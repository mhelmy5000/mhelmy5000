"""
Native Word style definitions for the University of Ha'il template.

Everything a user needs is a real w:style entry, so applying "Heading 2" or
"UoH Callout" from the Styles gallery reproduces the identity exactly and the
Navigation pane, cross-references and the table of contents all work. No part of
the template relies on direct/manual formatting.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
import oox    # noqa: E402

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

# Sizes are half-points; spacing/indent values are twips (1/20 pt).
BODY_SZ, BODY_SZ_CS = 22, 27          # 11 pt Latin / 13.5 pt Arabic


def _rfonts(major=False):
    """Bind runs to the theme rather than hard-coding face names."""
    kind = "major" if major else "minor"
    return ('<w:rFonts w:ascii{a}="{k}HAnsi" w:hAnsi{a}="{k}HAnsi" '
            'w:eastAsia{a}="{k}HAnsi" w:cstheme="{k}Bidi"/>'
            .format(a="Theme", k=kind))


def _sz(pt, cs_bump=2.5):
    """Latin size plus a larger complex-script size — Arabic naskh faces have a
    smaller apparent x-height, so they need a couple of points more."""
    return '<w:sz w:val="{}"/><w:szCs w:val="{}"/>'.format(
        int(round(pt * 2)), int(round((pt + cs_bump) * 2)))


def style(sid, name, stype="paragraph", based=None, nextS=None, link=None,
          ppr="", rpr="", qformat=True, ui=None, default=False,
          semiHidden=False, unhide=False, custom=True, extra=""):
    bits = ['<w:style w:type="{}"{} w:styleId="{}">'.format(
        stype, ' w:default="1"' if default else "", sid)]
    bits.append('<w:name w:val="{}"/>'.format(name))
    if based:
        bits.append('<w:basedOn w:val="{}"/>'.format(based))
    if nextS:
        bits.append('<w:next w:val="{}"/>'.format(nextS))
    if link:
        bits.append('<w:link w:val="{}"/>'.format(link))
    if ui is not None:
        bits.append('<w:uiPriority w:val="{}"/>'.format(ui))
    if semiHidden:
        bits.append('<w:semiHidden/>')
    if unhide:
        bits.append('<w:unhideWhenUsed/>')
    if qformat:
        bits.append('<w:qFormat/>')
    if custom:
        bits.append('<w:rsid w:val="00A1B2C3"/>')
    if ppr:
        bits.append('<w:pPr>{}</w:pPr>'.format(ppr))
    if rpr:
        bits.append('<w:rPr>{}</w:rPr>'.format(rpr))
    bits.append(extra)
    bits.append('</w:style>')
    return "".join(bits)


def spacing(before=None, after=None, line=None, rule="auto"):
    a = []
    if before is not None:
        a.append('w:before="{}"'.format(before))
    if after is not None:
        a.append('w:after="{}"'.format(after))
    if line is not None:
        a.append('w:line="{}" w:lineRule="{}"'.format(line, rule))
    return '<w:spacing {}/>'.format(" ".join(a)) if a else ""


def color(hexv):
    return '<w:color w:val="{}"/>'.format(hexv)


def border(edge, sz, hexv, space=0, val="single"):
    return ('<w:{e} w:val="{v}" w:sz="{s}" w:space="{sp}" w:color="{c}"/>'
            .format(e=edge, v=val, s=sz, sp=space, c=hexv))


def shd(fill):
    return '<w:shd w:val="clear" w:color="auto" w:fill="{}"/>'.format(fill)


def heading_numpr(level):
    return '<w:numPr><w:ilvl w:val="{}"/><w:numId w:val="3"/></w:numPr>'.format(level)


def doc_defaults():
    return (
        '<w:docDefaults>'
        '<w:rPrDefault><w:rPr>'
        + _rfonts() +
        '<w:color w:val="{ink}"/>'.format(ink=brand.INK)
        + _sz(11) +
        '<w:lang w:val="en-US" w:eastAsia="en-US" w:bidi="ar-SA"/>'
        '</w:rPr></w:rPrDefault>'
        '<w:pPrDefault><w:pPr>'
        + spacing(after=160, line=276) +
        '</w:pPr></w:pPrDefault>'
        '</w:docDefaults>')


def latent():
    return ('<w:latentStyles w:defLockedState="0" w:defUIPriority="99" '
            'w:defSemiHidden="1" w:defUnhideWhenUsed="1" w:defQFormat="0" '
            'w:count="376">'
            '<w:lsdException w:name="Normal" w:semiHidden="0" w:uiPriority="0" '
            'w:unhideWhenUsed="0" w:qFormat="1"/>'
            + "".join(
                '<w:lsdException w:name="heading {n}" w:semiHidden="0" '
                'w:uiPriority="{p}" w:unhideWhenUsed="0" w:qFormat="1"/>'
                .format(n=n, p=9 + n) for n in range(1, 10))
            + '<w:lsdException w:name="caption" w:semiHidden="0" w:uiPriority="35" '
              'w:unhideWhenUsed="0" w:qFormat="1"/>'
              '<w:lsdException w:name="Title" w:semiHidden="0" w:uiPriority="10" '
              'w:unhideWhenUsed="0" w:qFormat="1"/>'
              '<w:lsdException w:name="Subtitle" w:semiHidden="0" w:uiPriority="11" '
              'w:unhideWhenUsed="0" w:qFormat="1"/>'
              '<w:lsdException w:name="Quote" w:semiHidden="0" w:uiPriority="29" '
              'w:unhideWhenUsed="0" w:qFormat="1"/>'
              '<w:lsdException w:name="Intense Quote" w:semiHidden="0" '
              'w:uiPriority="30" w:unhideWhenUsed="0" w:qFormat="1"/>'
              '<w:lsdException w:name="List Paragraph" w:semiHidden="0" '
              'w:uiPriority="34" w:unhideWhenUsed="0" w:qFormat="1"/>'
              '<w:lsdException w:name="Hyperlink" w:semiHidden="0" w:uiPriority="99" '
              'w:unhideWhenUsed="0"/>'
              '<w:lsdException w:name="Table Grid" w:semiHidden="0" '
              'w:uiPriority="39" w:unhideWhenUsed="0"/>'
              '</w:latentStyles>')


def _table_style(sid, name, header_fill, header_color, band_fill, ui,
                 first_col_bold=True, outer=True):
    hair = brand.RULE
    borders = ['<w:tblBorders>']
    borders.append(border("top", 8, brand.DEEP_BLUE if outer else hair))
    borders.append(border("left", 0, "auto", val="none"))
    borders.append(border("bottom", 8, brand.DEEP_BLUE if outer else hair))
    borders.append(border("right", 0, "auto", val="none"))
    borders.append(border("insideH", 4, hair))
    borders.append(border("insideV", 0, "auto", val="none"))
    borders.append('</w:tblBorders>')

    tblpr = ('<w:tblPr><w:tblStyleRowBandSize w:val="1"/>'
             + "".join(borders) +
             '<w:tblCellMar>'
             '<w:top w:w="85" w:type="dxa"/><w:left w:w="115" w:type="dxa"/>'
             '<w:bottom w:w="85" w:type="dxa"/><w:right w:w="115" w:type="dxa"/>'
             '</w:tblCellMar></w:tblPr>')

    parts = [
        '<w:style w:type="table" w:styleId="{}">'.format(sid),
        '<w:name w:val="{}"/>'.format(name),
        '<w:basedOn w:val="TableNormal"/>',
        '<w:uiPriority w:val="{}"/>'.format(ui),
        '<w:qFormat/>',
        '<w:pPr>' + spacing(before=60, after=60, line=252) + '</w:pPr>',
        '<w:rPr>' + _sz(10, 2.5) + '</w:rPr>',
        tblpr,
        '<w:tblStylePr w:type="firstRow">'
        '<w:pPr>' + spacing(before=80, after=80) + '<w:keepNext/></w:pPr>'
        '<w:rPr><w:b/><w:bCs/>' + color(header_color) + '</w:rPr>'
        '<w:tcPr>' + shd(header_fill) +
        '<w:tcBorders>' + border("bottom", 8, header_fill) + '</w:tcBorders>'
        '<w:vAlign w:val="center"/></w:tcPr></w:tblStylePr>',
        '<w:tblStylePr w:type="lastRow">'
        '<w:rPr><w:b/><w:bCs/></w:rPr>'
        '<w:tcPr><w:tcBorders>' + border("top", 8, brand.PETROL) +
        '</w:tcBorders></w:tcPr></w:tblStylePr>',
    ]
    if first_col_bold:
        parts.append('<w:tblStylePr w:type="firstCol">'
                     '<w:rPr><w:b/><w:bCs/>' + color(brand.DEEP_BLUE) +
                     '</w:rPr></w:tblStylePr>')
    if band_fill:
        parts.append('<w:tblStylePr w:type="band1Horz">'
                     '<w:tcPr>' + shd(band_fill) + '</w:tcPr></w:tblStylePr>')
    parts.append('</w:style>')
    return "".join(parts)


def styles_xml():
    S = []

    # ---- foundational ------------------------------------------------------
    S.append(style("Normal", "Normal", default=True, ui=0, custom=False,
                   ppr='<w:jc w:val="left"/>' + spacing(after=160, line=276),
                   rpr=_sz(11)))
    S.append('<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont">'
             '<w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/>'
             '<w:semiHidden/><w:unhideWhenUsed/></w:style>')
    S.append('<w:style w:type="table" w:default="1" w:styleId="TableNormal">'
             '<w:name w:val="Normal Table"/><w:uiPriority w:val="99"/>'
             '<w:semiHidden/><w:unhideWhenUsed/>'
             '<w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar>'
             '<w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>'
             '<w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/>'
             '</w:tblCellMar></w:tblPr></w:style>')
    S.append('<w:style w:type="numbering" w:default="1" w:styleId="NoList">'
             '<w:name w:val="No List"/><w:uiPriority w:val="99"/>'
             '<w:semiHidden/><w:unhideWhenUsed/></w:style>')

    # ---- headings ----------------------------------------------------------
    hdefs = [
        (1, "heading 1", 17.0, brand.DEEP_BLUE, 400, 160, True),
        (2, "heading 2", 13.5, brand.PETROL, 320, 120, True),
        (3, "heading 3", 11.5, brand.DEEP_BLUE, 260, 100, True),
        (4, "heading 4", 11.0, brand.SLATE, 220, 80, False),
    ]
    for lvl, name, pt, col, before, after, numbered in hdefs:
        ppr = ('<w:keepNext/><w:keepLines/>'
               + (heading_numpr(lvl - 1) if numbered else "")
               + spacing(before=before, after=after, line=252)
               + '<w:outlineLvl w:val="{}"/>'.format(lvl - 1)
               + '<w:jc w:val="left"/>')
        rpr = (_rfonts(major=True) + '<w:b/><w:bCs/>' + color(col) + _sz(pt, 3.0)
               + ('<w:spacing w:val="-4"/>' if lvl == 1 else ""))
        if lvl == 1:
            ppr += '<w:pBdr>' + border("bottom", 6, brand.RULE, space=6) + '</w:pBdr>'
        if lvl == 4:
            rpr += '<w:caps/><w:spacing w:val="12"/>'
        S.append(style("Heading{}".format(lvl), name, based="Normal",
                       nextS="Normal", link="Heading{}Char".format(lvl),
                       ui=9 + lvl, ppr=ppr, rpr=rpr))
        S.append(style("Heading{}Char".format(lvl),
                       "Heading {} Char".format(lvl), stype="character",
                       based="DefaultParagraphFont", link="Heading{}".format(lvl),
                       ui=9 + lvl, rpr=rpr, qformat=False))

    S.append(style("UoHFrontHeading", "UoH Front Heading", based="Heading1",
                   nextS="Normal", ui=13,
                   ppr='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr>'
                       + '<w:outlineLvl w:val="0"/>'))

    # ---- cover / display ---------------------------------------------------
    S.append(style("Title", "Title", based="Normal", nextS="Subtitle",
                   link="TitleChar", ui=10,
                   ppr='<w:jc w:val="left"/><w:contextualSpacing/>'
                       + spacing(before=0, after=140, line=228),
                   rpr=_rfonts(major=True) + '<w:b/><w:bCs/>'
                       + color(brand.DEEP_BLUE) + '<w:spacing w:val="-14"/>'
                       + _sz(30, 4)))
    S.append(style("TitleChar", "Title Char", stype="character",
                   based="DefaultParagraphFont", link="Title", ui=10,
                   qformat=False,
                   rpr=_rfonts(major=True) + '<w:b/><w:bCs/>'
                       + color(brand.DEEP_BLUE) + _sz(30, 4)))
    S.append(style("Subtitle", "Subtitle", based="Normal", nextS="Normal",
                   link="SubtitleChar", ui=11,
                   ppr='<w:jc w:val="left"/>' + spacing(before=0, after=360,
                                                        line=264),
                   rpr=color(brand.SLATE) + _sz(15, 3)))
    S.append(style("SubtitleChar", "Subtitle Char", stype="character",
                   based="DefaultParagraphFont", link="Subtitle", ui=11,
                   qformat=False, rpr=color(brand.SLATE) + _sz(15, 3)))
    S.append(style("UoHDocLabel", "UoH Doc Label", based="Normal",
                   nextS="Title", ui=12,
                   ppr='<w:jc w:val="left"/>' + spacing(before=0, after=100),
                   rpr='<w:b/><w:bCs/><w:caps/><w:spacing w:val="46"/>'
                       + color(brand.PETROL) + _sz(9, 2)))
    S.append(style("UoHCoverMeta", "UoH Cover Meta", based="Normal",
                   nextS="UoHCoverMeta", ui=13,
                   ppr='<w:jc w:val="left"/>' + spacing(before=0, after=60,
                                                        line=240),
                   rpr=color(brand.INK) + _sz(9.5, 2.5)))
    S.append(style("UoHCoverMetaLabel", "UoH Cover Meta Label",
                   stype="character", based="DefaultParagraphFont", ui=13,
                   rpr='<w:b/><w:bCs/><w:caps/><w:spacing w:val="20"/>'
                       + color(brand.SLATE) + _sz(8, 2)))
    S.append(style("UoHClassification", "UoH Classification", based="Normal",
                   nextS="Normal", ui=14,
                   ppr='<w:jc w:val="left"/>'
                       + '<w:pBdr>' + border("top", 6, brand.TEAL, space=6)
                       + '</w:pBdr>' + spacing(before=120, after=0),
                   rpr='<w:b/><w:bCs/><w:caps/><w:spacing w:val="34"/>'
                       + color(brand.PETROL) + _sz(8, 2)))

    # ---- section divider ---------------------------------------------------
    S.append(style("UoHSectionNumber", "UoH Section Number", based="Normal",
                   nextS="UoHSectionTitle", ui=15,
                   ppr='<w:pageBreakBefore/><w:jc w:val="left"/>'
                       + spacing(before=2600, after=60, line=240),
                   rpr=_rfonts(major=True) + color(brand.TEAL)
                       + '<w:spacing w:val="-20"/>' + _sz(52, 6)))
    S.append(style("UoHSectionTitle", "UoH Section Title", based="Normal",
                   nextS="Normal", ui=15,
                   ppr='<w:jc w:val="left"/>'
                       + '<w:pBdr>' + border("bottom", 12, brand.TEAL, space=10)
                       + '</w:pBdr>' + spacing(before=0, after=200, line=240),
                   rpr=_rfonts(major=True) + '<w:b/><w:bCs/>'
                       + color(brand.DEEP_BLUE) + _sz(22, 3.5)))

    # ---- body variants -----------------------------------------------------
    S.append(style("UoHLead", "UoH Lead Paragraph", based="Normal",
                   nextS="Normal", ui=16,
                   ppr=spacing(before=0, after=220, line=288),
                   rpr=color(brand.PETROL) + _sz(12.5, 3)))
    S.append(style("UoHExecSummary", "UoH Executive Summary", based="Normal",
                   nextS="UoHExecSummary", ui=17,
                   ppr='<w:pBdr>'
                       + border("top", 4, brand.LIGHT_TEAL, space=10)
                       + border("left", 4, brand.LIGHT_TEAL, space=10)
                       + border("bottom", 4, brand.LIGHT_TEAL, space=10)
                       + border("right", 4, brand.LIGHT_TEAL, space=10)
                       + '</w:pBdr>' + shd(brand.tint(brand.TEAL, 0.10))
                       + '<w:ind w:left="170" w:right="170"/>'
                       + spacing(before=100, after=100, line=276),
                   rpr=_sz(10.5, 2.5)))
    S.append(style("UoHCallout", "UoH Callout", based="Normal", nextS="Normal",
                   ui=18,
                   ppr='<w:pBdr>' + border("left", 18, brand.TEAL, space=10)
                       + '</w:pBdr>' + shd(brand.MIST)
                       + '<w:ind w:left="284" w:right="284"/>'
                       + '<w:jc w:val="left"/>'
                       + spacing(before=180, after=180, line=264),
                   rpr=color(brand.DEEP_BLUE) + _sz(10.5, 2.5)))
    S.append(style("Quote", "Quote", based="Normal", nextS="Normal",
                   link="QuoteChar", ui=29,
                   ppr='<w:ind w:left="567" w:right="567"/>'
                       + '<w:jc w:val="left"/>'
                       + spacing(before=200, after=200, line=276),
                   rpr='<w:i/><w:iCs/>' + color(brand.PETROL) + _sz(11.5, 3)))
    S.append(style("QuoteChar", "Quote Char", stype="character",
                   based="DefaultParagraphFont", link="Quote", ui=29,
                   qformat=False,
                   rpr='<w:i/><w:iCs/>' + color(brand.PETROL) + _sz(11.5, 3)))
    S.append(style("UoHNote", "UoH Note", based="Normal", nextS="Normal",
                   ui=19, ppr=spacing(before=80, after=180, line=240),
                   rpr=color(brand.SLATE) + _sz(9, 2.5)))

    # ---- lists -------------------------------------------------------------
    S.append(style("ListParagraph", "List Paragraph", based="Normal",
                   ui=34, ppr='<w:ind w:left="454"/><w:contextualSpacing/>'
                              + spacing(after=80)))
    S.append(style("UoHBullet", "UoH Bullet", based="ListParagraph",
                   nextS="UoHBullet", ui=35,
                   ppr='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
                       '<w:jc w:val="left"/><w:contextualSpacing/>'
                       + spacing(after=80, line=264)))
    S.append(style("UoHBullet2", "UoH Bullet 2", based="UoHBullet",
                   nextS="UoHBullet2", ui=35,
                   ppr='<w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr>'))
    S.append(style("UoHNumber", "UoH Numbered", based="ListParagraph",
                   nextS="UoHNumber", ui=36,
                   ppr='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>'
                       '<w:jc w:val="left"/><w:contextualSpacing/>'
                       + spacing(after=80, line=264)))
    S.append(style("UoHNumber2", "UoH Numbered 2", based="UoHNumber",
                   nextS="UoHNumber2", ui=36,
                   ppr='<w:numPr><w:ilvl w:val="1"/><w:numId w:val="2"/></w:numPr>'))

    # ---- captions, links, notes -------------------------------------------
    S.append(style("Caption", "caption", based="Normal", nextS="Normal", ui=35,
                   ppr='<w:keepNext/><w:jc w:val="left"/>'
                       + spacing(before=80, after=240, line=240),
                   rpr='<w:b/><w:bCs/>' + color(brand.SLATE) + _sz(8.5, 2.5)))
    S.append(style("Hyperlink", "Hyperlink", stype="character",
                   based="DefaultParagraphFont", ui=99,
                   rpr=color(brand.PETROL) + '<w:u w:val="single"/>'))
    S.append(style("FollowedHyperlink", "FollowedHyperlink", stype="character",
                   based="DefaultParagraphFont", ui=99, qformat=False,
                   rpr=color(brand.SLATE) + '<w:u w:val="single"/>'))
    S.append(style("UoHEmphasis", "UoH Emphasis", stype="character",
                   based="DefaultParagraphFont", ui=20,
                   rpr='<w:b/><w:bCs/>' + color(brand.PETROL)))

    # ---- header / footer ---------------------------------------------------
    S.append(style("Header", "header", based="Normal", nextS="Normal", ui=99,
                   qformat=False,
                   ppr='<w:tabs><w:tab w:val="center" w:pos="4535"/>'
                       '<w:tab w:val="right" w:pos="9070"/></w:tabs>'
                       '<w:jc w:val="left"/>'
                       + '<w:pBdr>' + border("bottom", 4, brand.RULE, space=6)
                       + '</w:pBdr>' + spacing(after=0, line=240),
                   rpr=color(brand.SLATE) + _sz(8.5, 2.5)))
    S.append(style("Footer", "footer", based="Normal", nextS="Normal", ui=99,
                   qformat=False,
                   ppr='<w:tabs><w:tab w:val="center" w:pos="4535"/>'
                       '<w:tab w:val="right" w:pos="9070"/></w:tabs>'
                       '<w:jc w:val="left"/>'
                       + '<w:pBdr>' + border("top", 4, brand.RULE, space=6)
                       + '</w:pBdr>' + spacing(after=0, line=240),
                   rpr=color(brand.SLATE) + _sz(8.5, 2.5)))
    S.append(style("PageNumber", "page number", stype="character",
                   based="DefaultParagraphFont", ui=99, qformat=False,
                   rpr='<w:b/><w:bCs/>' + color(brand.DEEP_BLUE)))

    # ---- table of contents -------------------------------------------------
    S.append(style("TOCHeading", "TOC Heading", based="Heading1",
                   nextS="Normal", ui=39,
                   ppr='<w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr>'
                       '<w:outlineLvl w:val="9"/>'
                       + spacing(before=0, after=200, line=252)
                       + '<w:pBdr>' + border("bottom", 6, brand.RULE, space=6)
                       + '</w:pBdr>'))
    toc_specs = [(1, 0, True, brand.DEEP_BLUE, 11, 200),
                 (2, 240, False, brand.INK, 10.5, 60),
                 (3, 480, False, brand.SLATE, 10, 40)]
    for lvl, ind, bold, col, pt, before in toc_specs:
        S.append(style("TOC{}".format(lvl), "toc {}".format(lvl),
                       based="Normal", nextS="Normal", ui=39, qformat=False,
                       ppr='<w:tabs><w:tab w:val="right" w:leader="dot" '
                           'w:pos="9070"/></w:tabs>'
                           '<w:jc w:val="left"/>'
                           '<w:ind w:left="{i}" w:right="284" w:hanging="0"/>'.format(i=ind)
                           + spacing(before=before, after=40, line=240),
                       rpr=('<w:b/><w:bCs/>' if bold else "") + color(col)
                           + _sz(pt, 2.5)))

    # ---- Arabic / RTL companions ------------------------------------------
    # NB: inside <w:bidi/> Word reads w:jc="left" as "start" — the right-hand
    # margin. Writing "right" here would flush Arabic text to the left.
    ar_common = '<w:bidi/><w:jc w:val="left"/>'
    S.append(style("UoHArabicTitle", "UoH Arabic Title", based="Title",
                   nextS="UoHArabicBody", ui=21,
                   ppr=ar_common + spacing(before=0, after=140, line=252),
                   rpr=_rfonts(major=True) + '<w:b/><w:bCs/><w:rtl/>'
                       + color(brand.DEEP_BLUE) + _sz(26, 8)))
    for lvl, pt, col in ((1, 16, brand.DEEP_BLUE), (2, 13.5, brand.PETROL),
                         (3, 12, brand.DEEP_BLUE)):
        S.append(style("UoHArabicHeading{}".format(lvl),
                       "UoH Arabic Heading {}".format(lvl),
                       based="Heading{}".format(lvl), nextS="UoHArabicBody",
                       ui=21,
                       ppr=ar_common + '<w:numPr><w:ilvl w:val="0"/>'
                                       '<w:numId w:val="0"/></w:numPr>'
                           + spacing(before=320, after=120, line=264),
                       rpr=_rfonts(major=True) + '<w:b/><w:bCs/><w:rtl/>'
                           + color(col) + _sz(pt, 4)))
    S.append(style("UoHArabicBody", "UoH Arabic Body", based="Normal",
                   nextS="UoHArabicBody", ui=21,
                   ppr=ar_common + spacing(after=160, line=312),
                   rpr='<w:rtl/>' + _sz(11, 3)))
    S.append(style("UoHArabicBullet", "UoH Arabic Bullet",
                   based="UoHArabicBody", nextS="UoHArabicBullet", ui=21,
                   ppr=ar_common
                       + '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="4"/></w:numPr>'
                       + '<w:ind w:left="454"/><w:contextualSpacing/>'
                       + spacing(after=80, line=300)))

    # ---- tables ------------------------------------------------------------
    S.append(_table_style("UoHTable", "UoH Table", brand.DEEP_BLUE, "FFFFFF",
                          brand.MIST, 59))
    S.append(_table_style("UoHTableLight", "UoH Table Light",
                          brand.tint(brand.TEAL, 0.16), brand.DEEP_BLUE,
                          None, 60))
    S.append('<w:style w:type="table" w:styleId="UoHTableKeyFacts">'
             '<w:name w:val="UoH Key Facts Table"/>'
             '<w:basedOn w:val="TableNormal"/><w:uiPriority w:val="61"/>'
             '<w:qFormat/>'
             '<w:pPr>' + spacing(before=40, after=40, line=240) + '</w:pPr>'
             '<w:rPr>' + _sz(10, 2.5) + '</w:rPr>'
             '<w:tblPr><w:tblBorders>'
             + border("insideH", 4, brand.RULE)
             + border("top", 0, "auto", val="none")
             + border("bottom", 0, "auto", val="none")
             + border("left", 0, "auto", val="none")
             + border("right", 0, "auto", val="none")
             + border("insideV", 0, "auto", val="none")
             + '</w:tblBorders><w:tblCellMar>'
               '<w:top w:w="70" w:type="dxa"/><w:left w:w="0" w:type="dxa"/>'
               '<w:bottom w:w="70" w:type="dxa"/><w:right w:w="115" w:type="dxa"/>'
               '</w:tblCellMar></w:tblPr>'
             '<w:tblStylePr w:type="firstCol"><w:rPr><w:b/><w:bCs/>'
             + color(brand.SLATE) + '</w:rPr></w:tblStylePr>'
             '</w:style>')
    S.append('<w:style w:type="table" w:styleId="TableGrid">'
             '<w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/>'
             '<w:uiPriority w:val="39"/>'
             '<w:pPr>' + spacing(after=0, line=240) + '</w:pPr>'
             '<w:tblPr><w:tblBorders>'
             + border("top", 4, brand.RULE) + border("left", 4, brand.RULE)
             + border("bottom", 4, brand.RULE) + border("right", 4, brand.RULE)
             + border("insideH", 4, brand.RULE) + border("insideV", 4, brand.RULE)
             + '</w:tblBorders></w:tblPr></w:style>')

    return oox.canonicalize(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<w:styles {ns}>{defaults}{latent}{styles}</w:styles>'
        .format(ns=W, defaults=doc_defaults(), latent=latent(),
                styles="".join(S)))
