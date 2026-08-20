#!/usr/bin/env python3
"""
Builds docs/University_Branded_Presentation_Sample.pptx — one slide per layout,
filled with representative content. It is the visual QA harness for the .potx
and doubles as a catalogue of what each layout is for.
"""
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand                       # noqa: E402
import build_ppt as BP             # noqa: E402
import ppt_layouts as PL           # noqa: E402
from ppt_shapes import esc, nid, IN, solid  # noqa: E402

R = BP.R
SAMPLE_IMG = "sample-image.png"


def make_sample_image(path):
    """A brand-toned block that stands in for photography in the sample deck."""
    w, h = 1600, 900
    im = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(im)
    a, b = brand.rgb(brand.PETROL), brand.rgb(brand.TEAL)
    for y in range(h):
        t = y / (h - 1)
        d.line([(0, y), (w, y)],
               fill=tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)))
    emb = Image.open(os.path.join(BP.LOGO, "uoh-emblem-white.png"))
    eh = int(h * 0.52)
    emb = emb.resize((round(eh * emb.width / emb.height), eh), Image.LANCZOS)
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    layer.alpha_composite(emb, ((w - emb.width) // 2, (h - emb.height) // 2))
    alpha = layer.split()[3].point(lambda v: int(v * 0.22))
    layer.putalpha(alpha)
    im = Image.alpha_composite(im.convert("RGBA"), layer).convert("RGB")
    im.save(path, quality=92)


def sph(attrs, paras, name="Placeholder"):
    return ('<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="{n}"/>'
            '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
            '<p:nvPr><p:ph {a}/></p:nvPr></p:nvSpPr><p:spPr/>'
            '<p:txBody><a:bodyPr/><a:lstStyle/>{p}</p:txBody></p:sp>'
            .format(id=nid(), n=name, a=attrs, p=paras))


def P(items):
    out = []
    for it in items:
        text, lvl = (it, 0) if isinstance(it, str) else it
        out.append('<a:p><a:pPr lvl="{l}"/><a:r><a:rPr lang="en-US" dirty="0"/>'
                   '<a:t>{t}</a:t></a:r></a:p>'.format(l=lvl, t=esc(text)))
    return "".join(out)


def title(text):
    return sph('type="title"', P([text]), "Title")


def body(idx, items, ph_type="body"):
    a = 'type="{}" idx="{}"'.format(ph_type, idx) if ph_type else 'idx="{}"'.format(idx)
    return sph(a, P(items), "Body {}".format(idx))


def content(idx, items):
    return sph('idx="{}"'.format(idx), P(items), "Content {}".format(idx))


def pic(idx, rid):
    return ('<p:pic><p:nvPicPr><p:cNvPr id="{id}" name="Image"/>'
            '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
            '<p:nvPr><p:ph type="pic" idx="{i}"/></p:nvPr></p:nvPicPr>'
            '<p:blipFill><a:blip r:embed="{r}"/>'
            '<a:srcRect/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            '<p:spPr/></p:pic>'.format(id=nid(), i=idx, r=rid))


def footer_sp(number=True):
    out = [sph('type="ftr" idx="11"', P(["University of Ha'il"]), "Footer")]
    if number:
        out.append(
            '<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="Slide Number"/>'
            '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
            '<p:nvPr><p:ph type="sldNum" idx="12"/></p:nvPr></p:nvSpPr>'
            '<p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>'
            '<a:p><a:pPr algn="r"/><a:fld id="{{B7C4E9A1-1C2D-4F3E-9A5B-'
            '6D7E8F901234}}" type="slidenum"><a:rPr lang="en-US"/>'
            '<a:t>2</a:t></a:fld></a:p></p:txBody></p:sp>'.format(id=nid()))
    return "".join(out)


def table_frame(idx, headers, rows, x, y, w, h):
    ncol = len(headers)
    colw = w // ncol
    grid = "".join('<a:gridCol w="{}"/>'.format(colw) for _ in range(ncol))

    def tr(cells, height):
        tcs = "".join(
            '<a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r>'
            '<a:rPr lang="en-US" sz="1200"/><a:t>{}</a:t></a:r></a:p>'
            '</a:txBody><a:tcPr marL="91440" marR="91440" marT="45720" '
            'marB="45720" anchor="ctr"/></a:tc>'.format(esc(c)) for c in cells)
        return '<a:tr h="{}">{}</a:tr>'.format(height, tcs)

    body_rows = "".join(tr(r, 320040) for r in rows)
    return ('<p:graphicFrame><p:nvGraphicFramePr>'
            '<p:cNvPr id="{id}" name="Table"/><p:cNvGraphicFramePr>'
            '<a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr>'
            '<p:nvPr><p:ph idx="{i}"/></p:nvPr></p:nvGraphicFramePr>'
            '<p:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></p:xfrm>'
            '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/'
            'drawingml/2006/table"><a:tbl>'
            '<a:tblPr firstRow="1" bandRow="1">'
            '<a:tableStyleId>{g}</a:tableStyleId></a:tblPr>'
            '<a:tblGrid>{grid}</a:tblGrid>{hdr}{rows}</a:tbl>'
            '</a:graphicData></a:graphic></p:graphicFrame>'
            .format(id=nid(), i=idx, x=int(x), y=int(y), w=int(w), h=int(h),
                    g=BP.TBL_GUID, grid=grid, hdr=tr(headers, 370840),
                    rows=body_rows))


IMG_RID = "rId2"


def slide_bodies():
    """(layout_number, shape-xml) for each sample slide."""
    S = []

    S.append((1, sph('type="ctrTitle"', P(["Annual Performance Report 2025/26"]),
                     "Title")
              + sph('type="subTitle" idx="1"',
                    P(["Deanship of Quality and Academic Accreditation"]),
                    "Subtitle")
              + body(2, ["Prepared for the University Council  |  "
                         "20 August 2026"])))

    S.append((2, body(1, ["01"]) + title("Strategic Context")
              + body(2, ["Where the university stands against the 2030 plan"])))

    S.append((3, title("Purpose of this review")
              + content(1, ["Assess delivery against the approved strategic plan",
                            "Confirm the accreditation evidence base is complete",
                            ("Evidence gathered from eight colleges", 1),
                            ("Data current to the end of the second semester", 1),
                            "Set the priorities for the coming academic year"])
              + footer_sp()))

    S.append((4, title("Strengths and areas to address")
              + content(1, ["Strengths",
                            ("Graduate employability above the national median", 1),
                            ("Research output up year on year", 1)])
              + content(2, ["To address",
                            ("Uneven survey response rates across colleges", 1),
                            ("Placement capacity in health programmes", 1)])
              + footer_sp()))

    S.append((5, title("Three lines of effort")
              + content(1, ["Teaching", ("Curriculum review cycle", 1)])
              + content(2, ["Research", ("Grant capture and support", 1)])
              + content(3, ["Community", ("Partnership agreements", 1)])
              + footer_sp()))

    S.append((6, title("Campus development")
              + body(1, ["The new academic block adds twelve teaching spaces",
                         ("Handover scheduled for the second semester", 1),
                         ("Funded from the approved capital programme", 1)])
              + pic(2, IMG_RID) + footer_sp()))

    S.append((7, pic(1, IMG_RID) + title("A campus built around the student")
              + body(2, ["Photograph: University of Ha'il campus"])))

    S.append((8, title("Research and innovation")
              + pic(1, IMG_RID)
              + body(2, ["Four new research groups established this year",
                         ("Two joint projects with regional industry", 1),
                         ("Laboratory refurbishment completed", 1)])
              + footer_sp()))

    S.append((9, title("Executive summary")
              + body(1, ["Delivery is on plan; the risk sits in evidence "
                         "collection, not in performance."])
              + body(2, ["Situation",
                         ("Year three of the strategic plan", 1),
                         ("Accreditation review due next year", 1)])
              + body(3, ["Findings",
                         ("Eleven of fourteen targets met", 1),
                         ("Survey coverage below threshold", 1)])
              + body(4, ["Recommendation",
                         ("Fund a central evidence unit", 1),
                         ("Report quarterly to Council", 1)])
              + footer_sp()))

    S.append((10, title("What we are asking Council to note")
              + body(1, ["Performance is on track",
                         ("Eleven of fourteen indicators met or exceeded", 1)])
              + body(2, ["Evidence collection is the single risk",
                         ("Response rates must reach 60% before review", 1)])
              + body(3, ["One decision is needed today",
                         ("Approval of the central evidence unit", 1)])
              + footer_sp()))

    S.append((11, title("Key indicators at a glance")
              + body(1, ["94.2%", ("Student satisfaction", 1)])
              + body(2, ["1,480", ("Graduates this year", 1)])
              + body(3, ["312", ("Indexed publications", 1)])
              + body(4, ["78%", ("Employed within a year", 1)])
              + content(5, ["Detail by college is available in Annex B"])
              + footer_sp()))

    S.append((12, title("Publications by college")
              + content(1, ["Chart placeholder — insert a native PowerPoint "
                            "chart here; it picks up the theme palette "
                            "automatically."])
              + body(2, ["What the data shows",
                         ("Engineering and Science account for 61%", 1),
                         ("Growth is concentrated in joint authorship", 1)])
              + footer_sp()))

    tbl = table_frame(1,
                      ["Indicator", "Baseline", "Target", "Actual", "Status"],
                      [["Student satisfaction", "91.0%", "93.0%", "94.2%", "Met"],
                       ["Graduate employment", "72%", "78%", "78%", "Met"],
                       ["Indexed publications", "265", "320", "312", "At risk"],
                       ["Survey response rate", "48%", "60%", "51%", "Behind"]],
                      PL.M, PL.BODY_Y, PL.CONTENT_W, int(2.9 * IN))
    S.append((13, title("Performance against target") + tbl
              + body(2, ["Source: Deanship of Quality, semester two returns"])
              + footer_sp()))

    S.append((14, title("How the review was run")
              + body(1, ["Scope agreed"]) + body(2, ["Data collected"])
              + body(3, ["Evidence tested"]) + body(4, ["Findings drafted"])
              + body(5, ["Council review"]) + footer_sp()))

    S.append((15, title("Delivery roadmap")
              + body(1, ["Q1"]) + body(2, ["Q2"]) + body(3, ["Q3"])
              + body(4, ["Q4"])
              + body(5, ["Evidence unit staffed", "Baseline audit"])
              + body(6, ["Survey redesign", "College liaison"])
              + body(7, ["Mid-year report", "Gap closure"])
              + body(8, ["Accreditation dossier", "Council sign-off"])
              + footer_sp()))

    S.append((16, title("Governance of the review")
              + content(1, ["University Council",
                            ("Quality Committee", 1),
                            ("Deanship of Quality — secretariat", 2),
                            ("College quality units", 2)])
              + body(2, ["Structure approved by Council, 12 March 2026"])
              + footer_sp()))

    S.append((17, title("Evidence management architecture")
              + content(1, ["Sources → collection → validation → dossier",
                            ("Insert the diagram or SmartArt in this area", 1)])
              + body(2, ["Legend",
                         ("Owned by the Deanship", 1),
                         ("Owned by colleges", 1),
                         ("Shared systems", 1)])
              + footer_sp()))

    S.append((18, title("Two options for the evidence unit")
              + body(1, ["Central unit"]) + body(2, ["Distributed model"])
              + body(3, ["One team, consistent method",
                         ("Faster to accredit", 1),
                         ("Needs three new posts", 1)])
              + body(4, ["Capacity in each college",
                         ("No new central cost", 1),
                         ("Method varies by college", 1)])
              + footer_sp()))

    S.append((19, body(1, ["Evidence is not paperwork. It is how the "
                           "university proves the quality it already "
                           "delivers."])
              + body(2, ["Dean of Quality and Academic Accreditation"])
              + footer_sp()))

    S.append((20, title("Thank you")
              + body(1, ["Deanship of Quality and Academic Accreditation  |  "
                         "quality@uoh.edu.sa  |  www.uoh.edu.sa"])))
    return S


def slide_xml(shapes):
    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
            '<p:sld {ns}><p:cSld>{tree}</p:cSld>'
            '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'
            .format(ns=BP.P_NS, tree=PL.sp_tree([shapes])))


def slide_rels(layout_no, uses_image):
    rel = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
           '<Relationships xmlns="http://schemas.openxmlformats.org/package/'
           '2006/relationships">'
           '<Relationship Id="rId1" Type="{r}/slideLayout" '
           'Target="../slideLayouts/slideLayout{n}.xml"/>'
           .format(r=R, n=layout_no)]
    if uses_image:
        rel.append('<Relationship Id="{i}" Type="{r}/image" '
                   'Target="../media/{g}"/>'.format(i=IMG_RID, r=R, g=SAMPLE_IMG))
    rel.append('</Relationships>')
    return "".join(rel)


def build():
    specs = BP.build()
    make_sample_image(os.path.join(BP.BUILD, "media", SAMPLE_IMG))
    BP.MEDIA.append((SAMPLE_IMG, None, None))

    bodies = slide_bodies()
    parts = {}
    for i, (layout_no, shapes) in enumerate(bodies, 1):
        parts["ppt/slides/slide{}.xml".format(i)] = slide_xml(shapes)
        parts["ppt/slides/_rels/slide{}.xml.rels".format(i)] = \
            slide_rels(layout_no, IMG_RID in shapes)

    pkg = BP.base_parts(specs, template=False, n_slides=len(bodies),
                        slide_parts=parts)
    BP.write_package(BP.SAMPLE, pkg)


if __name__ == "__main__":
    build()
