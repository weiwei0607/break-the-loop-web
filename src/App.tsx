import { useState, lazy, Suspense } from 'react';
import { Index } from './pages/Index';

const Passbook = lazy(() => import('./pages/Passbook').then(m => ({ default: m.Passbook })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));

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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        {view === 'onboarding' && <Onboarding onDone={handleOnboardingDone} />}
        {view === 'passbook' && <Passbook onBack={() => setView('index')} />}
      </Suspense>
      {view === 'index' && <Index onGoToPassbook={() => setView('passbook')} />}
    </div>
  );
}
