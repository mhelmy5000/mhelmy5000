#!/usr/bin/env python3
"""
Builds University_Branded_Presentation_Template.potx (and a sample deck that
walks through every layout, used for visual QA).
"""
import os
import re
import shutil
import sys
import zipfile
import xml.dom.minidom as minidom

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand                                   # noqa: E402
import theme_xml                               # noqa: E402
import ppt_layouts as PL                       # noqa: E402
from ppt_shapes import (SLIDE_W, SLIDE_H, esc)  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
LOGO = os.path.join(ROOT, "assets", "logo")
BUILD = os.path.join(ROOT, "build", "ppt")
OUTFILE = os.path.join(ROOT, "University_Branded_Presentation_Template.potx")
SAMPLE = os.path.join(ROOT, "docs", "University_Branded_Presentation_Sample.pptx")

P_NS = ('xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"')
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
CT = "application/vnd.openxmlformats-officedocument"

TBL_GUID = "{9B2C7A41-3E5D-4F62-8A17-5C0E1D4B7F30}"

MEDIA = [("emblem.png", "uoh-emblem.png", 420),
         ("lockup-white.png", "uoh-lockup-horizontal-white.png", 1500),
         ("emblem-white.png", "uoh-emblem-white.png", 420)]

MASTER_RID_EMBLEM = "rId22"
LAYOUT_RIDS = dict(emblem="rId2", lockup_white="rId3", emblem_white="rId4")


# ------------------------------------------------------------------ parts ----
def clr_map():
    return ('<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" '
            'accent1="accent1" accent2="accent2" accent3="accent3" '
            'accent4="accent4" accent5="accent5" accent6="accent6" '
            'hlink="hlink" folHlink="folHlink"/>')


def slide_master(n_layouts):
    ids = "".join('<p:sldLayoutId id="{i}" r:id="rId{n}"/>'
                  .format(i=2147483649 + n, n=n + 1) for n in range(n_layouts))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<p:sldMaster {ns}>'
        '<p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/>'
        '</a:solidFill><a:effectLst/></p:bgPr></p:bg>{tree}</p:cSld>'
        '{cm}<p:sldLayoutIdLst>{ids}</p:sldLayoutIdLst>'
        '<p:hf sldNum="1" hdr="0" ftr="1" dt="0"/>'
        '{tx}</p:sldMaster>'
        .format(ns=P_NS, tree=PL.master_shapes(MASTER_RID_EMBLEM),
                cm=clr_map(), ids=ids, tx=PL.master_txstyles()))


def slide_layout(spec):
    bg = ""
    if spec["bg"]:
        bg = ('<p:bg><p:bgPr><a:solidFill><a:srgbClr val="{}"/></a:solidFill>'
              '<a:effectLst/></p:bgPr></p:bg>'.format(spec["bg"]))
    show = "" if spec["show_master"] else ' showMasterSp="0"'
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<p:sldLayout {ns} type="{t}" preserve="1"{sm}>'
        '<p:cSld name="{n}">{bg}{tree}</p:cSld>'
        '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'
        .format(ns=P_NS, t=spec["type"], sm=show, n=esc(spec["name"]),
                bg=bg, tree=PL.sp_tree(spec["shapes"])))


def presentation(slide_rids=()):
    slds = "".join('<p:sldId id="{i}" r:id="{r}"/>'.format(i=256 + n, r=rid)
                   for n, rid in enumerate(slide_rids))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<p:presentation {ns} saveSubsetFonts="1">'
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/>'
        '</p:sldMasterIdLst>'
        '<p:sldIdLst>{slds}</p:sldIdLst>'
        '<p:sldSz cx="{w}" cy="{h}"/><p:notesSz cx="6858000" cy="9144000"/>'
        '<p:defaultTextStyle>'
        '<a:defPPr><a:defRPr lang="en-US"/></a:defPPr>'
        '</p:defaultTextStyle></p:presentation>'
        .format(ns=P_NS, slds=slds, w=SLIDE_W, h=SLIDE_H))


