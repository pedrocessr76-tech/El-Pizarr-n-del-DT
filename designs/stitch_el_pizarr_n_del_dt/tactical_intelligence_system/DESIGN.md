---
name: Tactical Intelligence System
colors:
  surface: '#111316'
  surface-dim: '#111316'
  surface-bright: '#37393d'
  surface-container-lowest: '#0c0e11'
  surface-container-low: '#1a1c1f'
  surface-container: '#1e2023'
  surface-container-high: '#282a2d'
  surface-container-highest: '#333538'
  on-surface: '#e2e2e6'
  on-surface-variant: '#baccb0'
  inverse-surface: '#e2e2e6'
  inverse-on-surface: '#2f3034'
  outline: '#85967c'
  outline-variant: '#3c4b35'
  surface-tint: '#2ae500'
  primary: '#efffe3'
  on-primary: '#053900'
  primary-container: '#39ff14'
  on-primary-container: '#107100'
  inverse-primary: '#106e00'
  secondary: '#bdf4ff'
  on-secondary: '#00363d'
  secondary-container: '#00e3fd'
  on-secondary-container: '#00616d'
  tertiary: '#fff9f0'
  on-tertiary: '#3a3000'
  tertiary-container: '#ffdb40'
  on-tertiary-container: '#736000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79ff5b'
  primary-fixed-dim: '#2ae500'
  on-primary-fixed: '#022100'
  on-primary-fixed-variant: '#095300'
  secondary-fixed: '#9cf0ff'
  secondary-fixed-dim: '#00daf3'
  on-secondary-fixed: '#001f24'
  on-secondary-fixed-variant: '#004f58'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#111316'
  on-background: '#e2e2e6'
  surface-variant: '#333538'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for elite sports management, prioritizing high-performance data visualization and tactical clarity. It evokes the atmosphere of a high-tech "war room" or modern coaching staff suite—focused, urgent, and authoritative.

The visual style is a fusion of **Modern Glassmorphism** and **High-Contrast Data Display**. It utilizes a deep, dark canvas to allow vibrant functional accents to guide the user's eye toward critical performance metrics and action items. Every element is designed to feel like a precise instrument, using semi-transparent layers to maintain a sense of depth and hierarchy without cluttering the interface.

## Colors

The palette is anchored in deep, dark neutrals to reduce eye strain during long analytical sessions.

*   **Primary (Neon Grass Green):** Reserved for core actions, success states, and positive performance trends. It represents the pitch and vital energy.
*   **Secondary (Electric Cyan):** Used for technical data points, secondary navigation, and informative charts.
*   **Tertiary (Gold):** Exclusively for achievements, trophies, and premium player rankings.
*   **Neutrals:** The background utilizes "Midnight Blue" (#121417) for the lowest layer, with "Graphite Gray" (#1A1D21) defining surface containers and cards.

## Typography

This design system utilizes **Inter** for its clinical precision and excellent readability at small sizes—crucial for data-heavy dashboards. 

The typographic hierarchy is aggressive. Large headlines use tight letter-spacing and heavy weights to command attention, while labels utilize uppercase styling and increased tracking to differentiate "Metadata" from "Content." Functional data (numbers, player stats) should always be rendered with tabular figures to ensure alignment in lists and tables.

## Layout & Spacing

The design system employs a **12-column fixed grid** for desktop dashboards, transitioning to a fluid single-column layout for mobile. 

The spacing rhythm is based on an **8px linear scale**, ensuring consistent alignment across disparate data widgets.
- **Margins:** 32px on desktop to provide breathing room against the screen edge.
- **Gutters:** 24px fixed gutters between dashboard cards to maintain the "modular" feel.
- **Padding:** Internal card padding is set to 24px to prevent data density from feeling overwhelming.

## Elevation & Depth

Depth is created through **Glassmorphism** and tonal layering rather than traditional drop shadows.

1.  **Level 0 (Background):** #121417. The foundation layer.
2.  **Level 1 (Cards/Widgets):** #1A1D21 with a 1px solid border at 10% white opacity. This provides a subtle "etched" look.
3.  **Level 2 (Overlays/Modals):** A semi-transparent blur (Backdrop Filter: blur(12px)) with a slightly lighter surface tint.
4.  **Interactive States:** Primary buttons and active states should have a subtle outer glow using the Primary Green color (blur: 15px, spread: -5px) to simulate a light-emitting diode (LED) effect.

## Shapes

The shape language is professional and modern. All primary containers, including dashboard cards, input fields, and buttons, use a **12px (0.75rem)** corner radius. 

Smaller elements like tags or "chips" may use more aggressive rounding (pill-shaped) to distinguish them from structural UI elements. Icons must be thin-stroke (1.5px) technical line icons with slightly rounded terminals to match the UI radius.

## Components

### Buttons
- **Primary:** Solid #39FF14 background with #121417 text. Bold weight.
- **Secondary:** Transparent background with 1px #00E5FF border and cyan text.
- **Ghost:** No background, white text at 70% opacity, becoming 100% on hover.

### Cards & Widgets
Every card must feature the 1px white (10% opacity) border. Header sections within cards should be separated by a subtle horizontal rule or a distinct graphite background tint.

### Data Tables
Rows should have a subtle hover state (#ffffff05). Use "Neon Green" for positive percentages and "Electric Cyan" for neutral or secondary metrics. Avoid zebra-striping; use thin 1px dividers instead.

### Inputs
Fields use the #1A1D21 background. On focus, the border transitions from 10% white to 100% Electric Cyan with a subtle glow.

### Achievement Chips
Small, Gold-tinted (#FFD700) components used for "Player of the Match" or "League Champion" markers, using a semi-transparent gold fill and solid gold text.