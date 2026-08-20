"""
Shared brand definition for the University of Ha'il Office template system.

Every colour here is sampled from / derived from the university emblem: the mark
runs a single vertical gradient from a deep navy at the crown of the oval to a
teal at the foot of the badge. Nothing outside that navy-to-teal family is
invented; the remaining values are neutrals built for legible body text on paper
and on screen.
"""

# --- Core brand ramp (read top-to-bottom off the emblem gradient) -------------
DEEP_BLUE   = "1B3B5C"   # crown of the oval / darkest point of the gradient
PETROL      = "1B6E82"   # mid gradient, where the flame sits
TEAL        = "14A197"   # foot of the badge, the wordmark colour
LIGHT_TEAL  = "6BC5BE"   # 45% tint of TEAL, for fills and secondary series
PALE_TEAL   = "D6EBE9"   # 15% tint, table banding and quiet panels

# --- Neutrals -----------------------------------------------------------------
INK         = "1C2B33"   # body text, a blue-cast near-black (not pure black)
SLATE       = "5C7079"   # captions, metadata, muted UI text
RULE        = "D3DEE2"   # hairlines, table borders, dividers
MIST        = "EEF3F5"   # page panels, section shading, alternating rows
WHITE       = "FFFFFF"

# --- Supporting accents (still inside the brand family) -----------------------
SLATE_BLUE  = "6E8A99"   # chart series 5
PALE_STEEL  = "A8C8CE"   # chart series 6

# --- Office theme colour slots ------------------------------------------------
# dk1/lt1 drive automatic text colour; dk2/lt2 drive the "background 2" pair.
THEME_COLORS = {
    "dk1":      INK,
    "lt1":      WHITE,
    "dk2":      DEEP_BLUE,
    "lt2":      MIST,
    "accent1":  TEAL,
    "accent2":  DEEP_BLUE,
    "accent3":  PETROL,
    "accent4":  LIGHT_TEAL,
    "accent5":  SLATE_BLUE,
    "accent6":  PALE_STEEL,
    "hlink":    PETROL,
    "folHlink": SLATE,
}

# --- Typography ---------------------------------------------------------------
# Latin faces ship with every supported build of Microsoft Office. The
# complex-script (cs) faces are the Arabic companions Word/PowerPoint apply to
# RTL runs; each has a documented fallback chain in the design guide.
FONT_MAJOR_LATIN = "Segoe UI Semibold"   # display / headings
FONT_MINOR_LATIN = "Segoe UI"            # body
FONT_MAJOR_CS    = "Sakkal Majalla"      # Arabic headings
FONT_MINOR_CS    = "Sakkal Majalla"      # Arabic body

# Theme-level names (a theme slot takes one name only; style-level overrides add
# the Semibold weight where a heavier display cut is wanted).
THEME_MAJOR_LATIN = "Segoe UI"
THEME_MINOR_LATIN = "Segoe UI"
THEME_MAJOR_CS    = FONT_MAJOR_CS
THEME_MINOR_CS    = FONT_MINOR_CS

# --- Emblem gradient ----------------------------------------------------------
EMBLEM_GRADIENT = [(0.00, DEEP_BLUE), (0.45, PETROL), (1.00, TEAL)]

UNIVERSITY_EN = "University of Ha'il"
UNIVERSITY_AR = "جامعة حائل"


def rgb(hex_str):
    """'1B3B5C' -> (27, 59, 92)"""
    h = hex_str.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(hex_a, hex_b, t):
    """Linear blend between two hex colours; t=0 -> a, t=1 -> b."""
    a, b = rgb(hex_a), rgb(hex_b)
    return "".join(f"{round(a[i] + (b[i] - a[i]) * t):02X}" for i in range(3))


def tint(hex_str, pct):
    """Mix a colour toward white. pct=0.15 -> a 15% tint."""
    return mix(WHITE, hex_str, pct)
