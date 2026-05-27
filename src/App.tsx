import CrisisGame from './components/CrisisGame';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950">
      <CrisisGame />
    </div>
  );
}
