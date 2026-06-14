import { useState, useEffect, useCallback } from 'react';
import { allChallenges, type Challenge } from '../data/challenges';
import { ChallengeCard } from '../components/ChallengeCard';
import { DailySchedule } from '../components/DailySchedule';
import { Confetti } from '../components/Confetti';
import {
  db, getSettings, updateSettings, getTodayStr, calculateStreak, completeToday,
  type DailyDraw, type Settings,
} from '../db';
import { Flame, BookOpen, Settings as SettingsIcon, Sparkles, Send, Loader2, RotateCcw } from 'lucide-react';
import { getApiKey, saveApiKey, generateReflection } from '../gemini';

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
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey());
  const [feelingText, setFeelingText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflectionError, setReflectionError] = useState('');
  const [initError, setInitError] = useState('');
  const [lastReflectAt, setLastReflectAt] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Init: load today's draw and streak
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const todayStr = getTodayStr();
        const [draw, s, stk] = await Promise.all([
          db.dailyDraws.get(todayStr),
          getSettings(),
          calculateStreak(),
        ]);
        if (!mounted) return;
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
          if (!mounted) return;
          setTodayDraw(newDraw);
          setStep('draw');
        }
      } catch (err) {
        console.error('Init failed:', err);
        if (mounted) {
          setInitError('載入資料失敗，請重新整理頁面');
          setStep('draw');
        }
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  const handleAccept = useCallback(async (time: string) => {
    if (!todayDraw) return;
    try {
      const updated = { ...todayDraw, plannedTime: time, acceptedAt: Date.now() };
      await db.dailyDraws.put(updated);
      setTodayDraw(updated);
      setStep('accepted');
    } catch (err) {
      console.error('handleAccept failed:', err);
    }
  }, [todayDraw]);

  const handleReject = useCallback(async () => {
    if (!todayDraw) return;
    try {
      // Mark as skipped and re-draw same difficulty (exclude current challenge)
      const list = allChallenges[todayDraw.difficulty].filter(c => c.id !== todayDraw.challengeId);
      const pool = list.length > 0 ? list : allChallenges[todayDraw.difficulty];
      const random = pool[Math.floor(Math.random() * pool.length)];
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
    } catch (err) {
      console.error('handleReject failed:', err);
    }
  }, [todayDraw]);

  const handleComplete = useCallback(async () => {
    try {
      await completeToday();
      const stk = await calculateStreak();
      setStreak(stk);
      setShowConfetti(true);
      setStep('completed');
    } catch (err) {
      console.error('handleComplete failed:', err);
    }
  }, []);

  const handleReflection = useCallback(async () => {
    if (!feelingText.trim() || !todayDraw) return;
    if (!getApiKey()) { setApiKeyInput(''); setShowSettings(true); return; }
    // 2-second cooldown to prevent spam
    if (Date.now() - lastReflectAt < 2000) return;
    setLastReflectAt(Date.now());
    setIsGenerating(true);
    setReflectionError('');
    try {
      const res = await generateReflection(todayDraw.text, feelingText.trim());
      setAiResponse(res);
    } catch (e) {
      setReflectionError(e instanceof Error ? e.message : '生成失敗');
    } finally {
      setIsGenerating(false);
    }
  }, [feelingText, todayDraw, lastReflectAt]);

  const handleChangeDifficulty = useCallback(async (diff: 'easy' | 'medium' | 'hard') => {
    if (!todayDraw) return;
    try {
      await updateSettings({ preferredDifficulty: diff });
      setSettings(prev => prev ? { ...prev, preferredDifficulty: diff } : prev);
      // Re-draw (exclude current challenge if same difficulty)
      const pool = todayDraw.difficulty === diff
        ? allChallenges[diff].filter(c => c.id !== todayDraw.challengeId)
        : allChallenges[diff];
      const list = pool.length > 0 ? pool : allChallenges[diff];
      const random = list[Math.floor(Math.random() * list.length)];
      const updated: DailyDraw = {
        ...todayDraw,
        challengeId: random.id,
        difficulty: diff,
        text: random.text,
        skippedAt: undefined,
        acceptedAt: undefined,
      };
      await db.dailyDraws.put(updated);
      setTodayDraw(updated);
      setStep('draw');
    } catch (err) {
      console.error('handleChangeDifficulty failed:', err);
    }
  }, [todayDraw]);

  const challenge: Challenge | null = todayDraw
    ? { id: todayDraw.challengeId, text: todayDraw.text, difficulty: todayDraw.difficulty }
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 flex flex-col items-center">
      <Confetti active={showConfetti} count={50} />
      {/* Header */}
      <header className="w-full max-w-lg mb-8 text-center relative pt-2">
        <div className="absolute right-0 top-0 flex gap-2">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="p-2 rounded-xl bg-zinc-900/80 text-zinc-500 hover:text-zinc-300 border border-zinc-800/60 transition-all hover:border-zinc-700"
            aria-label="設定"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
        <h1
          className="text-[2.6rem] font-black tracking-[-0.04em] text-brand-light mb-1.5 animate-brand-glow"
          style={{ letterSpacing: '-0.04em' }}
        >
          BreakTheLoop
        </h1>
        <p className="text-zinc-600 text-[11px] font-bold tracking-[0.22em] uppercase">
          生活破圈器
        </p>
        <div
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full"
          style={{
            background: 'rgba(184,131,95,0.08)',
            border: '1px solid rgba(184,131,95,0.2)',
            boxShadow: streak > 0 ? '0 0 16px rgba(184,131,95,0.12)' : 'none',
          }}
        >
          <Flame className={`w-4 h-4 text-orange-500 ${streak > 0 ? 'animate-flame' : ''}`} />
          <span className="text-sm font-bold text-zinc-300">
            連續破圈{' '}
            <span className="text-orange-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {streak}
            </span>{' '}
            天
          </span>
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
                        ? 'bg-brand-light text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {d === 'easy' ? '簡單' : d === 'medium' ? '中等' : '困難'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Gemini API Key（AI 反思功能）</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 h-9 px-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono focus:outline-none focus:border-brand-light"
                />
                <button
                  onClick={() => { saveApiKey(apiKeyInput); }}
                  className="px-3 py-1.5 rounded-xl bg-brand-light text-white text-xs font-bold hover:opacity-90"
                >儲存</button>
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
            {initError && <p className="mt-2 text-xs text-red-400">{initError}</p>}
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
          <section className="w-full flex flex-col items-center py-8">
            {/* Checkmark with bounce animation */}
            <div
              className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center mb-5"
              style={{ animation: 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            >
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold text-zinc-100 mb-2"
              style={{ animation: 'fadeIn 0.5s ease-out 0.3s both' }}
            >
              今日挑戰已完成！
            </h2>
            <p
              className="text-zinc-500 text-sm mb-6 text-center px-4"
              style={{ animation: 'fadeIn 0.5s ease-out 0.45s both' }}
            >
              {challenge.text}
            </p>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-2"
              style={{ animation: 'streakPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s both' }}
            >
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-300">連續 {streak} 天破圈</span>
            </div>
            <p
              className="text-zinc-600 text-xs mb-8"
              style={{ animation: 'fadeIn 0.5s ease-out 0.9s both' }}
            >
              明天會自動抽取新的挑戰，記得回來打卡
            </p>

            {/* AI Reflection */}
            <div
              className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3"
              style={{ animation: 'fadeIn 0.5s ease-out 1s both' }}
            >
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                和 AI 分享你的感受（選填）
              </div>
              {!aiResponse ? (
                <>
                  <textarea
                    value={feelingText}
                    onChange={e => setFeelingText(e.target.value)}
                    placeholder="今天完成這個挑戰的感覺怎麼樣？有什麼發現嗎？"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs resize-none focus:outline-none focus:border-brand-light placeholder:text-zinc-600"
                  />
                  {!getApiKey() && (
                    <p className="text-xs text-zinc-600">
                      💡 需先在右上角⚙️設定 Gemini API Key 才能使用 AI 反思功能
                    </p>
                  )}
                  {reflectionError && <p className="text-xs text-red-400">{reflectionError}</p>}
                  <button
                    onClick={handleReflection}
                    disabled={isGenerating || !feelingText.trim()}
                    className="w-full py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold hover:border-brand-light hover:text-brand-light disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />生成中...</> : <><Send className="w-3.5 h-3.5" />送出</>}
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-zinc-300 text-sm leading-relaxed">{aiResponse}</p>
                  <button
                    onClick={() => { setAiResponse(''); setFeelingText(''); }}
                    className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />重新輸入
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer Nav */}
      <footer className="w-full max-w-lg mt-12 py-6 border-t border-black/5 flex justify-center gap-8">
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
