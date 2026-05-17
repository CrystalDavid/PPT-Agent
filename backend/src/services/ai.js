/**
 * DeepSeek AI 服务封装
 * DeepSeek API 兼容 OpenAI 格式
 */

const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function chatCompletion(messages, options = {}) {
  const { temperature = 0.7, maxTokens = 2048, stream = false } = options;

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
      stream,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err}`);
  }

  if (stream) {
    return res.body;
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * 流式调用，返回 ReadableStream
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
