import fitz  
import os

def sign_pdf(original_path: str, signature_image_path: str, x: int, y: int, page_num: int, width: int, height: int):
    try:
        doc = fitz.open(original_path)
    except Exception as e:
        raise ValueError(f"Could not open PDF at {original_path}: {e}")
    
    if page_num < 1 or page_num > len(doc):
        page_num = 1
    page = doc[page_num - 1]
    
    rect = fitz.Rect(x, y, x + width, y + height)
    
    try:
        page.insert_image(rect, filename=signature_image_path)
    except Exception as e:
         raise ValueError(f"Could not insert image: {e}")
    
    output_filename = os.path.basename(original_path).replace(".pdf", "_signed.pdf")
    output_path = os.path.join("uploads", output_filename)
    
    doc.save(output_path)
    doc.close()
    
    return output_path
