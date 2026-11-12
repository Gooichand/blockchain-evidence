"""Original PDF hidden-text positives and visible white-on-dark negatives."""
from pathlib import Path
from reportlab.pdfgen import canvas
out=Path('public/samples/document/concealed');out.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(out/'signals.pdf'),pagesize=(500,400));c.setTitle('Original concealed-text candidate fixture')
c.setFont('Helvetica',14);c.drawString(30,360,'VISIBLE BLACK TEXT')
c.setFillColorRGB(1,1,1);c.drawString(30,320,'WHITE ON WHITE HIDDEN')
c.setFillColorRGB(0,0,0);c.rect(20,255,360,35,fill=1,stroke=0);c.setFillColorRGB(1,1,1);c.drawString(30,265,'VISIBLE WHITE ON DARK')
c.setFillColorRGB(0,0,0);c.saveState();t=c.beginText(30,220);t.setTextRenderMode(3);t.textOut('INVISIBLE RENDER MODE');c.drawText(t);c.restoreState()
c.saveState();c.setFillAlpha(0);c.drawString(30,180,'ZERO OPACITY TEXT');c.restoreState()
c.drawString(30,140,'VISIBLE AFTER RESTORE')
c.drawString(30,-20,'OUTSIDE PAGE TEXT')
c.save()
(out/'README.md').write_text('Original ReportLab text fixture. Positives: invisible rendering, white-on-white and zero opacity, outside-page subject to PDF.js extraction. Negatives: visible black, visible white on dark, restored graphics state. Detection is candidate-only, not proof of concealment intent. Apache-2.0 with repository.\n')
