import { canonicalStringify, sign } from '../_lib/ship.js';

export async function onRequestPost(context) {
  try {
    const { data } = await context.request.json();
    const salt = context.env.SHIP_SIGNING_SECRET;

    if (!salt) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing SHIP_SIGNING_SECRET' }), {
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
      // This forces the browser to download it as a file, not append .json
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  } catch (err) {
    console.error('Export Worker Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
}
