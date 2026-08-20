#!/usr/bin/env python3
"""
Builds University_Branded_Word_Template.dotx.

The package is written as raw OOXML so every visual decision lands in a real
Word style, theme slot or numbering definition — nothing in the shipped body
relies on direct formatting, which is what lets a user restyle a whole document
from the Styles gallery.
"""
import os
import shutil
import sys
import zipfile
import xml.dom.minidom as minidom

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand                     # noqa: E402
import oox                       # noqa: E402
import theme_xml                 # noqa: E402
import word_styles as ws         # noqa: E402
import word_numbering as wn      # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
LOGO = os.path.join(ROOT, "assets", "logo")
BUILD = os.path.join(ROOT, "build", "word")
OUTFILE = os.path.join(ROOT, "University_Branded_Word_Template.dotx")
# Same package, document content type: a ready-to-edit copy for anyone who
# wants to look at the template without installing it, and what QA renders.
SAMPLEFILE = os.path.join(ROOT, "docs", "University_Branded_Word_Sample.docx")

DOTX_CT = ("application/vnd.openxmlformats-officedocument."
           "wordprocessingml.template.main+xml")
DOCX_CT = ("application/vnd.openxmlformats-officedocument."
           "wordprocessingml.document.main+xml")

EMU_CM = 360000
TWIP_CM = 566.93

PAGE_W, PAGE_H = 11906, 16838          # A4 portrait, twips
MARGIN = dict(top=1588, right=1418, bottom=1418, left=1418, header=737, footer=737)
TEXT_W = PAGE_W - MARGIN["left"] - MARGIN["right"]      # 9070 twips

NS = (
    'xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
    'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
    'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
)

_pic_id = [100]


