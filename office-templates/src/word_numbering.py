"""List definitions: body bullets, body numbering, automatic heading numbering
and an RTL bullet list for Arabic content."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'

BULLET_CHARS = ["&#xF0B7;", "&#x2013;", "&#xF0A7;"]      # Symbol • / en dash / Wingdings ▪
BULLET_FONTS = ["Symbol", None, "Wingdings"]
NUM_FMTS = ["decimal", "lowerLetter", "lowerRoman"]
NUM_TEXTS = ["%1.", "%2.", "%3."]


def _lvl(ilvl, numfmt, text, left, hanging, rpr="", pstyle=None,
         jc="left", suff=None, start=1, rtl=False):
    bits = ['<w:lvl w:ilvl="{}">'.format(ilvl),
            '<w:start w:val="{}"/>'.format(start),
            '<w:numFmt w:val="{}"/>'.format(numfmt)]
    if pstyle:
        bits.append('<w:pStyle w:val="{}"/>'.format(pstyle))
    if suff:
        bits.append('<w:suff w:val="{}"/>'.format(suff))
    bits.append('<w:lvlText w:val="{}"/>'.format(text))
    bits.append('<w:lvlJc w:val="{}"/>'.format(jc))
    ind = ('<w:ind w:right="{l}" w:hanging="{h}"/>'.format(l=left, h=hanging)
           if rtl else
           '<w:ind w:left="{l}" w:hanging="{h}"/>'.format(l=left, h=hanging))
    bits.append('<w:pPr>{}</w:pPr>'.format(ind))
    if rpr:
        bits.append('<w:rPr>{}</w:rPr>'.format(rpr))
    bits.append('</w:lvl>')
    return "".join(bits)


def numbering_xml():
    out = []

    # 0 — body bullets, three levels, brand-teal markers
    lv = []
    for i in range(3):
        rpr = '<w:color w:val="{}"/>'.format(brand.TEAL)
        if BULLET_FONTS[i]:
            rpr = ('<w:rFonts w:ascii="{f}" w:hAnsi="{f}" w:hint="default"/>'
                   .format(f=BULLET_FONTS[i]) + rpr)
        lv.append(_lvl(i, "bullet", BULLET_CHARS[i],
                       454 + i * 397, 284, rpr=rpr))
    out.append('<w:abstractNum w:abstractNumId="0">'
               '<w:multiLevelType w:val="hybridMultilevel"/>'
               + "".join(lv) + '</w:abstractNum>')

    # 1 — body numbering
    lv = []
    for i in range(3):
        lv.append(_lvl(i, NUM_FMTS[i], NUM_TEXTS[i], 454 + i * 397, 284,
                       rpr='<w:b/><w:color w:val="{}"/>'.format(brand.PETROL)))
    out.append('<w:abstractNum w:abstractNumId="1">'
               '<w:multiLevelType w:val="hybridMultilevel"/>'
               + "".join(lv) + '</w:abstractNum>')

    # 2 — automatic heading numbers, bound to Heading 1-3
    lv = [_lvl(0, "decimal", "%1.", 0, 0, pstyle="Heading1", suff="space"),
          _lvl(1, "decimal", "%1.%2", 0, 0, pstyle="Heading2", suff="space"),
          _lvl(2, "decimal", "%1.%2.%3", 0, 0, pstyle="Heading3", suff="space")]
    for i in range(3, 9):
        lv.append(_lvl(i, "none", "", 0, 0))
    out.append('<w:abstractNum w:abstractNumId="2">'
               '<w:multiLevelType w:val="multilevel"/>'
               '<w:name w:val="UoH Heading Numbers"/>'
               + "".join(lv) + '</w:abstractNum>')

    # 3 — Arabic (RTL) bullets
    lv = []
    for i in range(3):
        rpr = '<w:color w:val="{}"/>'.format(brand.TEAL)
        if BULLET_FONTS[i]:
            rpr = ('<w:rFonts w:ascii="{f}" w:hAnsi="{f}" w:hint="default"/>'
                   .format(f=BULLET_FONTS[i]) + rpr)
        # indents stay logical (start/hanging); <w:bidi/> on the paragraph
        # flips them to the right-hand margin
        lv.append(_lvl(i, "bullet", BULLET_CHARS[i], 454 + i * 397, 284,
                       rpr=rpr))
    out.append('<w:abstractNum w:abstractNumId="3">'
               '<w:multiLevelType w:val="hybridMultilevel"/>'
               + "".join(lv) + '</w:abstractNum>')

    nums = "".join(
        '<w:num w:numId="{n}"><w:abstractNumId w:val="{a}"/></w:num>'
        .format(n=i + 1, a=i) for i in range(4))

    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<w:numbering {ns}>{abs}{nums}</w:numbering>'
            .format(ns=W, abs="".join(out), nums=nums))
