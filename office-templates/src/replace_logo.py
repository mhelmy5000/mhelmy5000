#!/usr/bin/env python3
"""
Swap the university's official artwork into both templates.

The templates ship with a reconstruction of the emblem drawn from the mark
supplied for this work. When the official master artwork is available, point
this script at it and both packages are rebuilt around it — nothing else in the
design system changes.

    python3 replace_logo.py --emblem path/to/emblem.png
    python3 replace_logo.py --emblem emblem.png --lockup lockup-horizontal.png

Any variant not supplied is derived:
  * white/reversed versions are produced by flattening the artwork to white,
    preserving transparency;
  * a horizontal lockup is produced by setting the emblem beside the bilingual
    wordmark, exactly as build_logo.py does.

Accepts PNG (transparent background strongly preferred) or SVG.
"""
import argparse
import os
import subprocess
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.normpath(os.path.join(HERE, "..", "assets", "logo"))

TARGETS = {
    "emblem": "uoh-emblem.png",
    "emblem_white": "uoh-emblem-white.png",
    "lockup": "uoh-lockup-horizontal.png",
    "lockup_white": "uoh-lockup-horizontal-white.png",
    "lockup_vertical": "uoh-lockup-vertical.png",
    "lockup_vertical_white": "uoh-lockup-vertical-white.png",
}


def load(path):
    if path.lower().endswith(".svg"):
        import cairosvg
        import io
        png = cairosvg.svg2png(url=path, output_width=2400)
        return Image.open(io.BytesIO(png)).convert("RGBA")
    return Image.open(path).convert("RGBA")


def to_white(img):
    """Flatten every visible pixel to white, keeping the alpha channel."""
    r, g, b, a = img.split()
    white = Image.new("L", img.size, 255)
    return Image.merge("RGBA", (white, white, white, a))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--emblem", help="official emblem/badge artwork (PNG or SVG)")
    ap.add_argument("--emblem-white", help="reversed emblem for dark backgrounds")
    ap.add_argument("--lockup", help="horizontal emblem + wordmark lockup")
    ap.add_argument("--lockup-white", help="reversed horizontal lockup")
    ap.add_argument("--lockup-vertical", help="stacked emblem + wordmark lockup")
    ap.add_argument("--lockup-vertical-white", help="reversed stacked lockup")
    ap.add_argument("--no-rebuild", action="store_true",
                    help="write the assets but do not rebuild the templates")
    args = ap.parse_args()

    supplied = {k: v for k, v in vars(args).items()
                if k in TARGETS and v}
    if not supplied:
        ap.error("supply at least --emblem")

    for key, path in supplied.items():
        img = load(path)
        img.save(os.path.join(LOGO, TARGETS[key]))
        print("installed {} -> {}".format(path, TARGETS[key]))

    # derive any reversed variant that was not supplied
    for base, white in (("emblem", "emblem_white"),
                        ("lockup", "lockup_white"),
                        ("lockup_vertical", "lockup_vertical_white")):
        if base in supplied and white not in supplied:
            src = os.path.join(LOGO, TARGETS[base])
            dst = os.path.join(LOGO, TARGETS[white])
            to_white(Image.open(src).convert("RGBA")).save(dst)
            print("derived  {} (reversed)".format(TARGETS[white]))

    if "emblem" in supplied and "lockup" not in supplied:
        print("note: no horizontal lockup supplied — rebuilding one from the "
              "new emblem plus the bilingual wordmark")
        import build_logo
        emblem = Image.open(os.path.join(LOGO, TARGETS["emblem"])).convert("RGBA")
        build_logo.build_lockup_h(emblem).save(
            os.path.join(LOGO, TARGETS["lockup"]))
        build_logo.build_lockup_h(
            to_white(emblem), mono=True).save(
            os.path.join(LOGO, TARGETS["lockup_white"]))

    if args.no_rebuild:
        return
    for script in ("build_word.py", "build_sample.py"):
        print("--- {}".format(script))
        subprocess.check_call([sys.executable, os.path.join(HERE, script)])


if __name__ == "__main__":
    main()
