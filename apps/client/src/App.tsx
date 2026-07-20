import { PackOpener } from './components/PackOpener';
import { PitchBoard } from './components/PitchBoard';
import { MatchSimulator } from './components/MatchSimulator';

function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.15),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(135deg,_#07131f,_#15364f)] px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8">
        <header className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-black/20">
          <h1 className="text-4xl font-bold text-white">El Pizarrón del DT</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Construye tu equipo con sobres, selecciona la dificultad y enfrenta a un rival generado por IA.
          </p>
        </header>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-8">
            <PackOpener />
            <MatchSimulator />
          </div>
          <PitchBoard />
        </div>
      </div>
    </main>
  );
}

export default App;
