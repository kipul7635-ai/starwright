// functions/_lib/ship.js
export function canonicalStringify(value) {
  if (value === null) return 'null';
  if (typeof value === 'undefined') return 'null'; // Prevent crashes on missing keys
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalStringify).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(value[k])).join(',') + '}';
}

export async function sign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return [...new Uint8Array(signatureBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}