def table_styles():
    def bdr(edge, color=None, w=12700):
        if not color:
            return '<a:{e}><a:ln><a:noFill/></a:ln></a:{e}>'.format(e=edge)
        return ('<a:{e}><a:ln w="{w}" cap="flat" cmpd="sng" algn="ctr">'
                '<a:solidFill><a:srgbClr val="{c}"/></a:solidFill>'
                '<a:prstDash val="solid"/></a:ln></a:{e}>'
                .format(e=edge, w=w, c=color))

    def txstyle(color, b=None):
        return ('<a:tcTxStyle{b}><a:font><a:latin typeface="+mn-lt"/>'
                '<a:ea typeface=""/><a:cs typeface="+mn-cs"/></a:font>'
                '<a:srgbClr val="{c}"/></a:tcTxStyle>'
                .format(b=' b="on"' if b else "", c=color))

    def fill(color):
        return ('<a:fill><a:solidFill><a:srgbClr val="{}"/></a:solidFill>'
                '</a:fill>'.format(color))

    whole = ('<a:wholeTbl>{tx}<a:tcStyle><a:tcBdr>{l}{r}{t}{b}{ih}{iv}'
             '</a:tcBdr>{f}</a:tcStyle></a:wholeTbl>'
             .format(tx=txstyle(brand.INK), l=bdr("left"), r=bdr("right"),
                     t=bdr("top", brand.DEEP_BLUE), b=bdr("bottom", brand.DEEP_BLUE),
                     ih=bdr("insideH", brand.RULE, 6350), iv=bdr("insideV"),
                     f=fill(brand.WHITE)))
    band = ('<a:band1H><a:tcStyle><a:tcBdr/>{f}</a:tcStyle></a:band1H>'
            .format(f=fill(brand.MIST)))
    first = ('<a:firstRow>{tx}<a:tcStyle><a:tcBdr>{b}</a:tcBdr>{f}</a:tcStyle>'
             '</a:firstRow>'
             .format(tx=txstyle(brand.WHITE, b=True),
                     b=bdr("bottom", brand.DEEP_BLUE), f=fill(brand.DEEP_BLUE)))
    firstcol = ('<a:firstCol>{tx}<a:tcStyle><a:tcBdr/></a:tcStyle></a:firstCol>'
                .format(tx=txstyle(brand.DEEP_BLUE, b=True)))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/'
        '2006/main" def="{g}">'
        '<a:tblStyle styleId="{g}" styleName="University of Ha\'il Table">'
        '{whole}{band}{fc}{first}</a:tblStyle></a:tblStyleLst>'
        .format(g=TBL_GUID, whole=whole, band=band, fc=firstcol, first=first))


def pres_props():
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<p:presentationPr {ns}/>'.format(ns=P_NS))


def view_props():
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<p:viewPr {ns}><p:gridSpacing cx="72008" cy="72008"/>'
            '</p:viewPr>'.format(ns=P_NS))


def core_props():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<cp:coreProperties '
        'xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/'
        'core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        '<dc:title>University of Ha\'il — Presentation Template</dc:title>'
        '<dc:creator>University of Ha\'il</dc:creator>'
        '<cp:keywords>University of Ha\'il; template; brand</cp:keywords>'
        '<cp:category>Template</cp:category><cp:revision>1</cp:revision>'
        '</cp:coreProperties>')


def app_props(n_slides=0):
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/'
        '2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/'
        'officeDocument/2006/docPropsVTypes">'
        '<Application>Microsoft Office PowerPoint</Application>'
        '<Slides>{n}</Slides><Company>University of Ha\'il</Company>'
        '<AppVersion>16.0000</AppVersion></Properties>'.format(n=n_slides))


def content_types(n_layouts, n_slides=0, template=True):
    main = ("presentationml.template.main+xml" if template
            else "presentationml.presentation.main+xml")
    parts = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/'
        'content-types">'
        '<Default Extension="rels" ContentType="application/vnd.'
        'openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Default Extension="png" ContentType="image/png"/>'
        '<Override PartName="/ppt/presentation.xml" ContentType="{ct}.{m}"/>'
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" '
        'ContentType="{ct}.presentationml.slideMaster+xml"/>'
        '<Override PartName="/ppt/presProps.xml" ContentType="{ct}.'
        'presentationml.presProps+xml"/>'
        '<Override PartName="/ppt/viewProps.xml" ContentType="{ct}.'
        'presentationml.viewProps+xml"/>'
        '<Override PartName="/ppt/tableStyles.xml" ContentType="{ct}.'
        'presentationml.tableStyles+xml"/>'
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="{ct}.theme+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.'
        'openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="{ct}.'
        'extended-properties+xml"/>'.format(ct=CT, m=main)]
    for i in range(1, n_layouts + 1):
        parts.append('<Override PartName="/ppt/slideLayouts/slideLayout{i}.xml" '
                     'ContentType="{ct}.presentationml.slideLayout+xml"/>'
                     .format(i=i, ct=CT))
    for i in range(1, n_slides + 1):
        parts.append('<Override PartName="/ppt/slides/slide{i}.xml" '
                     'ContentType="{ct}.presentationml.slide+xml"/>'
                     .format(i=i, ct=CT))
    parts.append('</Types>')
    return "".join(parts)


def root_rels():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/'
        'relationships">'
        '<Relationship Id="rId1" Type="{r}/officeDocument" '
        'Target="ppt/presentation.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/'
        'package/2006/relationships/metadata/core-properties" '
        'Target="docProps/core.xml"/>'
        '<Relationship Id="rId3" Type="{r}/extended-properties" '
        'Target="docProps/app.xml"/></Relationships>'.format(r=R))


