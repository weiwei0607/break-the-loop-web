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
  let s = await db.settings.get(1);
  if (!s) {
    s = { id: 1, streak: 0, preferredDifficulty: 'easy', notificationEnabled: false };
    await db.settings.add(s);
  }
  return s;
}

export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>) {
  await db.settings.update(1, changes);
}

export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function calculateStreak(): Promise<number> {
  const s = await getSettings();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  if (s.lastCompletedDate === today || s.lastCompletedDate === yesterday) {
    return s.streak;
  }
  // streak broken
  if (s.streak !== 0) {
    await updateSettings({ streak: 0 });
  }
  return 0;
}

export async function completeToday() {
  const today = getTodayStr();
  await db.dailyDraws.update(today, { completedAt: Date.now() });

  const s = await getSettings();
  const yesterday = getYesterdayStr();
  let newStreak = 1;
  if (s.lastCompletedDate === yesterday || s.lastCompletedDate === today) {
    newStreak = s.streak + (s.lastCompletedDate === today ? 0 : 1);
  }
  await updateSettings({ streak: newStreak, lastCompletedDate: today });
}

export async function getStats() {
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
}

async function calculateLongestStreak(): Promise<number> {
  const completed = await db.dailyDraws.where('completedAt').above(0).sortBy('id');
  if (completed.length === 0) return 0;

  let max = 0;
  let current = 0;
  let prevDate: Date | null = null;

  for (const draw of completed) {
    const d = new Date(draw.id + 'T00:00:00');
    if (prevDate) {
      const diff = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
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
}
