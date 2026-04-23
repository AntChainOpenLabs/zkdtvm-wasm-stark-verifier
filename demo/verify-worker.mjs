import init, { initVerifierRuntime, verifyCompressedBytes } from '/pkg-web/dt_wasm_verifier.js';

let inited = false;

async function ensureInit() {
  if (inited) return;
  await init();
  initVerifierRuntime();
  inited = true;
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'warm') {
    try {
      await ensureInit();
      self.postMessage({ type: 'warmed' });
    } catch (e) {
      self.postMessage({ type: 'warm_error', error: String(e) });
    }
    return;
  }

  if (msg.type === 'verify') {
    const { id, proof, vk } = msg;
    try {
      await ensureInit();
      const t0 = performance.now();
      verifyCompressedBytes(proof, vk);
      const ms = performance.now() - t0;
      self.postMessage({ type: 'result', id, ok: true, ms });
    } catch (e) {
      self.postMessage({ type: 'result', id, ok: false, error: String(e) });
    }
  }
};
