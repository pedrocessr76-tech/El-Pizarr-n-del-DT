---
name: Pitch Operations System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f493f'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6f7a6e'
  outline-variant: '#becabc'
  surface-tint: '#006d30'
  primary: '#00652c'
  on-primary: '#ffffff'
  primary-container: '#15803d'
  on-primary-container: '#d3ffd5'
  inverse-primary: '#79db8d'
  secondary: '#51606d'
  on-secondary: '#ffffff'
  secondary-container: '#d5e4f4'
  on-secondary-container: '#576673'
  tertiary: '#854600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a95b00'
  on-tertiary-container: '#fff1e9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#95f8a7'
  primary-fixed-dim: '#79db8d'
  on-primary-fixed: '#00210a'
  on-primary-fixed-variant: '#005323'
  secondary-fixed: '#d5e4f4'
  secondary-fixed-dim: '#b9c8d7'
  on-secondary-fixed: '#0e1d28'
  on-secondary-fixed-variant: '#3a4855'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-metric:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  data-tabular:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  gutter-compact: 0.5rem
  margin-mobile: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-performance, utilitarian, and dependable B2B operating environment engineered specifically for sports facility managers, venue operators, and administrative staff managing football complexes in Argentina. 

The aesthetic marries corporate precision with subtle athletic vigor:
- **Tone & Mood:** Authoritative, robust, agile, and lucid. It eliminates visual noise, decorative fluff, and frivolous gradients in favor of structural clarity, instant legibility, and swift data entry under high-pressure front-desk environments.
- **Visual Stance:** Utilitarian Corporate Modern. High-density grids, crisp 1px structural dividers, and deliberate micro-accents. Surfaces remain neutral, allowing real-time schedule statuses, occupancy rates, and Argentine Peso (ARS) cash flows to command immediate visual hierarchy.
- **Operational Reality:** Optimized for dual-use situations: fast, high-contrast legibility in bright facility check-in counters as well as dense desktop monitoring during peak nocturnal booking hours.

## Colors

The palette is engineered to balance technical neutral backdrops with sport-anchored functional signifiers:

- **Primary Action (Field Green):** `#15803d` serves as the primary operational touchpoint (confirmations, primary actions, available slots, active match timers). Use `#16a34a` for interactive hover states and `#0f5132` for pressed or high-emphasis active badges.
- **Structural Chrome & Navigation (Deep Petroleum & Graphite):** `#0f1e29` anchors topbars, persistent side navigation panels, and complex switcher menus, grounding the product in an enterprise-grade architectural frame. Secondary structural fills rely on `#162a38` and `#1e293b`.
- **Canvas & Surfaces:** Primary application background is `#f8fafc` (slate-50) paired with `#ffffff` for elevated analytical cards, tables, and modal dialogues. Tier-2 inner surfaces (such as inactive time-grid cells) use `#f1f5f9`.
- **Data & Text Contrast:** Primary text is pinned to `#0f172a` (meeting WCAG AAA against pure white surfaces), secondary labels utilize `#334155`, and disabled/muted helper text uses `#64748b`.
- **Status & Operational Alerts:**
  - *Pending / Deposit Required / In Review:* Amber `#d97706` background tint `#fef3c7`.
  - *Cancelled / Rain-Out / Maintenance Lock:* Crimson `#dc2626` background tint `#fee2e2`.
  - *Tournament / League Fixture / Info:* Blue `#2563eb` background tint `#eff6ff`.
- **Dividers & Grid Borders:** Discrete 1px border lines strictly set to `#e2e8f0`.

## Typography

Inter is employed systematically across all roles to ensure maximum readability within data-dense reservation grids, fiscal metrics, and compact tables. 