# ------------------------------------------------------------- XML helpers ---
def esc(t):
    return (t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def run(text, rpr="", rtl=False):
    pr = rpr + ('<w:rtl/>' if rtl else "")
    return ('<w:r>{pr}<w:t xml:space="preserve">{t}</w:t></w:r>'
            .format(pr='<w:rPr>{}</w:rPr>'.format(pr) if pr else "",
                    t=esc(text)))


def para(text="", style=None, ppr_extra="", rpr="", rtl=False, runs=None):
    ppr = ""
    if style or ppr_extra:
        ppr = '<w:pPr>{}{}</w:pPr>'.format(
            '<w:pStyle w:val="{}"/>'.format(style) if style else "", ppr_extra)
    body = runs if runs is not None else (run(text, rpr, rtl) if text else "")
    return '<w:p>{}{}</w:p>'.format(ppr, body)


def picture(rid, cx, cy, name, alt):
    _pic_id[0] += 1
    pid = _pic_id[0]
    return (
        '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
        '<wp:extent cx="{cx}" cy="{cy}"/>'
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        '<wp:docPr id="{pid}" name="{name}" descr="{alt}"/>'
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/>'
        '</wp:cNvGraphicFramePr>'
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/'
        'drawingml/2006/picture"><pic:pic>'
        '<pic:nvPicPr><pic:cNvPr id="{pid}" name="{name}" descr="{alt}"/>'
        '<pic:cNvPicPr/></pic:nvPicPr>'
        '<pic:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/>'
        '</a:stretch></pic:blipFill>'
        '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
        '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>'
        .format(rid=rid, cx=int(cx), cy=int(cy), pid=pid, name=name, alt=esc(alt)))


def field(instr, placeholder, rpr=""):
    r = '<w:rPr>{}</w:rPr>'.format(rpr) if rpr else ""
    return ('<w:r>{r}<w:fldChar w:fldCharType="begin"/></w:r>'
            '<w:r>{r}<w:instrText xml:space="preserve">{i}</w:instrText></w:r>'
            '<w:r>{r}<w:fldChar w:fldCharType="separate"/></w:r>'
            '<w:r>{r}<w:t>{p}</w:t></w:r>'
            '<w:r>{r}<w:fldChar w:fldCharType="end"/></w:r>'
            .format(r=r, i=esc(instr), p=esc(placeholder)))


def table(style, widths, rows, header=True, first_col=True, band=True,
          look=None, cell_style=None, indent=0):
    look = look or dict(firstRow=header, lastRow=False, firstColumn=first_col,
                        lastColumn=False, noHBand=False, noVBand=True)
    total = sum(widths)
    grid = "".join('<w:gridCol w:w="{}"/>'.format(w) for w in widths)
    tbl = ['<w:tbl><w:tblPr><w:tblStyle w:val="{}"/>'.format(style),
           '<w:tblW w:w="{}" w:type="dxa"/>'.format(total)]
    if indent:
        tbl.append('<w:tblInd w:w="{}" w:type="dxa"/>'.format(indent))
    tbl.append('<w:tblLook w:val="04A0" w:firstRow="{fr}" w:lastRow="{lr}" '
               'w:firstColumn="{fc}" w:lastColumn="{lc}" w:noHBand="{nh}" '
               'w:noVBand="{nv}"/>'
               .format(fr=int(look["firstRow"]), lr=int(look["lastRow"]),
                       fc=int(look["firstColumn"]), lc=int(look["lastColumn"]),
                       nh=int(look["noHBand"]), nv=int(look["noVBand"])))
    tbl.append('</w:tblPr><w:tblGrid>{}</w:tblGrid>'.format(grid))
    for ri, cells in enumerate(rows):
        trpr = '<w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>' if (header and ri == 0) \
            else '<w:trPr><w:cantSplit/></w:trPr>'
        tbl.append('<w:tr>{}'.format(trpr))
        for ci, cell in enumerate(cells):
            content = cell if isinstance(cell, list) else [cell]
            paras = "".join(
                c if c.startswith("<w:p") else para(c, style=cell_style)
                for c in content) or para("")
            tbl.append('<w:tc><w:tcPr><w:tcW w:w="{w}" w:type="dxa"/>'
                       '<w:vAlign w:val="center"/></w:tcPr>{p}</w:tc>'
                       .format(w=widths[ci], p=paras))
        tbl.append('</w:tr>')
    tbl.append('</w:tbl>')
    return "".join(tbl)


PAGE_BREAK = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


# ------------------------------------------------------------ header/footer --
def header_default(rid_emblem, emblem_h_cm):
    w, h = Image.open(os.path.join(BUILD, "media", "emblem.png")).size
    cy = int(emblem_h_cm * EMU_CM)
    cx = int(cy * w / h)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<w:hdr {ns}>{p}</w:hdr>'.format(ns=NS, p=para(
            style="Header",
            runs=picture(rid_emblem, cx, cy, "UoH emblem",
                         "University of Ha'il emblem")
            + run(" University of Ha'il",
                  rpr='<w:b/><w:color w:val="{}"/>'.format(brand.DEEP_BLUE))
            + '<w:r><w:tab/></w:r>'
            + run("[Document title]")
            + '<w:r><w:tab/></w:r>'
            + run("[Department]"),
            ppr_extra='<w:tabs><w:tab w:val="center" w:pos="{c}"/>'
                      '<w:tab w:val="right" w:pos="{r}"/></w:tabs>'
                      .format(c=TEXT_W // 2, r=TEXT_W))))


def footer_default():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<w:ftr {ns}>{p}</w:ftr>'.format(ns=NS, p=para(
            style="Footer",
            runs=run("[Classification]")
            + '<w:r><w:tab/></w:r>'
            + run("[Doc. reference]")
            + '<w:r><w:tab/></w:r>'
            + run("Page ")
            + field("PAGE", "1",
                    rpr='<w:b/><w:color w:val="{}"/>'.format(brand.DEEP_BLUE))
            + run(" of ")
            + field("NUMPAGES", "1",
                    rpr='<w:b/><w:color w:val="{}"/>'.format(brand.DEEP_BLUE)),
            ppr_extra='<w:tabs><w:tab w:val="center" w:pos="{c}"/>'
                      '<w:tab w:val="right" w:pos="{r}"/></w:tabs>'
                      .format(c=TEXT_W // 2, r=TEXT_W))))


def footer_cover():
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<w:ftr {ns}>{p}</w:ftr>'.format(ns=NS, p=para(
                "Classification: [Public / Internal / Confidential]"
                "\u2003|\u2003\u00a9 University of Ha'il",
                style="UoHClassification")))


