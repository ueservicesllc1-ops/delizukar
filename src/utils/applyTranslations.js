import { translateBatch } from '../services/translateService';

const CACHE_KEY = 'translationCache_v2';
let mutationObserver = null;
let autoLang = null;
let autoSource = null;

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

function cacheKey(text, target, source) {
  return `${source || 'es'}:${target}:${text}`;
}

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentNode;
    if (!parent || !parent.closest) continue;
    if (parent.closest('script, style, textarea, noscript, [data-no-translate]')) continue;
    const text = node.nodeValue || '';
    if (text.trim()) nodes.push(node);
  }
  return nodes;
}

function collectAttributeTargets(root) {
  const targets = [];
  const selector = '[placeholder], [title], img[alt], [aria-label]';
  root.querySelectorAll(selector).forEach(el => {
    if (el.closest('[data-no-translate]')) return;
    if (el.hasAttribute('placeholder')) targets.push({ el, attr: 'placeholder' });
    if (el.hasAttribute('title')) targets.push({ el, attr: 'title' });
    if (el.tagName === 'IMG' && el.hasAttribute('alt')) targets.push({ el, attr: 'alt' });
    if (el.hasAttribute('aria-label')) targets.push({ el, attr: 'aria-label' });
  });
  return targets;
}

async function translateAndApply(root, targetLang, sourceLang) {
  const textNodes = collectTextNodes(root);
  const attrTargets = collectAttributeTargets(root);
  if (textNodes.length === 0 && attrTargets.length === 0) return;

  const cache = loadCache();
  const texts = [
    ...textNodes.map(n => n.nodeValue),
    ...attrTargets.map(t => String(t.el.getAttribute(t.attr) || ''))
  ];

  const results = new Array(texts.length);
  const toTranslate = [];
  const mapIndex = [];

  texts.forEach((t, idx) => {
    const key = cacheKey(t, targetLang, sourceLang);
    const hit = cache[key];
    if (typeof hit === 'string') {
      results[idx] = hit;
    } else {
      toTranslate.push(t);
      mapIndex.push(idx);
    }
  });

  const batchSize = 50;
  for (let i = 0; i < toTranslate.length; i += batchSize) {
    const slice = toTranslate.slice(i, i + batchSize);
    try {
      const translated = await translateBatch(slice, targetLang, sourceLang);
      translated.forEach((tr, j) => {
        const idx = mapIndex[i + j];
        const original = toTranslate[i + j];
        results[idx] = tr || original;
        cache[cacheKey(original, targetLang, sourceLang)] = results[idx];
      });
      saveCache(cache);
    } catch {
      slice.forEach((orig, j) => {
        const idx = mapIndex[i + j];
        results[idx] = orig;
      });
    }
  }

  // Text nodes
  results.slice(0, textNodes.length).forEach((t, idx) => {
    if (typeof t === 'string' && textNodes[idx] && textNodes[idx].nodeValue !== t) {
      textNodes[idx].nodeValue = t;
    }
  });
  // Attributes
  results.slice(textNodes.length).forEach((t, i) => {
    const target = attrTargets[i];
    if (target && typeof t === 'string') {
      target.el.setAttribute(target.attr, t);
    }
  });

  try {
    if (document.title) {
      const titleKey = cacheKey(document.title, targetLang, sourceLang);
      const hit = cache[titleKey];
      if (typeof hit === 'string') {
        document.title = hit;
      } else {
        const [tr] = await translateBatch([document.title], targetLang, sourceLang);
        if (tr) {
          document.title = tr;
          cache[titleKey] = tr;
          saveCache(cache);
        }
      }
    }
  } catch {}
}

export async function applyTranslations(targetLang = 'en', sourceLang = 'es') {
  if (typeof document === 'undefined') return;
  await translateAndApply(document.body, targetLang, sourceLang);
}

export function startAutoTranslate(targetLang = 'en', sourceLang = 'es') {
  if (typeof document === 'undefined') return;
  autoLang = targetLang; autoSource = sourceLang;
  if (mutationObserver) { try { mutationObserver.disconnect(); } catch {} }
  mutationObserver = new MutationObserver(() => {
    clearTimeout(startAutoTranslate._t);
    startAutoTranslate._t = setTimeout(() => translateAndApply(document.body, autoLang, autoSource), 150);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
  translateAndApply(document.body, targetLang, sourceLang);
}

export function stopAutoTranslate() {
  autoLang = null; autoSource = null;
  if (mutationObserver) { try { mutationObserver.disconnect(); } catch {} mutationObserver = null; }
}


