exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'Clé API manquante' }) };
  try {
    const { image, prompt } = JSON.parse(event.body || '{}');
    if (!image || !prompt) return { statusCode: 400, body: JSON.stringify({ error: 'Requête invalide' }) };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-5-5',
        max_tokens: 400,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
          { type: 'text', text: prompt }
        ] }]
      })
    });
    const d = await r.json();
    if (!r.ok) return { statusCode: 502, body: JSON.stringify({ error: d.error && d.error.message }) };
    const text = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Erreur serveur' }) };
  }
};