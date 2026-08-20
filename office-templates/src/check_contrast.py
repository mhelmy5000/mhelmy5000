#!/usr/bin/env python3
"""
Contrast audit for every text/background pair the templates actually ship.

WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text (>=18 pt regular or
>=14 pt bold). Bullet glyphs and rules are decorative and are reported but not
required to pass.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hexv):
    r, g, b = brand.rgb(hexv)
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def ratio(fg, bg):
    a, b = sorted((luminance(fg), luminance(bg)), reverse=True)
    return (a + 0.05) / (b + 0.05)


# (where, foreground, background, required ratio; None = decorative)
PAIRS = [
    ("Word body text",            brand.INK,        brand.WHITE,      4.5),
    ("Word Heading 1/3",          brand.DEEP_BLUE,  brand.WHITE,      4.5),
    ("Word Heading 2",            brand.PETROL,     brand.WHITE,      4.5),
    ("Word Heading 4 / captions", brand.SLATE,      brand.WHITE,      4.5),
    ("Word header & footer",      brand.SLATE,      brand.WHITE,      4.5),
    ("Word cover label",          brand.PETROL,     brand.WHITE,      4.5),
    ("Word classification",       brand.PETROL,     brand.WHITE,      4.5),
    ("Word lead paragraph",       brand.PETROL,     brand.WHITE,      4.5),
    ("Word section number 52pt",  brand.TEAL,       brand.WHITE,      3.0),
    ("Word exec-summary panel",   brand.INK,        brand.tint(brand.TEAL, 0.10), 4.5),
    ("Word callout",              brand.DEEP_BLUE,  brand.MIST,       4.5),
    ("Word table header",         brand.WHITE,      brand.DEEP_BLUE,  4.5),
    ("Word banded table row",     brand.INK,        brand.MIST,       4.5),
    ("Word inline emphasis",      brand.PETROL,     brand.WHITE,      4.5),
    ("Word bullet glyph",         brand.TEAL,       brand.WHITE,      None),

    ("PPT slide title",           brand.DEEP_BLUE,  brand.WHITE,      4.5),
    ("PPT body text",             brand.INK,        brand.WHITE,      4.5),
    ("PPT footer",                brand.SLATE,      brand.WHITE,      4.5),
    ("PPT title-slide title",     brand.WHITE,      brand.DEEP_BLUE,  4.5),
    ("PPT title-slide subtitle",  brand.LIGHT_TEAL, brand.DEEP_BLUE,  4.5),
    ("PPT presenter details",     brand.PALE_STEEL, brand.DEEP_BLUE,  4.5),
    ("PPT section number 66pt",   brand.PALE_TEAL,  brand.PETROL,     3.0),
    ("PPT section title",         brand.WHITE,      brand.PETROL,     4.5),
    ("PPT section summary",       brand.PALE_TEAL,  brand.PETROL,     4.5),
    ("PPT slide number (dark)",   brand.PALE_TEAL,  brand.PETROL,     4.5),
    ("PPT KPI figure 40pt",       brand.PETROL,     brand.MIST,       3.0),
    ("PPT KPI label",             brand.SLATE,      brand.MIST,       4.5),
    ("PPT panel heading",         brand.DEEP_BLUE,  brand.MIST,       4.5),
    ("PPT panel body",            brand.INK,        brand.MIST,       4.5),
    ("PPT key-message numeral",   brand.TEAL,       brand.WHITE,      3.0),
    ("PPT roadmap/compare head",  brand.WHITE,      brand.PETROL,     4.5),
    ("PPT step badge",            brand.WHITE,      brand.PETROL,     4.5),
    ("PPT quote",                 brand.DEEP_BLUE,  brand.MIST,       4.5),
    ("PPT quote attribution",     brand.PETROL,     brand.MIST,       4.5),
    ("PPT closing contact",       brand.PALE_STEEL, brand.DEEP_BLUE,  4.5),
]


def main():
    failures = 0
    for where, fg, bg, need in PAIRS:
        v = ratio(fg, bg)
        if need is None:
            verdict = "decorative"
        elif v >= need:
            verdict = "pass (>= {})".format(need)
        else:
            verdict = "FAIL (needs {})".format(need)
            failures += 1
        print("{:<28} #{} on #{}  {:5.2f}  {}".format(where, fg, bg, v, verdict))
    print("\n{} pair(s) checked, {} failure(s)".format(len(PAIRS), failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