def pres_rels(n_slides=0):
    rel = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
           '<Relationships xmlns="http://schemas.openxmlformats.org/package/'
           '2006/relationships">'
           '<Relationship Id="rId1" Type="{r}/slideMaster" '
           'Target="slideMasters/slideMaster1.xml"/>'.format(r=R)]
    nxt = 2
    for i in range(1, n_slides + 1):
        rel.append('<Relationship Id="rId{n}" Type="{r}/slide" '
                   'Target="slides/slide{i}.xml"/>'.format(n=nxt, r=R, i=i))
        nxt += 1
    for typ, target in (("presProps", "presProps.xml"),
                        ("viewProps", "viewProps.xml"),
                        ("theme", "theme/theme1.xml"),
                        ("tableStyles", "tableStyles.xml")):
        rel.append('<Relationship Id="rId{n}" Type="{r}/{t}" Target="{g}"/>'
                   .format(n=nxt, r=R, t=typ, g=target))
        nxt += 1
    rel.append('</Relationships>')
    return "".join(rel), ["rId{}".format(i + 2) for i in range(n_slides)]


def master_rels(n_layouts):
    rel = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
           '<Relationships xmlns="http://schemas.openxmlformats.org/package/'
           '2006/relationships">']
    for i in range(1, n_layouts + 1):
        rel.append('<Relationship Id="rId{i}" Type="{r}/slideLayout" '
                   'Target="../slideLayouts/slideLayout{i}.xml"/>'
                   .format(i=i, r=R))
    rel.append('<Relationship Id="rId{n}" Type="{r}/theme" '
               'Target="../theme/theme1.xml"/>'.format(n=n_layouts + 1, r=R))
    rel.append('<Relationship Id="{i}" Type="{r}/image" '
               'Target="../media/emblem.png"/>'.format(i=MASTER_RID_EMBLEM, r=R))
    rel.append('</Relationships>')
    return "".join(rel)


def layout_rels(layout_xml):
    """Only declare the images this particular layout actually uses."""
    used = set(re.findall(r'r:embed="(rId\d+)"', layout_xml))
    target = {LAYOUT_RIDS["emblem"]: "emblem.png",
              LAYOUT_RIDS["lockup_white"]: "lockup-white.png",
              LAYOUT_RIDS["emblem_white"]: "emblem-white.png"}
    rel = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
           '<Relationships xmlns="http://schemas.openxmlformats.org/package/'
           '2006/relationships">'
           '<Relationship Id="rId1" Type="{r}/slideMaster" '
           'Target="../slideMasters/slideMaster1.xml"/>'.format(r=R)]
    for rid in sorted(used, key=lambda s: int(s[3:])):
        rel.append('<Relationship Id="{i}" Type="{r}/image" '
                   'Target="../media/{g}"/>'.format(i=rid, r=R, g=target[rid]))
    rel.append('</Relationships>')
    return "".join(rel)


def prepare_media():
    media = os.path.join(BUILD, "media")
    os.makedirs(media, exist_ok=True)
    for out, src, height_or_width in MEDIA:
        im = Image.open(os.path.join(LOGO, src))
        if "lockup" in out:
            w = height_or_width
            im = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        else:
            h = height_or_width
            im = im.resize((round(h * im.width / im.height), h), Image.LANCZOS)
        im.save(os.path.join(media, out), optimize=True)


def base_parts(specs, template=True, n_slides=0, slide_parts=None):
    prels, slide_rids = pres_rels(n_slides)
    parts = {
        "[Content_Types].xml": content_types(len(specs), n_slides, template),
        "_rels/.rels": root_rels(),
        "docProps/core.xml": core_props(),
        "docProps/app.xml": app_props(n_slides),
        "ppt/presentation.xml": presentation(slide_rids),
        "ppt/_rels/presentation.xml.rels": prels,
        "ppt/presProps.xml": pres_props(),
        "ppt/viewProps.xml": view_props(),
        "ppt/tableStyles.xml": table_styles(),
        "ppt/theme/theme1.xml": theme_xml.theme_xml(),
        "ppt/slideMasters/slideMaster1.xml": slide_master(len(specs)),
        "ppt/slideMasters/_rels/slideMaster1.xml.rels": master_rels(len(specs)),
    }
    for i, spec in enumerate(specs, 1):
        xml = slide_layout(spec)
        parts["ppt/slideLayouts/slideLayout{}.xml".format(i)] = xml
        parts["ppt/slideLayouts/_rels/slideLayout{}.xml.rels".format(i)] = \
            layout_rels(xml)
    if slide_parts:
        parts.update(slide_parts)
    return parts


def write_package(path, parts):
    for name, xml in parts.items():
        minidom.parseString(xml.encode("utf-8"))
    if os.path.exists(path):
        os.remove(path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", parts.pop("[Content_Types].xml"))
        for name, xml in parts.items():
            z.writestr(name, xml.encode("utf-8"))
        for out, _, _ in MEDIA:
            z.write(os.path.join(BUILD, "media", out), "ppt/media/" + out)
    print("wrote {} ({:.0f} KB)".format(os.path.basename(path),
                                        os.path.getsize(path) / 1024))


def build():
    if os.path.isdir(BUILD):
        shutil.rmtree(BUILD)
    os.makedirs(BUILD)
    prepare_media()
    specs = PL.layouts(LAYOUT_RIDS["emblem"], LAYOUT_RIDS["lockup_white"],
                       LAYOUT_RIDS["emblem_white"])
    write_package(OUTFILE, base_parts(specs, template=True))
    return specs


if __name__ == "__main__":
    build()
