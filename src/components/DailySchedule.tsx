import { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { BreathingGuide } from './BreathingGuide';

interface ScheduleItem {
  id: string;
  time: string;
  activity: string;
  isChallenge?: boolean;
}

const defaultSchedule: ScheduleItem[] = [
  { id: 'default-1', time: '0800', activity: '起床洗漱' },
  { id: 'default-2', time: '0900', activity: '開始工作或學習' },
  { id: 'default-3', time: '1200', activity: '午餐休息時間' },
  { id: 'default-4', time: '1400', activity: '下午時段任務' },
  { id: 'default-5', time: '1800', activity: '下班或晚餐' },
  { id: 'default-6', time: '2200', activity: '準備就寢' },
];

const formatTime = (hhmm: string): string => {
  if (hhmm.length !== 4) return hhmm;
  const hh = hhmm.slice(0, 2);
  const mm = hhmm.slice(2, 4);
  return `${hh}:${mm}`;
};

interface Props {
  challengeText: string;
  challengeTime: string;
  onComplete: () => void;
}

export const DailySchedule: React.FC<Props> = ({ challengeText, challengeTime, onComplete }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const fullSchedule = useMemo(() => {
    const challengeItem: ScheduleItem = {
      id: 'challenge',
      time: challengeTime,
      activity: challengeText,
      isChallenge: true,
    };
    return [...defaultSchedule, challengeItem].sort(
      (a, b) => parseInt(a.time, 10) - parseInt(b.time, 10)
    );
  }, [challengeText, challengeTime]);

  const handleToggleComplete = useCallback(() => {
    setIsCompleted(true);
    setTimeout(() => {
      onComplete();
    }, 800);
  }, [onComplete]);

  return (
    <div className="w-full max-w-md mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* 時程表區 */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-black/10" />
          <h2 className="text-zinc-500 tracking-widest text-sm font-bold uppercase">
            今日時程
          </h2>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <div className="space-y-2">
          {fullSchedule.map((item) => (
            <div
              key={item.id}
              className={[
                'flex items-center gap-4 p-4 rounded-xl transition-all',
                item.isChallenge
                  ? 'bg-brand-light/10 border border-brand-light/30 ring-1 ring-brand-light/20'
                  : 'bg-black/[0.04]',
              ].join(' ')}
            >
              <div className="text-zinc-500 font-mono text-sm w-14 shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(item.time)}
              </div>
              <div
                className={[
                  'flex-1 font-medium text-sm',
                  item.isChallenge ? 'text-brand-light' : 'text-zinc-300',
                ].join(' ')}
              >
                {item.activity}
                {item.isChallenge && (
                  <span className="ml-2 text-[10px] bg-brand-light text-white px-1.5 py-0.5 rounded-sm font-bold">
                    挑戰
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 身體覺察引導 */}
      <section className="py-6">
        <BreathingGuide challengeText={challengeText} />
      </section>

      {/* 完成按鈕 */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-black/10" />
          <h2 className="text-zinc-500 tracking-widest text-sm font-bold uppercase">
            完成打卡
          </h2>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <button
          onClick={handleToggleComplete}
          disabled={isCompleted}
          className={[
            'w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg transition-all',
            isCompleted
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-brand-light text-white hover:bg-brand-light/90 active:scale-[0.98]',
          ].join(' ')}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="w-6 h-6" />
              已完成
            </>
          ) : (
            <>
              <CheckCircle2 className="w-6 h-6" />
              標記完成
            </>
          )}
        </button>
        <p className="text-center text-zinc-600 text-xs">
          完成後會記錄連續天數，明天繼續保持！
        </p>
      </section>
    </div>
  );
};
