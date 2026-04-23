# zkDTVM-wasm-stark-verifier

Pre-built WASM verifier for **compressed zkDTVM proofs**. No Rust toolchain required — just Node.js.

---

## Integration

The entry point is **`dt_wasm_verifier.js`** inside `pkg-web/` (browser) or `pkg-node/` (Node.js). Import it, call the verifier — that's it.

### Browser (ES module)

```js
import init, { initVerifierRuntime, verifyCompressedBytes }
  from './pkg-web/dt_wasm_verifier.js';

// 1. Load & compile WASM (once per page / worker)
await init();
initVerifierRuntime();

// 2. Verify
const proof = new Uint8Array(/* compressed_proof.bin bytes */);
const vk    = new Uint8Array(/* compressed_vk.bin bytes */);

try {
  verifyCompressedBytes(proof, vk);   // no exception = PASS
  console.log('PASS');
} catch (e) {
  console.log('FAIL', e);
}
```

### Node.js

```js
import { initVerifierRuntime, verifyCompressedBytes }
  from './pkg-node/dt_wasm_verifier.js';

initVerifierRuntime();

const proof = fs.readFileSync('compressed_proof.bin');
const vk    = fs.readFileSync('compressed_vk.bin');

verifyCompressedBytes(proof, vk);  // throws on failure
```

### API reference

| Function | Signature | Description |
|----------|-----------|-------------|
| `init()` | `() → Promise<void>` | Load & compile WASM. **Browser only** (Node auto-loads). |
| `initVerifierRuntime()` | `() → void` | Install panic hook. Call once before verifying. |
| `verifyCompressedBytes(proof, vk)` | `(Uint8Array, Uint8Array) → void` | Verify proof. **Throws** on failure. |
| `verifyCompressedOk(proof, vk)` | `(Uint8Array, Uint8Array) → boolean` | Verify proof. Returns `true` if valid, `false` otherwise. |

### Byte format

- **`compressed_proof.bin`** — `bincode::serialize(compressed_proof)`
- **`compressed_vk.bin`** — `bincode::serialize(vk.hash())` — the **VK digest**, not the full `DTVerifyingKey` struct.

---

## Smoke test

Run all fixtures in one command:

```bash
npm run verify:node
```

Output:

```
Running 2 fixture(s):

[example_0]
  proof fixtures/example_0/proof.bin (2417106 bytes)
  vk    fixtures/example_0/vk.bin (32 bytes)
  OK 165.01 ms

[bad_example_0] (expect: fail)
  proof fixtures/bad_example_0/proof.bin (2417106 bytes)
  vk    fixtures/bad_example_0/vk.bin (32 bytes)
  FAIL compressed proof verification failed (124.46 ms)
  ✓ correctly rejected

Done: 2 passed, 0 failed
```

Or verify a specific proof/vk pair:

```bash
node verify-node.mjs /path/to/compressed_proof.bin /path/to/compressed_vk.bin
```

---

## Browser demo

```bash
npm run demo
```

Open **http://127.0.0.1:8788/**. Two modes:

- **Fixtures tab** — select any fixture from `fixtures/index.json`, click Verify.
- **Upload tab** — drag & drop your own `compressed_proof.bin` and `compressed_vk.bin`.

---

## Adding fixtures

1. Create a folder under `fixtures/<name>/` with `compressed_proof.bin` and `compressed_vk.bin`.
2. Add an entry to `fixtures/index.json`:

```json
{
  "name": "<name>",
  "description": "...",
  "proof": "/fixtures/<name>/compressed_proof.bin",
  "vk": "/fixtures/<name>/compressed_vk.bin"
}
```

Both the demo page and `npm run verify:node` will automatically pick up the new fixture.

---

## Project structure

```
├── pkg-web/              # WASM package for browsers (ES module)
├── pkg-node/             # WASM package for Node.js
├── fixtures/             # Sample proof & VK files
│   ├── index.json        # Fixture manifest (auto-discovered)
│   └── example_0/        # Sample compressed STARK proof (valid)
├── demo/                 # Browser demo UI
├── serve.mjs             # Local HTTP server for the demo
├── verify-node.mjs       # Node.js smoke test (runs all fixtures)
└── package.json
```