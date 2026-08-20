"""
OOXML housekeeping.

WordprocessingML enforces a fixed child order inside pPr/rPr/border containers;
generators that concatenate fragments get this wrong sooner or later, so the
finished XML is passed through one canonical-ordering step instead of relying on
every call site to remember the schema sequence.
"""
import xml.dom.minidom as minidom

PPR_ORDER = """pStyle keepNext keepLines pageBreakBefore framePr widowControl
numPr suppressLineNumbers pBdr shd tabs suppressAutoHyphens kinsoku wordWrap
overflowPunct topLinePunct autoSpaceDE autoSpaceDN bidi adjustRightInd
snapToGrid spacing ind contextualSpacing mirrorIndents suppressOverlap jc
textDirection textAlignment textboxTightWrap outlineLvl divId cnfStyle rPr
sectPr pPrChange""".split()

RPR_ORDER = """rStyle rFonts b bCs i iCs caps smallCaps strike dstrike outline
shadow emboss imprint noProof snapToGrid vanish webHidden color spacing w kern
position sz szCs highlight u effect bdr shd fitText vertAlign rtl cs em lang
eastAsianLayout specVanish oMath rPrChange""".split()

BORDER_ORDER = """top start left bottom end right between bar insideH insideV
tl2br tr2bl""".split()

TCPR_ORDER = """cnfStyle tcW gridSpan hMerge vMerge tcBorders shd noWrap tcMar
textDirection tcFitText vAlign hideMark headers tcPrChange""".split()

TBLPR_ORDER = """tblStyle tblpPr tblOverlap bidiVisual tblStyleRowBandSize
tblStyleColBandSize tblW jc tblCellSpacing tblInd tblBorders shd tblLayout
tblCellMar tblLook tblCaption tblDescription tblPrChange""".split()

TRPR_ORDER = """cnfStyle divId gridBefore gridAfter wBefore wAfter cantSplit
trHeight tblHeader tblCellSpacing jc hidden ins del trPrChange""".split()

ORDERED = {
    "tcPr": TCPR_ORDER,
    "tblPr": TBLPR_ORDER,
    "trPr": TRPR_ORDER,
    "pPr": PPR_ORDER,
    "rPr": RPR_ORDER,
    "pBdr": BORDER_ORDER,
    "tblBorders": BORDER_ORDER,
    "tcBorders": BORDER_ORDER,
}


def _local(name):
    return name.split(":", 1)[-1]


def _sort(node):
    for child in list(node.childNodes):
        if child.nodeType == child.ELEMENT_NODE:
            _sort(child)
    order = ORDERED.get(_local(node.nodeName))
    if not order:
        return
    kids = [c for c in node.childNodes if c.nodeType == c.ELEMENT_NODE]
    if len(kids) < 2:
        return
    index = {n: i for i, n in enumerate(order)}
    decorated = [(index.get(_local(k.nodeName), len(order) + i), i, k)
                 for i, k in enumerate(kids)]
    decorated.sort(key=lambda t: (t[0], t[1]))
    for k in kids:
        node.removeChild(k)
    for _, _, k in decorated:
        node.appendChild(k)


def canonicalize(xml):
    """Reorder schema-sensitive children; returns serialized XML."""
    decl, _, rest = xml.partition("?>")
    head = decl + "?>\r\n" if rest else ""
    doc = minidom.parseString(xml.encode("utf-8"))
    _sort(doc.documentElement)
    out = doc.documentElement.toxml()
    return head + out
