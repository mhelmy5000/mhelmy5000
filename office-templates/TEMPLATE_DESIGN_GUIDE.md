# University of Ha'il — Office Template Design Guide

Two production templates and the design system behind them.

| File | What it is |
|---|---|
| `University_Branded_Word_Template.dotx` | Word template — cover, front matter, full native style set, headers/footers, bilingual support |
| `University_Branded_Presentation_Template.potx` | PowerPoint template — one slide master, twenty reusable layouts |
| `docs/University_Branded_Word_Sample.docx` | The same document as an ordinary `.docx`, for looking at without installing |
| `docs/University_Branded_Presentation_Sample.pptx` | One filled slide per layout — a catalogue of the twenty layouts |
| `docs/word-template-pages.jpg`, `docs/powerpoint-layouts.jpg` | Contact sheets of everything, rendered |

Both files carry the **same theme part**, byte for byte. A chart pasted from Excel, a table in
Word and a slide in PowerPoint all resolve to the same eight brand colours and the same type.

---

## 1. Colour palette

Every colour is read off the emblem, which runs a single vertical gradient from a deep navy at
the crown of the oval to a teal at the foot of the badge. Nothing outside that navy‑to‑teal
family has been invented; the rest are neutrals chosen for legible body text on paper.

| Role | Hex | Theme slot | Used for |
|---|---|---|---|
| Ha'il Deep Blue | `#1B3B5C` | `dk2` / accent 2 | Headings 1 & 3, table header rows, title and closing slides |
| Ha'il Petrol | `#1B6E82` | accent 3 / hyperlink | Heading 2, section‑divider slides, quotes, hyperlinks |
| Ha'il Teal | `#14A197` | **accent 1** | Bullets, rules, Word section numerals, the primary chart series |
| Light Teal | `#6BC5BE` | accent 4 | Title-slide subtitle, tints, second chart series |
| Pale Teal | `#D6EBE9` | — | Executive‑summary panel, section‑divider numerals and text on petrol |
| Slate Blue | `#6E8A99` | accent 5 | Fifth chart series |
| Pale Steel | `#A8C8CE` | accent 6 | Sixth chart series, reversed body text |
| Ink | `#1C2B33` | `dk1` | Body text — a blue‑cast near‑black, never pure black |
| Slate | `#5C7079` | followed link | Captions, metadata, footers, Heading 4 |
| Rule | `#D3DEE2` | — | Hairlines, table rules, dividers |
| Mist | `#EEF3F5` | `lt2` | Panels, callouts, table banding, KPI tiles |
| White | `#FFFFFF` | `lt1` | Page and slide ground |

**Proportion.** Roughly 70 % white/mist, 20 % deep blue, 10 % teal. Teal is an accent —
it marks and points, it does not fill.

---

## 2. Typography

| | Latin | Arabic (complex script) |
|---|---|---|
| Headings | **Segoe UI** (Semibold where a heavier cut is wanted) | **Sakkal Majalla** |
| Body | **Segoe UI** | **Sakkal Majalla** |

Both ship with Windows and Microsoft Office, so documents open correctly on any university
machine without installing fonts.

**If a machine lacks them,** substitute in this order and the layout holds:
Latin — Segoe UI → Calibri → Arial.
Arabic — Sakkal Majalla → Dubai → Traditional Arabic → Arial.
Change them once in the theme (Design ▸ Fonts ▸ Customise Fonts) and every style follows.

**Arabic is set two to three points larger than the Latin at the same level.** Naskh faces have
a smaller apparent height, so matching the point sizes would leave Arabic looking undersized
next to English. Every style therefore carries a separate complex‑script size, and mixed
sentences sit optically level without anyone adjusting anything.

### Type hierarchy — Word

