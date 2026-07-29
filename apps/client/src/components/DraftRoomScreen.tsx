import { useState } from 'react';

interface DraftRoomScreenProps {
  onNext?: () => void;
}

export function DraftRoomScreen({ onNext }: DraftRoomScreenProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const draftOptions = [
    { name: 'V. VAN DIJK', rating: 89, pos: 'CB', pac: 78, sho: 60, pas: 71, dri: 72, def: 91, phy: 86, color: 'bg-surface-container-high border-gold/40' },
    { name: 'T. HERNÁNDEZ', rating: 85, pos: 'LB', pac: 93, sho: 72, pas: 76, dri: 81, def: 78, phy: 84, color: 'bg-surface-container-high border-silver/40' },
    { name: 'R. DIAS', rating: 88, pos: 'CB', pac: 64, sho: 39, pas: 68, dri: 68, def: 89, phy: 87, color: 'bg-surface-container-high border-gold/40' },
    { name: 'A. ROBERTSON', rating: 86, pos: 'LB', pac: 80, sho: 61, pas: 81, dri: 79, def: 81, phy: 76, color: 'bg-surface-container-high border-silver/40' },
    { name: 'J. KOUNDÉ', rating: 85, pos: 'RB', pac: 84, sho: 45, pas: 69, dri: 74, def: 85, phy: 78, color: 'bg-surface-container-high border-silver/40' },
  ];

  return (
    <div className="relative min-h-screen bg-surface font-body-md text-on-surface">
      <div className="flex flex-col w-full">
        {/* Status & Progress Header */}
        <div className="px-margin py-md flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-container-low/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/10">
          <div className="flex flex-col gap-xs">
            <div className="flex items-center gap-sm">
              <span className="w-3 h-3 rounded-full bg-primary-container animate-pulse shadow-[0_0_12px_#39ff14]" />
              <span className="font-label-md text-label-md text-primary-container uppercase tracking-[0.2em] font-bold">
                Draft en Vivo
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold">Construye tu Escuadra</h1>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex flex-col gap-xs min-w-[200px]">
              <div className="flex justify-between items-end">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase text-xs">
                  Plantilla (Titulares + Reservas)
                </span>
                <span className="font-headline-md text-headline-md text-primary-container font-bold">
                  1/18
                </span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary-container shadow-[0_0_15px_#39ff14] w-[15%]" />
              </div>
            </div>

            <button
              onClick={onNext}
              className="bg-primary-container text-on-primary-container font-label-md text-label-md px-md py-sm rounded-lg shadow-[0_0_15px_-5px_#39ff14] hover:shadow-[0_0_20px_-5px_#39ff14] transition-all flex items-center gap-xs font-bold"
            >
              <span className="material-symbols-outlined">save</span>
              <span>Guardar Alineación</span>
            </button>
          </div>
        </div>

        {/* Main Layout Container */}
        <div className="relative flex flex-col lg:flex-row px-margin gap-gutter pb-xl mt-md">
          {/* Football Pitch Area (Left) */}
          <div className="relative w-full lg:w-3/5 aspect-[4/5] bg-surface-container-low rounded-2xl overflow-hidden shadow-2xl border border-white/10 p-lg">
            {/* Real Tactical Pitch Image */}
            <div
              className="absolute inset-0 z-0 bg-cover bg-center opacity-30 scale-105"
              style={{ backgroundImage: "url('/images/pitch_bg.jpg')" }}
            />

            {/* Pitch Markings Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-primary-container/20 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full border-x border-primary-container/20" />
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary-container/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-primary-container/20 rounded-full" />
            </div>

            {/* Players Grid (4-3-3 Formation) */}
            <div className="relative z-10 w-full h-full grid grid-cols-5 grid-rows-4 items-center justify-items-center">
              {/* Forwards */}
              {['LW', 'ST', 'RW'].map((pos, idx) => (
                <div key={pos} className={`col-start-${idx * 2 + 1} row-start-1`}>
                  <button
                    onClick={() => setSelectedSlot(pos)}
                    className="flex flex-col items-center gap-2 group/btn"
                  >
                    <div className="w-20 h-24 rounded-2xl bg-surface-container-highest/90 backdrop-blur-md flex flex-col items-center justify-center border border-white/10 group-hover/btn:border-primary-container transition-all group-hover/btn:bg-surface-bright shadow-md">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover/btn:text-primary-container text-3xl">
                        add
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface/80 px-2 py-0.5 rounded">
                      {pos}
                    </span>
                  </button>
                </div>
              ))}

              {/* Midfield */}
              <div className="col-start-2 row-start-2">
                <button onClick={() => setSelectedSlot('CM1')} className="flex flex-col items-center gap-2 group/btn">
                  <div className="w-20 h-24 rounded-2xl bg-surface-container-highest/90 backdrop-blur-md flex flex-col items-center justify-center border border-white/10 group-hover/btn:border-primary-container transition-all group-hover/btn:bg-surface-bright shadow-md">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover/btn:text-primary-container text-3xl">
                      add
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface/80 px-2 py-0.5 rounded">
                    CM
                  </span>
                </button>
              </div>

              {/* Captain Card (Pre-selected) */}
              <div className="col-start-3 row-start-2 relative">
                <div className="w-24 h-32 rounded-2xl bg-tertiary-container/30 border-2 border-tertiary-container relative overflow-hidden shadow-2xl p-2 flex flex-col justify-between backdrop-blur-md">
                  <div className="flex justify-between items-start">
                    <span className="text-xl font-black text-tertiary-container leading-none">98</span>
                    <span className="text-[9px] font-bold text-tertiary-container uppercase">CAM</span>
                  </div>
                  <div className="text-center my-auto">
                    <div className="text-xs font-black uppercase text-on-surface tracking-tight">MESSI</div>
                    <div className="text-[9px] text-tertiary-container font-bold">CAPITÁN</div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px] font-bold text-on-surface-variant border-t border-white/10 pt-1">
                    <span>PAC 85</span>
                    <span>SHO 92</span>
                    <span>PAS 97</span>
                  </div>
                </div>
              </div>

              <div className="col-start-4 row-start-2">
                <button onClick={() => setSelectedSlot('CM2')} className="flex flex-col items-center gap-2 group/btn">
                  <div className="w-20 h-24 rounded-2xl bg-surface-container-highest/90 backdrop-blur-md flex flex-col items-center justify-center border border-white/10 group-hover/btn:border-primary-container transition-all group-hover/btn:bg-surface-bright shadow-md">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover/btn:text-primary-container text-3xl">
                      add
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface/80 px-2 py-0.5 rounded">
                    CM
                  </span>
                </button>
              </div>

              {/* Defense */}
              {['LB', 'CB1', 'CB2', 'RB'].map((pos, idx) => (
                <div key={pos} className={`col-start-${idx + 1} row-start-3`}>
                  <button onClick={() => setSelectedSlot(pos)} className="flex flex-col items-center gap-2 group/btn">
                    <div className="w-20 h-24 rounded-2xl bg-surface-container-highest/90 backdrop-blur-md flex flex-col items-center justify-center border border-white/10 group-hover/btn:border-primary-container transition-all group-hover/btn:bg-surface-bright shadow-md">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover/btn:text-primary-container text-3xl">
                        add
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface/80 px-2 py-0.5 rounded">
                      {pos.substring(0, 2)}
                    </span>
                  </button>
                </div>
              ))}

              {/* GK */}
              <div className="col-start-3 row-start-4">
                <button onClick={() => setSelectedSlot('GK')} className="flex flex-col items-center gap-2 group/btn">
                  <div className="w-20 h-24 rounded-2xl bg-surface-container-highest/90 backdrop-blur-md flex flex-col items-center justify-center border border-white/10 group-hover/btn:border-tertiary-container transition-all group-hover/btn:bg-surface-bright shadow-md">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover/btn:text-tertiary-container text-3xl">
                      add
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface/80 px-2 py-0.5 rounded">
                    GK
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Player Selection Cards Modal / Panel (Right) */}
          <div className="w-full lg:w-2/5 flex flex-col gap-md">
            <div className="bg-surface-container-low p-md rounded-2xl border border-white/10 shadow-xl">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-on-surface font-bold text-lg flex items-center gap-xs">
                  <span className="material-symbols-outlined text-primary-container">style</span>
                  Elige un Jugador para la Posición
                </h3>
                {selectedSlot && (
                  <span className="font-label-sm text-primary-container bg-primary-container/10 px-2 py-0.5 rounded font-bold uppercase">
                    {selectedSlot}
                  </span>
                )}
              </div>

              <div className="space-y-sm">
                {draftOptions.map((card) => (
                  <div
                    key={card.name}
                    className="p-sm bg-surface-container rounded-xl border border-white/5 hover:border-primary-container/40 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-md">
                      <div className="w-12 h-14 rounded-lg bg-surface-container-high border border-white/10 flex flex-col items-center justify-center p-1">
                        <span className="text-primary-container font-extrabold text-sm leading-none">{card.rating}</span>
                        <span className="text-[9px] text-on-surface-variant font-bold">{card.pos}</span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-on-surface font-bold text-sm group-hover:text-primary-container transition-colors">
                          {card.name}
                        </h4>
                        <div className="flex gap-2 text-[10px] text-on-surface-variant mt-0.5">
                          <span>PAC: {card.pac}</span>
                          <span>PAS: {card.pas}</span>
                          <span>DEF: {card.def}</span>
                        </div>
                      </div>
                    </div>
                    <button className="bg-primary-container/10 text-primary-container group-hover:bg-primary-container group-hover:text-on-primary-container px-3 py-1 rounded-lg text-xs font-bold transition-all">
                      Seleccionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
