import pdfplumber
import tiktoken

PDF_PATH = "./document.pdf"

# Pick the model you plan to send the PDF text to.
# tiktoken can select an encoding for a given model name.
enc = tiktoken.encoding_for_model("gpt-4o")  # change as needed

total_tokens = 0
per_page = []

with pdfplumber.open(PDF_PATH) as pdf:
    for i, page in enumerate(pdf.pages, start=1):
        text = page.extract_text() or ""
        n = len(enc.encode(text))
        per_page.append((i, n))
        total_tokens += n

print("Total tokens:", total_tokens)
print("Top 10 pages by tokens:", sorted(per_page, key=lambda x: x[1], reverse=True)[:10])