export function BracketScreen() {
  return (
    <div className="relative bg-[#111316] min-h-screen font-body-md text-[#e2e2e6]">
      <div className="flex flex-col w-full relative min-h-[900px] overflow-hidden">
        {/* Tactical Pitch Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <rect fill="none" height="90" stroke="currentColor" strokeWidth="0.5" width="90" x="5" y="5" />
            <line stroke="currentColor" strokeWidth="0.5" x1="50" x2="50" y1="5" y2="95" />
            <circle cx="50" cy="50" fill="none" r="10" stroke="currentColor" strokeWidth="0.5" />
            <rect fill="none" height="40" stroke="currentColor" strokeWidth="0.5" width="15" x="5" y="30" />
            <rect fill="none" height="40" stroke="currentColor" strokeWidth="0.5" width="15" x="80" y="30" />
          </svg>
        </div>

        {/* Tournament Header */}
        <div className="w-full flex items-center justify-between px-6 py-6 relative z-10 bg-gradient-to-b from-[#0c0e11] to-transparent">
          <div>
            <h1 className="text-3xl md:text-4xl leading-none text-white uppercase tracking-tight font-extrabold shadow-[0_0_20px_rgba(57,255,20,0.1)]">
              Copa del DT
            </h1>
            <p className="text-xs text-[#39ff14] mt-1 font-semibold">
              Fase Final - Temporada 24/25
            </p>
          </div>

          <div className="flex gap-2 scale-90 sm:scale-100 origin-right">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs px-3 py-1 bg-[#1e2023] rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-gray-600" />
              Terminado
            </div>
            <div className="flex items-center gap-1.5 text-white text-xs px-3 py-1 bg-[#282a2d] rounded-full shadow-[0_0_10px_rgba(57,255,20,0.2)] border border-[#39ff14]/30">
              <span className="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse" />
              En Vivo
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-xs px-3 py-1 bg-[#1e2023] rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full border border-gray-600" />
              Próximo
            </div>
          </div>
        </div>

        {/* Bracket Container */}
        <div className="flex-1 flex w-full relative z-10 px-2 sm:px-4 pb-12 overflow-hidden items-center justify-center">
          <div className="w-full flex justify-between items-stretch gap-2 sm:gap-4 mt-8 relative max-w-[1600px] mx-auto h-[700px]">
            {/* Connectors Layer */}
            <div className="absolute inset-0 pointer-events-none z-0 hidden md:block opacity-30 text-[#39ff14]">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 700">
                <path d="M 120 105 L 140 105 L 140 220 L 220 220" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 120 335 L 140 335 L 140 220" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 120 565 L 140 565 L 140 450 L 220 450" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 120 795 L 140 795 L 140 450" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 320 220 L 350 220 L 350 335 L 400 335" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 320 450 L 350 450 L 350 335" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 880 105 L 860 105 L 860 220 L 780 220" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 880 335 L 860 335 L 860 220" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 880 565 L 860 565 L 860 450 L 780 450" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 880 795 L 860 795 L 860 450" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 680 220 L 650 220 L 650 335 L 600 335" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 680 450 L 650 450 L 650 335" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {/* LEFT WING */}
            <div className="flex gap-2 sm:gap-4 h-full relative z-10 flex-1 justify-between max-w-[45%]">
              {/* Octavos Left */}
              <div className="flex flex-col justify-between h-full w-[80px] sm:w-[100px] lg:w-[120px] flex-shrink-0 gap-2 py-4 relative">
                <h3 className="text-[10px] text-gray-400 uppercase text-center mb-2 absolute -top-6 w-full font-bold">
                  Octavos
                </h3>
                {/* Match 1 */}
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-gray-500">
                    <span className="text-xs text-white font-semibold">MCI</span>
                    <span className="text-xs text-gray-300 font-bold">1</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-400">RMA</span>
                    <span className="text-xs text-gray-400">0</span>
                  </div>
                </div>

                {/* Match 2 */}
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-[#39ff14]/40">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-[#39ff14] shadow-[inset_2px_0_0_#39ff14]">
                    <span className="text-xs text-[#39ff14] font-bold">EQU</span>
                    <span className="text-xs text-[#39ff14] font-bold">3</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-400">BAY</span>
                    <span className="text-xs text-gray-400">1</span>
                  </div>
                </div>

                {/* Match 3 */}
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-gray-500">
                    <span className="text-xs text-white font-semibold">PSG</span>
                    <span className="text-xs text-gray-300 font-bold">2</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-400">JUV</span>
                    <span className="text-xs text-gray-400">0</span>
                  </div>
                </div>

                {/* Match 4 */}
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-gray-500">
                    <span className="text-xs text-white font-semibold">ARS</span>
                    <span className="text-[10px] text-gray-300 font-bold">1(4)</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-400">INT</span>
                    <span className="text-[10px] text-gray-400">1(3)</span>
                  </div>
                </div>
              </div>

              {/* Cuartos Left */}
              <div className="flex flex-col justify-around h-full w-[80px] sm:w-[100px] lg:w-[120px] flex-shrink-0 py-[15%] relative">
                <h3 className="text-[10px] text-gray-400 uppercase text-center mb-2 absolute -top-6 w-full font-bold">
                  Cuartos
                </h3>
                {/* QF 1 */}
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-[#39ff14]/40">
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-400">MCI</span>
                    <span className="text-xs text-gray-400">0</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-[#39ff14]">
                    <span className="text-xs text-[#39ff14] font-bold">EQU</span>
                    <span className="text-xs text-[#39ff14] font-bold">2</span>
                  </div>
                </div>
                {/* QF 2 */}
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-gray-500">
                    <span className="text-xs text-white font-semibold">PSG</span>
                    <span className="text-xs text-gray-300 font-bold">3</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-400">ARS</span>
                    <span className="text-xs text-gray-400">1</span>
                  </div>
                </div>
              </div>

              {/* Semifinal Left */}
              <div className="flex flex-col justify-center h-full w-[85px] sm:w-[110px] lg:w-[130px] flex-shrink-0 relative">
                <h3 className="text-[10px] text-gray-400 uppercase text-center mb-2 absolute -top-6 w-full font-bold">
                  Semifinal
                </h3>
                {/* SF 1 (LIVE MATCH) */}
                <div className="bg-[#1e2023] shadow-[0_0_20px_rgba(57,255,20,0.3)] rounded-lg overflow-hidden flex flex-col relative border border-[#39ff14]/50">
                  <div className="bg-[#39ff14] text-[#111316] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111316] animate-pulse" />
                    EN JUEGO
                  </div>
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-l-2 border-[#39ff14]">
                    <span className="text-xs text-white font-bold">EQU</span>
                    <span className="text-xs text-[#39ff14] font-bold">0</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/10" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023]">
                    <span className="text-xs text-gray-300">PSG</span>
                    <span className="text-xs text-gray-300">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FINAL CENTER */}
            <div className="flex flex-col justify-center items-center h-full w-[140px] sm:w-[180px] lg:w-[220px] flex-shrink-0 relative z-20 px-2">
              <h3 className="text-xs text-[#ffdb40] uppercase text-center mb-4 absolute -top-6 w-full shadow-[0_0_15px_rgba(255,219,64,0.3)] px-3 py-1 bg-[#1e2023] rounded-full border border-[#ffdb40]/40 font-extrabold">
                Gran Final
              </h3>
              <div className="bg-[#1e2023] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative w-full border border-[#ffdb40]/30 mb-3">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#ffdb40] to-transparent" />
                <div className="p-3 text-center bg-[#111316] flex flex-col gap-2">
                  <div className="flex justify-between items-center opacity-50">
                    <span className="text-xs text-gray-400">???</span>
                    <span className="text-sm text-gray-400 font-bold">-</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center opacity-50">
                    <span className="text-xs text-gray-400">???</span>
                    <span className="text-sm text-gray-400 font-bold">-</span>
                  </div>
                </div>
                <div className="py-2 bg-[#282a2d] text-center">
                  <span className="material-symbols-outlined text-[#ffdb40] text-3xl">
                    emoji_events
                  </span>
                </div>
              </div>
              <button className="w-full bg-[#39ff14] text-[#111316] py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold hover:bg-[#79ff5b] transition-colors shadow-[0_0_20px_rgba(57,255,20,0.5)] cursor-pointer">
                Empezar
              </button>
            </div>

            {/* RIGHT WING */}
            <div className="flex gap-2 sm:gap-4 h-full relative z-10 flex-1 flex-row-reverse justify-between max-w-[45%]">
              {/* Octavos Right */}
              <div className="flex flex-col justify-between h-full w-[80px] sm:w-[100px] lg:w-[120px] flex-shrink-0 gap-2 py-4 relative">
                <h3 className="text-[10px] text-gray-400 uppercase text-center mb-2 absolute -top-6 w-full font-bold">
                  Octavos
                </h3>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">BAR</span>
                    <span className="text-xs text-gray-300 font-bold">2</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">NAP</span>
                    <span className="text-xs text-gray-400">1</span>
                  </div>
                </div>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">LIV</span>
                    <span className="text-xs text-gray-300 font-bold">3</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">MIL</span>
                    <span className="text-xs text-gray-400">0</span>
                  </div>
                </div>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">BVB</span>
                    <span className="text-xs text-gray-300 font-bold">1</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">ATM</span>
                    <span className="text-xs text-gray-400">0</span>
                  </div>
                </div>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">CHE</span>
                    <span className="text-xs text-gray-300 font-bold">2</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">BEN</span>
                    <span className="text-xs text-gray-400">1</span>
                  </div>
                </div>
              </div>

              {/* Cuartos Right */}
              <div className="flex flex-col justify-around h-full w-[80px] sm:w-[100px] lg:w-[120px] flex-shrink-0 py-[15%] relative">
                <h3 className="text-[10px] text-gray-400 uppercase text-center mb-2 absolute -top-6 w-full font-bold">
                  Cuartos
                </h3>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">BAR</span>
                    <span className="text-xs text-gray-400">1</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">LIV</span>
                    <span className="text-xs text-gray-300 font-bold">3</span>
                  </div>
                </div>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">BVB</span>
                    <span className="text-xs text-gray-300 font-bold">2</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">CHE</span>
                    <span className="text-xs text-gray-400">0</span>
                  </div>
                </div>
              </div>

              {/* Semifinal Right */}
              <div className="flex flex-col justify-center h-full w-[85px] sm:w-[110px] lg:w-[130px] flex-shrink-0 relative">
                <h3 className="text-[10px] text-gray-400 uppercase text-center mb-2 absolute -top-6 w-full font-bold">
                  Semifinal
                </h3>
                <div className="bg-[#1e2023] rounded-lg overflow-hidden flex flex-col shadow-md border border-white/10">
                  <div className="flex justify-between items-center p-1.5 bg-[#282a2d] border-r-2 border-gray-500 flex-row-reverse">
                    <span className="text-xs text-white font-semibold">LIV</span>
                    <span className="text-xs text-gray-300 font-bold">-</span>
                  </div>
                  <div className="h-[1px] w-full bg-white/5" />
                  <div className="flex justify-between items-center p-1.5 bg-[#1e2023] flex-row-reverse">
                    <span className="text-xs text-gray-400">BVB</span>
                    <span className="text-xs text-gray-400">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
