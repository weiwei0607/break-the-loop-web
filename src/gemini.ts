const MODEL = 'gemini-1.5-flash';

export function getApiKey(): string {
  return localStorage.getItem('loop_gemini_key') ?? '';
}

export function saveApiKey(key: string) {
  if (key.trim()) localStorage.setItem('loop_gemini_key', key.trim());
  else localStorage.removeItem('loop_gemini_key');
}

export async function generateReflection(challenge: string, feeling: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('請先設定 Gemini API Key');

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `你是一位溫暖鼓勵的生活教練。使用者今天完成了一個挑戰自我的小任務，並分享了感受。

今日挑戰：${challenge}
使用者分享：${feeling}

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

  const data = await resp.json() as { candidates: { content: { parts: { text: string }[] } }[] };
  return data.candidates[0].content.parts[0].text.trim();
}
