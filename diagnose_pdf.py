import sys
import pypdf
import os

def analyze_pdf(filename):
    print(f"--- Analyzing: {filename} ---")
    
    if not os.path.exists(filename):
        print("ERROR: File not found!")
        return

    try:
        reader = pypdf.PdfReader(filename)
        print(f"Number of pages: {len(reader.pages)}")
        print(f"Is Encrypted: {reader.is_encrypted}")
        
        total_text = ""
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            print(f"\n--- Page {i+1} ---")
            if text:
                print(f"Extracted {len(text)} characters.")
                print(f"Preview: {text[:100]}...")
                total_text += text
            else:
                print("NO TEXT EXTRACTED (Page might be an image/scan)")
                
            # Check for images
            if hasattr(page, 'images'):
                print(f"Images detected on page: {len(page.images)}")
        
        if len(total_text.strip()) == 0:
            print("\nCONCLUSION: The PDF contains 0 extractable characters.")
            print("Reason: It is likely a scanned document (image) or uses a font encoding pypdf cannot read.")
        else:
            print(f"\nCONCLUSION: Successfully extracted {len(total_text)} characters.")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python diagnose_pdf.py <filename>")
    else:
        # Join arguments to handle spaces in filename
        filename = " ".join(sys.argv[1:])
        analyze_pdf(filename)