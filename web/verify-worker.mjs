import init, { initVerifierRuntime, verifyCompressedBytes } from '/pkg-web/dt_wasm_verifier.js';

let initPromise;

function ensureInit() {
  // Share the in-flight result so concurrent warm and verify messages cannot
  // initialize separate WASM runtimes or retry a deterministic init failure.
  if (!initPromise) {
    initPromise = (async () => {
      await init();
      initVerifierRuntime();
    })();
  }
  return initPromise;
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