def blank_hdr(tag):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<w:{t} {ns}><w:p><w:pPr><w:spacing w:after="0" w:line="240" '
            'w:lineRule="auto"/></w:pPr></w:p></w:{t}>'.format(t=tag, ns=NS))


# ------------------------------------------------------------------- body ----
def cover(rid_lockup):
    w, h = Image.open(os.path.join(BUILD, "media", "lockup.png")).size
    cx = int(7.8 * EMU_CM)
    cy = int(cx * h / w)
    meta_rows = [
        [run_label("Department"), "[Faculty / Deanship / Department]"],
        [run_label("Prepared by"), "[Name, role]"],
        [run_label("Reviewed by"), "[Name, role]"],
        [run_label("Date"), "[DD Month YYYY]"],
        [run_label("Version"), "[1.0]"],
        [run_label("Reference"), "[UoH/DEPT/2025/001]"],
    ]
    return (
        para(runs=picture(rid_lockup, cx, cy, "UoH lockup",
                          "University of Ha'il logo"),
             ppr_extra='<w:spacing w:before="360" w:after="0"/>')
        + para(ppr_extra='<w:spacing w:before="0" w:after="2200" w:line="240" '
                         'w:lineRule="auto"/>')
        + para("[Document type]", style="UoHDocLabel")
        + para("[Document Title Goes Here]", style="Title")
        + para("[One-line subtitle, scope or reporting period]", style="Subtitle")
        + table("UoHTableKeyFacts", [2100, 4400], meta_rows,
                header=False, first_col=False, cell_style="UoHCoverMeta")
    )


def run_label(text):
    return para(runs=run(text, rpr='<w:rStyle w:val="UoHCoverMetaLabel"/>'),
                style="UoHCoverMeta")


def front_matter():
    control = [
        ["Version", "Date", "Author", "Summary of change"],
        ["0.1", "[DD Mon YYYY]", "[Name]", "First draft"],
        ["1.0", "[DD Mon YYYY]", "[Name]", "Approved for issue"],
    ]
    approvals = [
        ["Role", "Name", "Signature", "Date"],
        ["Owner", "[Name]", "", ""],
        ["Approver", "[Name]", "", ""],
    ]
    toc_instr = r' TOC \o "1-3" \h \z \u '
    return (
        PAGE_BREAK
        + para("Document Control", style="UoHFrontHeading")
        + para("Record every issued version here. Rows are ordinary table rows "
               "— press Tab in the last cell to add another.", style="UoHNote")
        + table("UoHTable", [1200, 1900, 2500, 3470], control, first_col=False)
        + para(ppr_extra='<w:spacing w:before="0" w:after="320"/>')
        + para("Approvals", style="UoHFrontHeading")
        + table("UoHTableLight", [2100, 2600, 2600, 1770], approvals,
                first_col=False, band=False)
        + PAGE_BREAK
        + para("Table of Contents", style="TOCHeading")
        + para(runs='<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
                    '<w:r><w:instrText xml:space="preserve">' + esc(toc_instr) +
                    '</w:instrText></w:r>'
                    '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
                    + run("Right-click here and choose Update Field to build the "
                          "contents list.", rpr='<w:i/>')
                    + '<w:r><w:fldChar w:fldCharType="end"/></w:r>')
        + PAGE_BREAK
        + para("Executive Summary", style="UoHFrontHeading")
        + para("[Open with the single most important message of the document — "
               "one sentence a busy reader could act on without reading further.]",
               style="UoHLead")
        + para("[Two to four short paragraphs. State what was asked, what was "
               "found and what is recommended. Keep the whole summary to one "
               "page so it can stand alone as a briefing note.]",
               style="UoHExecSummary")
        + para("[Key finding or recommendation one]", style="UoHBullet")
        + para("[Key finding or recommendation two]", style="UoHBullet")
        + para("[Key finding or recommendation three]", style="UoHBullet")
    )


