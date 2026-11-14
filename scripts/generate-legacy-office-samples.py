#!/usr/bin/env python3
"""Generate synthetic legacy OLE2 Office fixtures.

Builds minimal ODT/ODS/ODP documents with odfpy (synthetic metadata only),
then converts them to DOC/XLS/PPT with LibreOffice headless. Output bytes
embed conversion timestamps; committed fixtures are the test reference.
Run from the repo root: python3 scripts/generate-legacy-office-samples.py
"""
import os
import subprocess
import sys
import tempfile

from odf import dc, meta
from odf.opendocument import OpenDocumentPresentation, OpenDocumentSpreadsheet, OpenDocumentText
from odf import draw, table, text

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "public", "samples", "document")


def add_meta(doc):
    doc.meta.addElement(meta.Generator(text="DGC synthetic fixture"))
    doc.meta.addElement(dc.Title(text="Synthetic legacy title"))
    doc.meta.addElement(dc.Description(text="Synthetic legacy fixture note"))
    doc.meta.addElement(meta.Keyword(text="synthetic legacy fixture"))
    doc.meta.addElement(meta.InitialCreator(text="DGC Synthetic Author"))
    doc.meta.addElement(dc.Creator(text="DGC Synthetic Editor"))
    doc.meta.addElement(meta.CreationDate(text="2026-11-14T12:00:00"))
    doc.meta.addElement(dc.Date(text="2026-11-14T12:30:00"))
    doc.meta.addElement(meta.UserDefined(name="Company", text="DGC Synthetic Company"))


def build(work):
    doc = OpenDocumentText()
    add_meta(doc)
    doc.text.addElement(text.P(text="Synthetic legacy fixture body. Not a real document."))
    doc.save(os.path.join(work, "fixture.odt"))

    sheet = OpenDocumentSpreadsheet()
    add_meta(sheet)
    tab = table.Table(name="Sheet1")
    row = table.TableRow()
    cell = table.TableCell(valuetype="string")
    cell.addElement(text.P(text="synthetic cell"))
    row.addElement(cell)
    tab.addElement(row)
    sheet.spreadsheet.addElement(tab)
    sheet.save(os.path.join(work, "fixture.ods"))

    deck = OpenDocumentPresentation()
    add_meta(deck)
    from odf import style
    pagelayout = style.PageLayout(name="PM1")
    deck.automaticstyles.addElement(pagelayout)
    master = style.MasterPage(name="Default", pagelayoutname="PM1")
    deck.masterstyles.addElement(master)
    page = draw.Page(name="page1", masterpagename="Default")
    frame = draw.Frame(x="1cm", y="1cm", width="20cm", height="3cm")
    box = draw.TextBox()
    box.addElement(text.P(text="Synthetic legacy slide"))
    frame.addElement(box)
    page.addElement(frame)
    deck.presentation.addElement(page)
    deck.save(os.path.join(work, "fixture.odp"))


def main():
    os.makedirs(OUT, exist_ok=True)
    work = tempfile.mkdtemp()
    profile = os.path.join(work, "profile")
    build(work)
    pairs = [("odt", "doc"), ("ods", "xls"), ("odp", "ppt")]
    for src, dst in pairs:
        subprocess.run(
            [
                "soffice",
                "--headless",
                "-env:UserInstallation=file://" + profile,
                "--convert-to",
                dst,
                "--outdir",
                work,
                os.path.join(work, "fixture." + src),
            ],
            check=True,
            capture_output=True,
        )
        target = os.path.join(OUT, "legacy-summary." + dst)
        os.replace(os.path.join(work, "fixture." + dst), target)
        print(os.path.relpath(target, ROOT), os.path.getsize(target), "bytes")


if __name__ == "__main__":
    sys.exit(main())
