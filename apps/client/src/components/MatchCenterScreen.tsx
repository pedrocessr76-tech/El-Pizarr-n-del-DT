export function MatchCenterScreen() {
  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden bg-background min-h-screen">
      {/* Ambient background elements */}
      <div className="absolute top-0 right-0 w-3/4 h-[800px] bg-gradient-to-bl from-primary-container/10 via-transparent to-transparent pointer-events-none blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-1/2 h-[600px] bg-gradient-to-tr from-secondary-container/5 via-transparent to-transparent pointer-events-none blur-[100px]" />

      <div className="px-margin max-w-[1600px] mx-auto w-full pt-lg pb-xl space-y-md z-10 relative">
        {/* Header / Scoreboard */}
        <section className="bg-surface-container rounded-xl shadow-xl overflow-hidden relative group border border-white/5">
          {/* Subtle internal glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          {/* Top Bar: Competition & Time */}
          <div className="bg-surface-container-high py-sm px-md flex items-center justify-between text-on-surface-variant font-label-md text-label-md uppercase tracking-widest border-b border-white/5">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">trophy</span>
              <span>Liga de Campeones - Cuartos de Final</span>
            </div>
            <div className="flex items-center gap-sm text-primary-container animate-pulse font-bold">
              <span className="w-2 h-2 rounded-full bg-primary-container" />
              <span>76:42</span>
            </div>
          </div>

          {/* Main Score Area */}
          <div className="py-xl px-lg flex items-center justify-center gap-xl relative">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Home Team */}
            <div className="flex flex-col items-center gap-md relative z-10 flex-1">
              <div
                className="w-32 h-32 rounded-full bg-surface-container-high shadow-lg flex items-center justify-center p-sm border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCBdNjaulF8QNVhXR9Q62KDqOx6hRXZYs2mAspoeYt53nie4WxqokSrseBkOQH06fnfUW-pLtDz56TZhlXHJI3SFQaU8VLXF2TGg-RV0fjU5wNHMu_ARqSVNjOoZt3HhHxy9eVNDhTDMmPeF66YXmvyehoR5WCH9_482WpagCM38TpVl-7BwxUHxZIIlHjpl3M8_WlwBzct-vGahxuqU7ChNLdGa7VuH9PsD_nZNfjuL5S7SldMwmILfC5BMx_3hNmLmZOwNFbOsSw')",
                }}
              >
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold drop-shadow">GFC</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                Galácticos FC
              </h2>
              <div className="flex gap-xs">
                <span className="px-xs py-[2px] bg-primary/10 text-primary rounded font-label-sm text-label-sm font-semibold">
                  4-3-3
                </span>
                <span className="px-xs py-[2px] bg-secondary-container/10 text-secondary-container rounded font-label-sm text-label-sm font-semibold">
                  Ofensiva
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-sm relative z-10">
              <div className="flex items-center gap-md font-headline-xl text-headline-xl text-on-surface tabular-nums">
                <span className="text-[80px] leading-none text-primary-container font-extrabold drop-shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                  2
                </span>
                <span className="text-on-surface-variant opacity-50 text-4xl">-</span>
                <span className="text-[80px] leading-none text-on-surface font-extrabold">1</span>
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant bg-surface px-md py-xs rounded-full border border-white/5">
                2º Tiempo
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-md relative z-10 flex-1">
              <div
                className="w-32 h-32 rounded-full bg-surface-container-high shadow-lg flex items-center justify-center p-sm border border-white/10 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA8wZCquUzB2Eogt2PiDwc1z0iXnFP1nEMEUPpJjQUHEvVvXhDhTtuUGoycbQq3GyeLVmZSRStLZjVxhnsX7w4vIZMMOFVNK6gK6MQO1DHP2zJ_kljSiJ1_4T4vNFmU1Ri8_CdOYqncAQ0flut746loTayoQj0FAacniq0xPZkQgyB7Og0k5V2Akb1KamoGHCloc1vBTzcOitJa23Ovsn7Nm7QMeoAlX_P2x7jXNqbtdM59BDdI3hKGjEC-G5relvv487zbDcHxu6M')",
                }}
              >
                <span className="font-headline-xl text-headline-xl text-on-surface font-extrabold drop-shadow">TFC</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                Titanes FC
              </h2>
              <div className="flex gap-xs">
                <span className="px-xs py-[2px] bg-surface-container-highest text-on-surface-variant rounded font-label-sm text-label-sm font-semibold">
                  5-3-2
                </span>
                <span className="px-xs py-[2px] bg-surface-container-highest text-on-surface-variant rounded font-label-sm text-label-sm font-semibold">
                  Defensiva
                </span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-surface-container-highest py-sm px-md flex items-center justify-center gap-md border-t border-white/5">
            <button className="bg-primary-container text-background font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-primary transition-colors flex items-center gap-sm shadow-[0_0_20px_-5px_#39ff14] font-bold">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
              Siguiente Acción
            </button>
            <button className="bg-transparent text-secondary-container font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-secondary-container/10 transition-colors border border-secondary-container flex items-center gap-sm font-bold">
              <span className="material-symbols-outlined text-[20px]">fast_forward</span>
              Simular Final
            </button>
          </div>
        </section>

        {/* Main Grid: Stats, Lineups, Commentary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-gutter">
            {/* Live Stats Overview */}
            <section className="bg-surface-container rounded-xl shadow-lg p-md border border-white/5">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-md flex items-center gap-sm font-bold">
                <span className="material-symbols-outlined text-secondary-container">bar_chart</span>
                Estadísticas en Vivo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Posesión</span>
                  </div>
                  <div className="flex items-center gap-sm font-headline-md text-headline-md font-bold">
                    <span className="text-primary-container w-16 text-right">58%</span>
                    <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary-container w-[58%]" />
                      <div className="h-full bg-surface-variant w-[42%]" />
                    </div>
                    <span className="text-on-surface w-16">42%</span>
                  </div>
                </div>

                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Tiros a Puerta</span>
                  </div>
                  <div className="flex items-center gap-sm font-headline-md text-headline-md font-bold">
                    <span className="text-primary-container w-12 text-right">7</span>
                    <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary-container w-[65%]" />
                      <div className="h-full bg-surface-variant w-[35%]" />
                    </div>
                    <span className="text-on-surface w-12">3</span>
                  </div>
                </div>

                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Faltas</span>
                  </div>
                  <div className="flex items-center gap-sm font-headline-md text-headline-md font-bold">
                    <span className="text-on-surface w-12 text-right">4</span>
                    <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                      <div className="h-full bg-surface-variant w-[30%]" />
                      <div className="h-full bg-error w-[70%]" />
                    </div>
                    <span className="text-error w-12">9</span>
                  </div>
                </div>

                <div className="flex flex-col gap-sm">
                  <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                    <span>Córners</span>
                  </div>
                  <div className="flex items-center gap-sm font-headline-md text-headline-md font-bold">
                    <span className="text-primary-container w-12 text-right">5</span>
                    <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                      <div className="h-full bg-primary-container w-[80%]" />
                      <div className="h-full bg-surface-variant w-[20%]" />
                    </div>
                    <span className="text-on-surface w-12">1</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Lineups Visualization (Tactical Board) */}
            <section className="bg-surface-container rounded-xl shadow-lg overflow-hidden relative border border-white/5">
              <div className="absolute inset-0 bg-surface-container-low pointer-events-none" />
              <div className="relative z-10 p-md border-b border-surface-container-highest flex justify-between items-center bg-surface-container/90 backdrop-blur-sm">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm font-bold">
                  <span className="material-symbols-outlined text-secondary-container">strategy</span>
                  Alineaciones
                </h3>
                <div className="flex gap-sm">
                  <span className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-primary-container shadow-[0_0_8px_#39ff14]" /> Local
                  </span>
                  <span className="flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant">
                    <span className="w-3 h-3 rounded-full bg-on-surface" /> Visitante
                  </span>
                </div>
              </div>

              {/* The Pitch View */}
              <div className="relative w-full h-[400px] bg-surface-container-lowest overflow-hidden flex items-center justify-center p-lg">
                <div className="absolute inset-4 border border-surface-container-highest/50 rounded-lg pointer-events-none" />
                <div className="absolute top-4 bottom-4 left-1/2 w-px bg-surface-container-highest/50 pointer-events-none -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-surface-container-highest/50 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2" />

                <div
                  className="w-full h-full relative bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAus-txYEh_l0F8do6GYB6LKuuX7EgqvAtBmoE_edZL8bSoFPlDgK4pXMuqvt5hl4ZWgSlOXz0SudgAGiHmBAOJRX3PkYrEFDRtffEYax9Sb9q8eTjKzB2upWketpWHW_-bUatIdk5iBeZS9sHO-aEpkiq6vi5NOWbwDQzOvyvQylHDOitytaCfgSvSwdBey-Rjbw-PWNJCbLAxntJi62RnkPuIAZD42s1zXvP1d4syOmBHeH-SMBZOblcbTR7Fe6IIAPBBby7K6us')",
                  }}
                >
                  <div className="absolute top-1/2 left-[20%] w-8 h-8 bg-primary-container rounded-full shadow-[0_0_10px_#39ff14] flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                    <span className="font-label-sm text-background font-bold text-[10px]">10</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-container-high px-2 py-1 rounded text-on-surface font-label-sm text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
                      M. Silva
                    </div>
                  </div>

                  <div className="absolute top-1/3 right-[30%] w-8 h-8 bg-surface rounded-full border-2 border-on-surface shadow-md flex items-center justify-center -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                    <span className="font-label-sm text-on-surface font-bold text-[10px]">5</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface-container-high px-2 py-1 rounded text-on-surface font-label-sm text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
                      J. Pérez
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Commentary Stream */}
          <div className="lg:col-span-4 h-full">
            <section className="bg-surface-container rounded-xl shadow-lg h-full flex flex-col overflow-hidden max-h-[700px] border border-white/5">
              <div className="p-md border-b border-surface-container-highest bg-surface-container/90 backdrop-blur-sm shrink-0">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm font-bold">
                  <span className="material-symbols-outlined text-secondary-container">feed</span>
                  Minuto a Minuto
                </h3>
              </div>
              <div className="p-md overflow-y-auto flex-1 space-y-md relative custom-scrollbar" id="commentary-scroll">
                <div className="sticky top-0 left-0 right-0 flex justify-center pb-sm bg-gradient-to-b from-surface-container to-transparent z-10 pointer-events-none">
                  <span className="bg-surface-container-high text-primary-container px-3 py-1 rounded-full font-label-sm text-[10px] uppercase tracking-widest flex items-center gap-xs shadow-sm font-bold border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" /> Live Updates
                  </span>
                </div>

                {/* Events */}
                <div className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <span className="font-label-md text-primary-container w-10 text-right font-bold">72'</span>
                    <div className="w-px h-full bg-surface-container-highest group-last:hidden mt-xs" />
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-lg flex-1 shadow-sm border-l-2 border-primary-container">
                    <div className="flex items-center gap-xs mb-1">
                      <span className="material-symbols-outlined text-primary-container text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        sports_soccer
                      </span>
                      <span className="font-label-md text-on-surface font-bold">¡GOL DE GALÁCTICOS!</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                      Increíble disparo desde fuera del área de M. Silva (10) que se cuela por la escuadra. Asistencia de K. Ruiz (7).
                    </p>
                  </div>
                </div>

                <div className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <span className="font-label-md text-on-surface-variant w-10 text-right">68'</span>
                    <div className="w-px h-full bg-surface-container-highest group-last:hidden mt-xs" />
                  </div>
                  <div className="bg-surface-container-lowest p-sm rounded-lg flex-1 border border-white/5">
                    <div className="flex items-center gap-xs mb-1">
                      <span className="w-3 h-4 bg-[#FFD700] rounded-[2px] shadow-sm" />
                      <span className="font-label-md text-on-surface font-semibold">Tarjeta Amarilla</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                      Fuerte entrada de J. Pérez (5) de Titanes FC en el centro del campo.
                    </p>
                  </div>
                </div>

                <div className="flex gap-md group">
                  <div className="flex flex-col items-center">
                    <span className="font-label-md text-on-surface-variant w-10 text-right">60'</span>
                    <div className="w-px h-full bg-surface-container-highest group-last:hidden mt-xs" />
                  </div>
                  <div className="bg-surface-container-lowest p-sm rounded-lg flex-1 border border-white/5">
                    <div className="flex items-center gap-xs mb-1">
                      <span className="material-symbols-outlined text-secondary-container text-[16px]">sync_alt</span>
                      <span className="font-label-md text-on-surface font-semibold">Sustitución (Titanes FC)</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant text-xs">
                      Entra L. Gómez (14), sale D. Torres (9) por molestias musculares.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
