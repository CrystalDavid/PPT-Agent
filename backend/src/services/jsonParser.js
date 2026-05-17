/**
 * 健壮的 JSON 解析器
 * AI 有时会输出不完美的 JSON，这里尽最大努力解析
 */

function safeParseJSON(text) {
  if (!text || typeof text !== 'string') return { raw: String(text || '') };

  // 策略 1：直接解析整个文本
  try {
    return JSON.parse(text);
  } catch {}

  // 策略 2：提取 ```json ... ``` 代码块
  const jsonBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonBlock) {
    try {
      return JSON.parse(jsonBlock[1].trim());
    } catch {}
  }

  // 策略 3：贪婪匹配最外层 { ... }
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}

    // 策略 4：尝试修复常见问题后再解析
    let fixed = braceMatch[0];
    // 去掉尾部逗号
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    // 去掉注释
    fixed = fixed.replace(/\/\/[^\n]*/g, '');
    try {
      return JSON.parse(fixed);
    } catch {}
  }

  // 策略 5：尝试匹配 [ ... ] 数组
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {}
  }

  // 全部失败，返回 raw
  console.error('[safeParseJSON] All strategies failed. First 200 chars:', text.substring(0, 200));
  return { raw: text };
}

module.exports = { safeParseJSON };
