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

import axios from 'axios';

const apiKey = process.env.REACT_APP_TRANSLATE_API_KEY || localStorage.getItem('GOOGLE_TRANSLATE_API_KEY');
const endpoint = 'https://translation.googleapis.com/language/translate/v2';
const MAX_BATCH_CHARS = 490;

const createBatches = (items, maxChars = MAX_BATCH_CHARS) => {
  const batches = [];
  let batch = [];
  let length = 0;

  const pushBatch = () => {
    if (batch.length > 0) {
      batches.push(batch);
      batch = [];
      length = 0;
    }
  };

  items.forEach((rawItem) => {
    const text = (rawItem === undefined || rawItem === null) ? '' : String(rawItem);

    if (text.length === 0) {
      batch.push('');
      return;
    }

    if (text.length <= maxChars) {
      if (length + text.length > maxChars) {
        pushBatch();
      }
      batch.push(text);
      length += text.length;
      return;
    }

    // Split very long text into pieces.
    let start = 0;
    while (start < text.length) {
      const chunk = text.slice(start, start + maxChars);
      if (chunk.length === 0) break;
      if (chunk.length === maxChars) {
        pushBatch();
        batches.push([chunk]);
        length = 0;
      } else {
        if (length + chunk.length > maxChars) {
          pushBatch();
        }
        batch.push(chunk);
        length += chunk.length;
      }
      start += maxChars;
    }
  });

  pushBatch();
  return batches;
};

export const translateBatch = async (texts, targetLang = 'en', sourceLang = 'es') => {
  if (!apiKey || !Array.isArray(texts)) return texts;
  try {
    const batches = createBatches(texts);
    const translations = [];

    for (const batch of batches) {
      if (!batch || batch.length === 0) continue;
      const response = await axios.post(`${endpoint}?key=${apiKey}`, {
        q: batch,
        target: targetLang,
        source: sourceLang,
        format: 'text'
      });
      const batchTranslations = response?.data?.data?.translations?.map((tr) => tr.translatedText) || [];
      translations.push(...batchTranslations);
    }

    return translations;
  } catch (error) {
    console.error('Translation API error:', error.response?.data || error.message);
    throw error;
  }
};


