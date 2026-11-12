"""Generate original Office fixtures; tracked change claims are deliberately synthetic."""
from pathlib import Path
from datetime import datetime, timezone
from zipfile import ZipFile,ZIP_DEFLATED
from docx import Document
from openpyxl import Workbook
from pptx import Presentation
from pptx.util import Inches
out=Path('public/samples/office');out.mkdir(parents=True,exist_ok=True)
d=Document();d.core_properties.created=datetime(2026,11,1,9,0,tzinfo=timezone.utc);d.core_properties.modified=datetime(2026,11,1,10,2,tzinfo=timezone.utc);d.core_properties.author='DGC Synthetic';d.core_properties.title='Original office metadata fixture';d.add_paragraph('Original DGC document');d.save(out/'tracked.docx')
w=Workbook();w.properties.creator='DGC Synthetic';w.properties.title='Original office metadata fixture';w.active['A1']='Original DGC spreadsheet';w.save(out/'workbook.xlsx')
p=Presentation();p.core_properties.author='DGC Synthetic';p.core_properties.title='Original office metadata fixture';slide=p.slides.add_slide(p.slide_layouts[6]);slide.shapes.add_textbox(Inches(1), Inches(1), Inches(6), Inches(1)).text='Original DGC presentation';p.save(out/'presentation.pptx')
path=out/'tracked.docx'
with ZipFile(path) as z: files={n:z.read(n) for n in z.namelist()}
xml=files['word/document.xml'].decode();event='<w:p><w:del w:id="1" w:author="DGC Synthetic" w:date="2026-11-01T10:00:00Z"><w:r><w:delText>Amount 100</w:delText></w:r></w:del><w:ins w:id="2" w:author="DGC Synthetic" w:date="2026-11-01T10:01:00Z"><w:r><w:t>Amount 101</w:t></w:r></w:ins></w:p>'
files['word/document.xml']=xml.replace('<w:body>','<w:body>'+event).encode()
with ZipFile(path,'w',ZIP_DEFLATED) as z:
 for n,data in files.items():z.writestr(n,data)
(out/'README.md').write_text('# Original Office examples\n\nGenerated with python-docx, openpyxl and python-pptx by scripts/generate-office-samples.py. The DOCX includes two synthetic tracked changes, deliberately inserted with known author/date/text claims. These examples do not establish true history or authorship. No personal documents.\n')
