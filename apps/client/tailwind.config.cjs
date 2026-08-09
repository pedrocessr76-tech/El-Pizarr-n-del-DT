/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
    theme: {
    extend: {
      "colors": {
              "on-secondary-container": "#a4baaf",
              "secondary-fixed": "#d1e8dc",
              "error-container": "#93000a",
              "surface-container-high": "#222a3d",
              "surface-container-low": "#131b2e",
              "on-secondary-fixed-variant": "#374b42",
              "on-primary-fixed": "#002114",
              "inverse-surface": "#dae2fd",
              "primary-fixed-dim": "#a5d0b9",
              "on-error-container": "#ffdad6",
              "on-surface": "#dae2fd",
              "surface": "#0b1326",
              "surface-container": "#171f33",
              "secondary-fixed-dim": "#b5ccc0",
              "surface-dim": "#0b1326",
              "surface-container-lowest": "#060e20",
              "on-primary": "#0e3727",
              "on-tertiary-fixed-variant": "#574500",
              "tertiary-fixed-dim": "#e9c349",
              "primary-fixed": "#c1ecd4",
              "outline": "#8b938d",
              "on-primary-fixed-variant": "#274e3d",
              "surface-variant": "#2d3449",
              "on-primary-container": "#86af99",
              "tertiary": "#e9c349",
              "surface-tint": "#a5d0b9",
              "background": "#0b1326",
              "on-tertiary-fixed": "#241a00",
              "outline-variant": "#414844",
              "tertiary-fixed": "#ffe088",
              "inverse-on-surface": "#283044",
              "primary": "#a5d0b9",
              "on-surface-variant": "#c1c8c2",
              "inverse-primary": "#3f6653",
              "on-tertiary-container": "#4e3d00",
              "secondary-container": "#374b42",
              "tertiary-container": "#cba72f",
              "on-error": "#690005",
              "surface-bright": "#31394d",
              "error": "#ffb4ab",
              "on-secondary-fixed": "#0b1f18",
              "on-secondary": "#21342c",
              "secondary": "#b5ccc0",
              "on-tertiary": "#3c2f00",
              "surface-container-highest": "#2d3449",
              "on-background": "#dae2fd",
              "primary-container": "#1b4332"
      },
      "spacing": {
              "xl": "32px",
              "base": "4px",
              "gutter": "16px",
              "sm": "8px",
              "margin": "24px",
              "xs": "4px",
              "lg": "24px",
              "md": "16px"
      },
      "fontFamily": {
              "stat-value": [
                      "Montserrat"
              ],
              "body-lg": [
                      "Inter"
              ],
              "headline-lg-mobile": [
                      "Montserrat"
              ],
              "label-md": [
                      "Inter"
              ],
              "headline-md": [
                      "Montserrat"
              ],
              "body-md": [
                      "Inter"
              ],
              "headline-sm": [
                      "Montserrat"
              ],
              "display-lg": [
                      "Montserrat"
              ],
              "headline-lg": [
                      "Montserrat"
              ]
      },
      "fontSize": {
              "stat-value": [
                      "22px",
                      {
                              "lineHeight": "22px",
                              "fontWeight": "800"
                      }
              ],
              "body-lg": [
                      "18px",
                      {
                              "lineHeight": "28px",
                              "fontWeight": "400"
                      }
              ],
              "headline-lg-mobile": [
                      "28px",
                      {
                              "lineHeight": "36px",
                              "fontWeight": "700"
                      }
              ],
              "label-md": [
                      "14px",
                      {
                              "lineHeight": "20px",
                              "letterSpacing": "0.05em",
                              "fontWeight": "600"
                      }
              ],
              "headline-md": [
                      "24px",
                      {
                              "lineHeight": "32px",
                              "fontWeight": "700"
                      }
              ],
              "body-md": [
                      "16px",
                      {
                              "lineHeight": "24px",
                              "fontWeight": "400"
                      }
              ],
              "headline-sm": [
                      "20px",
                      {
                              "lineHeight": "28px",
                              "fontWeight": "600"
                      }
              ],
              "display-lg": [
                      "48px",
                      {
                              "lineHeight": "56px",
                              "letterSpacing": "-0.02em",
                              "fontWeight": "800"
                      }
              ],
              "headline-lg": [
                      "32px",
                      {
                              "lineHeight": "40px",
                              "letterSpacing": "-0.01em",
                              "fontWeight": "700"
                      }
              ]
      }
    },
  },

  plugins: [],
};
