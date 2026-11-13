---
name: Quiet Paper
colors:
  surface: '#fbf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#fbf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f0'
  surface-container: '#efeeeb'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e4e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#454651'
  inverse-surface: '#30312f'
  inverse-on-surface: '#f2f0ed'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4559aa'
  primary: '#4356a7'
  on-primary: '#ffffff'
  primary-container: '#5c6fc2'
  on-primary-container: '#fffbff'
  inverse-primary: '#b8c4ff'
  secondary: '#38675a'
  on-secondary: '#ffffff'
  secondary-container: '#bbeddc'
  on-secondary-container: '#3e6d60'
  tertiary: '#745b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca730'
  on-tertiary-container: '#4f3d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001354'
  on-primary-fixed-variant: '#2c4090'
  secondary-fixed: '#bbeddc'
  secondary-fixed-dim: '#a0d1c1'
  on-secondary-fixed: '#002019'
  on-secondary-fixed-variant: '#1f4f43'
  tertiary-fixed: '#ffe08a'
  tertiary-fixed-dim: '#eac24a'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#fbf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2df'
typography:
  display:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  display-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system draws direct inspiration from tactile, understated stationery, Japanese bookbinding, and archival linen. It is tailored for focused writers, researchers, and knowledge workers who require an environment free from modern interface fatigue.

The visual direction is flat, calm, and architectural. It relies on subtle contrast, structural borders, and paper-like textures rather than saturated fills or aggressive visual indicators. The design evokes psychological safety, permanence, and clarity—treating every note, schema, and encrypted vault as an archival artifact.

## Colors

The core system is structured around warm paper tones, soft pastel tints, and deep pigmented ink tones. 

### Canvas & Standard Surfaces
- **Canvas Base**: `#FAF8F5` (Warm off-white background)
- **Surface Elevation**: `#FFFFFF` (Crisp pure white surface for cards, editor panels, sheets)
- **Dividers & Outlines**: `#E8E4DE` (1px warm muted gray border)

### Primary Accent (Muted Periwinkle)
- **Surface Fill (Rest)**: `#DDE3FA`
- **Surface Fill (Hover)**: `#CBD5F5`
- **Focus Rings, Interactive Links & Active Accents**: `#6F82D6`
- **Ink / Text / Icon on Accent**: `#2F3A6B`

### Text & Ink Hierarchy
- **Primary Ink**: `#2E2E38` (Soft charcoal, avoiding pure black)
- **Secondary Ink**: `#6B6B76` (Muted warm graphite)
- **Tertiary / Placeholder Ink**: `#9898A4`

### Encrypted Vault Theme
When entering an encrypted or locked vault state, the interface transitions to an archival sage-green atmosphere:
- **Vault Page Base**: `#F1F8F5`
- **Vault Surfaces**: `#E3F1EC`
- **Vault Accent / Outline Tint**: `#9CCDBD`
- **Vault Ink / Text / Glyph**: `#1F4A40`

### Semantic & Feedback Surfaces
Status indications use soft pastel fills paired with high-legibility dark ink:
- **Success**: Fill `#DDF0E3`, Text `#25593A`
- **Error**: Fill `#F8E1E1`, Text `#8A2F2F`
- **Warning & Key Recovery**: Fill `#FBEFD5`, Text `#6B4A10`

## Typography

The type system is strictly grounded in `Inter`, balancing readability with classic editorial rhythm. Monospace (`JetBrains Mono`) is reserved exclusively for syntax blocks, encryption keys, and raw export metadata.

### Typographic Rules
- **No Aggressive Tracking**: Avoid wide uppercase letter-spacing or decorative tech typography. All casing remains sentence or title case.
- **Reading Comfort**: Body copy is set at 15px with a relaxed `1.6` line-height ratio (`24px`) to preserve natural scanning flow.
- **Strict Size Floor**: Never render functional UI text below 12px.
- **Hierarchy through Contrast**: Distinguish structural levels via tone (`#2E2E38` to `#6B6B76`) and modest weight shifts (`400` vs `500`/`600`), avoiding dramatic size leaps.

## Layout & Spacing

Layouts follow a clean, structured workspace approach based on an 8px grid foundation. Content is framed with clear spatial balance to mimic open book spreads.