| Style | Size | Weight / colour | Notes |
|---|---|---|---|
| Title | 30 pt | Semibold, Deep Blue | Cover only |
| Subtitle | 15 pt | Regular, Slate | |
| Heading 1 | 17 pt | Bold, Deep Blue | Auto‑numbered `1.`, hairline rule beneath |
| Heading 2 | 13.5 pt | Bold, Petrol | Auto‑numbered `1.1` |
| Heading 3 | 11.5 pt | Bold, Deep Blue | Auto‑numbered `1.1.1` |
| Heading 4 | 11 pt | Bold caps, Slate | Unnumbered run‑in |
| Normal | 11 pt / 13.5 pt Arabic | Ink, 1.15 line, left aligned | |
| UoH Lead Paragraph | 12.5 pt | Petrol | Standfirst under a section title |
| Caption | 8.5 pt | Bold, Slate | Tables above, figures below |
| Footer / Header | 8.5 pt | Slate | |

### Type hierarchy — PowerPoint

| Element | Size |
|---|---|
| Presentation title (title slide) | 44 pt bold |
| Section title | 40 pt bold · section number 66 pt |
| Slide title | 32 pt bold |
| Body level 1 → 5 | 18 / 16 / 14 / 12 / 11 pt |
| KPI figure | 40 pt bold petrol · label 11 pt caps |
| Quote | 28 pt italic |
| Footer and slide number | 10 pt |

---

## 3. Logo usage

Six variants live in `assets/logo/`:

| File | Use |
|---|---|
| `uoh-emblem.png` | Badge alone — Word header, top‑right of content slides |
| `uoh-emblem-white.png` | Badge reversed, for deep blue / petrol grounds |
| `uoh-lockup-horizontal.png` | Badge beside the bilingual wordmark — document covers |
| `uoh-lockup-horizontal-white.png` | The same, reversed — title and closing slides |
| `uoh-lockup-vertical.png` / `-white.png` | Stacked lockup, for square or portrait spaces |
| `uoh-emblem.svg` | Vector geometry of the badge |

**Rules.**

- **Clear space** — keep clear on all sides at least the height of the badge's foot band
  (about 15 % of the badge height). Nothing sits inside it.
- **Minimum size** — 10 mm high in print, 40 px on screen. Below that use the badge alone,
  never the lockup: the wordmark stops being legible first.
- **Position is fixed by the templates.** Word: badge at the head of every page, lockup on the
  cover. PowerPoint: badge top‑right on every content layout, reversed lockup on the title,
  section and closing layouts. Do not move it slide by slide — that is the whole point of it
  being on the master.
- **Never** stretch it, recolour it outside the two supplied versions, add effects to it, or
  place the colour version on a dark ground.

> **On the artwork itself.** The emblem embedded in these templates is a reconstruction, drawn
> as vector geometry from the mark supplied for this work — the university's master artwork
> file was not available to this build. It is accurate enough to lay out and review the system,
> but the official file should replace it before the templates are issued. That is one command
> and changes nothing else:
>
> ```bash
> python3 src/replace_logo.py --emblem path/to/official-emblem.png
> ```
>
> Reversed variants and the lockups are derived automatically if you do not supply them, and
> both templates are rebuilt around the new artwork.

---

## 4. Using the Word template

