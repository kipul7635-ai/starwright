export async function onRequestPost(context) {
  try {
    const shipFile = await context.request.json();
    const salt = context.env.SHIP_SIGNING_SECRET;

    if (shipFile.magic !== 'SHIPWRIGHT' || shipFile.version !== 1) {
      throw new Error('Invalid ship file format');
    }

    const expectedSig = await sign(canonicalStringify(shipFile.data), salt);

    // Use a timing-safe comparison to prevent timing attacks
    if (expectedSig !== shipFile.sig) {
      throw new Error('Signature mismatch — ship data has been edited.');
    }

    // Signature is valid. Return the data so the client can load it.
    return new Response(JSON.stringify({ data: shipFile.data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Re-use the same canonicalization and signing functions as export.js
// (In a real project, you can extract these into a shared utility file)
function canonicalStringify(value) { /* ... same as export.js ... */ }
async function sign(data, secret) { /* ... same as export.js ... */ }
