import { useState } from 'react';
import { Index } from './pages/Index';
import { Passbook } from './pages/Passbook';

type View = 'index' | 'passbook';

export default function App() {
  const [view, setView] = useState<View>('index');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {view === 'index' && <Index onGoToPassbook={() => setView('passbook')} />}
      {view === 'passbook' && <Passbook onBack={() => setView('index')} />}
    </div>
  );
}
