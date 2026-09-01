---
name: Elite Pitch
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c1c8c2'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8b938d'
  outline-variant: '#414844'
  surface-tint: '#a5d0b9'
  primary: '#a5d0b9'
  on-primary: '#0e3727'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#3f6653'
  secondary: '#b5ccc0'
  on-secondary: '#21342c'
  secondary-container: '#374b42'
  on-secondary-container: '#a4baaf'
  tertiary: '#e9c349'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cba72f'
  on-tertiary-container: '#4e3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#d1e8dc'
  secondary-fixed-dim: '#b5ccc0'
  on-secondary-fixed: '#0b1f18'
  on-secondary-fixed-variant: '#374b42'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  stat-value:
    fontFamily: Montserrat
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 22px
  headline-lg-mobile:
    fontFamily: Montserrat
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
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style
The design system is engineered to evoke the high-stakes atmosphere of elite professional football. The brand personality is authoritative, precise, and premium—balancing the tactical sobriety of scouting tools with the cinematic prestige of modern sports broadcasts. 

The aesthetic follows a **Modern/Corporate** foundation with **Glassmorphism** and **Tactile** accents. It utilizes deep, immersive greens to represent the pitch, contrasted with high-end metallic accents for rarity and achievement. Surfaces should feel heavy and structural, while interactive overlays should feel like light-refracting glass floating above the field of play.

## Colors
The palette is rooted in a "Night Match" aesthetic. The background uses **Deep Charcoal** to ensure high-contrast readability and a premium feel. 

- **Primary & Secondary:** These greens are reserved for structural branding and pitch-related elements (like field layouts or success states).
- **Metals:** Use Gold, Silver, and Bronze exclusively for tier-based logic (Rare, Epic, Common). Gold is also used sparingly as a "Legend" highlight for high-priority CTA states.
- **Surface Logic:** Use layered depths of Charcoal and Slate. Darker tones are "further back," while lighter Slate tones are "closer" to the user.

## Typography
The typography system uses **Montserrat** for all high-impact headers to provide a commanding, athletic presence. Its geometric construction mirrors the modern branding found in top-tier leagues. 

**Inter** is utilized for body text and data density. For player statistics and ratings, always use Montserrat Bold or ExtraBold. Label styles should frequently use uppercase with slight letter spacing to mimic the "player nameplate" look found on jerseys and broadcast graphics.

## Layout & Spacing
This design system employs an **8px grid system** (with a 4px half-step for micro-adjustments). 

- **Grid:** Use a 12-column fluid grid for desktop and a 4-column grid for mobile.
- **Pitch Layout:** The "Formation" view should be treated as a fixed-aspect container (typically 2:3 or 3:4) that scales proportionally to the screen width, ensuring player cards maintain their spatial relationships regardless of device size.
- **Padding:** Maintain generous internal padding in modals (24px) to preserve the "premium" feel; avoid overcrowding technical data.

## Elevation & Depth
Depth is created through a mix of **Tonal Layering** and **Glassmorphism**.

1.  **Level 0 (Pitch):** Deep Charcoal (#0F172A).
2.  **Level 1 (Cards/Panels):** Tonal green or dark slate with a 1px inner border (10% White) to define edges.
3.  **Level 2 (Modals/Overlays):** Backdrop blur (20px) with a semi-transparent background (rgba(15, 23, 42, 0.8)).
4.  **Shadows:** Use "Deep Field" shadows for floating elements: `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)`.
5.  **Metallic Sheen:** For Rare/Legendary items, apply a subtle linear gradient overlay (45-degree angle) to simulate light reflecting off a premium surface.

## Shapes
The shape language is **Rounded**, signifying a modern and approachable tool while maintaining professional structure. 

- **Standard Elements:** 0.5rem (8px) for buttons and inputs.
- **Player Cards:** 1rem (16px) for the outer container.
- **Formation Nodes:** Circular (pill-shaped) for player position markers.

## Components

### Player Cards (Vertical)
The centerpiece of the UI. Cards must feature a vertical hierarchy:
- **Header:** Rating (Large Montserrat) and Position.
- **Visual:** Player silhouette/photo with a subtle geometric pattern background (stripes or hexagons at 5% opacity).
- **Identity:** Flag icon and Player Name in Montserrat Bold.
- **Stats Grid:** A 2x3 grid of stats (PAC, SHO, PAS, DRI, DEF, PHY). Stat values are Montserrat ExtraBold; labels are Inter Small-caps.
- **Rarity Styles:** 
    - *Common:* Bronze border, matte finish.
    - *Rare:* Gold border, animated "shimmer" gradient, glowing rating.

### Buttons
- **Enabled:** Solid background with a subtle "stadium light" top-down gradient. High-priority buttons use a Gold border and white text.
- **Interactive:** Hover state should trigger a subtle outer glow (Primary Green or Gold).
- **Disabled:** 40% opacity, no glow, grayscale.

### Formations
A tactical "Pitch" view. The pitch should be a dark green gradient (#081C15 to #1B4332) with crisp, thin white lines (0.5px). Cards placed on the pitch scale down to "mini-card" versions focusing on Rating, Image, and Name only.

### Overlays & Modals
Floating glass containers. Use a 1px "Light Leak" border on the top and left edges to simulate physical depth. Content inside should be grouped with clear Slate dividers.