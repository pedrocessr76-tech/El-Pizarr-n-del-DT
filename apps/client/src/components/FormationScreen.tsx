import { useState } from 'react';

interface FormationScreenProps {
  onNext?: () => void;
  onBack?: () => void;
}

export function FormationScreen({ onNext, onBack }: FormationScreenProps) {
  const [selectedFormation, setSelectedFormation] = useState<string | null>('4-3-3');

  const formationList = [
    { id: '4-3-3', name: '4-3-3', desc: 'Ofensiva Estándar', color: 'bg-[#39ff14]', activeBorder: 'border-[#39ff14]' },
    { id: '4-4-2', name: '4-4-2', desc: 'Equilibrio Clásico', color: 'bg-[#00e3fd]', activeBorder: 'border-[#00e3fd]' },
    { id: '3-5-2', name: '3-5-2', desc: 'Control Total', color: 'bg-[#ffdb40]', activeBorder: 'border-[#ffdb40]' },
    { id: '5-4-1', name: '5-4-1', desc: 'Fortaleza Defensiva', color: 'bg-[#ffb4ab]', activeBorder: 'border-[#ffb4ab]' },
  ];

  return (
    <div className="relative bg-[#111316] min-h-screen font-body-md text-[#e2e2e6]">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20 blur-sm pointer-events-none"
        style={{ backgroundImage: "url('/images/pitch_bg.jpg')" }}
      />
      <div className="relative z-10 flex flex-col w-full">
        {/* Interactive Formation Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-8 py-10">
          {/* Left Panel: Tactical Options */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-1 text-[#39ff14] hover:text-white transition-colors group"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                  <span className="text-xs uppercase tracking-widest font-bold">
                    Volver al Hub
                  </span>
                </button>
              </div>
              <span className="text-xs text-[#39ff14] uppercase tracking-widest font-bold">
                Configuración Táctica
              </span>
              <h1 className="text-3xl font-extrabold text-white">Elegir Alineación</h1>
              <p className="text-xs text-gray-400 max-w-md mt-1 leading-relaxed">
                Selecciona la estructura base para tu próximo encuentro. Esta decisión afectará la transición defensa-ataque y la densidad en el mediocampo.
              </p>
            </div>

            {/* Formation Cards Grid */}
            <div className="grid grid-cols-1 gap-3">
              {formationList.map((item) => {
                const isSelected = selectedFormation === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedFormation(item.id)}
                    className={`group relative flex items-center justify-between p-4 bg-[#1e2023] hover:bg-[#282a2d] transition-all duration-300 rounded-xl overflow-hidden border-l-4 active:scale-[0.98] ${
                      isSelected
                        ? item.activeBorder + ' bg-[#282a2d] shadow-lg border-t border-r border-b border-white/10'
                        : 'border-transparent border border-white/5'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className={`text-xl font-bold transition-colors ${isSelected ? 'text-[#39ff14]' : 'text-white group-hover:text-[#39ff14]'}`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-400 uppercase">
                        {item.desc}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <span className={`w-1.5 h-6 rounded-full transition-colors ${isSelected ? item.color : 'bg-gray-700'}`} />
                      <span className={`w-1.5 h-6 rounded-full transition-colors ${isSelected ? item.color : 'bg-gray-700'}`} />
                      <span className={`w-1.5 h-6 rounded-full transition-colors ${isSelected ? item.color : 'bg-gray-700'}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-6">
              <button
                onClick={onNext}
                disabled={!selectedFormation}
                className={`w-full py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-bold text-sm shadow-lg ${
                  selectedFormation
                    ? 'bg-[#39ff14] text-[#111316] hover:bg-[#79ff5b] shadow-[0_0_20px_-5px_#39ff14] cursor-pointer'
                    : 'bg-[#282a2d] text-gray-600 cursor-not-allowed'
                }`}
              >
                <span>CONFIRMAR FORMACIÓN</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Right Panel: Visual Pitch */}
          <div className="lg:col-span-8 relative">
            <div className="sticky top-6 aspect-[4/5] md:aspect-[16/10] bg-[#1a1c1f]/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex items-center justify-center">
              {/* Pitch Markings SVG */}
              <div className="absolute inset-0 opacity-20 pointer-events-none text-white">
                <svg fill="none" height="100%" viewBox="0 0 800 600" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <rect height="520" stroke="currentColor" strokeWidth="2" width="720" x="40" y="40" />
                  <path d="M400 40V560" stroke="currentColor" strokeWidth="2" />
                  <circle cx="400" cy="300" r="60" stroke="currentColor" strokeWidth="2" />
                  <path d="M40 180H120V420H40" stroke="currentColor" strokeWidth="2" />
                  <path d="M760 180H680V420H760" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>

              {/* Dynamic Players Layer */}
              <div className="relative z-10 w-full h-full p-8 flex flex-col justify-between items-center py-10">
                {selectedFormation ? (
                  <div className="w-full h-full flex flex-col justify-between py-4">
                    {/* Forwards */}
                    <div className="flex justify-around items-center">
                      <div className="w-12 h-12 rounded-full bg-[#39ff14] text-[#111316] flex items-center justify-center font-extrabold shadow-[0_0_15px_#39ff14] text-xs">EXI</div>
                      <div className="w-12 h-12 rounded-full bg-[#39ff14] text-[#111316] flex items-center justify-center font-extrabold shadow-[0_0_15px_#39ff14] text-xs">DEL</div>
                      <div className="w-12 h-12 rounded-full bg-[#39ff14] text-[#111316] flex items-center justify-center font-extrabold shadow-[0_0_15px_#39ff14] text-xs">EXD</div>
                    </div>

                    {/* Midfield */}
                    <div className="flex justify-around items-center">
                      <div className="w-12 h-12 rounded-full bg-[#9cf0ff] text-[#001f24] flex items-center justify-center font-extrabold shadow-[0_0_15px_#9cf0ff] text-xs">VOL</div>
                      <div className="w-12 h-12 rounded-full bg-[#9cf0ff] text-[#001f24] flex items-center justify-center font-extrabold shadow-[0_0_15px_#9cf0ff] text-xs">MC</div>
                      <div className="w-12 h-12 rounded-full bg-[#9cf0ff] text-[#001f24] flex items-center justify-center font-extrabold shadow-[0_0_15px_#9cf0ff] text-xs">VOL</div>
                    </div>

                    {/* Defense */}
                    <div className="flex justify-around items-center">
                      <div className="w-12 h-12 rounded-full bg-[#37393d] text-white border border-white/20 flex items-center justify-center font-bold text-xs">LI</div>
                      <div className="w-12 h-12 rounded-full bg-[#37393d] text-white border border-white/20 flex items-center justify-center font-bold text-xs">DFC</div>
                      <div className="w-12 h-12 rounded-full bg-[#37393d] text-white border border-white/20 flex items-center justify-center font-bold text-xs">DFC</div>
                      <div className="w-12 h-12 rounded-full bg-[#37393d] text-white border border-white/20 flex items-center justify-center font-bold text-xs">LD</div>
                    </div>

                    {/* GK */}
                    <div className="flex justify-center items-center">
                      <div className="w-12 h-12 rounded-full bg-[#ffdb40] text-[#736000] flex items-center justify-center font-extrabold shadow-[0_0_15px_rgba(255,219,64,0.5)] text-xs">POR</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center my-auto">
                    <div className="w-20 h-20 rounded-full bg-[#39ff14]/10 flex items-center justify-center mb-4 animate-pulse">
                      <span className="material-symbols-outlined text-[#39ff14] text-[40px]">sports_soccer</span>
                    </div>
                    <p className="text-xl text-white font-bold">Selecciona un esquema táctico</p>
                    <p className="text-xs text-gray-400 mt-1">El tablero se actualizará dinámicamente</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Overlay */}
            <div className="mt-4 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Visualizador Táctico v3.0</span>
                <span className="text-2xl text-white font-extrabold">{selectedFormation || '----'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Análisis de Espacios</span>
                <div className="flex gap-1.5 mt-1 justify-end">
                  <div className="w-2 h-2 rounded-full bg-[#39ff14]/60" />
                  <div className="w-2 h-2 rounded-full bg-[#39ff14]/30" />
                  <div className="w-2 h-2 rounded-full bg-[#39ff14]/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
