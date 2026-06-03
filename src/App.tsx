import { useState } from 'react';
import { Index } from './pages/Index';
import { Passbook } from './pages/Passbook';
import { Onboarding } from './pages/Onboarding';

type View = 'onboarding' | 'index' | 'passbook';

const ONBOARDING_KEY = 'btl_onboarding_done';

function getInitialView(): View {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1' ? 'index' : 'onboarding';
  } catch {
    return 'index';
  }
}

export default function App() {
  const [view, setView] = useState<View>(getInitialView);

  function handleOnboardingDone() {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch { /* noop */ }
    setView('index');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {view === 'onboarding' && <Onboarding onDone={handleOnboardingDone} />}
      {view === 'index' && <Index onGoToPassbook={() => setView('passbook')} />}
      {view === 'passbook' && <Passbook onBack={() => setView('index')} />}
    </div>
  );
}
