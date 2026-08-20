"""
The single Office theme shared by the Word and PowerPoint templates.

Both packages embed the byte-identical part, which is what keeps a chart pasted
from Excel, a table in Word and a slide in PowerPoint resolving to the same
brand colours and the same type.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402

THEME_NAME = "University of Ha'il"

_C = brand.THEME_COLORS


def _clr(slot, value):
    if slot == "dk1":
        return '<a:dk1><a:sysClr val="windowText" lastClr="{}"/></a:dk1>'.format(value)
    if slot == "lt1":
        return '<a:lt1><a:sysClr val="window" lastClr="{}"/></a:lt1>'.format(value)
    return '<a:{0}><a:srgbClr val="{1}"/></a:{0}>'.format(slot, value)


def color_scheme():
    order = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3",
             "accent4", "accent5", "accent6", "hlink", "folHlink"]
    return ('<a:clrScheme name="{}">{}</a:clrScheme>'
            .format(THEME_NAME, "".join(_clr(s, _C[s]) for s in order)))


def font_scheme():
    def block(tag, latin, cs):
        return (
            '<a:{tag}>'
            '<a:latin typeface="{latin}" panose="020B0502040204020203"/>'
            '<a:ea typeface=""/>'
            '<a:cs typeface="{cs}"/>'
            '<a:font script="Arab" typeface="{cs}"/>'
            '<a:font script="Hebr" typeface="Arial"/>'
            '</a:{tag}>'.format(tag=tag, latin=latin, cs=cs))

    return ('<a:fontScheme name="{}">{}{}</a:fontScheme>'.format(
        THEME_NAME,
        block("majorFont", brand.THEME_MAJOR_LATIN, brand.THEME_MAJOR_CS),
        block("minorFont", brand.THEME_MINOR_LATIN, brand.THEME_MINOR_CS)))


def format_scheme():
    """Deliberately restrained: flat fills, hairline-to-medium lines, one soft
    shadow. No heavy gradients or bevels anywhere in the identity."""
    solid = '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    subtle_grad = (
        '<a:gradFill rotWithShape="1"><a:gsLst>'
        '<a:gs pos="0"><a:schemeClr val="phClr"><a:lumMod val="105000"/>'
        '<a:satMod val="102000"/></a:schemeClr></a:gs>'
        '<a:gs pos="100000"><a:schemeClr val="phClr"><a:lumMod val="92000"/>'
        '<a:satMod val="104000"/></a:schemeClr></a:gs>'
        '</a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>')

    def ln(w, alpha=None):
        clr = ('<a:schemeClr val="phClr">{}</a:schemeClr>'
               .format('<a:alpha val="{}"/>'.format(alpha) if alpha else ""))
        return ('<a:ln w="{}" cap="flat" cmpd="sng" algn="ctr">'
                '<a:solidFill>{}</a:solidFill><a:prstDash val="solid"/>'
                '<a:miter lim="800000"/></a:ln>'.format(w, clr))

    soft_shadow = (
        '<a:effectStyle><a:effectLst>'
        '<a:outerShdw blurRad="63500" dist="25400" dir="5400000" rotWithShape="0">'
        '<a:srgbClr val="{}"><a:alpha val="18000"/></a:srgbClr></a:outerShdw>'
        '</a:effectLst></a:effectStyle>'.format(brand.DEEP_BLUE))

    return (
        '<a:fmtScheme name="{}">'
        '<a:fillStyleLst>{s}{s}{g}</a:fillStyleLst>'
        '<a:lnStyleLst>{l1}{l2}{l3}</a:lnStyleLst>'
        '<a:effectStyleLst>'
        '<a:effectStyle><a:effectLst/></a:effectStyle>'
        '<a:effectStyle><a:effectLst/></a:effectStyle>'
        '{sh}'
        '</a:effectStyleLst>'
        '<a:bgFillStyleLst>{s}{s}{g}</a:bgFillStyleLst>'
        '</a:fmtScheme>'.format(THEME_NAME, s=solid, g=subtle_grad,
                                l1=ln(6350, 60000), l2=ln(12700),
                                l3=ln(19050), sh=soft_shadow))


def theme_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'name="{name}">'
        '<a:themeElements>{clr}{fnt}{fmt}</a:themeElements>'
        '<a:objectDefaults/><a:extraClrSchemeLst/>'
        '</a:theme>'.format(name=THEME_NAME, clr=color_scheme(),
                            fnt=font_scheme(), fmt=format_scheme()))


if __name__ == "__main__":
    x = theme_xml()
    import xml.dom.minidom as md
    md.parseString(x)
    print("theme1.xml OK — {} bytes".format(len(x)))
