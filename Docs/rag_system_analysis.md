# RAG System Deep-Dive Analysis

This document provides a technical analysis of how Retrieval-Augmented Generation (RAG) is implemented in Examinal using the NVIDIA AI stack.

## 1. Document Ingestion & Chunking
**File:** [app/services/content_ingestion.py](file:///f:/examinal/examinal-backend/app/services/content_ingestion.py)
- **Strategy:** Uses `RecursiveCharacterTextSplitter` to break documents into overlapping chunks.
- **Parameters:** 
    - `chunk_size`: 600 characters (optimized for precision).
    - `chunk_overlap`: 150 characters (ensures context isn't lost at boundaries).
- **Separators:** Intelligently splits at paragraphs (`\n\n`), then lines (`\n`), then sentences (`. `) to maintain semantic meaning.

## 2. Vectorization & Storage
**File:** [app/services/vector_store.py](file:///f:/examinal/examinal-backend/app/services/vector_store.py)
- **Model:** `nvidia/llama-3.2-nv-embedqa-1b-v2`
- **Mechanism:** 
    - Passages are embedded using `input_type="passage"`.
    - Queries are embedded using `input_type="query"`.
    - This "asymmetric" embedding is a state-of-the-art technique that significantly improves retrieval accuracy for QA tasks compared to standard models.
- **Storage:** Local **ChromaDB** with Cosine Similarity index.

## 3. The Two-Stage Retrieval Pipeline
**File:** [app/services/rag_pipeline.py](file:///f:/examinal/examinal-backend/app/services/rag_pipeline.py) & [app/services/vector_store.py](file:///f:/examinal/examinal-backend/app/services/vector_store.py)
Retrieval is broken into two distinct phases to maximize both speed and accuracy:

### Phase 1: Embedding Search (Broad)
- Searches the vector database for the top **25 candidates**.
- This is extremely fast but can occasionally include semantically similar but contextually irrelevant results.

### Phase 2: Nim Reranking (Precision)
- Uses **`nvidia/llama-nemotron-rerank-1b-v2`**.
- This model looks at the actual *meaning* of the question and the passage together.
- It re-scores the 25 candidates and returns only the **Top 6** most relevant passages.
- **Benefit:** Dramatically reduces "hallucinations" by ensuring the LLM only sees the most pertinent information.

## 4. Response Generation
**File:** [app/services/rag_pipeline.py](file:///f:/examinal/examinal-backend/app/services/rag_pipeline.py)
- **Model:** **`nvidia/nemotron-3-nano-30b-a3b`**
- **Process:** 
    - Constructs a "Context-Grounded" prompt.
    - Explicitly instructs the model to use **ONLY** the provided passages.
    - Includes rerank scores in the internal logging for transparency.

## Verdict
The Examinal RAG system follows modern best practices. The combination of **asymmetric embeddings** and **GPU-accelerated reranking** puts it significantly ahead of standard "Search-then-Generate" architectures. It is highly optimized for academic and technical document assessment.
