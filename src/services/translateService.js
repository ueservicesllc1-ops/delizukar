function getApiBase() {
  try {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5050';
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return `http://${host}:5050`;
  } catch {}
  return '';
}

function getGoogleApiKey() {
  try { return localStorage.getItem('GOOGLE_TRANSLATE_API_KEY') || ''; } catch { return ''; }
}

export async function translateText(text, target = 'en', source) {
  if (!text || !text.trim()) return text;
  try {
    const base = getApiBase();
    const resp = await fetch(`${base}/api/translate-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-google-api-key': getGoogleApiKey() },
      body: JSON.stringify({ q: text, target, source })
    });
    if (!resp.ok) return text;
    const json = await resp.json();
    if (typeof json.translated === 'string') return json.translated;
    return text;
  } catch (error) {
    // Servicio de traducción no disponible - no es crítico, retornar texto original
    return text;
  }
}

export async function translateBatch(texts, target = 'en', source) {
  try {
    const base = getApiBase();
    const resp = await fetch(`${base}/api/translate-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-google-api-key': getGoogleApiKey() },
      body: JSON.stringify({ q: texts, target, source })
    });
    if (!resp.ok) return texts;
    const json = await resp.json();
    return Array.isArray(json.translated) ? json.translated : texts;
  } catch (error) {
    // Servicio de traducción no disponible - no es crítico, retornar textos originales
    return texts;
  }
}


