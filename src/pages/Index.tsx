import { useState, useEffect, useCallback } from 'react';
import { allChallenges, type Challenge } from '../data/challenges';
import { ChallengeCard } from '../components/ChallengeCard';
import { DailySchedule } from '../components/DailySchedule';
import {
  db, getSettings, updateSettings, getTodayStr, calculateStreak, completeToday,
  type DailyDraw, type Settings,
} from '../db';
import { Flame, BookOpen, Settings as SettingsIcon } from 'lucide-react';

type Step = 'loading' | 'draw' | 'accepted' | 'completed';

interface Props {
  onGoToPassbook: () => void;
}

export const Index: React.FC<Props> = ({ onGoToPassbook }) => {
  const [step, setStep] = useState<Step>('loading');
  const [todayDraw, setTodayDraw] = useState<DailyDraw | null>(null);
  const [streak, setStreak] = useState(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Init: load today's draw and streak
  useEffect(() => {
    async function init() {
      const todayStr = getTodayStr();
      const [draw, s, stk] = await Promise.all([
        db.dailyDraws.get(todayStr),
        getSettings(),
        calculateStreak(),
      ]);
      setStreak(stk);
      setSettings(s);

      if (draw) {
        setTodayDraw(draw);
        if (draw.completedAt) {
          setStep('completed');
        } else if (draw.acceptedAt) {
          setStep('accepted');
        } else {
          setStep('draw');
        }
      } else {
        // Auto-draw based on preference
        const diff = s.preferredDifficulty || 'easy';
        const list = allChallenges[diff];
        const random = list[Math.floor(Math.random() * list.length)];
        const newDraw: DailyDraw = {
          id: todayStr,
          challengeId: random.id,
          difficulty: diff,
          text: random.text,
          plannedTime: '',
        };
        await db.dailyDraws.put(newDraw);
        setTodayDraw(newDraw);
        setStep('draw');
      }
    }
    init();
  }, []);

  const handleAccept = useCallback(async (time: string) => {
    if (!todayDraw) return;
    const updated = { ...todayDraw, plannedTime: time, acceptedAt: Date.now() };
    await db.dailyDraws.put(updated);
    setTodayDraw(updated);
    setStep('accepted');
  }, [todayDraw]);

  const handleReject = useCallback(async () => {
    if (!todayDraw) return;
    // Mark as skipped and re-draw same difficulty
    const list = allChallenges[todayDraw.difficulty];
    const random = list[Math.floor(Math.random() * list.length)];
    const updated: DailyDraw = {
      ...todayDraw,
      challengeId: random.id,
      text: random.text,
      skippedAt: Date.now(),
      acceptedAt: undefined,
    };
    await db.dailyDraws.put(updated);
    setTodayDraw(updated);
    setStep('draw');
  }, [todayDraw]);

  const handleComplete = useCallback(async () => {
    await completeToday();
    const stk = await calculateStreak();
    setStreak(stk);
    setStep('completed');
  }, []);

  const handleChangeDifficulty = useCallback(async (diff: 'easy' | 'medium' | 'hard') => {
    await updateSettings({ preferredDifficulty: diff });
    setSettings(prev => prev ? { ...prev, preferredDifficulty: diff } : prev);
    // Re-draw
    const list = allChallenges[diff];
    const random = list[Math.floor(Math.random() * list.length)];
    const updated: DailyDraw = {
      ...todayDraw!,
      challengeId: random.id,
      difficulty: diff,
      text: random.text,
      skippedAt: undefined,
      acceptedAt: undefined,
    };
    await db.dailyDraws.put(updated);
    setTodayDraw(updated);
    setStep('draw');
  }, [todayDraw]);

  const challenge: Challenge | null = todayDraw
    ? { id: todayDraw.challengeId, text: todayDraw.text, difficulty: todayDraw.difficulty }
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-lg mb-8 text-center relative">
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="設定"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-brand-light mb-2">
          BreakTheLoop
        </h1>
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">
          生活破圈器
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-bold text-zinc-300">連續破圈 <span className="text-orange-400">{streak}</span> 天</span>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && settings && (
        <div className="w-full max-w-lg mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">偏好設定</h3>
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">預設難度（每日自動抽選）</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => handleChangeDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      settings.preferredDifficulty === d
                        ? 'bg-brand-light text-zinc-900'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {d === 'easy' ? '簡單' : d === 'medium' ? '中等' : '困難'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-lg flex flex-col items-center flex-1">
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-light border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-zinc-500 text-sm">正在抽取今日挑戰...</p>
          </div>
        )}

        {step === 'draw' && challenge && (
          <section className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-12 duration-700 w-full">
            <div className="mb-6 text-center">
              <p className="text-zinc-400 text-sm">今日自動抽選</p>
              <p className="text-zinc-600 text-xs mt-1">不喜歡可以重新抽取</p>
            </div>
            <div className="mb-12">
              <ChallengeCard
                difficulty={challenge.difficulty}
                challenge={challenge}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            </div>
          </section>
        )}

        {step === 'accepted' && challenge && todayDraw && (
          <section className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
            <DailySchedule
              challengeText={challenge.text}
              challengeTime={todayDraw.plannedTime}
              onComplete={handleComplete}
            />
          </section>
        )}

        {step === 'completed' && challenge && (
          <section className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-700 py-12">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">今日挑戰已完成！</h2>
            <p className="text-zinc-500 text-sm mb-8">{challenge.text}</p>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-300">連續 {streak} 天</span>
            </div>
            <p className="mt-8 text-zinc-600 text-xs">明天會自動抽取新的挑戰，記得回來打卡</p>
          </section>
        )}
      </main>

      {/* Footer Nav */}
      <footer className="w-full max-w-lg mt-12 py-6 border-t border-white/5 flex justify-center gap-8">
        <button
          onClick={onGoToPassbook}
          className="text-xs font-bold tracking-widest uppercase text-zinc-600 hover:text-brand-light transition-all flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          任務存摺
        </button>
      </footer>
    </div>
  );
};
