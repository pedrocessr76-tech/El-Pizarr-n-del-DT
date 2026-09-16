---
name: Pitch Master Pro
colors:
  surface: '#0d1515'
  surface-dim: '#0d1515'
  surface-bright: '#333b3b'
  surface-container-lowest: '#080f10'
  surface-container-low: '#151d1d'
  surface-container: '#192121'
  surface-container-high: '#242b2c'
  surface-container-highest: '#2e3636'
  on-surface: '#dce4e4'
  on-surface-variant: '#bccbb8'
  inverse-surface: '#dce4e4'
  inverse-on-surface: '#2a3232'
  outline: '#869584'
  outline-variant: '#3d4a3c'
  surface-tint: '#48e26f'
  primary: '#53eb77'
  on-primary: '#003913'
  primary-container: '#2dce5e'
  on-primary-container: '#00521e'
  inverse-primary: '#006e2b'
  secondary: '#e6c43b'
  on-secondary: '#3b2f00'
  secondary-container: '#b49600'
  on-secondary-container: '#3b3000'
  tertiary: '#b4d8c1'
  on-tertiary: '#163627'
  tertiary-container: '#99bca6'
  on-tertiary-container: '#2c4c3b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#69ff88'
  primary-fixed-dim: '#48e26f'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#00531e'
  secondary-fixed: '#ffe173'
  secondary-fixed-dim: '#e6c43b'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#554500'
  tertiary-fixed: '#c7ebd4'
  tertiary-fixed-dim: '#abcfb8'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#2d4d3c'
  background: '#0d1515'
  on-background: '#dce4e4'
  surface-variant: '#2e3636'
typography:
  display-lg:
    fontFamily: archivoNarrow
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: archivoNarrow
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: archivoNarrow
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  card-width: 160px
  card-height: 220px
---

## Brand & Style

The design system is engineered for a high-fidelity sports management experience, channeling the intensity and prestige of elite football. It targets tactical enthusiasts and competitive gamers who demand both depth and visual polish.

The aesthetic is a fusion of **Glassmorphism** and **High-Contrast Bold**, inspired by modern sports broadcasting and trading card interfaces. It utilizes depth through layered translucency, vibrant background blurs, and sharp geometric patterns (chevrons and rhombuses) to create a sense of kinetic energy. The interface should feel like a premium command center—authoritative, sleek, and immersive.

## Colors

The palette is rooted in the pitch: a deep forest green provides the foundation, while "Bright Grass Green" acts as the primary action driver. 

### Tiered Surfaces
The design system employs a unique hierarchical surface logic based on footballing achievement:
- **Bronze:** For entry-level players and standard utilities.
- **Silver:** For mid-tier performance and secondary features.
- **Gold:** Reserved for "Elite" status, high-value assets, and primary highlights.

### Interaction States
- **Primary:** Bright Grass Green (#2dce5e) for high-intent actions.
- **Surface Adaptive:** In Dark Mode, cards and panels use semi-transparent gradients of the Tier colors. In Light Mode, these transition to soft, desaturated versions to maintain readability against the light greenish-white background.

## Typography

The typographic strategy balances raw power with data-heavy utility. 

**Archivo Narrow** is used for headlines and titles to evoke the condensed, urgent feel of sports headlines and jersey numbering. It must always be set in uppercase for high-level UI elements to maintain a "broadcast" aesthetic.

**Inter** handles the heavy lifting of management: player stats, descriptions, and settings. Its neutrality ensures legibility during complex tactical maneuvers.

**JetBrains Mono** is utilized for technical data points, such as player attributes (PAC, SHO, PAS) and tactical coordinates, reinforcing the "technical director" persona of the user.

## Layout & Spacing

The design system utilizes a **Fluid Grid** with fixed-aspect-ratio containers for tactical elements. 

### Grid Logic
- **Desktop:** 12-column grid with 24px gutters.
- **Mobile:** 4-column grid with 16px gutters.
- **Tactical Pitch:** A specific "Safe Zone" container that maintains a 2:3 aspect ratio regardless of screen size to ensure formation geometry (4-3-3, etc.) remains consistent.

### Spacing Rhythm
A 4px baseline shift is used. Components are padded in multiples of 8px (e.g., 16px, 24px) to maintain a tight, professional density suitable for data-heavy management dashboards.

## Elevation & Depth

Depth is used to simulate the physical presence of collectible cards and tactical boards.

- **Level 0 (Pitch):** The base background with a subtle grass texture or noise.
- **Level 1 (Panels):** Tonal layers with 1px soft-grey borders at 10% opacity.
- **Level 2 (Active Cards):** Glassmorphism effect. Uses a `backdrop-filter: blur(12px)` with a top-down linear gradient (White at 15% to Transparent).
- **Level 3 (Modals):** High-diffusion ambient shadows. Shadows are tinted with the background green (#1a3a2a) at 40% opacity to prevent "dirty" black shadows and maintain color harmony.

## Shapes

The shape language is "Athletic Geometric." 

- **Cards:** Strictly 8px (`rounded-lg`) to mirror physical sports cards.
- **Buttons:** 4px (`rounded-sm`) for a sharper, more aggressive "pro" feel.
- **Tournament Brackets:** 0px (Sharp) or 2px radius for lines and connectors to emphasize precision and structure.
- **Patterns:** 45-degree rhombuses and chevrons are used as background masks within player cards to create a sense of movement.

## Components

### Player Cards (FIFA Style)
- **Dimensions:** 160x220px.
- **Styling:** Dynamic gradients based on tier (Gold/Silver/Bronze). Top-right features the player rating and position. The bottom half contains a high-contrast attribute grid.
- **Hover:** Subtle 1.05x scale transform with an increased outer glow in the tier's primary color.

### Tactical Formation Board
- **Pitch:** Deep green field with faint white markings.
- **Nodes:** Interactive slots where cards can be dropped. Nodes use a dashed "ghost border" when empty.
- **Lines:** Dynamic connecting lines between positions to show tactical chemistry, colored based on strength (Green for strong, Red for weak).

### Buttons
- **CTA:** Solid #2dce5e with Archivo Narrow Bold white text. Subtle inner-glow on top edge.
- **Secondary:** Transparent background with a 2px #b0b8b8 border.
- **Tertiary:** Text-only with an underline on hover.

### Tournament Brackets
- **Connectors:** 2px solid lines. Active paths should glow in #2dce5e.
- **Match Nodes:** Small horizontal cards showing team crests and scores.

### Input Fields
- **Dark Mode:** Dark forest green fill, 1px soft-grey border, 4px corner radius. Focus state shifts border to Gold (#f7d44a).