import sys
import subprocess

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Change all white (also shades of whites) to transparent
        if item[0] > 220 and item[1] > 220 and item[2] > 220:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    
    # Let's crop empty transparent space to get a clean logo
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(out_path, "PNG")
    print(f"Saved {out_path}")
    return img

def create_favicon(img, out_path):
    # The 'E' is on the left side of the image. 
    # Let's crop the left square part roughly. 
    # Since the image is a horizontal rectangle, we can crop a square from the left edge.
    width, height = img.size
    
    # The 'E' is approximately the first height pixels wide?
    # Let's crop a square from the left: (0, 0, height, height)
    # But wait, there might be spacing. 
    # Actually, we can look for the first non-transparent column, then take a width equal to height.
    bbox = img.getbbox()
    if bbox:
        cropped_e = img.crop((0, 0, min(height * 1.2, width), height))
        # Now let's try to crop the 'E' tightly
        e_bbox = cropped_e.getbbox()
        if e_bbox:
            cropped_e = cropped_e.crop(e_bbox)
            
        # Make it a square canvas for favicon
        max_dim = max(cropped_e.size)
        square = Image.new('RGBA', (max_dim, max_dim), (255,255,255,0))
        square.paste(cropped_e, ((max_dim - cropped_e.width)//2, (max_dim - cropped_e.height)//2))
        
        square.save(out_path, "PNG")
        print(f"Saved {out_path}")

if __name__ == "__main__":
    img = remove_white_bg("raw_logo.png", "logo-transparent.png")
    create_favicon(img, "favicon.png")