### Breakpoints & Layout Adaptations
- **Desktop (1024px and above)**: Multi-pane split architecture with a fixed sidebar (240px–280px), middle list pane (320px–380px), and fluid document canvas (max-width constrained at 768px for body reading).
- **Tablet (768px to 1023px)**: Collapsible sidebar navigation, dual-pane list and editor views with `1.25rem` gutters.
- **Mobile (Below 768px)**: Single active pane view with stacked navigation, pinned header tools, full-width cards, and standard `1rem` outer canvas padding.

## Elevation & Depth

This system is strictly flat and non-skeuomorphic. Depth is created through surface contrast and structural borders rather than blur or drop shadows.

- **Standard Elevation**: All cards, sidebars, toolbars, and panels sit flat with 0px box shadows, delineated solely by `#E8E4DE` 1px solid borders.
- **Card Interactive Hover**: A restrained whisper shadow `0 1px 2px rgba(0, 0, 0, 0.05)` accompanied by a border shift to `#D9D4CC`.
- **Modals & Flyouts**: Elevated dialogs use a soft planar shadow `0 8px 24px rgba(0, 0, 0, 0.08)` resting above a flat dimming scrim of `rgba(46, 46, 56, 0.28)`.
- **Prohibitions**: No multi-stop gradients, outer glows, saturated drop shadows, or heavy frosted blurs.

## Shapes

The geometric framework favors subtle, tailored corners that reflect cut paper. Roundedness must remain controlled and purposeful.

### Radii Allocations
- **Cards, Panels & Modal Containers**: Strictly `8px` (`rounded-lg`).
- **Interactive Controls (Buttons, Inputs, Search Bars, Menus)**: Strictly `6px`.
- **Micro Elements (Tags, Badges, Inline Code)**: Strictly `4px`.
- **Identity & Avatars**: True circular (`rounded-full`), rendered with user initials resting on muted pastel fill tints.
- **Strictly Avoided**: Full pill buttons (`rounded-full`), bubbly tabs, or 0px brutalist sharp edges.

## Components

### Buttons
- **Primary**: Background `#DDE3FA`, text `#2F3A6B`, border `1px solid transparent`, radius `6px`, padding `8px 16px`. Hover state shifts background to `#CBD5F5`. Focus displays a clean `2px solid #6F82D6` ring with `2px` offset.
- **Secondary / Plain**: Background `#FFFFFF`, text `#2E2E38`, border `1px solid #E8E4DE`, radius `6px`. Hover shifts background to `#FAF8F5` and border to `#D9D4CC`.
- **Destructive**: Background `#F8E1E1`, text `#8A2F2F`, border `1px solid transparent`, radius `6px`.

### Inputs & Search Fields
- Height `36px` to `40px` with `6px` radius.
- Background `#FFFFFF`, border `1px solid #E8E4DE`, text `#2E2E38`, placeholder `#9898A4`.
- Focus state maintains `#FFFFFF` surface with an explicit `1px solid #6F82D6` border and a soft outer focus indicator `0 0 0 2px rgba(111, 130, 214, 0.25)`.

### Cards & Note Items
- Surface `#FFFFFF`, border `1px solid #E8E4DE`, radius `8px`, padding `16px`.
- Rest state has no shadow. On hover, apply `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05)`.
- Selected/Active note card in list: Left border `3px solid #6F82D6`, background `#FDFDFD`.

### Chips & Tags
- Height `22px` to `24px` with `4px` corner radius.
- Standard Tags: Background `#FAF8F5`, border `1px solid #E8E4DE`, text `#6B6B76`, font size `12px`.
- Vault Tags: Background `#E3F1EC`, border `1px solid #9CCDBD`, text `#1F4A40`.

### Checkboxes & Radio Buttons
- Checkbox: `16px x 16px` with `4px` radius and `1px solid #E8E4DE`. When checked, background `#DDE3FA`, border `#6F82D6`, with a deep navy `#2F3A6B` check icon.
- Radio: Circular `16px x 16px` with inner solid dot.

### Encrypted Vault Specific Controls
- Unlock Banner / Lock Container: Surface `#E3F1EC`, outline `1px solid #9CCDBD`, text `#1F4A40`.
- Vault Action Trigger: Fill `#9CCDBD`, text `#1F4A40`, hover `#8CBEAE`.

### Modals & Dialogs
- Surface `#FFFFFF`, border `1px solid #E8E4DE`, radius `8px`, padding `24px`.
- Shadow `0 8px 24px rgba(0, 0, 0, 0.08)`. Overlay backdrop set to `rgba(46, 46, 56, 0.28)`.