def body_demo():
    data = [
        ["Indicator", "Baseline", "Target", "Status"],
        ["[Indicator name]", "[0.0]", "[0.0]", "[On track]"],
        ["[Indicator name]", "[0.0]", "[0.0]", "[At risk]"],
        ["[Indicator name]", "[0.0]", "[0.0]", "[Complete]"],
    ]
    return (
        para("01", style="UoHSectionNumber")
        + para("[Section Title]", style="UoHSectionTitle")
        + para("[A short standfirst introducing what this section covers and why "
               "it matters to the reader.]", style="UoHLead")
        + para("[Heading 1 — numbered automatically]", style="Heading1")
        + para("[Body text. This paragraph uses the Normal style: 11 pt, 1.15 line "
               "spacing, left aligned, with the complex-script size raised so "
               "Arabic runs sit optically level with the Latin text.]")
        + para("[Heading 2]", style="Heading2")
        + para("[Body text.]")
        + para("[First bulleted point]", style="UoHBullet")
        + para("[Second bulleted point]", style="UoHBullet")
        + para("[Sub-point at the second level]", style="UoHBullet2")
        + para("[Heading 3]", style="Heading3")
        + para("[First numbered step]", style="UoHNumber")
        + para("[Second numbered step]", style="UoHNumber")
        + para("[Third numbered step]", style="UoHNumber")
        + para("[HEADING 4 — UNNUMBERED RUN-IN]", style="Heading4")
        + para("[Body text.]")
        + para("[Callout — use for a decision, an instruction or anything the "
               "reader must not miss.]", style="UoHCallout")
        + para("[A pull quote, testimony or extract from policy sits in the Quote "
               "style.]", style="Quote")
        + para("Table 1 — [Table caption, placed above the table]",
               style="Caption")
        + table("UoHTable", [3670, 1800, 1800, 1800], data)
        + para(ppr_extra='<w:spacing w:before="0" w:after="200"/>')
        + para("Figure 1 — [Figure caption, placed below the figure]",
               style="Caption")
        + para("[Heading 1 — numbering continues across the document]",
               style="Heading1")
        + para("[Body text.]")
    )


def arabic_demo():
    return (
        para("02", style="UoHSectionNumber",
             ppr_extra='<w:bidi/><w:jc w:val="left"/>')
        + para("المحتوى باللغة العربية",
               style="UoHSectionTitle",
               ppr_extra='<w:bidi/><w:jc w:val="left"/>', rtl=True)
        + para("عنوان رئيسي",
               style="UoHArabicHeading1", rtl=True)
        + para("هذه فقرة نمو"
               "ذجية باللغة "
               "العربية توض"
               "ح إعدادات ال"
               "اتجاه من الي"
               "مين إلى اليس"
               "ار وتباعد ال"
               "أسطر المناس"
               "ب للنص العرب"
               "ي.", style="UoHArabicBody", rtl=True)
        + para("عنوان فرعي",
               style="UoHArabicHeading2", rtl=True)
        + para("النقطة الأو"
               "لى", style="UoHArabicBullet", rtl=True)
        + para("النقطة الثا"
               "نية", style="UoHArabicBullet", rtl=True)
    )


