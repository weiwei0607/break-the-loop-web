import { useState, useCallback } from 'react';
import { Zap, Clock, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { updateSettings } from '../db';

interface Props {
  onDone: () => void;
}

const steps = [
  {
    icon: <Zap className="w-10 h-10 text-brand-light" />,
    title: '每天只需 2 分鐘',
    desc: '每天抽一張身體覺察任務，打破無意識的慣性循環，讓生活重新有感。',
  },
  {
    icon: <Clock className="w-10 h-10 text-orange-400" />,
    title: '設定執行時間',
    desc: '翻開卡片後，輸入你預計完成的時間（例如 1830），任務就會嵌入今日時程。',
  },
  {
    icon: <Sparkles className="w-10 h-10 text-purple-400" />,
    title: 'AI 陪你反思',
    desc: '完成挑戰後，可以選填感受，讓 AI 給你個性化的鼓勵和一個值得思考的問題。',
  },
];

export const Onboarding: React.FC<Props> = ({ onDone }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const isLast = currentStep === steps.length;

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCurrentStep(steps.length); // difficulty selection
    }
  }, [currentStep]);

  const handleFinish = useCallback(async () => {
    try {
      await updateSettings({ preferredDifficulty: selectedDifficulty });
    } catch {
      // best-effort
    }
    onDone();
  }, [selectedDifficulty, onDone]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-3xl font-black tracking-tighter text-brand-light mb-10">
        BreakTheLoop
      </h1>

      {!isLast ? (
        <div
          key={currentStep}
          className="w-full max-w-sm flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-500"
        >
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
            {steps[currentStep].icon}
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-3">{steps[currentStep].title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-10">{steps[currentStep].desc}</p>

          {/* Step dots */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-5 h-2 bg-brand-light'
                    : i < currentStep
                    ? 'w-2 h-2 bg-brand-light/50'
                    : 'w-2 h-2 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl bg-brand-light text-zinc-900 font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            繼續 <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-500">
          <h2 className="text-xl font-bold text-zinc-100 mb-2 text-center">選擇你的挑戰難度</h2>
          <p className="text-zinc-500 text-sm text-center mb-8">之後在設定中可以隨時更改</p>

          <div className="space-y-3 mb-8">
            {([
              { key: 'easy' as const, emoji: '🌱', label: '簡單', desc: '5–10 分鐘，身體覺察小動作' },
              { key: 'medium' as const, emoji: '🌿', label: '中等', desc: '20–40 分鐘，需要行動力' },
              { key: 'hard' as const, emoji: '🌳', label: '困難', desc: '跨出舒適圈的深度挑戰' },
            ]).map(d => (
              <button
                key={d.key}
                onClick={() => setSelectedDifficulty(d.key)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  selectedDifficulty === d.key
                    ? 'bg-brand-light/10 border-brand-light/50 ring-1 ring-brand-light/30'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span className="text-2xl">{d.emoji}</span>
                <div className="flex-1">
                  <p className="font-bold text-zinc-100 text-sm">{d.label}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{d.desc}</p>
                </div>
                {selectedDifficulty === d.key && (
                  <CheckCircle2 className="w-5 h-5 text-brand-light shrink-0" />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3.5 rounded-2xl bg-brand-light text-zinc-900 font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            開始破圈！<Zap className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
