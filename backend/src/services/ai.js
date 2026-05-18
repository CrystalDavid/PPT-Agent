/**
 * DeepSeek AI 服务封装
 * DeepSeek API 兼容 OpenAI 格式
 */

const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function chatCompletion(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048, retries = 2 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2分钟超时

      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`DeepSeek API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.choices[0].message.content;
    } catch (err) {
      const isRetryable = err.name === 'AbortError'
        || err.message?.includes('fetch failed')
        || err.message?.includes('ECONNRESET')
        || err.message?.includes('ETIMEDOUT')
        || err.message?.includes('socket hang up');

      if (isRetryable && attempt < retries) {
        console.warn(`[AI] Attempt ${attempt + 1} failed (${err.message}), retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
}

/**
 * 流式调用，返回 Response
 */
async function chatCompletionStream(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048 } = options;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  return res;
}

module.exports = { chatCompletion, chatCompletionStream };
