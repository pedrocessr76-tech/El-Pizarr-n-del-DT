export function HistorialScreen() {
  return (
    <div className="flex flex-col w-full px-margin pb-margin gap-md min-h-screen bg-surface">
      {/* Header Bar */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-end justify-between mt-sm mb-xs gap-md">
        <div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">Historial de Partidas</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Revisión de rendimiento táctico y resultados recientes.
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface font-label-md text-label-md px-md py-sm rounded-full flex items-center gap-xs border border-white/5">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filtros
          </button>
          <button className="bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface font-label-md text-label-md px-md py-sm rounded-full flex items-center gap-xs border border-white/5">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Exportar Datos
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Main Content: Match History List */}
        <div className="col-span-12 xl:col-span-8 flex flex-col gap-sm">
          {/* Match Card: Win */}
          <div className="group relative bg-surface-container/40 backdrop-blur-md rounded-xl overflow-hidden hover:bg-surface-container/60 transition-all cursor-pointer border border-white/5 shadow-md">
            {/* Victory Indicator Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-container group-hover:w-2 transition-all shadow-[0_0_10px_0_#39ff14]" />
            <div className="p-md pl-lg flex flex-col sm:flex-row items-center justify-between gap-md relative">
              {/* Background Decor */}
              <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-primary-container/5 to-transparent pointer-events-none" />
              {/* Match Info */}
              <div className="flex flex-col gap-xs min-w-0 w-full sm:w-auto text-center sm:text-left">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Liga Premier • J24 • 12 Oct 2023
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-md mt-sm">
                  <div className="flex flex-col items-center gap-xs">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <img
                        className="w-8 h-8 object-contain"
                        alt="Nosotros Crest"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1Jf6w0lsmK-OXbtZrUJad4Cjei6rm2PZLs-OAXrP75A165rCU5P49p93lKwwAepq1c5RRnEAcqdXjIZAPMuk5YSzvwocQxCIlO4RCb-QUZPaIm418l1IoSkkFDhlgHhp1jI88X2rB-ZqRDmYHRqot2drMBpHY-xVxhQOSifWJztxVjv_10j5x160RPzKcB0Cn_UqgprIb7sCbO5CdCcj8Y2PXNMEU0JmYof5GXK-W19RJgBjz-uGhX5U7BCnEY42ZDuF5xGyxjD4"
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate w-20 text-center">
                      Nosotros
                    </span>
                  </div>
                  <div className="flex flex-col items-center mx-xs">
                    <div className="font-headline-xl text-headline-xl text-primary-container font-extrabold tracking-tighter">
                      3 - 1
                    </div>
                    <span className="font-label-sm text-label-sm text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-sm mt-1 font-bold">
                      VICTORIA
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-xs">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <img
                        className="w-8 h-8 object-contain opacity-70"
                        alt="Rival FC Crest"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHFu0iMlwj3wMPb3GR775WMJJRhnrAAAUoDigLQm5_ov8u2bEm3k8uE9Jdf7KguD8T0koPzS2cjFdqihn0VtJSmUtIGVdOLxlem0sQzrXsyDLCsO3-mhYAPZJo9cqAfBgC1o4v6gvtV9UhaVhDbYCHVRvIX6k_XxM36A96fexZlJl_WT5kylSpeNd1JI3FaKTD_u8pW4usPj-7MBKSSZNDzEM52_Cxin_VuX1uBDVMqENCTkJ7ShRhtH0ZqBPtXaPIbkseULFYYH8"
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant truncate w-20 text-center">
                      Rival FC
                    </span>
                  </div>
                </div>
              </div>
              {/* Quick Stats */}
              <div className="flex sm:flex-col gap-md sm:gap-xs w-full sm:w-48 bg-surface-container-highest/30 rounded-lg p-sm border border-white/5 relative z-10">
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pie_chart</span> Pos
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">62%</span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sports_soccer</span> Tiros
                  </span>
                  <span className="font-label-md text-label-md text-on-surface text-primary-fixed font-bold">
                    14 <span className="text-on-surface-variant text-[10px] font-normal">vs</span> 6
                  </span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">speed</span> xG
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    2.4 <span className="text-on-surface-variant text-[10px] font-normal">vs</span> 0.8
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Match Card: Loss */}
          <div className="group relative bg-surface-container/40 backdrop-blur-md rounded-xl overflow-hidden hover:bg-surface-container/60 transition-all cursor-pointer border border-white/5 shadow-md">
            {/* Defeat Indicator Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-error group-hover:w-2 transition-all" />
            <div className="p-md pl-lg flex flex-col sm:flex-row items-center justify-between gap-md relative">
              <div className="flex flex-col gap-xs min-w-0 w-full sm:w-auto text-center sm:text-left">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Copa Nacional • 4tos • 05 Oct 2023
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-md mt-sm">
                  <div className="flex flex-col items-center gap-xs">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <img
                        className="w-8 h-8 object-contain opacity-70"
                        alt="Nosotros Crest"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCqvpAVhhJFjDn8LLznfAwCCkid0BD2UtzNTtSJZQMZ14OShJCXepPA3jZCnhThOAcGwK0f_UPaMQyxNqBvIGv7Jr9YFtFv0HL5D_vXt0HKeTkzz-EOfERTLDyattVwYZe9nCSYTYEIGNYCad1O0pkyI_BaIEYhlNAkzsWJV7NBay6BvC8Kykv8-o15101rmF5thxv3WhaDv-fjotQGIRrfex6kmucERI_DHa0bj4RY2D8eB1NV7jgtlQAQTVV3x-i7IL3b_Ygh2g"
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface-variant truncate w-20 text-center">
                      Nosotros
                    </span>
                  </div>
                  <div className="flex flex-col items-center mx-xs">
                    <div className="font-headline-xl text-headline-xl text-on-surface font-extrabold tracking-tighter">
                      0 - 2
                    </div>
                    <span className="font-label-sm text-label-sm text-error bg-error/10 px-2 py-0.5 rounded-sm mt-1 font-bold">
                      DERROTA
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-xs">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <img
                        className="w-8 h-8 object-contain"
                        alt="Atlético Mar Crest"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_qtcWErBv9sjMfklFucZgEPWx2KnQ9l7_4QrFu1uqmeq4Eksj9IIubqWsFNMX35IQJSA9KFQeP2Suu65JZKFOft8JBKNVZgK7VmOyxqf6iXjSBzUoaVLGL7sC3RRVzR30HKAoJn3YVhoI0ks3tTzv5RiYc5UfOXUwp-dOQ6S_2OHC1z-xfb_mLhWk90XPGNUTgXRfut8gEBYGbI8gRVIrW3wuSURhSYLM1jo5Q8RX3Ghe2ktFyVrHIqrdaNO3ATMZeaw2aN3SuDg"
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate w-20 text-center">
                      Atlético Mar
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col gap-md sm:gap-xs w-full sm:w-48 bg-surface-container-highest/30 rounded-lg p-sm border border-white/5 relative z-10">
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pie_chart</span> Pos
                  </span>
                  <span className="font-label-md text-label-md text-error font-bold">45%</span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sports_soccer</span> Tiros
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    5 <span className="text-on-surface-variant text-[10px] font-normal">vs</span> 12
                  </span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">speed</span> xG
                  </span>
                  <span className="font-label-md text-label-md text-on-surface text-error font-bold">
                    0.5 <span className="text-on-surface-variant text-[10px] font-normal">vs</span> 1.8
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Match Card: Draw */}
          <div className="group relative bg-surface-container/40 backdrop-blur-md rounded-xl overflow-hidden hover:bg-surface-container/60 transition-all cursor-pointer border border-white/5 shadow-md">
            {/* Draw Indicator Strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-fixed group-hover:w-2 transition-all shadow-[0_0_10px_0_#9cf0ff80]" />
            <div className="p-md pl-lg flex flex-col sm:flex-row items-center justify-between gap-md relative">
              <div className="flex flex-col gap-xs min-w-0 w-full sm:w-auto text-center sm:text-left">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Liga Premier • J23 • 28 Sep 2023
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-md mt-sm">
                  <div className="flex flex-col items-center gap-xs">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <img
                        className="w-8 h-8 object-contain"
                        alt="Nosotros Crest"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB47GKMTzHDC2VQyYssdJBoUyY7Mgl4oWhdNEAR5_R_cc8ph0zNZLMrYiMFZKPgJiRTDCUo_BIGIcp-eNkacE7DmsvS7B5xv_WIlx56h657kbmBAAwjy-ctSQ7I9xeWNoYdi4NnFqsxF0J36cI4-yW7jj4zQ2mdq3BfIdH-hurrZezjNYBruTDyNVmPtgGIfDIoB2v6Mz8IKVzEjM_4y6_e_f1L-KRUeeAHkSqimU-HKL7VVawjCOGL5jamuKJLZ0O6vlKh9kqJcQM"
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate w-20 text-center">
                      Nosotros
                    </span>
                  </div>
                  <div className="flex flex-col items-center mx-xs">
                    <div className="font-headline-xl text-headline-xl text-secondary-fixed font-extrabold tracking-tighter">
                      1 - 1
                    </div>
                    <span className="font-label-sm text-label-sm text-secondary-fixed bg-secondary-fixed/10 px-2 py-0.5 rounded-sm mt-1 font-bold">
                      EMPATE
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-xs">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center border border-white/10">
                      <img
                        className="w-8 h-8 object-contain"
                        alt="Cumbres SC Crest"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD40oEckBEGlMD6dbQnOVpVtE6pmrcRW4T2gtvg6At7DW9N8KtYrkRVD_0JGYgfHO8Rh0bIY1fNQWAeXGocFC2U4Voj5P66YSap_ISiCZ51JLAuY68IUThFAtGYvuSmdZoSpeB81JNXT0P1mEDR_2iKXz74YLNaiCdq7Gz-nzpaGKXYpUD0T4Yytkq0liU19rwSOk_SvRtSxW1MRNRoQlrXA73TrZEzesc6KqHuolzAp7JEYXO0uO2AeR1jucBpay0jSbamws4LQLA"
                      />
                    </div>
                    <span className="font-label-md text-label-md text-on-surface font-semibold truncate w-20 text-center">
                      Cumbres SC
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex sm:flex-col gap-md sm:gap-xs w-full sm:w-48 bg-surface-container-highest/30 rounded-lg p-sm border border-white/5 relative z-10">
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">pie_chart</span> Pos
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">51%</span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">sports_soccer</span> Tiros
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    9 <span className="text-on-surface-variant text-[10px] font-normal">vs</span> 8
                  </span>
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">speed</span> xG
                  </span>
                  <span className="font-label-md text-label-md text-on-surface font-bold">
                    1.1 <span className="text-on-surface-variant text-[10px] font-normal">vs</span> 0.9
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Summary & Insights */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-md">
          {/* Performance Summary Widget */}
          <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-md flex flex-col relative overflow-hidden group border border-white/5 shadow-md">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl group-hover:bg-primary-container/20 transition-colors pointer-events-none" />
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-primary-container">monitoring</span>
              Rendimiento
            </h3>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-md">
              Últimos 10 Partidos
            </span>
            <div className="flex justify-between items-end mb-lg">
              <div className="flex flex-col">
                <span className="font-headline-xl text-[48px] leading-none text-primary-container font-extrabold tracking-tighter">
                  60%
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                  Tasa de Victoria
                </span>
              </div>
              {/* Win/Draw/Loss Donut Chart */}
              <div className="w-20 h-20 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path className="text-error" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeWidth="4" />
                  <path className="text-secondary-fixed" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="20, 100" strokeDashoffset="-20" strokeWidth="4" />
                  <path className="text-primary-container" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="60, 100" strokeDashoffset="-40" strokeWidth="4" />
                </svg>
                <span className="absolute text-on-surface font-label-md font-bold">10P</span>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <div className="flex-1 bg-surface-container-highest/50 rounded-lg p-2 flex flex-col items-center border border-white/5">
                <span className="font-headline-md text-headline-md text-primary-container font-bold">6</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Vic</span>
              </div>
              <div className="flex-1 bg-surface-container-highest/50 rounded-lg p-2 flex flex-col items-center border border-white/5">
                <span className="font-headline-md text-headline-md text-secondary-fixed font-bold">2</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Emp</span>
              </div>
              <div className="flex-1 bg-surface-container-highest/50 rounded-lg p-2 flex flex-col items-center border border-white/5">
                <span className="font-headline-md text-headline-md text-error font-bold">2</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Der</span>
              </div>
            </div>
          </div>

          {/* Tactical Insight Widget */}
          <div className="bg-surface-container/60 backdrop-blur-xl rounded-xl p-md flex flex-col relative border border-white/5 shadow-md">
            <div className="absolute left-0 top-0 w-1 h-full bg-secondary-fixed rounded-l-xl opacity-50" />
            <h3 className="font-headline-md text-headline-md text-on-surface mb-xs flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-secondary-fixed">lightbulb</span>
              Insight Táctico
            </h3>
            <div className="bg-surface-container-highest/30 rounded-lg p-sm mt-sm border border-white/5 relative overflow-hidden">
              <div className="absolute right-[-10%] top-[-10%] w-24 h-24 text-secondary-fixed opacity-5">
                <span className="material-symbols-outlined text-[96px]">schema</span>
              </div>
              <div className="flex items-start gap-sm relative z-10">
                <span className="material-symbols-outlined text-primary-container mt-1">trending_up</span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Transiciones Ofensivas Mejoradas
                  </span>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-2 text-sm leading-relaxed">
                    El equipo ha incrementado la velocidad de progresión en un{' '}
                    <span className="text-primary-container font-bold">15%</span> en los últimos 3 partidos, resultando en un mayor número de tiros a puerta originados desde recuperaciones en campo propio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
