const MODEL = 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const FETCH_TIMEOUT_MS = 30000;
const MAX_INPUT_LENGTH = 500;
const LS_KEY = 'btl_gemini_key';

// In-memory cache, persisted to localStorage
let _apiKey = '';

function loadApiKeyFromStorage(): string {
  try {
    return (localStorage.getItem(LS_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

// Initialize from localStorage on module load
_apiKey = loadApiKeyFromStorage();

export function getApiKey(): string {
  if (!_apiKey) _apiKey = loadApiKeyFromStorage();
  return _apiKey;
}

export function saveApiKey(key: string) {
  _apiKey = key.trim();
  try {
    if (_apiKey) {
      localStorage.setItem(LS_KEY, _apiKey);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  } catch {
    // localStorage unavailable, keep in-memory
  }
}

function sanitizeInput(s: string): string {
  return s.slice(0, MAX_INPUT_LENGTH).replace(/[<>]/g, '');
}

function safeFetch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

function extractText(data: unknown): string {
  const d = data as Record<string, unknown> | undefined;
  const candidates = d?.candidates as Array<Record<string, unknown>> | undefined;
  const first = candidates?.[0];
  const content = first?.content as Record<string, unknown> | undefined;
  const parts = content?.parts as Array<Record<string, unknown>> | undefined;
  const text = parts?.[0]?.text as string | undefined;
  if (text === undefined) {
    throw new Error('AI 回應格式異常或內容被阻擋');
  }
  return text.trim();
}

export async function generateReflection(challenge: string, feeling: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('請先設定 Gemini API Key');

  const safeChallenge = sanitizeInput(challenge);
  const safeFeeling = sanitizeInput(feeling);

  const resp = await safeFetch(
    `${API_BASE}/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `你是一位溫暖鼓勵的生活教練。使用者今天完成了一個挑戰自我的小任務，並分享了感受。

今日挑戰：${safeChallenge}
使用者分享：${safeFeeling}

請用 2-3 句繁體中文給予：1) 真誠的鼓勵 2) 一個讓他/她繼續思考的小問題。語氣溫暖自然，不要過度誇張。`
          }]
        }],
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `API 錯誤 ${resp.status}`);
  }

  const data = await resp.json();
  return extractText(data);
}
