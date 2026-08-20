"""
Slide master text hierarchy and the twenty reusable layouts.

Every layout is a real slideLayout part with real placeholders, so the whole set
appears under Home › New Slide and Layout, and text typed into a slide inherits
its size, colour and bullet treatment from here rather than from local
formatting.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand              # noqa: E402
from ppt_shapes import (  # noqa: E402
    IN, SLIDE_W, SLIDE_H, M, CONTENT_W, TITLE_Y, TITLE_H, TITLE_W,
    BODY_Y, BODY_H, BODY_BOTTOM, FOOTER_Y, FOOTER_H,
    LOGO_X, LOGO_Y, LOGO_W, LOGO_H, GAP, COL2_W, GAP3, COL3_W,
    solid, placeholder, textbox, shape, shape_text, picture, sp_tree,
    lvl_ppr, def_rpr, para_run, esc)

FTR_W = int(7.6 * IN)
DT_X = M + FTR_W + int(0.2 * IN)
DT_W = int(2.4 * IN)
NUM_W = int(0.85 * IN)
NUM_X = SLIDE_W - M - NUM_W

MIST_FILL = solid(brand.MIST)
PANEL_INS = (int(0.22 * IN), int(0.18 * IN), int(0.22 * IN), int(0.18 * IN))


# --------------------------------------------------------------- master ------
def master_txstyles():
    title = ('<p:titleStyle>' + lvl_ppr(
        1, marL=0, indent=0, bullet="none", space_after=0, line=92000,
        rpr_xml=def_rpr(sz=3200, b=True, color=brand.DEEP_BLUE, spc=-30,
                        major=True)) + '</p:titleStyle>')

    sizes = [(1, 1800, 0, 0, "char", brand.TEAL, 600),
             (2, 1600, int(0.32 * IN), int(-0.22 * IN), "dash", brand.PETROL, 400),
             (3, 1400, int(0.64 * IN), int(-0.22 * IN), "dash", brand.SLATE, 300),
             (4, 1200, int(0.96 * IN), int(-0.20 * IN), "dash", brand.SLATE, 200),
             (5, 1100, int(1.28 * IN), int(-0.20 * IN), "dash", brand.SLATE, 200)]
    body = ['<p:bodyStyle>']
    for lvl, sz, marL, ind, bu, buc, sb in sizes:
        base_marL = marL + (int(0.28 * IN) if lvl == 1 else 0)
        base_ind = ind if lvl > 1 else int(-0.28 * IN)
        body.append(lvl_ppr(lvl, marL=base_marL, indent=base_ind, bullet=bu,
                            bullet_color=buc, space_before=sb, line=100000,
                            rpr_xml=def_rpr(sz=sz, color=brand.INK)))
    body.append('</p:bodyStyle>')

    other = ('<p:otherStyle>' + lvl_ppr(
        1, bullet="none", rpr_xml=def_rpr(sz=1400, color=brand.INK))
        + '</p:otherStyle>')
    return title + "".join(body) + other


def footer_phs(dark=False, show_footer=True):
    col = brand.PALE_STEEL if dark else brand.SLATE
    num_col = brand.PALE_TEAL if dark else brand.DEEP_BLUE
    out = []
    if show_footer:
        out.append(placeholder(
            M, FOOTER_Y, FTR_W, FOOTER_H, ph_type="ftr", idx=11, name="Footer",
            prompt="University of Ha'il", autofit="none",
            lst_style=lvl_ppr(1, bullet="none",
                              rpr_xml=def_rpr(sz=1000, color=col)),
            anchor="ctr"))
        out.append(placeholder(
            DT_X, FOOTER_Y, DT_W, FOOTER_H, ph_type="dt", idx=10, name="Date",
            prompt="", autofit="none",
            lst_style=lvl_ppr(1, bullet="none", algn="r",
                              rpr_xml=def_rpr(sz=1000, color=col)),
            anchor="ctr"))
    out.append(placeholder(
        NUM_X, FOOTER_Y, NUM_W, FOOTER_H, ph_type="sldNum", idx=12,
        name="Slide Number", autofit="none",
        prompt='<a:p><a:pPr algn="r"/><a:fld id="{{B7C4E9A1-1C2D-4F3E-9A5B-'
               '6D7E8F901234}}" type="slidenum"><a:rPr lang="en-US" sz="1000" '
               'b="1">{c}</a:rPr><a:t>#</a:t></a:fld></a:p>'
               .format(c=solid(num_col)),
        lst_style=lvl_ppr(1, bullet="none", algn="r",
                          rpr_xml=def_rpr(sz=1000, b=True, color=num_col)),
        anchor="ctr"))
    return out


def master_shapes(rid_emblem):
    return sp_tree(
        [placeholder(M, TITLE_Y, TITLE_W, TITLE_H, ph_type="title",
                     name="Title Placeholder",
                     prompt="Click to edit Master title style", anchor="b"),
         placeholder(M, BODY_Y, CONTENT_W, BODY_H, ph_type="body", idx=1,
                     name="Text Placeholder",
                     prompt='<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/>'
                            '<a:t>Click to edit Master text styles</a:t></a:r>'
                            '</a:p><a:p><a:pPr lvl="1"/><a:r>'
                            '<a:rPr lang="en-US"/><a:t>Second level</a:t></a:r>'
                            '</a:p><a:p><a:pPr lvl="2"/><a:r>'
                            '<a:rPr lang="en-US"/><a:t>Third level</a:t></a:r>'
                            '</a:p>')]
        + footer_phs()
        + [picture(rid_emblem, LOGO_X, LOGO_Y, LOGO_W, LOGO_H, name="UoH emblem")])


# ------------------------------------------------------------- helpers -------
def text_levels(base_sz=1800, color=None, bullet="char", algn=None,
                line=100000, b=None, i=None, indent_lvl1=True):
    """
    A complete five-level list style.

    Placeholders that declare only level 1 inherit levels 2-5 from the master,
    which can leave a sub-bullet larger than the bullet above it. Every content
    and text placeholder therefore carries the full ladder.
    """
    steps = [0, -200, -400, -500, -600]
    bullets = [bullet, "dash", "dash", "dash", "dash"]
    colors = [color or brand.INK, color or brand.SLATE, color or brand.SLATE,
              color or brand.SLATE, color or brand.SLATE]
    bu_colors = [brand.TEAL, brand.PETROL, brand.SLATE, brand.SLATE, brand.SLATE]
    out = []
    for n in range(5):
        sz = max(1000, base_sz + steps[n])
        bu = bullets[n] if bullet != "none" else "none"
        if bu == "none":
            marL, ind = 0, 0
        elif n == 0:
            marL, ind = (int(0.28 * IN), int(-0.28 * IN)) if indent_lvl1 else (0, 0)
        else:
            marL, ind = int(0.28 * IN) * (n + 1), int(-0.26 * IN)
        out.append(lvl_ppr(n + 1, marL=marL, indent=ind, bullet=bu,
                           bullet_color=bu_colors[n], space_before=500 - n * 60,
                           algn=algn, line=line,
                           rpr_xml=def_rpr(sz=sz, b=b if n == 0 else None,
                                           i=i if n == 0 else None,
                                           color=colors[n])))
    return "".join(out)


def title_ph(prompt="Click to edit Master title style", y=TITLE_Y, h=TITLE_H,
             w=TITLE_W, x=M, dark=False, sz=None, anchor="b"):
    ls = ""
    if dark or sz:
        ls = lvl_ppr(1, bullet="none",
                     rpr_xml=def_rpr(sz=sz or 3200, b=True, major=True, spc=-30,
                                     color=brand.WHITE if dark else brand.DEEP_BLUE))
    return placeholder(x, y, w, h, ph_type="title", name="Title",
                       prompt=prompt, lst_style=ls, anchor=anchor)


def panel_ph(idx, x, y, w, h, head, body, head_sz=1500, body_sz=1200,
             head_color=None, body_color=None, fill=MIST_FILL, name="Panel",
             ins=PANEL_INS, anchor="t", bullet2="char"):
    ls = (lvl_ppr(1, bullet="none", space_after=300,
                  rpr_xml=def_rpr(sz=head_sz, b=True,
                                  color=head_color or brand.DEEP_BLUE,
                                  major=True))
          + lvl_ppr(2, marL=int(0.24 * IN), indent=int(-0.24 * IN),
                    bullet=bullet2, space_before=200,
                    rpr_xml=def_rpr(sz=body_sz,
                                    color=body_color or brand.INK)))
    prompt = ('<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>{h}</a:t>'
              '</a:r></a:p><a:p><a:pPr lvl="1"/><a:r><a:rPr lang="en-US"/>'
              '<a:t>{b}</a:t></a:r></a:p>'.format(h=esc(head), b=esc(body)))
    return placeholder(x, y, w, h, idx=idx, ph_type="body", name=name,
                       prompt=prompt, lst_style=ls, fill=fill, ins=ins,
                       anchor=anchor)


def text_ph(idx, x, y, w, h, prompt, sz=1600, color=None, bullet="char",
            name="Text", anchor="t", ins=(0, 0, 0, 0), fill="", b=None,
            i=None, algn=None, ph_type="body", line=100000):
    ls = text_levels(sz, color=color, bullet=bullet, algn=algn, line=line,
                     b=b, i=i)
    return placeholder(x, y, w, h, idx=idx, ph_type=ph_type, name=name,
                       prompt=prompt, lst_style=ls, anchor=anchor, ins=ins,
                       fill=fill)


def content_ph(idx, x, y, w, h, prompt="Click to add content", name="Content",
               sz=None):
    return placeholder(x, y, w, h, idx=idx, name=name, prompt=prompt,
                       lst_style=text_levels(sz or 1800))


def pic_ph(idx, x, y, w, h, name="Picture", prompt="Click to add picture"):
    return placeholder(x, y, w, h, idx=idx, ph_type="pic", name=name,
                       prompt=prompt,
                       lst_style=lvl_ppr(1, bullet="none", algn="ctr",
                                         rpr_xml=def_rpr(sz=1200,
                                                         color=brand.SLATE)),
                       fill=solid(brand.MIST), anchor="ctr")


# ---------------------------------------------------------- the 20 layouts ---
def layouts(rid_emblem, rid_lockup_white, rid_emblem_white):
    L = []

    def add(name, ltype, shapes, dark=False, bg=None, show_master=True):
        L.append(dict(name=name, type=ltype, shapes=shapes, bg=bg,
                      show_master=show_master))

    # 1 — Title Slide -------------------------------------------------------
    add("Title Slide", "title", [
        picture(rid_lockup_white, M, int(0.95 * IN), int(4.4 * IN),
                int(4.4 * IN * 1461 / 3956), name="UoH lockup (reversed)"),
        placeholder(M, int(3.00 * IN), int(10.2 * IN), int(1.55 * IN),
                    ph_type="ctrTitle", name="Presentation Title",
                    prompt="Click to edit presentation title", anchor="b",
                    lst_style=lvl_ppr(1, bullet="none", line=92000,
                                      rpr_xml=def_rpr(sz=4400, b=True, spc=-40,
                                                      color=brand.WHITE,
                                                      major=True))),
        placeholder(M, int(4.65 * IN), int(10.2 * IN), int(0.75 * IN),
                    ph_type="subTitle", idx=1, name="Subtitle",
                    prompt="Subtitle, department or occasion",
                    lst_style=lvl_ppr(1, bullet="none",
                                      rpr_xml=def_rpr(sz=1800,
                                                      color=brand.LIGHT_TEAL))),
        text_ph(2, M, int(5.65 * IN), int(10.2 * IN), int(0.9 * IN),
                "Presenter name  |  Role  |  DD Month YYYY", sz=1200,
                color=brand.PALE_STEEL, bullet="none", name="Presenter details"),
    ], dark=True, bg=brand.DEEP_BLUE, show_master=False)

    # 2 — Section Divider ---------------------------------------------------
    add("Section Divider", "secHead", [
        text_ph(1, M, int(1.75 * IN), int(3.0 * IN), int(1.3 * IN), "01",
                sz=6600, color=brand.PALE_TEAL, bullet="none",
                name="Section number", anchor="b"),
        title_ph("Section title", y=int(3.05 * IN), h=int(1.25 * IN),
                 w=int(9.4 * IN), dark=True, sz=4000),
        text_ph(2, M, int(4.45 * IN), int(8.6 * IN), int(1.0 * IN),
                "One line on what this section covers", sz=1400,
                color=brand.PALE_TEAL, bullet="none", name="Section summary"),
        picture(rid_emblem_white, SLIDE_W - M - int(0.95 * IN * 0.729),
                int(4.85 * IN), int(0.95 * IN * 0.729), int(0.95 * IN),
                name="UoH emblem (reversed)"),
    ] + footer_phs(dark=True, show_footer=False),
        dark=True, bg=brand.PETROL, show_master=False)

    # 3 — Title + Content ---------------------------------------------------
    add("Title and Content", "obj", [
        title_ph(),
        content_ph(1, M, BODY_Y, CONTENT_W, BODY_H),
    ] + footer_phs())

    # 4 — Two-Column Content -----------------------------------------------
    add("Two-Column Content", "twoObj", [
        title_ph(),
        content_ph(1, M, BODY_Y, COL2_W, BODY_H, name="Content left"),
        content_ph(2, M + COL2_W + GAP, BODY_Y, COL2_W, BODY_H,
                   name="Content right"),
    ] + footer_phs())

    # 5 — Three-Column Content ---------------------------------------------
    add("Three-Column Content", "fourObj", [
        title_ph(),
    ] + [content_ph(i + 1, M + i * (COL3_W + GAP3), BODY_Y, COL3_W, BODY_H,
                    name="Content {}".format(i + 1), sz=1400)
         for i in range(3)] + footer_phs())

    # 6 — Text + Image ------------------------------------------------------
    add("Text and Image", "txAndObj", [
        title_ph(),
        text_ph(1, M, BODY_Y, COL2_W, BODY_H, "Click to add text", sz=1600),
        pic_ph(2, M + COL2_W + GAP, BODY_Y, COL2_W, BODY_H),
    ] + footer_phs())

    # 7 — Full-Width Image --------------------------------------------------
    img_h = int(4.85 * IN)
    add("Full-Width Image", "picTx", [
        pic_ph(1, 0, 0, SLIDE_W, img_h, name="Full-bleed image"),
        title_ph(y=img_h + int(0.22 * IN), h=int(0.62 * IN),
                 w=int(9.6 * IN), sz=2400, anchor="b"),
        text_ph(2, M, img_h + int(0.92 * IN), int(9.6 * IN), int(0.5 * IN),
                "Caption or source", sz=1100, color=brand.SLATE,
                bullet="none", name="Caption"),
        picture(rid_emblem, LOGO_X, img_h + int(0.30 * IN), LOGO_W, LOGO_H,
                name="UoH emblem"),
    ] + footer_phs(show_footer=False), show_master=False)

    # 8 — Image + Text ------------------------------------------------------
    add("Image and Text", "objAndTx", [
        title_ph(),
        pic_ph(1, M, BODY_Y, COL2_W, BODY_H),
        text_ph(2, M + COL2_W + GAP, BODY_Y, COL2_W, BODY_H,
                "Click to add text", sz=1600),
    ] + footer_phs())

    # 9 — Executive Summary -------------------------------------------------
    lead_h = int(1.05 * IN)
    card_y = BODY_Y + lead_h + int(0.30 * IN)
    card_h = BODY_BOTTOM - card_y
    add("Executive Summary", "objTx", [
        title_ph(),
        text_ph(1, M, BODY_Y, CONTENT_W, lead_h,
                "The one message a reader must take away", sz=1700,
                color=brand.PETROL, bullet="none", name="Lead statement"),
    ] + [panel_ph(i + 2, M + i * (COL3_W + GAP3), card_y, COL3_W, card_h,
                  ["Situation", "Findings", "Recommendation"][i],
                  "Supporting point", name="Summary card {}".format(i + 1))
         for i in range(3)] + footer_phs())

    # 10 — Key Messages -----------------------------------------------------
    row_h = int(1.42 * IN)
    row_gap = int(0.22 * IN)
    shapes = [title_ph()]
    for i in range(3):
        y = BODY_Y + i * (row_h + row_gap)
        shapes.append(shape_text(
            M, y, int(0.85 * IN), row_h,
            para_run("0{}".format(i + 1), sz=2800, b=True,
                     color=brand.TEAL, algn="l", major=True),
            name="Message number {}".format(i + 1), anchor="ctr"))
        shapes.append(panel_ph(
            i + 1, M + int(0.95 * IN), y, CONTENT_W - int(0.95 * IN), row_h,
            "Key message headline", "Why it matters, in one line",
            head_sz=1700, body_sz=1200, fill=MIST_FILL, bullet2="none",
            anchor="ctr", name="Key message {}".format(i + 1)))
    add("Key Messages", "objTx", shapes + footer_phs())

    # 11 — KPI / Dashboard --------------------------------------------------
    tile_gap = int(0.25 * IN)
    tile_w = (CONTENT_W - 3 * tile_gap) // 4
    tile_h = int(1.95 * IN)
    ls_kpi = (lvl_ppr(1, bullet="none", algn="l", space_after=200,
                      rpr_xml=def_rpr(sz=4000, b=True, color=brand.PETROL,
                                      spc=-40, major=True))
              + lvl_ppr(2, bullet="none", algn="l",
                        rpr_xml=def_rpr(sz=1100, color=brand.SLATE, spc=60,
                                        cap="all")))
    shapes = [title_ph()]
    for i in range(4):
        shapes.append(placeholder(
            M + i * (tile_w + tile_gap), BODY_Y, tile_w, tile_h,
            idx=i + 1, ph_type="body", name="KPI tile {}".format(i + 1),
            prompt='<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>00.0%'
                   '</a:t></a:r></a:p><a:p><a:pPr lvl="1"/><a:r>'
                   '<a:rPr lang="en-US"/><a:t>Indicator name</a:t></a:r></a:p>',
            lst_style=ls_kpi, fill=MIST_FILL, ins=PANEL_INS, anchor="ctr"))
    chart_y = BODY_Y + tile_h + int(0.28 * IN)
    shapes.append(content_ph(5, M, chart_y, CONTENT_W, BODY_BOTTOM - chart_y,
                             prompt="Click to add a chart or table",
                             name="Dashboard detail"))
    add("KPI Dashboard", "objTx", shapes + footer_phs())

    # 12 — Data / Chart -----------------------------------------------------
    chart_w = int(7.55 * IN)
    add("Data and Chart", "chartAndTx", [
        title_ph(),
        content_ph(1, M, BODY_Y, chart_w, BODY_H,
                   prompt="Click to add a chart", name="Chart"),
        panel_ph(2, M + chart_w + GAP, BODY_Y, CONTENT_W - chart_w - GAP,
                 BODY_H, "What the data shows", "Read-across for the reader",
                 head_sz=1500, body_sz=1200, name="Insight panel"),
    ] + footer_phs())

    # 13 — Table ------------------------------------------------------------
    note_h = int(0.5 * IN)
    add("Table", "tbl", [
        title_ph(),
        content_ph(1, M, BODY_Y, CONTENT_W, BODY_H - note_h - int(0.2 * IN),
                   prompt="Click to add a table", name="Table"),
        text_ph(2, M, BODY_BOTTOM - note_h, CONTENT_W, note_h,
                "Source or note", sz=1100, color=brand.SLATE, bullet="none",
                name="Table note"),
    ] + footer_phs())

    # 14 — Process / Timeline ----------------------------------------------
    steps = 5
    badge_d = int(0.52 * IN)
    line_y = BODY_Y + int(0.62 * IN)
    step_gap = int(0.18 * IN)
    step_w = (CONTENT_W - (steps - 1) * step_gap) // steps
    shapes = [title_ph(),
              shape(M + badge_d // 2, line_y + badge_d // 2 - 6350,
                    CONTENT_W - step_w // 2 - badge_d, 12700,
                    fill=solid(brand.LIGHT_TEAL), name="Timeline rule")]
    for i in range(steps):
        x = M + i * (step_w + step_gap)
        shapes.append(shape_text(
            x, line_y, badge_d, badge_d,
            para_run(str(i + 1), sz=1600, b=True, color=brand.WHITE,
                     algn="ctr", major=True),
            geom="ellipse", fill=solid(brand.PETROL),
            name="Step badge {}".format(i + 1)))
        shapes.append(text_ph(
            i + 1, x, line_y + badge_d + int(0.28 * IN), step_w,
            BODY_BOTTOM - (line_y + badge_d + int(0.28 * IN)),
            "Step title", sz=1400, b=True, color=brand.DEEP_BLUE,
            bullet="none", name="Step {}".format(i + 1)))
    add("Process / Timeline", "cust", shapes + footer_phs())

    # 15 — Roadmap ----------------------------------------------------------
    phases = 4
    ph_gap = int(0.25 * IN)
    ph_w = (CONTENT_W - (phases - 1) * ph_gap) // phases
    head_h = int(0.55 * IN)
    shapes = [title_ph()]
    for i in range(phases):
        x = M + i * (ph_w + ph_gap)
        shapes.append(placeholder(
            x, BODY_Y, ph_w, head_h, idx=i + 1, ph_type="body",
            name="Phase {} title".format(i + 1),
            prompt="Phase {}".format(i + 1),
            lst_style=lvl_ppr(1, bullet="none", algn="ctr",
                              rpr_xml=def_rpr(sz=1400, b=True,
                                              color=brand.WHITE, major=True)),
            fill=solid(brand.DEEP_BLUE if i % 2 == 0 else brand.PETROL),
            anchor="ctr", ins=(int(0.1 * IN), 0, int(0.1 * IN), 0)))
        shapes.append(text_ph(
            i + 5, x, BODY_Y + head_h, ph_w, BODY_BOTTOM - BODY_Y - head_h,
            "Deliverable", sz=1200, bullet="char",
            name="Phase {} detail".format(i + 1), fill=MIST_FILL,
            ins=PANEL_INS))
    add("Roadmap", "cust", shapes + footer_phs())

    # 16 — Organisational Structure ----------------------------------------
    add("Organisational Structure", "dgm", [
        title_ph(),
        content_ph(1, M, BODY_Y, CONTENT_W, BODY_H - int(0.55 * IN),
                   prompt="Click to add the organisation chart (SmartArt)",
                   name="Org chart"),
        text_ph(2, M, BODY_BOTTOM - int(0.5 * IN), CONTENT_W, int(0.5 * IN),
                "Effective date or approving authority", sz=1100,
                color=brand.SLATE, bullet="none", name="Chart note"),
    ] + footer_phs())

    # 17 — Architecture / Diagram ------------------------------------------
    leg_w = int(2.6 * IN)
    add("Architecture / Diagram", "dgm", [
        title_ph(),
        content_ph(1, M, BODY_Y, CONTENT_W - leg_w - GAP, BODY_H,
                   prompt="Click to add the diagram", name="Diagram"),
        panel_ph(2, M + CONTENT_W - leg_w, BODY_Y, leg_w, BODY_H,
                 "Legend", "Component or layer", head_sz=1400, body_sz=1100,
                 name="Legend"),
    ] + footer_phs())

    # 18 — Comparison -------------------------------------------------------
    head_h = int(0.58 * IN)
    add("Comparison", "twoObj", [
        title_ph(),
        placeholder(M, BODY_Y, COL2_W, head_h, idx=1, ph_type="body",
                    name="Option A title", prompt="Option A",
                    lst_style=lvl_ppr(1, bullet="none", algn="ctr",
                                      rpr_xml=def_rpr(sz=1600, b=True,
                                                      color=brand.WHITE,
                                                      major=True)),
                    fill=solid(brand.DEEP_BLUE), anchor="ctr"),
        placeholder(M + COL2_W + GAP, BODY_Y, COL2_W, head_h, idx=2,
                    ph_type="body", name="Option B title", prompt="Option B",
                    lst_style=lvl_ppr(1, bullet="none", algn="ctr",
                                      rpr_xml=def_rpr(sz=1600, b=True,
                                                      color=brand.WHITE,
                                                      major=True)),
                    fill=solid(brand.PETROL), anchor="ctr"),
        text_ph(3, M, BODY_Y + head_h, COL2_W, BODY_H - head_h,
                "Point of comparison", sz=1400, fill=MIST_FILL,
                ins=PANEL_INS, name="Option A detail"),
        text_ph(4, M + COL2_W + GAP, BODY_Y + head_h, COL2_W, BODY_H - head_h,
                "Point of comparison", sz=1400, fill=MIST_FILL,
                ins=PANEL_INS, name="Option B detail"),
    ] + footer_phs())

    # 19 — Quote / Highlight ------------------------------------------------
    add("Quote / Highlight", "cust", [
        textbox(M, int(1.05 * IN), int(1.5 * IN), int(1.9 * IN),
                para_run("“", sz=16000, b=True, color=brand.PALE_STEEL,
                         major=True), name="Quote mark", anchor="t"),
        text_ph(1, M + int(1.30 * IN), int(1.70 * IN),
                CONTENT_W - int(1.30 * IN), int(2.55 * IN),
                "A quotation, testimony or single highlighted statement",
                sz=2800, i=True, color=brand.DEEP_BLUE, bullet="none",
                name="Quote", line=110000, anchor="b"),
        text_ph(2, M + int(1.30 * IN), int(4.50 * IN),
                CONTENT_W - int(1.30 * IN), int(0.9 * IN),
                "Attribution — role, department", sz=1400,
                color=brand.PETROL, bullet="none", name="Attribution"),
    ] + footer_phs(), bg=brand.MIST)

    # 20 — Closing / Thank You ---------------------------------------------
    add("Closing / Thank You", "cust", [
        picture(rid_lockup_white, M, int(1.35 * IN), int(4.4 * IN),
                int(4.4 * IN * 1461 / 3956), name="UoH lockup (reversed)"),
        title_ph("Thank you", y=int(3.45 * IN), h=int(1.0 * IN),
                 w=int(8.6 * IN), dark=True, sz=3600),
        text_ph(1, M, int(4.55 * IN), int(8.6 * IN), int(1.6 * IN),
                "Department  |  email@uoh.edu.sa  |  www.uoh.edu.sa",
                sz=1400, color=brand.PALE_STEEL, bullet="none",
                name="Contact details"),
    ] + footer_phs(dark=True, show_footer=False),
        dark=True, bg=brand.DEEP_BLUE, show_master=False)

    return L
