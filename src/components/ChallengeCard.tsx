import React, { useState, useCallback } from 'react';
import { Challenge } from '../data/challenges';

interface Props {
  difficulty: 'easy' | 'medium' | 'hard';
  challenge: Challenge;
  onAccept: (time: string) => void;
  onReject: () => void;
}

const difficultyConfig = {
  easy: { label: '簡單', color: 'bg-green-500', shadow: 'shadow-green-500/50' },
  medium: { label: '中等', color: 'bg-orange-500', shadow: 'shadow-orange-500/50' },
  hard: { label: '困難', color: 'bg-red-500', shadow: 'shadow-red-500/50' }
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
  const config = difficultyConfig[difficulty];

  const handleFlip = useCallback(() => {
    if (!isFlipped) setIsFlipped(true);
  }, [isFlipped]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setTimeInput(raw);
  }, []);

  const handleAccept = useCallback(() => {
    if (!isValidTime(timeInput)) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
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
      className="relative w-72 h-96 cursor-pointer [perspective:1000px]"
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
            'absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-4 border-white/20 shadow-2xl [backface-visibility:hidden]',
            config.color,
            config.shadow
          ].join(' ')}
        >
          <div className="text-6xl mb-4">?</div>
          <div className="text-2xl font-bold tracking-widest text-white">{config.label}挑戰</div>
          <div className="mt-8 text-sm text-white/60 animate-pulse">點擊翻開命運</div>
        </div>

        {/* 背面 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-between p-6 rounded-2xl bg-zinc-900 border-4 border-white/10 [transform:rotateY(180deg)] [backface-visibility:hidden]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase text-white ${config.color}`}>
              {config.label}
            </span>
            <p className="mt-8 text-xl font-medium leading-relaxed text-zinc-100">
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
                  'w-full bg-zinc-800 border-none rounded-lg p-3 text-white transition-all outline-none',
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
                className="flex-1 bg-brand-light hover:bg-brand-light/80 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-900 font-bold py-3 rounded-xl transition-all"
              >
                接受挑戰
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-3 rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5 transition-all"
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
