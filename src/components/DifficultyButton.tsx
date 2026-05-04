import React, { useCallback } from 'react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  label: string;
  subLabel: string;
  color: string;
  bgColor: string;
}

const configMap: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: 'Easy 簡單',
    subLabel: '5至10分鐘小確幸',
    color: 'text-green-500',
    bgColor: 'bg-green-500',
  },
  medium: {
    label: 'Medium 中等',
    subLabel: '需要20至40分鐘行動',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
  },
  hard: {
    label: 'Hard 困難',
    subLabel: '跨出舒適圈的挑戰',
    color: 'text-red-500',
    bgColor: 'bg-red-500',
  },
};

interface Props {
  difficulty: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
}

export const DifficultyButton: React.FC<Props> = ({ difficulty, onSelect }) => {
  const cfg = configMap[difficulty];

  const handleClick = useCallback(() => {
    onSelect(difficulty);
  }, [difficulty, onSelect]);

  return (
    <button
      onClick={handleClick}
      className="group relative overflow-hidden bg-zinc-900 border border-white/5 p-6 rounded-2xl flex items-center justify-between transition-all hover:bg-zinc-800 hover:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-light/50"
    >
      <div className="flex flex-col items-start">
        <span className={`${cfg.color} font-bold uppercase text-xs tracking-widest mb-1`}>
          {cfg.label}
        </span>
        <span className="text-lg font-medium text-zinc-100">
          {cfg.subLabel}
        </span>
      </div>
      <div
        className={[
          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
          `${cfg.bgColor}/10 ${cfg.color}`,
          `group-hover:${cfg.bgColor} group-hover:text-zinc-950`,
        ].join(' ')}
      >
        →
      </div>
    </button>
  );
};
