import { canonicalStringify, sign } from '../_lib/ship.js';

export async function onRequestPost(context) {
  try {
    const shipFile = await context.request.json();
    const salt = context.env.SHIP_SIGNING_SECRET;

    if (!salt) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing SHIP_SIGNING_SECRET' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    if (shipFile.magic !== 'SHIPWRIGHT' || shipFile.version !== 1) {
      throw new Error('Invalid ship file format');
    }
    if (typeof shipFile.sig !== 'string') {
      throw new Error('Missing signature in ship file');
    }

    const payloadString = canonicalStringify(shipFile.data);
    const expectedSig = await sign(payloadString, salt);

    if (expectedSig !== shipFile.sig) {
      throw new Error('Signature mismatch — ship data has been edited.');
    }

    return new Response(JSON.stringify({ data: shipFile.data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Import Worker Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
}
