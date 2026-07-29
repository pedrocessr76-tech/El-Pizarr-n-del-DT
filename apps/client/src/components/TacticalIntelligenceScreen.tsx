export function TacticalIntelligenceScreen() {
  return (
    <div className="relative w-full px-6 lg:px-8 pt-8 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">monitoring</span>
            <span className="font-label-md text-primary-container uppercase tracking-widest">
              Análisis Táctico Avanzado
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-bold">
            Inteligencia Táctica
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-xl mt-1">
            Métricas integradas de eficiencia ofensiva, solidez defensiva y control de posesión.
          </p>
        </div>

        <button className="bg-primary-container text-on-primary-container font-label-md font-bold px-5 py-2.5 rounded-xl shadow.glow-primary hover:bg-primary transition-all active:scale-95 flex items-center gap-2 self-start md:self-auto">
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          <span>Generar Reporte IA</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="bg-surface-container/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <span className="font-label-sm text-on-surface-variant uppercase text-xs tracking-wider">
              Ataque & Eficiencia
            </span>
            <span className="material-symbols-outlined text-primary-container text-2xl">
              bolt
            </span>
          </div>
          <div className="font-headline-xl text-primary-container font-extrabold text-4xl mb-2">
            88 / 100
          </div>
          <p className="text-xs text-on-surface-variant">
            Progresión vertical limpia y efectividad en tiros dentro del área.
          </p>
          <div className="mt-4 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary-container" style={{ width: '88%' }} />
          </div>
        </div>

        <div className="bg-surface-container/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <span className="font-label-sm text-on-surface-variant uppercase text-xs tracking-wider">
              Solidez Defensiva
            </span>
            <span className="material-symbols-outlined text-secondary-fixed text-2xl">
              shield
            </span>
          </div>
          <div className="font-headline-xl text-secondary-fixed font-extrabold text-4xl mb-2">
            82 / 100
          </div>
          <p className="text-xs text-on-surface-variant">
            Intercepciones en tercio medio y duelos aéreos ganados.
          </p>
          <div className="mt-4 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-secondary-fixed" style={{ width: '82%' }} />
          </div>
        </div>

        <div className="bg-surface-container/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <span className="font-label-sm text-on-surface-variant uppercase text-xs tracking-wider">
              Control & Posesión
            </span>
            <span className="material-symbols-outlined text-tertiary-container text-2xl">
              tune
            </span>
          </div>
          <div className="font-headline-xl text-tertiary-container font-extrabold text-4xl mb-2">
            91 / 100
          </div>
          <p className="text-xs text-on-surface-variant">
            Precisión de pase bajo presión y retención de balón.
          </p>
          <div className="mt-4 h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-tertiary-container" style={{ width: '91%' }} />
          </div>
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <div className="bg-surface-container/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-lg relative z-10">
        <h3 className="font-headline-md text-on-surface font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-container">schema</span>
          <span>Desglose de Patrones de Juego</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-high/40 p-4 rounded-xl border border-white/5">
            <h4 className="font-label-md text-on-surface font-semibold text-sm mb-1">
              Contraataque Rápido (Transición A-D)
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              3.2 segundos promedio desde recuperación hasta disparo. Alta eficacia por banda izquierda (LW).
            </p>
          </div>

          <div className="bg-surface-container-high/40 p-4 rounded-xl border border-white/5">
            <h4 className="font-label-md text-on-surface font-semibold text-sm mb-1">
              Presión Alta Intensiva
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Recuperación en primer tercio rival al 68% de eficacia en los minutos 15' a 30'.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
