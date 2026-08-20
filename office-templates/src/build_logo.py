#!/usr/bin/env python3
"""
Builds the University of Ha'il emblem assets used by the Word and PowerPoint
templates.

The emblem is drawn as vector geometry (SVG -> cairosvg) and the Arabic/Latin
lettering is shaped with FreeType/Raqm and warped onto the badge arc, then the
two layers are composited. Outputs live in ../assets/logo/.

NOTE: this is a reconstruction of the mark for template layout purposes. Run
`replace_logo.py` with the university's official artwork to swap it into both
templates without touching any other part of the design.
"""
import io
import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cairosvg

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "logo"))
os.makedirs(OUT, exist_ok=True)

VB_W, VB_H = 1460, 2000           # emblem design canvas
SCALE = 2.0                        # render scale -> 2920 x 4000 px master
FONT_KUFI = "/usr/share/fonts/truetype/noto/NotoKufiArabic-Regular.ttf"
FONT_KUFI_B = "/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf"
FONT_SANS = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_SANS_M = "/usr/share/fonts/truetype/noto/NotoSans-Medium.ttf"
if not os.path.exists(FONT_SANS_M):
    FONT_SANS_M = FONT_SANS

# ---------------------------------------------------------------- geometry ---
CX, CY = 730.0, 1000.0
RX, RY = 715.0, 985.0
RING_W = 24.0
BAND_TOP = 1694.0

BOOK_TOP, BOOK_BOT = 1145.0, 1642.0
BOOK_X0, BOOK_SPAN = 504.0, 411.0
BOOK_GAP = 13.5
BOOK_W = (BOOK_SPAN - 2 * BOOK_GAP) / 3.0
SHELF_Y0, SHELF_Y1 = 1612.0, 1642.0
SHELF_X0, SHELF_X1 = 190.0, 1229.0
TICK_W, TICK_TOP = 46.0, 1391.0
TICK_L0, TICK_R0 = 424.0, 949.0


