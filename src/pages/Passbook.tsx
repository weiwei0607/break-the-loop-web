import { useState, useEffect } from 'react';
import { db, getStats, getTodayStr, type DailyDraw } from '../db';
import { ArrowLeft, Sprout, Trophy, Target, SkipForward, Calendar, Download, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const difficultyMeta = {
  easy:   { label: '易', color: '#8b9d7a', bg: 'rgba(139,157,122,0.10)',  border: 'rgba(139,157,122,0.2)' },
  medium: { label: '中', color: '#b8835f', bg: 'rgba(184,131,95,0.10)', border: 'rgba(184,131,95,0.2)' },
  hard:   { label: '難', color: '#a86f68', bg: 'rgba(168,111,104,0.10)',  border: 'rgba(168,111,104,0.2)' },
};

export const Passbook: React.FC<Props> = ({ onBack }) => {
  const [records, setRecords] = useState<DailyDraw[]>([]);
  const [stats, setStats] = useState({
    total: 0, completed: 0, skipped: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    currentStreak: 0, longestStreak: 0,
  });
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [all, s] = await Promise.all([
          db.dailyDraws.orderBy('id').reverse().toArray(),
          getStats(),
        ]);
        if (!mounted) return;
        setRecords(all);
        setStats(s);
      } catch (err) {
        console.error('Passbook load failed:', err);
        if (mounted) setLoadError('載入資料失敗');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  function downloadReport() {
    try {
      const todayStr = getTodayStr();
      const lines = [
        '═══════════════════════════════════',
        'BreakTheLoop 生活破圈器 任務存摺',
        `匯出時間：${todayStr}`,
        '═══════════════════════════════════',
        '',
        `【連續破圈】當前 ${stats.currentStreak} 天 | 最長 ${stats.longestStreak} 天`,
        `【完成率】${completionRate}% （${stats.completed}/${stats.total} 天）`,
        `【跳過次數】${stats.skipped} 次`,
        '',
        '【歷史紀錄】',
        ...records.map(r => {
          const status = r.completedAt ? '✅' : r.skippedAt ? '⏭️' : '⏳';
          const diff = difficultyMeta[r.difficulty]?.label || '?';
          return `${status} [${diff}] ${r.id}  ${r.text.replace(/\n/g, ' ').trim()}`;
        }),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breaktheloop-${todayStr}.txt`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('downloadReport failed:', err);
      alert('匯出失敗');
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 flex flex-col" style={{ background: '#f5f0e5' }}>
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[240px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(139,157,122,0.05) 0%, transparent 70%)', filter: 'blur(60px)' }} />

      {/* Header */}
      <header className="relative z-10 px-5 pt-14 pb-6">
        <button onClick={onBack}
          className="flex items-center gap-2 mb-8 active:opacity-70 transition-opacity"
          style={{ color: 'rgba(58,51,39,0.4)' }}>
          <ArrowLeft size={16} />
          <span className="text-[13px] font-medium">今日挑戰</span>
        </button>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2"
              style={{ color: '#8b9d7a', opacity: 0.65 }}>
              MY JOURNEY
            </p>
            <h1 className="font-black leading-none" style={{ fontSize: '2.1rem', letterSpacing: '-0.035em' }}>
              任務存摺
            </h1>
            <p className="text-[13px] mt-1.5" style={{ color: 'rgba(58,51,39,0.35)' }}>
              {loadError || '記錄你的每一次破圈'}
            </p>
          </div>
          <button onClick={downloadReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-95"
            style={{
              background: 'rgba(58,51,39,0.05)',
              border: '1px solid rgba(58,51,39,0.08)',
              color: 'rgba(58,51,39,0.5)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#8b9d7a')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(58,51,39,0.5)')}>
            <Download size={13} />
            匯出
          </button>
        </div>
      </header>

      <main className="relative z-10 px-5 pb-16 space-y-6 max-w-lg mx-auto w-full">

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Sprout, label: '當前連續', value: stats.currentStreak, unit: '天', color: '#8b9d7a', glow: 'rgba(139,157,122,0.15)' },
            { icon: Trophy, label: '最長連續', value: stats.longestStreak, unit: '天', color: '#c2a35e', glow: 'rgba(250,204,21,0.12)' },
            { icon: Target, label: '完成率', value: completionRate, unit: '%', color: '#8b9d7a', glow: 'rgba(139,157,122,0.12)' },
            { icon: Calendar, label: '總挑戰數', value: stats.total, unit: '天', color: 'rgba(58,51,39,0.6)', glow: 'none' },
          ].map(({ icon: Icon, label, value, unit, color, glow }) => (
            <div key={label} className="p-4 rounded-2xl relative overflow-hidden"
              style={{
                background: 'rgba(58,51,39,0.03)',
                border: '1px solid rgba(58,51,39,0.07)',
              }}>
              {/* Subtle corner glow */}
              {glow !== 'none' && (
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, filter: 'blur(12px)' }} />
              )}
              <div className="flex items-center gap-1.5 mb-3 relative z-10">
                <Icon size={13} style={{ color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(58,51,39,0.35)' }}>
                  {label}
                </span>
              </div>
              <p className="font-black relative z-10" style={{ fontSize: '2rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {value}
                <span className="text-[14px] font-medium ml-1" style={{ color: 'rgba(58,51,39,0.35)' }}>{unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* ── Difficulty breakdown ── */}
        <div className="p-5 rounded-2xl"
          style={{ background: 'rgba(58,51,39,0.03)', border: '1px solid rgba(58,51,39,0.07)' }}>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-5"
            style={{ color: 'rgba(58,51,39,0.3)' }}>
            難度分布
          </p>
          <div className="space-y-4">
            {(['easy', 'medium', 'hard'] as const).map(key => {
              const meta = difficultyMeta[key];
              const count = stats.byDifficulty[key];
              const pct = stats.completed > 0 ? Math.round((count / stats.completed) * 100) : 0;
              const label = key === 'easy' ? '簡單' : key === 'medium' ? '中等' : '困難';
              return (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span className="text-[13px] font-semibold" style={{ color: meta.color }}>{label}</span>
                    <span className="text-[12px]" style={{ color: 'rgba(58,51,39,0.3)' }}>{count} 次 · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(58,51,39,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: meta.color, opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── History ── */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase mb-4"
            style={{ color: 'rgba(58,51,39,0.3)' }}>
            歷史紀錄
          </p>

          {records.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px]" style={{ color: 'rgba(58,51,39,0.25)' }}>
                還沒有任何紀錄
              </p>
              <p className="text-[12px] mt-1" style={{ color: 'rgba(58,51,39,0.15)' }}>
                開始你的第一次挑戰吧
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map(r => {
                const meta = difficultyMeta[r.difficulty] || difficultyMeta.easy;
                const isDone = !!r.completedAt;
                const isSkipped = !!r.skippedAt;
                return (
                  <div key={r.id}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      background: isDone
                        ? 'rgba(139,157,122,0.04)'
                        : 'rgba(58,51,39,0.025)',
                      border: `1px solid ${isDone ? 'rgba(139,157,122,0.12)' : 'rgba(58,51,39,0.06)'}`,
                    }}>
                    {/* Difficulty badge */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0"
                      style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium leading-snug truncate"
                        style={{ color: isDone ? 'rgba(58,51,39,0.45)' : 'rgba(58,51,39,0.78)', textDecoration: isDone ? 'line-through' : 'none' }}>
                        {r.text}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(58,51,39,0.2)' }}>
                        {r.id}
                      </p>
                    </div>

                    {/* Status */}
                    {isDone ? (
                      <CheckCircle2 size={16} style={{ color: '#8b9d7a', opacity: 0.7 }} className="shrink-0" />
                    ) : isSkipped ? (
                      <SkipForward size={14} style={{ color: 'rgba(58,51,39,0.2)' }} className="shrink-0" />
                    ) : (
                      <Clock size={14} style={{ color: '#c2a35e', opacity: 0.6 }} className="shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