def how_to():
    return (
        PAGE_BREAK
        + para("How to use this template", style="TOCHeading")
        + para("Delete this page before issuing the document.", style="UoHNote")
        + para("Every element above is driven by a named style. Select any "
               "paragraph and the Styles gallery (Home tab) shows which one is "
               "applied; changing the style changes every matching paragraph in "
               "the document at once.", style="Normal")
        + para("Replace the bracketed placeholders on the cover, then update the "
               "header and footer text once — they repeat on every page.",
               style="UoHBullet")
        + para("Build the contents list by right-clicking the field on the "
               "Contents page and choosing Update Field › Update entire table.",
               style="UoHBullet")
        + para("Start a new part of the document with the UoH Section Number and "
               "UoH Section Title styles; the number style forces a page break "
               "before it.", style="UoHBullet")
        + para("For Arabic documents apply the UoH Arabic styles, which set "
               "right-to-left direction, the Arabic type size and the looser line "
               "spacing Arabic needs.", style="UoHBullet")
        + para("Tables: apply UoH Table for reporting grids, UoH Table Light for "
               "sign-off blocks and UoH Key Facts Table for label/value pairs.",
               style="UoHBullet")
    )


def sect_pr(rids):
    return (
        '<w:sectPr>'
        '<w:headerReference w:type="first" r:id="{h1}"/>'
        '<w:headerReference w:type="default" r:id="{h2}"/>'
        '<w:footerReference w:type="first" r:id="{f1}"/>'
        '<w:footerReference w:type="default" r:id="{f2}"/>'
        '<w:pgSz w:w="{pw}" w:h="{ph}"/>'
        '<w:pgMar w:top="{t}" w:right="{r}" w:bottom="{b}" w:left="{l}" '
        'w:header="{hd}" w:footer="{ft}" w:gutter="0"/>'
        '<w:cols w:space="708"/><w:titlePg/>'
        '<w:docGrid w:linePitch="360"/></w:sectPr>'
        .format(h1=rids["header1"], h2=rids["header2"], f1=rids["footer1"],
                f2=rids["footer2"], pw=PAGE_W, ph=PAGE_H, t=MARGIN["top"],
                r=MARGIN["right"], b=MARGIN["bottom"], l=MARGIN["left"],
                hd=MARGIN["header"], ft=MARGIN["footer"]))


def document_xml(rids):
    body = (cover(rids["lockup"]) + front_matter() + body_demo() + arabic_demo()
            + how_to() + sect_pr(rids))
    return oox.canonicalize(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<w:document {ns}><w:body>{b}</w:body></w:document>'
        .format(ns=NS, b=body))


def settings_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<w:settings xmlns:w="http://schemas.openxmlformats.org/'
        'wordprocessingml/2006/main" '
        'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">'
        '<w:zoom w:percent="100"/>'
        '<w:proofState w:spelling="clean" w:grammar="clean"/>'
        '<w:defaultTabStop w:val="454"/>'
        '<w:evenAndOddHeaders w:val="false"/>'
        '<w:drawingGridHorizontalSpacing w:val="110"/>'
        '<w:displayHorizontalDrawingGridEvery w:val="2"/>'
        '<w:characterSpacingControl w:val="doNotCompress"/>'
        '<w:updateFields w:val="true"/>'
        '<w:hdrShapeDefaults/>'
        '<w:compat>'
        '<w:compatSetting w:name="compatibilityMode" '
        'w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>'
        '<w:compatSetting w:name="overrideTableStyleFontSizeAndJustification" '
        'w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>'
        '<w:compatSetting w:name="enableOpenTypeFeatures" '
        'w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>'
        '<w:compatSetting w:name="doNotFlipMirrorIndents" '
        'w:uri="http://schemas.microsoft.com/office/word" w:val="1"/>'
        '</w:compat>'
        '<w:themeFontLang w:val="en-US" w:bidi="ar-SA"/>'
        '<w:clrSchemeMapping w:bg1="light1" w:t1="dark1" w:bg2="light2" '
        'w:t2="dark2" w:accent1="accent1" w:accent2="accent2" '
        'w:accent3="accent3" w:accent4="accent4" w:accent5="accent5" '
        'w:accent6="accent6" w:hyperlink="hyperlink" '
        'w:followedHyperlink="followedHyperlink"/>'
        '<w:decimalSymbol w:val="."/><w:listSeparator w:val=","/>'
        '</w:settings>')


