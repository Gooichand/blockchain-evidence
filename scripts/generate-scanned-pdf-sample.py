"""Original two-page raster-only PDF from the project's synthetic OCR image."""
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
im=Image.open('public/samples/document/ocr.png')
w,h=im.size
c=canvas.Canvas('public/samples/document/scanned.pdf',pagesize=(w/2,h/2))
c.setTitle('Original DGC synthetic scanned OCR fixture')
for _ in range(2):
 c.drawImage(ImageReader(im),0,0,width=w/2,height=h/2)
 c.showPage()
c.save()
