import Dexie, { type Table } from 'dexie';

export interface DailyDraw {
  id: string; // YYYY-MM-DD
  challengeId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  plannedTime: string;
  acceptedAt?: number;
  completedAt?: number;
  skippedAt?: number;
}

export interface Settings {
  id: number;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD
  preferredDifficulty?: 'easy' | 'medium' | 'hard';
  notificationEnabled: boolean;
}

class LoopDB extends Dexie {
  dailyDraws!: Table<DailyDraw>;
  settings!: Table<Settings>;

  constructor() {
    super('BreakTheLoopDB');
    this.version(1).stores({
      dailyDraws: 'id, difficulty, completedAt',
      settings: 'id',
    });
  }
}

export const db = new LoopDB();

export async function getSettings(): Promise<Settings> {
  try {
    let s = await db.settings.get(1);
    if (!s) {
      s = { id: 1, streak: 0, preferredDifficulty: 'easy', notificationEnabled: false };
      await db.settings.add(s);
    }
    return s;
  } catch (err) {
    console.error('getSettings failed:', err);
    // Fallback so the app doesn't crash
    return { id: 1, streak: 0, preferredDifficulty: 'easy', notificationEnabled: false };
  }
}

export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>) {
  try {
    await db.settings.update(1, changes);
  } catch (err) {
    console.error('updateSettings failed:', err);
    throw err;
  }
}

function fmtTaipei(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(d);
}

export function getTodayStr(): string {
  return fmtTaipei(new Date());
}

export function getYesterdayStr(): string {
  // 用 Taipei 時區的日期字串解析，避免本地時區偏移
  const todayStr = getTodayStr();
  const d = new Date(todayStr + 'T00:00:00+08:00');
  d.setDate(d.getDate() - 1);
  return fmtTaipei(d);
}

// 純讀取，不修改資料庫—避免每次 app 開啟就 reset streak
export async function calculateStreak(): Promise<number> {
  try {
    const s = await getSettings();
    const today = getTodayStr();
    const yesterday = getYesterdayStr();
    if (s.lastCompletedDate === today || s.lastCompletedDate === yesterday) {
      return s.streak;
    }
    return 0;
  } catch (err) {
    console.error('calculateStreak failed:', err);
    return 0;
  }
}

// 明確放棄/跳過時才呼叫此函數 reset streak
export async function breakStreak() {
  try {
    const s = await getSettings();
    if (s.streak !== 0) {
      await updateSettings({ streak: 0 });
    }
  } catch (err) {
    console.error('breakStreak failed:', err);
  }
}

export async function completeToday() {
  try {
    const today = getTodayStr();
    await db.dailyDraws.update(today, { completedAt: Date.now() });

    const s = await getSettings();
    const yesterday = getYesterdayStr();
    let newStreak = 1;
    if (s.lastCompletedDate === yesterday || s.lastCompletedDate === today) {
      newStreak = s.streak + (s.lastCompletedDate === today ? 0 : 1);
    }
    await updateSettings({ streak: newStreak, lastCompletedDate: today });
  } catch (err) {
    console.error('completeToday failed:', err);
    throw err;
  }
}

export async function getStats() {
  try {
    const all = await db.dailyDraws.toArray();
    const completed = all.filter(d => d.completedAt);
    const skipped = all.filter(d => d.skippedAt && !d.completedAt);
    const byDifficulty = {
      easy: completed.filter(d => d.difficulty === 'easy').length,
      medium: completed.filter(d => d.difficulty === 'medium').length,
      hard: completed.filter(d => d.difficulty === 'hard').length,
    };
    const currentStreak = await calculateStreak();
    const longestStreak = await calculateLongestStreak();
    return { total: all.length, completed: completed.length, skipped: skipped.length, byDifficulty, currentStreak, longestStreak };
  } catch (err) {
    console.error('getStats failed:', err);
    return { total: 0, completed: 0, skipped: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 }, currentStreak: 0, longestStreak: 0 };
  }
}

async function calculateLongestStreak(): Promise<number> {
  try {
    const completed = await db.dailyDraws.where('completedAt').above(0).sortBy('id');
    if (completed.length === 0) return 0;

    let max = 0;
    let current = 0;
    let prevDate: Date | null = null;

    for (const draw of completed) {
      const d = new Date(draw.id + 'T00:00:00+08:00');
      if (prevDate) {
        const diff = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          current++;
        } else {
          current = 1;
        }
      } else {
        current = 1;
      }
      prevDate = d;
      if (current > max) max = current;
    }
    return max;
  } catch (err) {
    console.error('calculateLongestStreak failed:', err);
    return 0;
  }
}
