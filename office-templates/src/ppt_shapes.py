"""Small OOXML shape/placeholder helpers for the PowerPoint template."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402

IN = 914400
SLIDE_W, SLIDE_H = 12192000, 6858000        # 13.333 x 7.5 in (16:9)

M = int(0.75 * IN)                          # side margin
CONTENT_W = SLIDE_W - 2 * M
TITLE_Y, TITLE_H = int(0.45 * IN), int(0.85 * IN)
BODY_Y = int(1.55 * IN)
BODY_BOTTOM = int(6.58 * IN)
BODY_H = BODY_BOTTOM - BODY_Y
FOOTER_Y, FOOTER_H = int(6.84 * IN), int(0.32 * IN)

LOGO_H = int(0.66 * IN)
LOGO_W = int(LOGO_H * 0.729)
LOGO_X = SLIDE_W - M - LOGO_W
LOGO_Y = int(0.40 * IN)

TITLE_W = LOGO_X - M - int(0.25 * IN)

GAP = int(0.35 * IN)
COL2_W = (CONTENT_W - GAP) // 2
GAP3 = int(0.30 * IN)
COL3_W = (CONTENT_W - 2 * GAP3) // 3

_uid = [1]


def nid():
    _uid[0] += 1
    return _uid[0]


def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def solid(hexv, alpha=None):
    inner = '<a:alpha val="{}"/>'.format(alpha) if alpha else ""
    return '<a:solidFill><a:srgbClr val="{}">{}</a:srgbClr></a:solidFill>'.format(
        hexv, inner)


def scheme(name):
    return '<a:solidFill><a:schemeClr val="{}"/></a:solidFill>'.format(name)


def xfrm(x, y, w, h):
    return ('<a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{w}" cy="{h}"/></a:xfrm>'
            .format(x=int(x), y=int(y), w=int(w), h=int(h)))


def sp_pr(x, y, w, h, geom="rect", fill="", line="", adj=None):
    av = ('<a:avLst><a:gd name="adj" fmla="val {}"/></a:avLst>'.format(adj)
          if adj is not None else "<a:avLst/>")
    ln = line or '<a:ln><a:noFill/></a:ln>'
    return ('<p:spPr>{x}<a:prstGeom prst="{g}">{av}</a:prstGeom>{f}{l}</p:spPr>'
            .format(x=xfrm(x, y, w, h), g=geom, av=av,
                    f=fill or "<a:noFill/>", l=ln))


def rpr(sz=None, b=None, i=None, color=None, spc=None, font=None, cap=None,
        close=True):
    a = ['<a:defRPr' if not close else '<a:rPr']
    a.append(' lang="en-US"')
    if sz:
        a.append(' sz="{}"'.format(sz))
    if b is not None:
        a.append(' b="{}"'.format(int(b)))
    if i is not None:
        a.append(' i="{}"'.format(int(i)))
    if spc is not None:
        a.append(' spc="{}"'.format(spc))
    if cap:
        a.append(' cap="{}"'.format(cap))
    a.append(">")
    if color:
        a.append(solid(color))
    if font:
        a.append('<a:latin typeface="{f}"/><a:cs typeface="{c}"/>'
                 .format(f=font[0], c=font[1]))
    a.append("</a:rPr>" if close else "</a:defRPr>")
    return "".join(a)


def def_rpr(sz=None, b=None, i=None, color=None, spc=None, cap=None,
            major=False):
    a = ['<a:defRPr']
    if sz:
        a.append(' sz="{}"'.format(sz))
    if b is not None:
        a.append(' b="{}"'.format(int(b)))
    if i is not None:
        a.append(' i="{}"'.format(int(i)))
    if spc is not None:
        a.append(' spc="{}"'.format(spc))
    if cap:
        a.append(' cap="{}"'.format(cap))
    a.append(">")
    if color:
        a.append(solid(color))
    kind = "mj" if major else "mn"
    a.append('<a:latin typeface="+{k}-lt"/><a:cs typeface="+{k}-cs"/>'.format(k=kind))
    a.append("</a:defRPr>")
    return "".join(a)


def lvl_ppr(lvl, marL=0, indent=0, bullet="none", bullet_color=None,
            space_before=0, space_after=0, line=100000, algn=None, rpr_xml=""):
    bu = "<a:buNone/>"
    if bullet == "char":
        bu = ('<a:buClr>{c}</a:buClr><a:buSzPct val="90000"/>'
              '<a:buFont typeface="Arial" pitchFamily="34" charset="0"/>'
              '<a:buChar char="•"/>'
              .format(c=solid(bullet_color or brand.TEAL).replace(
                  "<a:solidFill>", "").replace("</a:solidFill>", "")))
    elif bullet == "dash":
        bu = ('<a:buClr>{c}</a:buClr><a:buSzPct val="100000"/>'
              '<a:buFont typeface="Arial" pitchFamily="34" charset="0"/>'
              '<a:buChar char="–"/>'
              .format(c=solid(bullet_color or brand.LIGHT_TEAL).replace(
                  "<a:solidFill>", "").replace("</a:solidFill>", "")))
    elif bullet == "num":
        bu = ('<a:buClr>{c}</a:buClr><a:buFont typeface="+mj-lt"/>'
              '<a:buAutoNum type="arabicPeriod"/>'
              .format(c=solid(bullet_color or brand.PETROL).replace(
                  "<a:solidFill>", "").replace("</a:solidFill>", "")))
    tag = "a:lvl{}pPr".format(lvl)
    return ('<{t} marL="{m}" indent="{i}"{al}>'
            '<a:lnSpc><a:spcPct val="{ls}"/></a:lnSpc>'
            '<a:spcBef><a:spcPts val="{sb}"/></a:spcBef>'
            '<a:spcAft><a:spcPts val="{sa}"/></a:spcAft>'
            '{bu}{r}</{t}>'
            .format(t=tag, m=marL, i=indent,
                    al=' algn="{}"'.format(algn) if algn else "",
                    ls=line, sb=space_before, sa=space_after, bu=bu, r=rpr_xml))


def body_pr(anchor="t", ins=(0, 0, 0, 0), autofit="norm", wrap=True):
    af = {"norm": "<a:normAutofit/>", "none": "<a:noAutofit/>",
          "shape": "<a:spAutoFit/>"}[autofit]
    return ('<a:bodyPr lIns="{l}" tIns="{t}" rIns="{r}" bIns="{b}" '
            'anchor="{a}" wrap="{w}">{af}</a:bodyPr>'
            .format(l=ins[0], t=ins[1], r=ins[2], b=ins[3], a=anchor,
                    w="square" if wrap else "none", af=af))


def paras(items, default_rpr=""):
    """items: list of (text, level) or plain strings."""
    out = []
    for it in items:
        text, lvl = (it, 0) if isinstance(it, str) else it
        out.append('<a:p><a:pPr lvl="{l}"/><a:r>{r}<a:t>{t}</a:t></a:r></a:p>'
                   .format(l=lvl, r=default_rpr or '<a:rPr lang="en-US"/>',
                           t=esc(text)))
    return "".join(out) or '<a:p><a:endParaRPr lang="en-US"/></a:p>'


def placeholder(x, y, w, h, idx=None, ph_type=None, sz=None, name="Placeholder",
                prompt="", lst_style="", anchor="t", ins=(0, 0, 0, 0),
                fill="", autofit="norm", geom="rect", rot=None, line=""):
    ph = "<p:ph"
    if ph_type:
        ph += ' type="{}"'.format(ph_type)
    if sz:
        ph += ' sz="{}"'.format(sz)
    if idx is not None:
        ph += ' idx="{}"'.format(idx)
    ph += "/>"
    body = prompt if prompt.startswith("<a:p") else paras(
        [prompt] if prompt else [])
    return (
        '<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="{n}"/>'
        '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        '<p:nvPr>{ph}</p:nvPr></p:nvSpPr>'
        '{spr}'
        '<p:txBody>{bp}<a:lstStyle>{ls}</a:lstStyle>{b}</p:txBody></p:sp>'
        .format(id=nid(), n=name, ph=ph,
                spr=sp_pr(x, y, w, h, geom=geom, fill=fill, line=line),
                bp=body_pr(anchor=anchor, ins=ins, autofit=autofit),
                ls=lst_style, b=body))


def textbox(x, y, w, h, runs, anchor="t", ins=(0, 0, 0, 0), name="Text",
            wrap=True):
    return ('<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="{n}"/>'
            '<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>{spr}'
            '<p:txBody>{bp}<a:lstStyle/>{r}</p:txBody></p:sp>'
            .format(id=nid(), n=name, spr=sp_pr(x, y, w, h),
                    bp=body_pr(anchor=anchor, ins=ins, autofit="none",
                               wrap=wrap), r=runs))


def shape(x, y, w, h, geom="rect", fill="", line="", name="Shape", adj=None):
    return ('<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="{n}"/><p:cNvSpPr/>'
            '<p:nvPr/></p:nvSpPr>{spr}'
            '<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/>'
            '</a:p></p:txBody></p:sp>'
            .format(id=nid(), n=name,
                    spr=sp_pr(x, y, w, h, geom=geom, fill=fill, line=line,
                              adj=adj)))


def picture(rid, x, y, w, h, name="Logo", descr="University of Ha'il logo"):
    return ('<p:pic><p:nvPicPr><p:cNvPr id="{id}" name="{n}" descr="{d}"/>'
            '<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>'
            '<p:nvPr/></p:nvPicPr>'
            '<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/>'
            '</a:stretch></p:blipFill>'
            '<p:spPr>{x}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
            '</p:pic>'
            .format(id=nid(), n=name, d=esc(descr), rid=rid,
                    x=xfrm(x, y, w, h)))


def sp_tree(shapes):
    return ('<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/>'
            '<p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
            '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/>'
            '<a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>{}</p:spTree>'
            .format("".join(shapes)))


def shape_text(x, y, w, h, runs, geom="rect", fill="", line="", name="Shape",
               anchor="ctr", ins=(0, 0, 0, 0), adj=None):
    """A drawn shape that carries static text (badges, step numbers)."""
    return ('<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="{n}"/><p:cNvSpPr/>'
            '<p:nvPr/></p:nvSpPr>{spr}'
            '<p:txBody>{bp}<a:lstStyle/>{r}</p:txBody></p:sp>'
            .format(id=nid(), n=name,
                    spr=sp_pr(x, y, w, h, geom=geom, fill=fill, line=line,
                              adj=adj),
                    bp=body_pr(anchor=anchor, ins=ins, autofit="none"), r=runs))


def para_run(text, sz=None, b=None, i=None, color=None, spc=None, algn=None,
             cap=None, major=False, line=None):
    kind = "mj" if major else "mn"
    a = ['<a:rPr lang="en-US"']
    if sz:
        a.append(' sz="{}"'.format(sz))
    if b is not None:
        a.append(' b="{}"'.format(int(b)))
    if i is not None:
        a.append(' i="{}"'.format(int(i)))
    if spc is not None:
        a.append(' spc="{}"'.format(spc))
    if cap:
        a.append(' cap="{}"'.format(cap))
    a.append(">")
    if color:
        a.append(solid(color))
    a.append('<a:latin typeface="+{k}-lt"/><a:cs typeface="+{k}-cs"/></a:rPr>'
             .format(k=kind))
    ppr = ""
    if algn or line:
        ppr = '<a:pPr{a}>{l}</a:pPr>'.format(
            a=' algn="{}"'.format(algn) if algn else "",
            l='<a:lnSpc><a:spcPct val="{}"/></a:lnSpc>'.format(line) if line else "")
    return '<a:p>{p}<a:r>{r}<a:t>{t}</a:t></a:r></a:p>'.format(
        p=ppr, r="".join(a), t=esc(text))
