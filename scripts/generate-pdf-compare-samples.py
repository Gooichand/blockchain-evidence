"""Original same-text PDF layouts to exercise visual formatting comparison."""
from reportlab.pdfgen import canvas
for name,x,size in [('visual-first.pdf',40,18),('visual-second.pdf',80,24)]:
 c=canvas.Canvas('public/samples/document/'+name,pagesize=(420,260))
 c.setTitle('Original synthetic PDF visual comparison fixture')
 c.setFont('Helvetica',size);c.drawString(x,160,'Original DGC unchanged text')
 c.save()
