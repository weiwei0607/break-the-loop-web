import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Challenge } from '../data/challenges';

interface Props {
  difficulty: 'easy' | 'medium' | 'hard';
  challenge: Challenge;
  onAccept: (time: string) => void;
  onReject: () => void;
}

// 「呼吸」調性：難度用柔和大地色（鼠尾草 / 陶土 / 暮玫瑰），不再是紅綠燈警示色
const difficultyConfig = {
  easy: {
    label: '簡單',
    color: 'bg-brand-light',
    shadow: 'shadow-black/10',
    gradient: 'linear-gradient(150deg, #a6b794 0%, #8b9d7a 100%)',
    glow: 'rgba(139,157,122,0.28)',
    badgeBg: '#8b9d7a',
  },
  medium: {
    label: '中等',
    color: 'bg-orange-500',
    shadow: 'shadow-black/10',
    gradient: 'linear-gradient(150deg, #cdab8e 0%, #b8835f 100%)',
    glow: 'rgba(184,131,95,0.28)',
    badgeBg: '#b8835f',
  },
  hard: {
    label: '困難',
    color: 'bg-red-500',
    shadow: 'shadow-black/10',
    gradient: 'linear-gradient(150deg, #c39a93 0%, #a86f68 100%)',
    glow: 'rgba(168,111,104,0.26)',
    badgeBg: '#a86f68',
  },
};

const isValidTime = (value: string): boolean => {
  if (value.length !== 4) return false;
  const hh = parseInt(value.slice(0, 2), 10);
  const mm = parseInt(value.slice(2, 4), 10);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
};

export const ChallengeCard: React.FC<Props> = ({ difficulty, challenge, onAccept, onReject }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeInput, setTimeInput] = useState('');
  const [shake, setShake] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = difficultyConfig[difficulty];

  useEffect(() => () => { if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current); }, []);

  const handleFlip = useCallback(() => {
    if (!isFlipped) setIsFlipped(true);
  }, [isFlipped]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setTimeInput(raw);
  }, []);

  const handleAccept = useCallback(() => {
    if (!isValidTime(timeInput)) {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      setShake(true);
      shakeTimerRef.current = setTimeout(() => setShake(false), 400);
      return;
    }
    onAccept(timeInput);
  }, [timeInput, onAccept]);

  const handleReject = useCallback(() => {
    setIsFlipped(false);
    setTimeInput('');
    onReject();
  }, [onReject]);

  return (
    <div
      className="relative w-[min(288px,85vw)] h-[min(384px,75vw+100px)] cursor-pointer [perspective:1000px]"
      onClick={handleFlip}
      role="button"
      aria-label="點擊翻開挑戰卡片"
    >
      <div
        className={[
          'relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d]',
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        ].join(' ')}
      >
        {/* 正面 */}
        <div
          className={[
            'absolute inset-0 flex flex-col items-center justify-center rounded-2xl [backface-visibility:hidden] overflow-hidden',
            isFlipped ? 'pointer-events-none' : '',
          ].join(' ')}
          style={{
            background: config.gradient,
            boxShadow: `0 16px 44px ${config.glow}, 0 4px 14px rgba(120,90,60,0.14)`,
            border: '1px solid rgba(255,255,255,0.22)',
          }}
        >
          {/* Dot-grid texture overlay */}
          <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
          {/* Center radial highlight */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', filter: 'blur(24px)' }} />
          </div>
          {/* Top shine */}
          <div className="absolute top-0 left-0 right-0 h-1/3 rounded-t-2xl pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, transparent 100%)' }} />

          <div className="relative z-10 font-serif text-[5rem] font-medium text-white leading-none mb-3"
            style={{ textShadow: '0 2px 14px rgba(80,60,40,0.18)' }}>
            ?
          </div>
          <div className="relative z-10 text-xl font-black tracking-[0.12em] text-white"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {config.label}挑戰
          </div>
          <div className="relative z-10 mt-6 px-4 py-1.5 rounded-full text-xs font-bold text-white/70 tracking-widest animate-pulse"
            style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.15)' }}>
            點擊翻開命運
          </div>
        </div>

        {/* 背面 */}
        <div
          className={[
            'absolute inset-0 flex flex-col items-center justify-between p-6 rounded-2xl [transform:rotateY(180deg)] [backface-visibility:hidden]',
            isFlipped ? 'pointer-events-auto' : 'pointer-events-none',
          ].join(' ')}
          style={{
            background: 'linear-gradient(160deg, #fbf7ee 0%, #efe7d8 100%)',
            border: '1px solid rgba(120,90,60,0.12)',
            boxShadow: '0 12px 40px rgba(120,90,60,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full text-center">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase text-white"
              style={{ background: config.badgeBg, boxShadow: `0 4px 12px ${config.glow}` }}>
              {config.label}
            </span>
            <p className="mt-8 font-serif text-[1.35rem] font-medium leading-relaxed text-zinc-100">
              {challenge.text}
            </p>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <label htmlFor="challenge-time" className="text-xs text-zinc-500 ml-1">
                預計執行時間 (如 1830)
              </label>
              <input
                id="challenge-time"
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="輸入四位數字"
                className={[
                  'w-full bg-zinc-800 border-none rounded-lg p-3 text-zinc-100 transition-all outline-none',
                  'focus:ring-2 focus:ring-brand-light',
                  shake ? 'animate-shake ring-2 ring-red-500' : ''
                ].join(' ')}
                value={timeInput}
                onChange={handleTimeChange}
                onClick={(e) => e.stopPropagation()}
              />
              {timeInput.length === 4 && !isValidTime(timeInput) && (
                <p className="text-xs text-red-400 ml-1">請輸入有效的時間 (0000-2359)</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={timeInput.length !== 4}
                className="flex-1 bg-brand-light hover:bg-brand/90 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all"
              >
                接受挑戰
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-3 rounded-xl border border-black/10 text-zinc-400 hover:bg-black/5 transition-all"
              >
                放棄
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