def font_table_xml():
    faces = [(brand.THEME_MINOR_LATIN, "020B0502040204020203"),
             (brand.FONT_MAJOR_LATIN, "020B0702040204020203"),
             (brand.FONT_MINOR_CS, "02000000000000000000"),
             ("Symbol", "05050102010706020507"),
             ("Wingdings", "05000000000000000000"),
             ("Arial", "020B0604020202020204")]
    body = "".join(
        '<w:font w:name="{n}"><w:panose1 w:val="{p}"/>'
        '<w:charset w:val="00"/><w:family w:val="swiss"/><w:pitch w:val="variable"/>'
        '</w:font>'.format(n=n, p=p) for n, p in faces)
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<w:fonts xmlns:w="http://schemas.openxmlformats.org/'
            'wordprocessingml/2006/main">{}</w:fonts>'.format(body))


def core_props():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<cp:coreProperties '
        'xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>University of Ha\'il — Document Template</dc:title>'
        '<dc:subject>Official document template</dc:subject>'
        '<dc:creator>University of Ha\'il</dc:creator>'
        '<cp:keywords>University of Ha\'il; template; brand</cp:keywords>'
        '<cp:category>Template</cp:category>'
        '<cp:contentStatus>Approved layout</cp:contentStatus>'
        '<cp:revision>1</cp:revision>'
        '</cp:coreProperties>')


def app_props():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/'
        '2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        '<Application>Microsoft Office Word</Application>'
        '<Company>University of Ha\'il</Company>'
        '<AppVersion>16.0000</AppVersion></Properties>')


def content_types():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-'
        'package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Default Extension="png" ContentType="image/png"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.template.main+xml"/>'
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
        '<Override PartName="/word/numbering.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
        '<Override PartName="/word/settings.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
        '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>'
        '<Override PartName="/word/webSettings.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.webSettings+xml"/>'
        '<Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.theme+xml"/>'
        '<Override PartName="/word/header1.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.header+xml"/>'
        '<Override PartName="/word/header2.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.header+xml"/>'
        '<Override PartName="/word/footer1.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
        '<Override PartName="/word/footer2.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.'
        'openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.'
        'openxmlformats-officedocument.extended-properties+xml"/>'
        '</Types>')


R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def root_rels():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
        'relationships">'
        '<Relationship Id="rId1" Type="{r}/officeDocument" Target="word/document.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/'
        '2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="{r}/extended-properties" '
        'Target="docProps/app.xml"/>'
        '</Relationships>'.format(r=R))


def doc_rels(rids):
    rel = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
           '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
           'relationships">']
    fixed = [("styles", "styles.xml"), ("numbering", "numbering.xml"),
             ("settings", "settings.xml"), ("webSettings", "webSettings.xml"),
             ("fontTable", "fontTable.xml"), ("theme", "theme/theme1.xml")]
    for typ, target in fixed:
        rel.append('<Relationship Id="{i}" Type="{r}/{t}" Target="{g}"/>'
                   .format(i=rids[typ], r=R, t=typ, g=target))
    for typ, target in (("header", "header1.xml"), ("header", "header2.xml"),
                        ("footer", "footer1.xml"), ("footer", "footer2.xml")):
        key = target.replace(".xml", "")
        rel.append('<Relationship Id="{i}" Type="{r}/{t}" Target="{g}"/>'
                   .format(i=rids[key], r=R, t=typ, g=target))
    for key, target in (("lockup", "media/lockup.png"), ("emblem", "media/emblem.png")):
        rel.append('<Relationship Id="{i}" Type="{r}/image" Target="{g}"/>'
                   .format(i=rids[key], r=R, g=target))
    rel.append('</Relationships>')
    return "".join(rel)


