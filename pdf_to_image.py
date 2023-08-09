from pdf2image import convert_from_path
import sys

input_pdf = sys.argv[1]
output_directory = sys.argv[2]

images = convert_from_path(input_pdf)

for i, image in enumerate(images):
    image.save(f"{output_directory}/output_page_{i + 1}.png", 'PNG')