**Install it.** Copy `University_Branded_Word_Template.dotx` to
`%APPDATA%\Microsoft\Templates\` (Windows) or
`~/Library/Group Containers/UBF8T346G9.Office/User Content/Templates/` (Mac). It then appears
under File ▸ New ▸ Personal. Or just double‑click the file to start a document from it.

**The document you get** is a working skeleton, not a blank page: cover → document control and
approvals → contents → executive summary → a numbered section with every text element
demonstrated → an Arabic section → a "how to use" page to delete. Replace the bracketed
placeholders and delete what you do not need.

### The styles

Everything is a named style. Select any paragraph and the Styles gallery on the Home tab shows
which one is applied; change the style and every matching paragraph in the document follows.

| Style | Apply it to |
|---|---|
| `Title`, `Subtitle`, `UoH Doc Label` | The cover block |
| `UoH Cover Meta` (+ `UoH Cover Meta Label`) | The department / author / date table on the cover |
| `UoH Classification` | The classification line (it also sits in the cover footer) |
| `Heading 1`–`Heading 4` | Section structure. 1–3 number themselves and feed the contents list |
| `UoH Front Heading` | Front‑matter headings that belong in the contents but take no number |
| `UoH Section Number` + `UoH Section Title` | A divider page — the number style forces a page break before it |
| `Normal` | Body text |
| `UoH Lead Paragraph` | The standfirst under a section title |
| `UoH Executive Summary` | The tinted summary panel |
| `UoH Callout` | A decision, instruction or anything the reader must not miss |
| `Quote` | Pull quotes, testimony, extracts from policy |
| `UoH Bullet` / `UoH Bullet 2` | Bulleted lists (teal markers, two levels) |
| `UoH Numbered` / `UoH Numbered 2` | Numbered lists |
| `Caption` | Table captions (above) and figure captions (below) |
| `UoH Note` | Small grey notes |
| `UoH Emphasis` | Inline teal emphasis (character style) |
| `Hyperlink` | Applied automatically to links |

**Tables** — three styles under Table Design:

- **UoH Table** — reporting grids. Deep blue header row, mist banding, horizontal rules only.
- **UoH Table Light** — sign‑off and approval blocks. Tinted header, no banding.
- **UoH Key Facts Table** — label/value pairs, no borders but the rules between rows.

**Contents list** — right‑click the field on the Contents page ▸ Update Field ▸ Update entire
table. The template also sets fields to refresh when the document is opened.

**Page setup** — A4, 2.8 cm top / 2.5 cm elsewhere, header and footer 1.3 cm from the edge.
Print‑safe on any office device; nothing bleeds to the edge, so no special printing is needed.

**Turning off automatic heading numbers**, if a document does not want them: Home ▸ Styles ▸
right‑click Heading 1 ▸ Modify ▸ Format ▸ Numbering ▸ None. Do it once in the document and all
three levels follow.

### Arabic and bilingual documents

Five right‑to‑left styles sit alongside the Latin ones: `UoH Arabic Title`,
`UoH Arabic Heading 1`–`3`, `UoH Arabic Body`, `UoH Arabic Bullet`. They set the paragraph
direction, the Arabic type size and the looser line spacing Arabic needs — apply the style and
nothing else needs adjusting.

For a fully Arabic document, also set the section to right‑to‑left (Layout ▸ Page Setup, or
Ctrl+Shift+E on the paragraph) so the margins, header tabs and page numbering mirror.

For a bilingual document, keep the Latin styles for English passages and the Arabic styles for
Arabic ones — mixed inline text already resolves correctly, because every Latin style carries
the Arabic face and size for its complex‑script runs.

---

## 5. Using the PowerPoint template

**Install it** the same way as the Word template, or double‑click to start a deck from it.

**It is a real slide master.** Open View ▸ Slide Master and you will find one master and twenty
layouts, each with positioned placeholders. Add slides with Home ▸ New Slide and pick the
layout; change a slide's layout with Home ▸ Layout. Nothing needs drawing by hand, and a deck
stays consistent when content is added or replaced because everything inherits from the master.

### The twenty layouts

| # | Layout | Use it for |
|---|---|---|
| 1 | Title Slide | Deck opener. Reversed lockup on deep blue |
| 2 | Section Divider | Between parts of a deck. Big number, petrol ground |
| 3 | Title and Content | The default workhorse |
| 4 | Two‑Column Content | Two parallel lists, or text beside an object |
| 5 | Three‑Column Content | Three strands of work, three pillars |
| 6 | Text and Image | Argument on the left, picture on the right |
| 7 | Full‑Width Image | A photograph carrying the slide, title and caption beneath |
| 8 | Image and Text | Picture leads, text supports |
| 9 | Executive Summary | One lead statement over three summary cards |
| 10 | Key Messages | Three numbered messages — what the audience must remember |
| 11 | KPI Dashboard | Four headline figures over a supporting chart or table |
| 12 | Data and Chart | Chart on the left, the read‑across on the right |
| 13 | Table | A table with a source note |
| 14 | Process / Timeline | Five numbered steps along a rule |
| 15 | Roadmap | Four phases, alternating navy and petrol headers |
| 16 | Organisational Structure | An org chart or SmartArt with an approval note |
| 17 | Architecture / Diagram | A large diagram with a legend panel |
| 18 | Comparison | Two options side by side under coloured headers |
| 19 | Quote / Highlight | A single statement on a mist ground |
| 20 | Closing / Thank You | Reversed lockup, closing line, contact details |

### What the master fixes for you

- **Margins** — 0.75 in on every side. Titles start at 0.45 in from the top, content at 1.55 in,
  the footer band at 6.84 in. Every layout obeys the same grid, so switching layouts never
  shifts a title.
- **Footer and slide number** — on the master, so they appear on every content layout. Turn
  them on for a deck with Insert ▸ Header & Footer. Title, section and closing layouts
  deliberately carry only the slide number, or nothing.
- **The emblem** — on the master, top‑right. It is on every content layout automatically. The
  four full‑bleed or dark layouts hide the master shapes and carry their own reversed artwork.
- **Bullets** — teal at level 1, then petrol and slate dashes below, in a five‑level ladder.
  Every content and text placeholder carries the complete ladder, so a sub‑bullet is never
  larger than the bullet above it.
- **Tables** — a branded table style is the package default, so Insert ▸ Table produces a deep
  blue header row with mist banding without anyone choosing a style.
- **Charts** — accent 1–6 are the six brand colours in reading order, so an inserted chart is
  on‑brand with no recolouring. Use teal for the series that matters and the neutrals for the rest.

### Arabic slides

Set the text direction on the placeholder (Home ▸ Paragraph ▸ right‑to‑left, or Ctrl+Shift+E).
The complex‑script font and size come from the theme, so Arabic text picks up the same
hierarchy as the Latin. For a fully Arabic deck, mirror the layout by moving the emblem to the
top‑left on the master — one move, and every slide follows.

---

## 6. Design principles behind both files

- **Institutional, not decorative.** One weight of rule, flat fills, a single soft shadow in the
  theme's effect list. No gradients in the layouts, no bevels, no drop shadows on text.
- **Whitespace does the work.** Hierarchy comes from size, weight and space, not from boxes and
  colour blocks.
- **Teal points, navy states, neutrals carry.** Three roles, and no colour used for decoration.
- **Print‑safe and screen‑safe.** Nothing bleeds in Word, so the files print on any office
  device without special settings, and body text is at or above 11 pt. Every text/background
  pair the templates ship meets WCAG 2.1 AA — 4.5:1 for body text, 3:1 for large display text.
  `python3 src/check_contrast.py` re‑runs that audit over all 35 pairs; it exits non‑zero if a
  palette change breaks one.
- **Nothing is manually formatted.** Every visual decision lives in a style, a theme slot, a
  numbering definition or a master placeholder. That is what keeps a hundred documents from a
  hundred authors looking like one university.

---

## 7. Rebuilding from source

The templates are generated, not hand‑edited, so the design is reproducible and reviewable.

```
src/
  brand.py            palette, fonts, one source of truth for both templates
  theme_xml.py        the shared Office theme part
  oox.py              canonical child ordering for schema-sensitive OOXML
  build_logo.py       draws the emblem and lockups
  word_styles.py      every Word style definition
  word_numbering.py   bullets, numbered lists, automatic heading numbers
  build_word.py       assembles the .dotx
  ppt_shapes.py       slide geometry and shape helpers
  ppt_layouts.py      slide master text hierarchy and the twenty layouts
  build_ppt.py        assembles the .potx
  build_sample.py     the twenty-slide sample deck
  replace_logo.py     swap in the official artwork
  check_contrast.py   WCAG audit of every shipped colour pair
  build_all.py        rebuild everything
```

```bash
pip install python-pptx python-docx pillow cairosvg numpy
python3 src/build_all.py
```

To change a brand colour or a font, edit `src/brand.py` and rebuild — the theme, both templates
and every style follow from that one file.
