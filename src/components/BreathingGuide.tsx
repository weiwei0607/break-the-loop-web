import { useState, useEffect } from 'react';

interface Props {
  challengeText: string;
}

const bodyAwarenessKeywords = [
  '呼吸', '伸展', '身體', '閉眼', '冥想', '放鬆', '肩膀', '脖子', '脊椎', '腰部',
  '手指', '腳趾', '手腕', '腳踝', '膝蓋', '臀部', '胸部', '腹部', '頭皮', '耳朵',
  '舌頭', '下巴', '眼球', '肌肉', '關節', '姿勢', '坐直', '站立', '走路', '踏步',
  '按摩', '敲打', '搓揉', '觸摸', '感受', '溫度', '重量', '平衡', '單腳', '閉目',
];

function isBodyAwareness(text: string): boolean {
  return bodyAwarenessKeywords.some(k => text.includes(k));
}

export const BreathingGuide: React.FC<Props> = ({ challengeText }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in on mount
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // 4-7-8 breathing cycle mapped to a simpler 4-2-6 visual cycle
    const cycle = () => {
      setPhase('inhale');
      const t1 = setTimeout(() => {
        setPhase('hold');
        const t2 = setTimeout(() => {
          setPhase('exhale');
        }, 2000);
        return () => clearTimeout(t2);
      }, 4000);
      return () => clearTimeout(t1);
    };

    cycle();
    const interval = setInterval(cycle, 12000);
    return () => clearInterval(interval);
  }, []);

  const phaseText = {
    inhale: '吸氣 — 感受身體的擴張',
    hold: '屏息 — 停留在這個瞬間',
    exhale: '吐氣 — 釋放所有的緊繃',
  };

  const phaseClass = {
    inhale: 'breathing-inhale',
    hold: 'breathing-hold',
    exhale: 'breathing-exhale',
  };

  if (!isBodyAwareness(challengeText)) return null;

  return (
    <div
      className={`flex flex-col items-center transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Outer glow rings */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-brand-light/20 ${phaseClass[phase]}`}
        />
        <div
          className={`absolute inset-2 rounded-full border border-brand-light/10 ${phaseClass[phase]}`}
          style={{ animationDelay: '0.5s' }}
        />
        {/* Core breathing orb */}
        <div
          className={`w-20 h-20 rounded-full bg-brand-light/10 backdrop-blur-sm ${phaseClass[phase]}`}
        />
        {/* Center dot */}
        <div className="absolute w-3 h-3 rounded-full bg-brand-light/80" />
      </div>

      <p className="mt-4 text-sm font-medium text-brand-light/90 tracking-wide text-center">
        {phaseText[phase]}
      </p>
      <p className="mt-1 text-xs text-zinc-500 text-center">
        跟著圓圈的節奏，專注於此刻的身體感受
      </p>
    </div>
  );
};
