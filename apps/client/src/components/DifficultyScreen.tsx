interface DifficultyScreenProps {
  onStartTournament?: (difficulty: string) => void;
}

export function DifficultyScreen({ onStartTournament }: DifficultyScreenProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-margin bg-background/95 backdrop-blur-md transition-all duration-500 font-body-md text-on-surface">
      <div className="relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <div className="col-span-1 md:col-span-4 mb-lg text-center">
          <span className="font-label-md text-label-md text-primary-container uppercase tracking-[0.2em] block mb-sm font-bold">
            Nivel de Desafío
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface font-extrabold text-3xl sm:text-4xl">
            Selecciona tu Dificultad
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm max-w-lg mx-auto text-sm">
            La dificultad afecta la agresividad de la IA en el mercado y la precisión táctica de los rivales en el campo.
          </p>
        </div>

        {/* Difficulty Cards */}
        <button
          onClick={() => onStartTournament?.('Principiante')}
          className="group relative flex flex-col p-lg bg-surface-container rounded-xl hover:bg-primary/10 transition-all duration-300 text-left overflow-hidden border border-white/5 hover:border-primary-container/50 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">sports_soccer</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs font-bold">01</span>
          <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary-container transition-colors font-bold text-xl">
            Principiante
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-md text-xs leading-relaxed">
            Rivales balanceados. Ideal para probar nuevas tácticas.
          </p>
        </button>

        <button
          onClick={() => onStartTournament?.('Profesional')}
          className="group relative flex flex-col p-lg bg-surface-container rounded-xl hover:bg-secondary/10 transition-all duration-300 text-left overflow-hidden border border-white/5 hover:border-secondary-container/50 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">star</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs font-bold">02</span>
          <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-secondary-container transition-colors font-bold text-xl">
            Profesional
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-md text-xs leading-relaxed">
            Simulación estándar. Los errores se pagan caros.
          </p>
        </button>

        <button
          onClick={() => onStartTournament?.('Clase Mundial')}
          className="group relative flex flex-col p-lg bg-surface-container rounded-xl hover:bg-tertiary/10 transition-all duration-300 text-left overflow-hidden border border-white/5 hover:border-tertiary-container/50 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">military_tech</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs font-bold">03</span>
          <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-tertiary-container transition-colors font-bold text-xl">
            Clase Mundial
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-md text-xs leading-relaxed">
            Estrategias avanzadas y presión alta constante.
          </p>
        </button>

        <button
          onClick={() => onStartTournament?.('Leyenda')}
          className="group relative flex flex-col p-lg bg-surface-container rounded-xl hover:bg-error/10 transition-all duration-300 text-left overflow-hidden border border-white/5 hover:border-error/50 shadow-lg"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
            <span className="material-symbols-outlined text-[64px]">trophy</span>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant mb-xs font-bold">04</span>
          <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-error transition-colors font-bold text-xl">
            Leyenda
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-md text-xs leading-relaxed">
            Máxima precisión. Solo para los mejores DTs.
          </p>
        </button>
      </div>
    </div>
  );
}
