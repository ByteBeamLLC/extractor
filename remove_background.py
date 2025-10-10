from rembg import remove
from PIL import Image
import sys

input_path = 'public/sheetit_logo_v3.jpg'
output_path = 'public/sheetit_logo_v3_transparent.png'

print(f"Removing background from {input_path}...")

with open(input_path, 'rb') as i:
    with open(output_path, 'wb') as o:
        input_data = i.read()
        output_data = remove(input_data)
        o.write(output_data)

print(f"Background removed! Saved to {output_path}")
print(f"Opening image to verify...")

output_img = Image.open(output_path)
print(f"Image size: {output_img.size}")
print(f"Image mode: {output_img.mode}")
print(f"Has transparency: {output_img.mode in ['RGBA', 'LA', 'PA']}")