def header_rels(rid):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
            'relationships">'
            '<Relationship Id="{i}" Type="{r}/image" Target="media/emblem.png"/>'
            '</Relationships>'.format(i=rid, r=R))


def prepare_media():
    media = os.path.join(BUILD, "media")
    os.makedirs(media, exist_ok=True)
    src_lock = os.path.join(LOGO, "uoh-lockup-horizontal.png")
    src_emb = os.path.join(LOGO, "uoh-emblem.png")
    # 300 dpi at the sizes actually used on the page
    im = Image.open(src_lock)
    im.resize((1000, round(1000 * im.height / im.width)), Image.LANCZOS) \
        .save(os.path.join(media, "lockup.png"), optimize=True)
    im = Image.open(src_emb)
    im.resize((round(300 * im.width / im.height), 300), Image.LANCZOS) \
        .save(os.path.join(media, "emblem.png"), optimize=True)


def build():
    if os.path.isdir(BUILD):
        shutil.rmtree(BUILD)
    os.makedirs(BUILD)
    prepare_media()

    rids = {"styles": "rId1", "numbering": "rId2", "settings": "rId3",
            "webSettings": "rId4", "fontTable": "rId5", "theme": "rId6",
            "header1": "rId7", "header2": "rId8", "footer1": "rId9",
            "footer2": "rId10", "lockup": "rId11", "emblem": "rId12"}
    hdr_emblem_rid = "rId1"

    parts = {
        "[Content_Types].xml": content_types(),
        "_rels/.rels": root_rels(),
        "docProps/core.xml": core_props(),
        "docProps/app.xml": app_props(),
        "word/document.xml": document_xml(rids),
        "word/_rels/document.xml.rels": doc_rels(rids),
        "word/styles.xml": ws.styles_xml(),
        "word/numbering.xml": wn.numbering_xml(),
        "word/settings.xml": settings_xml(),
        "word/fontTable.xml": font_table_xml(),
        "word/webSettings.xml":
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<w:webSettings xmlns:w="http://schemas.openxmlformats.org/'
            'wordprocessingml/2006/main"><w:optimizeForBrowser/>'
            '</w:webSettings>',
        "word/theme/theme1.xml": theme_xml.theme_xml(),
        "word/header1.xml": blank_hdr("hdr"),
        "word/header2.xml": header_default(hdr_emblem_rid, 1.05),
        "word/footer1.xml": footer_cover(),
        "word/footer2.xml": footer_default(),
        "word/_rels/header2.xml.rels": header_rels(hdr_emblem_rid),
    }

    for name, xml in parts.items():
        minidom.parseString(xml.encode("utf-8"))       # fail fast on bad XML

    if os.path.exists(OUTFILE):
        os.remove(OUTFILE)
    with zipfile.ZipFile(OUTFILE, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", parts.pop("[Content_Types].xml"))
        for name, xml in parts.items():
            z.writestr(name, xml.encode("utf-8"))
        for img in ("lockup.png", "emblem.png"):
            z.write(os.path.join(BUILD, "media", img), "word/media/" + img)

    # ship the same bytes as an ordinary document too
    os.makedirs(os.path.dirname(SAMPLEFILE), exist_ok=True)
    if os.path.exists(SAMPLEFILE):
        os.remove(SAMPLEFILE)
    with zipfile.ZipFile(OUTFILE) as src, \
            zipfile.ZipFile(SAMPLEFILE, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename == "[Content_Types].xml":
                data = data.replace(DOTX_CT.encode(), DOCX_CT.encode())
            dst.writestr(item.filename, data)

    for f in (OUTFILE, SAMPLEFILE):
        print("wrote {} ({:.0f} KB)".format(os.path.basename(f),
                                            os.path.getsize(f) / 1024))


if __name__ == "__main__":
    build()
