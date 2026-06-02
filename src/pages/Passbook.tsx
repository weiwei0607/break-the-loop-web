import { useState, useEffect } from 'react';
import { db, getStats, getTodayStr, type DailyDraw } from '../db';
import { ArrowLeft, Flame, Trophy, Target, SkipForward, Calendar, Download } from 'lucide-react';

interface Props {
  onBack: () => void;
}

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
        const all = await db.dailyDraws.orderBy('id').reverse().toArray();
        const s = await getStats();
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
      const dateStr = `${todayStr.slice(0, 4)}/${todayStr.slice(5, 7)}/${todayStr.slice(8, 10)}`;
      const lines: string[] = [
        '═══════════════════════════════════',
        'BreakTheLoop 生活破圈器 任務存摺',
        `匯出時間：${dateStr}`,
        '═══════════════════════════════════',
        '',
        `【連續破圈】當前 ${stats.currentStreak} 天 | 最長 ${stats.longestStreak} 天`,
        `【完成率】${completionRate}% （${stats.completed}/${stats.total} 天）`,
        `【跳過次數】${stats.skipped} 次`,
        '',
        '【難度分布】',
        `  簡單：${stats.byDifficulty.easy} 次`,
        `  中等：${stats.byDifficulty.medium} 次`,
        `  困難：${stats.byDifficulty.hard} 次`,
        '',
        '【歷史紀錄】',
        ...records.map(r => {
          const status = r.completedAt ? '✅' : r.skippedAt ? '⏭️' : '⏳';
          const diff = r.difficulty === 'easy' ? '易' : r.difficulty === 'medium' ? '中' : '難';
          const text = r.text.replace(/\n/g, ' ').trim();
          return `${status} [${diff}] ${r.id}  ${text}`;
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-lg mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回今日挑戰</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-brand-light mb-2">
              任務存摺
            </h1>
            <p className="text-zinc-500 text-sm">記錄你的每一次破圈</p>
            {loadError && <p className="text-xs text-red-400 mt-1">{loadError}</p>}
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-brand-light hover:border-brand-light text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            匯出
          </button>
        </div>
      </header>

      <main className="w-full max-w-lg space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">當前連續</span>
            </div>
            <p className="text-3xl font-black text-zinc-100">{stats.currentStreak}<span className="text-sm font-medium text-zinc-500 ml-1">天</span></p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">最長連續</span>
            </div>
            <p className="text-3xl font-black text-zinc-100">{stats.longestStreak}<span className="text-sm font-medium text-zinc-500 ml-1">天</span></p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">完成率</span>
            </div>
            <p className="text-3xl font-black text-zinc-100">{completionRate}<span className="text-sm font-medium text-zinc-500 ml-1">%</span></p>
          </div>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">總挑戰數</span>
            </div>
            <p className="text-3xl font-black text-zinc-100">{stats.total}<span className="text-sm font-medium text-zinc-500 ml-1">天</span></p>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">難度分布</h3>
          <div className="space-y-3">
            {([
              { key: 'easy' as const, label: '簡單', color: 'bg-green-500', count: stats.byDifficulty.easy },
              { key: 'medium' as const, label: '中等', color: 'bg-orange-500', count: stats.byDifficulty.medium },
              { key: 'hard' as const, label: '困難', color: 'bg-red-500', count: stats.byDifficulty.hard },
            ]).map(d => {
              const pct = stats.completed > 0 ? Math.round((d.count / stats.completed) * 100) : 0;
              return (
                <div key={d.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{d.label}</span>
                    <span className="text-zinc-500">{d.count} 次 ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">歷史紀錄</h3>
          {records.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-8">還沒有任何紀錄，開始你的第一次挑戰吧！</p>
          )}
          {records.map(r => (
            <div
              key={r.id}
              className={[
                'flex items-center gap-4 p-4 rounded-xl border transition-all',
                r.completedAt
                  ? 'bg-green-500/5 border-green-500/20'
                  : r.skippedAt
                  ? 'bg-zinc-900 border-zinc-800'
                  : 'bg-zinc-900/50 border-zinc-800/50',
              ].join(' ')}
            >
              <div className={[
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                r.difficulty === 'easy' ? 'bg-green-500/10 text-green-400'
                : r.difficulty === 'medium' ? 'bg-orange-500/10 text-orange-400'
                : 'bg-red-500/10 text-red-400',
              ].join(' ')}>
                {r.difficulty === 'easy' ? '易' : r.difficulty === 'medium' ? '中' : '難'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${r.completedAt ? 'text-green-300 line-through opacity-60' : 'text-zinc-300'}`}>
                  {r.text}
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{r.id}</p>
              </div>
              <div className="shrink-0">
                {r.completedAt ? (
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">已完成</span>
                ) : r.skippedAt ? (
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2 py-1 rounded-full flex items-center gap-1">
                    <SkipForward className="w-3 h-3" /> 跳過
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">進行中</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