- **Tabular Figures:** All financial expressions (`$ 18.500,00 ARS`), match timestamps (`20:00 - 21:30`), and court slot counters must enforce open-type tabular numbers (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during data refreshes.
- **Labels & Micro-data:** `label-sm` utilizes an uppercase transformation with positive letter-spacing (`0.04em`) specifically for table headers, pitch category tags (e.g., "FÚTBOL 5", "FÚTBOL 7", "FÚTBOL 11 TECHADA"), and status pills.
- **Hierarchy Restraint:** Display sizes are capped at 28px. Dashboard headers prioritize tight line-heights to preserve vertical real estate for time-grid sheets and booking ledgers.

## Layout & Spacing

The system implements a compact 12-column responsive layout optimized for high density without visual suffocation:

- **Grid & Shell Structure:**
  - **Desktop (1280px+):** Collapsible 240px dark navigation sidebar (`#0f1e29`), fixed application header (52px height), and a fluid canvas using 16px (`1rem`) gutters and 20px (`1.25rem`) perimeter padding.
  - **Tablet (768px - 1279px):** Sidebar collapses to an 64px icon rail. Timeline schedule transitions into horizontally scrollable court swimlanes with pinned time axes.
  - **Mobile (< 768px):** Single-column stack with an 8px gutter, bottom fixed navigation for fast cash register ("Caja") and reservation access, and floating action buttons for instant slot reservations.
- **Spacing Rhythm:** Standard spacing derives from an explicit 4px base multiplier. High-density interfaces (schedule blocks, roster sheets, point-of-sale receipt lists) strictly utilize `space-xs` (4px) and `space-sm` (8px) for element gaps to ensure the maximum number of courts and hours remain visible above the fold.

## Elevation & Depth

Depth is established primarily through structural borders and flat tonal hierarchy, avoiding noisy or heavy shadows:

- **Tonal Layering:** The primary application canvas resides on `#f8fafc`. Interactive panels, slot matrices, and analytical cards sit on `#ffffff`. Modals and slide-over drawers elevate using crisp contrast outlines.
- **Borders over Shadows:** Depth is primarily articulated by 1px solid `#e2e8f0` structural borders. Cards do not employ prominent dropshadows; they rely on border definition and micro-hover color shifts (`#cbd5e1`).
- **Controlled Elevation Shadows:**
  - *Level 0 (Flat/Containers):* No shadow, 1px border `#e2e8f0`.
  - *Level 1 (Dropdowns, Popovers, Date Pickers):* `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`, border 1px `#cbd5e1`.
  - *Level 2 (Modals, Slide-Over Booking Drawers):* `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06)`. Backdrops use `#0f172a` with 50% opacity.
- **Interactive Pitch Grid States:** Active or selected booking slots use an inner outline glow (`box-shadow: inset 0 0 0 2px #15803d`) rather than external blurring to preserve razor-sharp grid borders.

## Shapes

The design system enforces a strict, disciplined geometric cadence with a low roundedness scale (`roundedness: 1`):

- **Default Border Radius (4px / 0.25rem):** Applied to form inputs, segmented control tabs, data grid cells, small utility badges, and dropdown menus.
- **Large Radius (8px / 0.5rem - Maximum System Cap):** Applied to analytical KPI summary cards, schedule frame containers, dialogue sheets, and central modals. No UI element may exceed 8px of corner rounding, preventing an excessively playful consumer feel and preserving enterprise discipline.
- **Pill Exceptions:** Rounded-full is permitted solely for numeric badge indicators (e.g., unread alert counts, active player tags) and avatar placeholders.

## Components

### Buttons
- **Primary:** Solid `#15803d`, text `#ffffff`, height 36px (compact) or 40px (regular). Hover `#16a34a`, active `#0f5132`. Border: none. Radius: 4px. Font: `label-md` weight 600.
- **Secondary / Outline:** Background `#ffffff`, border 1px `#e2e8f0`, text `#0f172a`. Hover background `#f8fafc`, border `#cbd5e1`.
- **Destructive:** Background `#dc2626`, text `#ffffff`. Hover `#ef4444`.
- **Petroleum (Operational Utility):** Background `#0f1e29`, text `#ffffff`, hover `#1e293b` (used for shift handover, batch printing, and complex settings).

### Input Fields & Controls
- **Text & Numeric Inputs:** Height 36px. Border 1px `#cbd5e1`, background `#ffffff`, radius 4px. Focus state uses border `#15803d` with an unblurred 1px ring (`box-shadow: 0 0 0 1px #15803d`). 
- **Monetary Prefix Add-ons:** Pinned left adornment showing `ARS $` rendered in `#64748b` background `#f1f5f9` with a dividing right border.
- **Checkboxes & Radios:** Sharp square/round controls sized at 16px with 1px border `#94a3b8`. Checked state fills `#15803d` with pure white vector checkmarks.

### Cards & Analytical Widgets
- Pure `#ffffff` surface, 1px border `#e2e8f0`, border-radius 8px. Header areas separated by a 1px border `#f1f5f9` divider. Padding fixed at `space-md` (12px) for compact telemetry or `space-lg` (20px) for high-level summaries.

### Status Chips & Badges
- Height 22px, padding horizontal 8px, font `label-sm` uppercase.
  - *Confirmed / Paid:* `#dcfce7` background, `#15803d` text, border 1px `#bbf7d0`.
  - *Pending Payment (Seña Pendiente):* `#fef3c7` background, `#b45309` text, border 1px `#fde68a`.
  - *Blocked / Maintenance:* `#fee2e2` background, `#b91c1c` text, border 1px `#fecaca`.
  - *Fixed Shift (Turno Fijo):* `#f1f5f9` background, `#334155` text, border 1px `#cbd5e1`.

### Specialized Domain Components
- **Booking Timeline Slot (Cancha Time Cell):** Highly dense matrix cells (height: 48px to 60px). Unoccupied slots display light dashed dividers on hover with a quick "+ Reservar" hint. Occupied slots display customer name, team name, and paid-fraction indicator bar (e.g., green bar for 100% paid, amber for partial deposit).
- **Cashier Quick-Bar (Caja Diaria):** Persistent bottom or top-right summary showing real-time balance: Cash (Efectivo), Digital transfers (Mercado Pago / Alias), and outstanding debts.