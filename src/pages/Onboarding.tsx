import { useState, useCallback } from 'react';
import { Zap, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { updateSettings } from '../db';

interface Props {
  onDone: () => void;
}

const STEPS = [
  {
    num: '01',
    Icon: Zap,
    iconColor: '#8b9d7a',
    iconBg: 'rgba(139,157,122,0.10)',
    iconBorder: 'rgba(139,157,122,0.18)',
    title: '每天只需\n2 分鐘',
    desc: '每天抽一張身體覺察任務，打破無意識的慣性循環，讓生活重新有感。',
    accent: '#8b9d7a',
  },
  {
    num: '02',
    Icon: Clock,
    iconColor: '#b8835f',
    iconBg: 'rgba(251,146,60,0.10)',
    iconBorder: 'rgba(251,146,60,0.18)',
    title: '嵌入你的\n時程表',
    desc: '翻開卡片後輸入預計完成時間（例如 1830），挑戰自動插入今日行程。',
    accent: '#b8835f',
  },
  {
    num: '03',
    Icon: Sparkles,
    iconColor: '#a98a92',
    iconBg: 'rgba(192,132,252,0.10)',
    iconBorder: 'rgba(192,132,252,0.18)',
    title: 'AI 陪你\n反思成長',
    desc: '完成後分享感受，AI 給你個性化的鼓勵和一個值得思考的問題。',
    accent: '#a98a92',
  },
];

const DIFFICULTIES = [
  {
    key: 'easy' as const,
    emoji: '🌱',
    label: '簡單',
    labelEn: 'EASY',
    desc: '5–10 分鐘，身體覺察小動作',
    color: '#8b9d7a',
    activeBorder: 'rgba(139,157,122,0.5)',
    activeBg: 'rgba(139,157,122,0.08)',
  },
  {
    key: 'medium' as const,
    emoji: '🌿',
    label: '中等',
    labelEn: 'MEDIUM',
    desc: '20–40 分鐘，需要行動力',
    color: '#b8835f',
    activeBorder: 'rgba(184,131,95,0.5)',
    activeBg: 'rgba(184,131,95,0.08)',
  },
  {
    key: 'hard' as const,
    emoji: '🌳',
    label: '困難',
    labelEn: 'HARD',
    desc: '跨出舒適圈的深度挑戰',
    color: '#a86f68',
    activeBorder: 'rgba(168,111,104,0.5)',
    activeBg: 'rgba(168,111,104,0.08)',
  },
];

export const Onboarding: React.FC<Props> = ({ onDone }) => {
  const [step, setStep] = useState(0); // 0-2 = intro, 3 = difficulty
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const isIntro = step < STEPS.length;
  const current = isIntro ? STEPS[step] : null;
  const totalSteps = STEPS.length + 1;

  const handleNext = useCallback(() => setStep(s => s + 1), []);

  const handleFinish = useCallback(async () => {
    try { await updateSettings({ preferredDifficulty: difficulty }); } catch { /* noop */ }
    onDone();
  }, [difficulty, onDone]);

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col relative overflow-hidden"
      style={{ background: '#f5f0e5' }}>

      {/* Ambient color glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[280px] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse, ${isIntro ? current!.accent : '#8b9d7a'}0D 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }} />

      {/* Header */}
      <div className="relative z-10 px-6 pt-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(139,157,122,0.12)', border: '1px solid rgba(139,157,122,0.2)' }}>
            <Zap size={14} style={{ color: '#8b9d7a' }} />
          </div>
          <span className="text-[13px] font-semibold text-zinc-500">BreakTheLoop</span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300" style={{
              width: i === step ? 18 : 6,
              height: 6,
              background: i === step
                ? (isIntro ? current!.accent : '#8b9d7a')
                : i < step ? 'rgba(58,51,39,0.25)' : 'rgba(58,51,39,0.08)',
            }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-14 pb-8">
        {isIntro && current ? (
          <div key={step} className="animate-slide-up flex-1 flex flex-col">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-7"
              style={{ color: current.accent, opacity: 0.65 }}>
              STEP {current.num}
            </p>

            <div className="w-[68px] h-[68px] rounded-[1.25rem] flex items-center justify-center mb-8"
              style={{ background: current.iconBg, border: `1px solid ${current.iconBorder}` }}>
              <current.Icon size={30} style={{ color: current.iconColor }} />
            </div>

            <h1 className="font-black leading-[1.08] mb-5" style={{
              fontSize: '2.15rem', letterSpacing: '-0.035em', whiteSpace: 'pre-line'
            }}>
              {current.title}
            </h1>

            <p className="text-[15px] leading-[1.65]" style={{ color: 'rgba(58,51,39,0.45)', maxWidth: 300 }}>
              {current.desc}
            </p>

            <div className="flex-1" />

            <button onClick={handleNext}
              className="w-full py-[1.05rem] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{
                background: current.accent,
                color: '#ffffff',
                boxShadow: `0 8px 24px ${current.accent}28`,
              }}>
              {step === STEPS.length - 1 ? '選擇難度' : '繼續'}
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Difficulty */
          <div className="animate-slide-up flex-1 flex flex-col">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-7"
              style={{ color: '#8b9d7a', opacity: 0.65 }}>
              最後一步
            </p>

            <h1 className="font-black leading-[1.08] mb-2" style={{ fontSize: '2.1rem', letterSpacing: '-0.035em' }}>
              選擇難度
            </h1>
            <p className="text-[14px] mb-8" style={{ color: 'rgba(58,51,39,0.35)' }}>
              之後在設定中可以隨時更改
            </p>

            <div className="space-y-2.5 flex-1">
              {DIFFICULTIES.map(d => {
                const active = difficulty === d.key;
                return (
                  <button key={d.key} onClick={() => setDifficulty(d.key)}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
                    style={{
                      background: active ? d.activeBg : 'rgba(58,51,39,0.03)',
                      border: `1px solid ${active ? d.activeBorder : 'rgba(58,51,39,0.07)'}`,
                    }}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: active ? d.activeBg : 'rgba(58,51,39,0.04)' }}>
                      {d.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-[15px]" style={{ color: active ? d.color : 'rgba(58,51,39,0.88)' }}>
                          {d.label}
                        </p>
                        <p className="text-[10px] font-bold tracking-widest" style={{ color: 'rgba(58,51,39,0.18)' }}>
                          {d.labelEn}
                        </p>
                      </div>
                      <p className="text-[12px] mt-0.5 truncate" style={{ color: 'rgba(58,51,39,0.35)' }}>
                        {d.desc}
                      </p>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: active ? d.color : 'transparent',
                        border: `2px solid ${active ? d.color : 'rgba(58,51,39,0.15)'}`,
                      }}>
                      {active && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button onClick={handleFinish}
              className="mt-6 w-full py-[1.05rem] rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              style={{
                background: '#8b9d7a',
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(139,157,122,0.22)',
              }}>
              開始破圈
              <Zap size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
