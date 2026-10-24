// This is the server-side function. The salt is NEVER sent to the client.
export async function onRequestPost(context) {
  try {
    const { data } = await context.request.json();
    // Access the secret from Cloudflare's environment variables
    const salt = context.env.SHIP_SIGNING_SECRET;

    if (!salt) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing secret' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const payloadString = canonicalStringify(data);
    const signature = await sign(payloadString, salt);

    const shipFile = {
      magic: 'SHIPWRIGHT',
      version: 1,
      sig: signature,
      data: data,
    };

    return new Response(JSON.stringify(shipFile), {
  headers: { 'Content-Type': 'application/octet-stream' },
});
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Same canonicalization logic as before, run on the server
function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalStringify(value[k])).join(',') + '}';
}

// Uses the Web Crypto API to create an HMAC-SHA256 signature
async function sign(data, secret) {
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
