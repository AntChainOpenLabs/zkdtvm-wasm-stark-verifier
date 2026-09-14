# zkdtvm-wasm-stark-verifier

Verify zkDTVM proofs for EthProofs in browsers and Node.js. Each verification
takes proof bytes and the expected application's complete verification key (VK).

## Files to deploy

Serve these files from your application's static directory, preserving their paths:

```text
pkg-web/dt_wasm_verifier.js
pkg-web/dt_wasm_verifier_bg.wasm
zkdtvm_vks/v0.8.0/vk.bin
```

Serve `.wasm` as `application/wasm`. The [VK](zkdtvm_vks/v0.8.0/vk.bin) is
2,440 bytes; the fixed Seal key is already included in WASM.

## EthProofs integration

zkDTVM submits Base64 proof bytes to EthProofs as `proof` and identifies the VK
with `verifier_id`. Use the trusted VK registered for that ID. This example uses
the v0.8.0 VK.

Add this module to your application. It loads WASM and the VK once, then reuses
them for subsequent proofs:

```js
import init, {
  initVerifierRuntime,
  verifyCompressedBytes,
} from '/pkg-web/dt_wasm_verifier.js';

const ready = (async () => {
  await init();
  initVerifierRuntime();
  const response = await fetch('/zkdtvm_vks/v0.8.0/vk.bin');
  if (!response.ok) throw new Error(`VK download failed: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
})();

export async function verifyEthproofsProof(proofBase64) {
  const vk = await ready;
  const proof = Uint8Array.from(atob(proofBase64), c => c.charCodeAt(0));
  verifyCompressedBytes(proof, vk);
}
```

Pass the record's Base64 `proof` field to `verifyEthproofsProof`. A resolved call
means verification passed; a rejected call means verification failed or could
not run. Do not pass a receipt, proof hash or VK digest.

For verification off the UI thread, also deploy [web/verify-worker.mjs](web/verify-worker.mjs):

```js
const worker = new Worker('/web/verify-worker.mjs', { type: 'module' });
worker.onmessage = ({ data }) => {
  if (data.type === 'result') console.log(data.id, data.ok, data.error);
};
worker.postMessage({ type: 'verify', id: 'proof-1', proof: proofBytes, vk: vkBytes });
```

Here `proofBytes` and `vkBytes` are decoded `Uint8Array` values. Keep the worker
alive to reuse its initialized verifier across requests.

## API

| Function | Result |
| --- | --- |
| `initVerifierRuntime()` | Initializes the verifier for reuse; throws on failure. |
| `verifyCompressedBytes(proof, vk)` | Returns on success; throws on failure. |
| `verifyCompressedOk(proof, vk)` | Returns `true` or `false`. |

Call `await init()` before using the browser API. Inputs are `Uint8Array`, limited
to 4 MiB for the proof and 1 MiB for the VK.

## Try it

```bash
npm run demo
# Open http://127.0.0.1:8788/, click Load sample, then Verify.

node scripts/verify_node.mjs path/to/proof.seal zkdtvm_vks/v0.8.0/vk.bin
```

## License

Bindings: [Apache-2.0](LICENSE).
Backend: [license notices](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier/blob/v0.8.0/vendor/zkdtvm-verifier-core/LICENSES.md).