def catmull_rom(points, samples_per_seg=28):
    """Smooth polyline through the given control points."""
    p = [points[0]] + list(points) + [points[-1]]
    out = []
    for i in range(len(p) - 3):
        p0, p1, p2, p3 = p[i], p[i + 1], p[i + 2], p[i + 3]
        for s in range(samples_per_seg):
            t = s / samples_per_seg
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t +
                       (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t +
                       (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    out.append(points[-1])
    return out


def tongue_path(spine, w_base, w_max, t_peak=0.20, tip_frac=0.0, ease=0.85):
    """
    Outline a flame tongue: a spine curve given a width profile that swells just
    above the base and tapers to (near) nothing at the tip.
    """
    pts = catmull_rom(spine)
    n = len(pts)
    widths = []
    for i in range(n):
        t = i / (n - 1)
        if t <= t_peak:
            u = t / t_peak if t_peak else 1.0
            w = w_base + (w_max - w_base) * (u ** 0.7)
        else:
            u = (t - t_peak) / (1.0 - t_peak)
            w = w_max * ((1.0 - u) ** ease)
            w = max(w, w_max * tip_frac * (1.0 - u * 0.15))
        widths.append(w)

    left, right = [], []
    for i, (x, y) in enumerate(pts):
        j0, j1 = max(0, i - 1), min(n - 1, i + 1)
        dx = pts[j1][0] - pts[j0][0]
        dy = pts[j1][1] - pts[j0][1]
        L = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / L, dx / L
        h = widths[i] / 2.0
        left.append((x + nx * h, y + ny * h))
        right.append((x - nx * h, y - ny * h))

    ring = left + right[::-1]
    d = "M {:.2f} {:.2f} ".format(*ring[0])
    d += " ".join("L {:.2f} {:.2f}".format(px, py) for px, py in ring[1:])
    return d + " Z"


# Flame tongues, base cluster -> tips. Ordered back-to-front.
TONGUES = [
    # far-left
    dict(spine=[(600, 1158), (546, 1072), (498, 1000), (466, 942), (454, 898)],
         w_base=50, w_max=60),
    # outer-left
    dict(spine=[(634, 1155), (576, 1038), (518, 936), (482, 834), (474, 742),
                (496, 686)],
         w_base=60, w_max=76),
    # inner-left
    dict(spine=[(672, 1152), (636, 1014), (606, 882), (594, 758), (608, 656),
                (646, 596)],
         w_base=68, w_max=84),
    # far-right
    dict(spine=[(808, 1158), (866, 1082), (910, 1018), (940, 966), (950, 926)],
         w_base=46, w_max=56),
    # outer-right
    dict(spine=[(786, 1155), (846, 1046), (898, 952), (930, 862), (938, 788),
                (922, 738)],
         w_base=56, w_max=70),
    # inner-right hook (the spiral at the shoulder of the flame)
    dict(spine=[(748, 1152), (790, 1024), (830, 902), (858, 790), (864, 700),
                (838, 640), (794, 632), (776, 672), (780, 714)],
         w_base=66, w_max=78, t_peak=0.16, tip_frac=0.24, ease=1.15),
    # central spire
    dict(spine=[(708, 1152), (696, 1002), (702, 840), (736, 658), (778, 498),
                (780, 408), (750, 376)],
         w_base=88, w_max=106, t_peak=0.22, ease=0.76),
]


def emblem_svg(mono=None):
    """SVG for every drawn (non-text) part of the badge.

    mono=None  -> brand gradient
    mono='#fff' -> flat colour, for the reversed lockup
    """
    if mono:
        paint = mono
        defs = ""
    else:
        paint = "url(#brandGrad)"
        stops = "".join(
            '<stop offset="{:.0%}" stop-color="#{}"/>'.format(o, c)
            for o, c in brand.EMBLEM_GRADIENT)
        defs = ('<linearGradient id="brandGrad" gradientUnits="userSpaceOnUse" '
                'x1="0" y1="0" x2="0" y2="{}">{}</linearGradient>'.format(VB_H, stops))

    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {} {}" '
        'width="{}" height="{}">'.format(VB_W, VB_H, VB_W * SCALE, VB_H * SCALE),
        '<defs>{}<clipPath id="bandClip"><rect x="0" y="{}" width="{}" height="{}"/>'
        '</clipPath></defs>'.format(defs, BAND_TOP, VB_W, VB_H - BAND_TOP),
        '<g>',
        # outer ring
        '<ellipse cx="{}" cy="{}" rx="{}" ry="{}" fill="none" stroke="{}" '
        'stroke-width="{}"/>'.format(CX, CY, RX, RY, paint, RING_W),
        # solid foot band
        '<ellipse cx="{}" cy="{}" rx="{}" ry="{}" fill="{}" clip-path="url(#bandClip)"/>'
        .format(CX, CY, RX + RING_W / 2, RY + RING_W / 2, paint),
    ]

    for t in TONGUES:
        parts.append('<path d="{}" fill="{}"/>'.format(tongue_path(**t), paint))

    # three books
    for i in range(3):
        x = BOOK_X0 + i * (BOOK_W + BOOK_GAP)
        parts.append('<rect x="{:.2f}" y="{}" width="{:.2f}" height="{}" fill="{}"/>'
                     .format(x, BOOK_TOP, BOOK_W, BOOK_BOT - BOOK_TOP, paint))
    # knocked-out cross bands (drawn as background-coloured gaps -> punched later)
    parts.append('<g id="knockout" fill="#000000">')
    for y0, y1 in ((1248, 1262), (1556, 1570)):
        parts.append('<rect x="{}" y="{}" width="{}" height="{}"/>'
                     .format(BOOK_X0 - 4, y0, BOOK_SPAN + 8, y1 - y0))
    parts.append('</g>')

    # flanking uprights + shelf
    parts.append('<rect x="{}" y="{}" width="{}" height="{}" fill="{}"/>'
                 .format(TICK_L0, TICK_TOP, TICK_W, BOOK_BOT - TICK_TOP, paint))
    parts.append('<rect x="{}" y="{}" width="{}" height="{}" fill="{}"/>'
                 .format(TICK_R0, TICK_TOP, TICK_W, BOOK_BOT - TICK_TOP, paint))
    parts.append('<rect x="{}" y="{}" width="{}" height="{}" rx="8" fill="{}"/>'
                 .format(SHELF_X0, SHELF_Y0, SHELF_X1 - SHELF_X0,
                         SHELF_Y1 - SHELF_Y0, paint))
    parts.append('</g></svg>')
    return "".join(parts)


def render_svg(svg):
    png = cairosvg.svg2png(bytestring=svg.encode("utf-8"))
    return Image.open(io.BytesIO(png)).convert("RGBA")


# ------------------------------------------------------------------- text ----
def text_image(text, font_path, size, color=(255, 255, 255, 255),
               rtl=False, tracking=0, pad=8):
    """Render shaped text to a tight RGBA image."""
    font = ImageFont.truetype(font_path, size)
    kw = dict(direction="rtl", language="ar") if rtl else {}
    probe = ImageDraw.Draw(Image.new("RGBA", (8, 8)))

    if tracking and not rtl:
        widths = [probe.textlength(ch, font=font) for ch in text]
        total = sum(widths) + tracking * (len(text) - 1)
        asc, desc = font.getmetrics()
        img = Image.new("RGBA", (int(total) + 2 * pad, asc + desc + 2 * pad), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        x = pad
        for ch, w in zip(text, widths):
            d.text((x, pad), ch, font=font, fill=color)
            x += w + tracking
    else:
        bbox = probe.textbbox((0, 0), text, font=font, **kw)
        img = Image.new("RGBA",
                        (bbox[2] - bbox[0] + 2 * pad, bbox[3] - bbox[1] + 2 * pad),
                        (0, 0, 0, 0))
        ImageDraw.Draw(img).text((pad - bbox[0], pad - bbox[1]), text,
                                 font=font, fill=color, **kw)

    return img.crop(img.getbbox())


def warp_arc(src, canvas_size, cx, cy, r_inner, theta_c=0.0):
    """
    Bend a rendered text image around a circular arc.

    The bottom edge of `src` is laid on radius `r_inner` from (cx, cy); the
    horizontal centre of `src` lands at angle `theta_c` (radians, clockwise
    from straight up). Inverse-mapped with bilinear sampling.
    """
    W, H = src.size
    r_mid = r_inner + H / 2.0
    r_out = r_inner + H
    cw, ch = canvas_size

    half = (W / 2.0) / r_mid + 0.05
    xs = [cx + r * math.sin(theta_c + s * half)
          for r in (r_inner, r_out) for s in (-1, 0, 1)]
    ys = [cy - r * math.cos(theta_c + s * half)
          for r in (r_inner, r_out) for s in (-1, 0, 1)]
    x0, x1 = max(0, int(min(xs)) - 4), min(cw, int(max(xs)) + 4)
    y0, y1 = max(0, int(min(ys)) - 4), min(ch, int(max(ys)) + 4)
    if x1 <= x0 or y1 <= y0:
        return Image.new("RGBA", canvas_size, (0, 0, 0, 0))

    yy, xx = np.mgrid[y0:y1, x0:x1]
    dx = xx - cx
    dy = yy - cy
    r = np.hypot(dx, dy)
    theta = np.arctan2(dx, -dy)
    sx = W / 2.0 + (theta - theta_c) * r_mid
    sy = r_out - r

    a = np.asarray(src, dtype=np.float32)
    ah, aw = a.shape[:2]
    valid = (sx >= 0) & (sx <= aw - 1) & (sy >= 0) & (sy <= ah - 1)
    sxc = np.clip(sx, 0, aw - 1)
    syc = np.clip(sy, 0, ah - 1)
    x0i = np.floor(sxc).astype(int); x1i = np.minimum(x0i + 1, aw - 1)
    y0i = np.floor(syc).astype(int); y1i = np.minimum(y0i + 1, ah - 1)
    fx = (sxc - x0i)[..., None]
    fy = (syc - y0i)[..., None]
    top = a[y0i, x0i] * (1 - fx) + a[y0i, x1i] * fx
    bot = a[y1i, x0i] * (1 - fx) + a[y1i, x1i] * fx
    samp = top * (1 - fy) + bot * fy
    samp[~valid] = 0

    out = np.zeros((ch, cw, 4), dtype=np.uint8)
    out[y0:y1, x0:x1] = np.clip(samp, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


# ------------------------------------------------------------------ build ----
ARC_CX, ARC_CY = 730.0, 905.0
ARC_R_MID = 715.0
ARC_TEXT_H = 190.0


def build_emblem(mono=None):
    """Compose badge geometry + lettering. Returns an RGBA image."""
    s = SCALE
    base = render_svg(emblem_svg(mono))
    W, H = base.size

    ink = (255, 255, 255, 255) if mono else None  # band text is always knocked out
    # Arabic arc: "جامعة حائل" with a wide word gap so 1426 sits in the middle.
    arc_src = text_image("جامعة" + " " * 6 + "حائل", FONT_KUFI,
                         int(ARC_TEXT_H * s * 0.86), rtl=True)
    scale_f = (ARC_TEXT_H * s) / arc_src.height
    arc_src = arc_src.resize((max(1, int(arc_src.width * scale_f)),
                              int(ARC_TEXT_H * s)), Image.LANCZOS)
    arc_layer = warp_arc(arc_src, (W, H), ARC_CX * s, ARC_CY * s,
                         (ARC_R_MID - ARC_TEXT_H / 2) * s, 0.0)

    flat = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    dr = ImageDraw.Draw(flat)

    def centered(img, cx_, cy_):
        flat.alpha_composite(img, (int(cx_ * s - img.width / 2),
                                   int(cy_ * s - img.height / 2)))

    centered(text_image("1426", FONT_SANS_M, int(104 * s), tracking=int(7 * s)),
             727, 296)
    del dr

    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    def band_centered(img, cx_, cy_):
        band.alpha_composite(img, (int(cx_ * s - img.width / 2),
                                   int(cy_ * s - img.height / 2)))

    band_centered(text_image("University of Ha'il", FONT_SANS, int(88 * s),
                             tracking=int(5 * s)), 716, 1782)
    band_centered(text_image("2005", FONT_SANS_M, int(104 * s),
                             tracking=int(7 * s)), 730, 1898)

    out = base
    # knock the book cross-bands and the band lettering out of the badge
    ko_alpha = np.asarray(out)[..., 3].copy()
    ko = np.asarray(band)[..., 3]
    arr = np.asarray(out).copy()
    arr[..., 3] = np.clip(ko_alpha.astype(np.int16) - ko.astype(np.int16), 0, 255)
    out = Image.fromarray(arr, "RGBA")

    # arc + 1426 painted in the badge colour (sample the gradient at that height)
    if mono:
        paint_arc = (255, 255, 255, 255)
        paint_num = (255, 255, 255, 255)
    else:
        paint_arc = brand.rgb(brand.mix(brand.DEEP_BLUE, brand.PETROL, 0.10)) + (255,)
        paint_num = brand.rgb(brand.mix(brand.DEEP_BLUE, brand.PETROL, 0.18)) + (255,)

    def tint_layer(layer, rgba):
        a = np.asarray(layer)[..., 3]
        m = np.zeros((a.shape[0], a.shape[1], 4), dtype=np.uint8)
        m[..., 0], m[..., 1], m[..., 2] = rgba[0], rgba[1], rgba[2]
        m[..., 3] = a
        return Image.fromarray(m, "RGBA")

    out.alpha_composite(tint_layer(arc_layer, paint_arc))
    out.alpha_composite(tint_layer(flat, paint_num))
    return out


def build_knockout_fix(img):
    """Remove the temporary black knockout rects drawn into the SVG."""
    a = np.asarray(img).copy()
    black = (a[..., 0] < 12) & (a[..., 1] < 12) & (a[..., 2] < 12) & (a[..., 3] > 0)
    a[black, 3] = 0
    return Image.fromarray(a, "RGBA")


def trim(img, pad=0):
    bb = img.getbbox()
    im = img.crop(bb)
    if pad:
        canvas = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
        canvas.alpha_composite(im, (pad, pad))
        return canvas
    return im


def build_lockup(emblem, mono=None):
    """Emblem stacked over the bilingual wordmark."""
    s = SCALE
    teal = (255, 255, 255, 255) if mono else brand.rgb(brand.TEAL) + (255,)
    ar = text_image(brand.UNIVERSITY_AR, FONT_KUFI, int(300 * s), color=teal, rtl=True)
    en = text_image(brand.UNIVERSITY_EN, FONT_SANS, int(210 * s), color=teal,
                    tracking=int(6 * s))

    target_w = max(emblem.width, ar.width, en.width)
    gap1, gap2 = int(110 * s), int(60 * s)
    H = emblem.height + gap1 + ar.height + gap2 + en.height
    canvas = Image.new("RGBA", (target_w, H), (0, 0, 0, 0))
    y = 0
    for im in (emblem, ar, en):
        canvas.alpha_composite(im, ((target_w - im.width) // 2, y))
        y += im.height + (gap1 if im is emblem else gap2)
    return trim(canvas, pad=int(14 * s))


def build_lockup_h(emblem, mono=None):
    """Emblem to the left of a stacked bilingual wordmark, for wide headers."""
    s = SCALE
    teal = (255, 255, 255, 255) if mono else brand.rgb(brand.TEAL) + (255,)
    navy = (255, 255, 255, 255) if mono else brand.rgb(brand.DEEP_BLUE) + (255,)
    ar = text_image(brand.UNIVERSITY_AR, FONT_KUFI, int(230 * s), color=teal, rtl=True)
    en = text_image(brand.UNIVERSITY_EN, FONT_SANS, int(150 * s), color=navy,
                    tracking=int(5 * s))

    gap_v = int(64 * s)
    block_h = ar.height + gap_v + en.height
    target_h = int(block_h * 1.62)
    em = emblem.resize((max(1, round(emblem.width * target_h / emblem.height)),
                        target_h), Image.LANCZOS)

    gap_h = int(150 * s)
    W = em.width + gap_h + max(ar.width, en.width)
    H = max(em.height, block_h)
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    canvas.alpha_composite(em, (0, (H - em.height) // 2))
    x = em.width + gap_h
    y = (H - block_h) // 2
    canvas.alpha_composite(ar, (x, y))
    canvas.alpha_composite(en, (x, y + ar.height + gap_v))
    return trim(canvas, pad=int(14 * s))


def main():
    colour = build_knockout_fix(build_emblem())
    white = build_knockout_fix(build_emblem(mono="#FFFFFF"))

    emblem = trim(colour)
    emblem_w = trim(white)

    emblem.save(os.path.join(OUT, "uoh-emblem.png"))
    emblem_w.save(os.path.join(OUT, "uoh-emblem-white.png"))
    build_lockup(emblem).save(os.path.join(OUT, "uoh-lockup-vertical.png"))
    build_lockup(emblem_w, mono=True).save(
        os.path.join(OUT, "uoh-lockup-vertical-white.png"))
    build_lockup_h(emblem).save(os.path.join(OUT, "uoh-lockup-horizontal.png"))
    build_lockup_h(emblem_w, mono=True).save(
        os.path.join(OUT, "uoh-lockup-horizontal-white.png"))

    with open(os.path.join(OUT, "uoh-emblem.svg"), "w", encoding="utf-8") as fh:
        fh.write(emblem_svg())

    for name in sorted(os.listdir(OUT)):
        p = os.path.join(OUT, name)
        if name.endswith(".png"):
            print(name, Image.open(p).size, "{:.0f} KB".format(os.path.getsize(p) / 1024))


if __name__ == "__main__":
    main()
