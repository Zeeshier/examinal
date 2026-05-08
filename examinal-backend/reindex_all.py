"""
Re-index all course documents after embedding model change.
Clears the old vector store and re-ingests all indexed documents.
"""

import sys
import os
import shutil

sys.path.append(os.getcwd())

from pathlib import Path
from app.config import settings
from app.database import SessionLocal
from app.models.content import ContentDocument, ContentPassage
from app.services.content_ingestion import ContentIngestionService
from app.services.vector_store import VectorStoreService

def reindex():
    print("=" * 60)
    print("  EXAMINAL — RE-INDEX ALL DOCUMENTS")
    print(f"  New Embedding Model: {settings.NVIDIA_EMBED_MODEL}")
    print("=" * 60)

    # Step 1: Clear old vector store data
    vs_dir = Path(settings.VECTOR_STORE_DIR)
    if vs_dir.exists():
        print(f"\n[1/3] Clearing old vector store at: {vs_dir}")
        shutil.rmtree(vs_dir)
        vs_dir.mkdir(exist_ok=True)
        print("      [OK] Old vectors cleared")
    else:
        print(f"\n[1/3] No existing vector store found at: {vs_dir}")
        vs_dir.mkdir(exist_ok=True)

    # Reset the singleton so it re-initializes with new model
    VectorStoreService._client = None
    VectorStoreService._embedder = None
    VectorStoreService._provider = None

    # Step 2: Find all documents that were previously indexed
    db = SessionLocal()
    try:
        # Fetch IDs first to avoid session/object expiration issues during long loops
        doc_ids = [d.id for d in db.query(ContentDocument.id).filter(
            ContentDocument.upload_status.in_(["indexed", "failed"])
        ).all()]

        if not doc_ids:
            print("\n[2/3] No documents found to re-index.")
            print("      Upload documents through the UI first, then run this again.")
            return

        print(f"\n[2/3] Found {len(doc_ids)} document(s) to re-index.")

        # Step 3: Re-ingest each document
        print(f"\n[3/3] Re-indexing with {settings.NVIDIA_EMBED_MODEL}...\n")
        ingestion_svc = ContentIngestionService()
        vs_service = VectorStoreService()

        success = 0
        failed = 0

        for doc_id in doc_ids:
            # Refresh doc in each iteration
            doc = db.query(ContentDocument).filter(ContentDocument.id == doc_id).first()
            if not doc:
                continue

            file_path = Path(settings.UPLOAD_DIR) / doc.filename
            if not file_path.exists():
                print(f"  [SKIP] {doc.original_filename} -- file not found: {file_path}")
                doc.upload_status = "failed"
                db.commit()
                failed += 1
                continue

            try:
                print(f"  [..] Processing: {doc.original_filename}...", end=" ", flush=True)

                # Delete old passages from DB
                db.query(ContentPassage).filter(
                    ContentPassage.document_id == doc.id
                ).delete()
                db.flush()

                # Parse and chunk
                passages_data = ingestion_svc.parse_and_chunk(str(file_path), doc.file_type)
                
                if not passages_data:
                    print("[SKIP] No text found")
                    doc.upload_status = "indexed"
                    db.commit()
                    success += 1
                    continue

                # Prepare batches for vector store and DB
                texts = [p["text"] for p in passages_data]
                
                # Get embeddings
                print(f" (embedding {len(texts)} chunks)...", end=" ", flush=True)
                embeddings = vs_service._embed_documents(texts)
                
                passage_ids = []
                for idx, (pdata, emb) in enumerate(zip(passages_data, embeddings)):
                    passage = ContentPassage(
                        document_id=doc.id,
                        content=pdata["text"],
                        page_number=pdata.get("page"),
                        chunk_index=idx,
                    )
                    db.add(passage)
                    db.flush() # Get passage.id
                    
                    passage.embedding_id = str(passage.id)
                    passage_ids.append(str(passage.id))
                
                # Add to vector store in one batch
                vs_service.add_passages_batch(
                    collection_name=f"course_{doc.course_id}",
                    passage_ids=passage_ids,
                    texts=texts,
                    metadatas=[{
                        "document_id": doc.id,
                        "course_id": doc.course_id,
                        "page": passages_data[i].get("page"),
                        "chunk_index": i,
                    } for i in range(len(passages_data))]
                )

                doc.upload_status = "indexed"
                db.commit()
                print(f"[OK] {len(passages_data)} passages indexed")
                success += 1

            except Exception as e:
                print(f"[FAIL] {e}")
                db.rollback()
                # Re-fetch doc to update status after rollback
                doc = db.query(ContentDocument).filter(ContentDocument.id == doc_id).first()
                if doc:
                    doc.upload_status = "failed"
                    db.commit()
                failed += 1

        print(f"\n{'=' * 60}")
        print(f"  DONE: {success} succeeded, {failed} failed")
        print(f"{'=' * 60}")

    finally:
        db.close()


if __name__ == "__main__":
    reindex()
