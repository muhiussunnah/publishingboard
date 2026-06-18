'use server';

// Gemini text generation (used by the AI tools, e.g. Mini Content Writer).
// Needs GEMINI_API_KEY in env. Auto-detects an available flash/pro model.
export async function generateContent(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { success: false, error: 'GEMINI_API_KEY is missing in .env.local' };

  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResponse.json();
    if (!listResponse.ok) return { success: false, error: 'Failed to list models. Check API key.' };

    const activeModel =
      listData.models?.find((m) => m.name.includes('flash') && m.supportedGenerationMethods.includes('generateContent')) ||
      listData.models?.find((m) => m.name.includes('pro') && m.supportedGenerationMethods.includes('generateContent')) ||
      listData.models?.find((m) => m.supportedGenerationMethods.includes('generateContent'));
    if (!activeModel) return { success: false, error: 'No valid Gemini model found.' };

    const url = `https://generativelanguage.googleapis.com/v1beta/${activeModel.name}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Write a high-quality, engaging piece about: "${prompt}".

IMPORTANT FORMATTING RULES:
1. Provide the output in CLEAN PLAIN TEXT only.
2. Do NOT use Markdown symbols (like **, ##, *, -, >).
3. Do NOT use bolding or italics syntax.
4. Use standard spacing for paragraphs.
5. Make it ready to copy-paste.`,
          }],
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return { success: false, error: data.error?.message || 'Generation failed' };
    return { success: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text };
  } catch (error) {
    console.error('Gemini error:', error);
    return { success: false, error: 'System error: ' + error.message };
  }
}
