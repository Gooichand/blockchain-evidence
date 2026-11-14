"""Original PDF hidden-text positives and visible white-on-dark negatives."""
from pathlib import Path
from reportlab.pdfgen import canvas

out = Path('public/samples/document/concealed')
out.mkdir(parents=True, exist_ok=True)

c = canvas.Canvas(str(out / 'signals.pdf'), pagesize=(500, 400))
c.setTitle('Original concealed-text candidate fixture')
# Page 1: rendering-mode / color / opacity / off-page signals and negatives.
c.setFont('Helvetica', 14)
c.drawString(30, 360, 'VISIBLE BLACK TEXT')
c.setFillColorRGB(1, 1, 1)
c.drawString(30, 320, 'WHITE ON WHITE HIDDEN')
c.setFillColorRGB(0, 0, 0)
c.rect(20, 255, 360, 35, fill=1, stroke=0)
c.setFillColorRGB(1, 1, 1)
c.drawString(30, 265, 'VISIBLE WHITE ON DARK')
c.setFillColorRGB(0, 0, 0)
c.saveState()
t = c.beginText(30, 220)
t.setTextRenderMode(3)
t.textOut('INVISIBLE RENDER MODE')
c.drawText(t)
c.restoreState()
c.saveState()
c.setFillAlpha(0)
c.drawString(30, 180, 'ZERO OPACITY TEXT')
c.restoreState()
c.drawString(30, 140, 'VISIBLE AFTER RESTORE')
c.drawString(30, -20, 'OUTSIDE PAGE TEXT')
c.showPage()
# Page 2: overpaint and clipping signals with layering negatives.
c.setFont('Helvetica', 14)
c.setFillColorRGB(0, 0, 0)
c.drawString(30, 360, 'OVERPAINTED HIDDEN TEXT')
c.setFillColorRGB(1, 1, 1)
c.rect(20, 350, 360, 25, fill=1, stroke=0)  # opaque white fill after the text
c.setFillColorRGB(0, 0, 0)
c.rect(20, 300, 360, 25, fill=1, stroke=0)  # painted first
c.setFillColorRGB(1, 1, 1)
c.drawString(30, 308, 'VISIBLE PAINTED AFTER BACKGROUND')
c.setFillColorRGB(0, 0, 0)
c.saveState()
p = c.beginPath()
p.rect(20, 200, 150, 30)
c.clipPath(p, stroke=0, fill=0)
c.drawString(25, 210, 'IN CLIP')
c.drawString(300, 210, 'CLIPPED OUTSIDE REGION')
c.restoreState()
c.drawString(30, 150, 'VISIBLE UNCLIPPED TEXT')
c.showPage()
c.save()


def pdf_string(s):
    return s.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def write_type3(path):
    """Minimal one-page PDF with a Type3 font whose glyph name is
    non-standard (/g01) and which has no ToUnicode map: pdf.js cannot map
    the glyph to Unicode, so the text run must be disclosed as unmapped."""
    content = 'BT /F1 48 Tf 50 300 Td (\\1) Tj ET'
    charproc = '1000 0 0 0 1000 700 d1\n50 0 900 700 re f\n'
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 400] '
        b'/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        b'<< /Type /Font /Subtype /Type3 /Name /F1 /FontBBox [0 0 1000 700] '
        b'/FontMatrix [0.001 0 0 0.001 0 0] '
        b'/CharProcs << /g01 6 0 R >> '
        b'/Encoding << /Type /Encoding /Differences [1 /g01] >> '
        b'/FirstChar 1 /LastChar 1 /Widths [1000] /Resources << >> >>',
        b'<< /Length %d >>\nstream\n%s\nendstream' % (len(content), content.encode()),
        b'<< /Length %d >>\nstream\n%s\nendstream' % (len(charproc), charproc.encode()),
    ]
    buf = bytearray(b'%PDF-1.4\n')
    offsets = []
    for i, body in enumerate(objects, 1):
        offsets.append(len(buf))
        buf += b'%d 0 obj\n' % i + body + b'\nendobj\n'
    xref = len(buf)
    buf += b'xref\n0 %d\n' % (len(objects) + 1)
    buf += b'0000000000 65535 f \n'
    for off in offsets:
        buf += b'%010d 00000 n \n' % off
    buf += (
        b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n'
        % (len(objects) + 1, xref)
    )
    path.write_bytes(bytes(buf))


write_type3(out / 'type3-unmapped.pdf')

(out / 'README.md').write_text(
    'Original synthetic fixtures. signals.pdf page 1: invisible rendering, '
    'white-on-white, zero opacity, outside-page positives and visible black, '
    'visible white-on-dark, restored-state negatives. Page 2: overpaint '
    '(later opaque fill over text) and clip (text outside the clip path) '
    'positives with layering/unclipped negatives. type3-unmapped.pdf: a '
    'hand-written Type3 font with a non-standard glyph name and no ToUnicode '
    'map, so the glyph run must be disclosed as unmapped rather than '
    'evaluated or dropped. Detection is candidate-only, not proof of '
    'concealment intent. Apache-2.0 with repository.\n'
)
print('signals.pdf + type3-unmapped.pdf regenerated')
