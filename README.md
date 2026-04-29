# zkdtvm-wasm-stark-verifier

Pre-built WASM verifier for **compressed zkdtvm proofs**. Drop `pkg-node/` or `pkg-web/` into any Node.js / browser project and verify — no Rust toolchain required.

---

## Version matrix

| Component        | Version / Source                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| zkdtvm           | **v0.6.1**                                                                                         |
| Verifier backend | [`zkdtvm-stark-verifier`](https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier) `main` branch |
| WASM size        | ~917 KB (`pkg-node/dt_wasm_verifier_bg.wasm`, 938 837 bytes)                                       |

> `zkdtvm_vks/v0.6.1/vk.bin` is the **official verifying-key digest bin**
> for the current release — it is bound to both the zkdtvm version and
> the Z-Dec (zk-dtvm ethereum client) version pinned above. The file
> contains the **hash digest** of the verifying key, **not** the
> verifying key itself; shipping the digest lets the verifier skip
> recomputing it on every call, keeping the in-browser / on-chain
> check cheap.

### History

Each row pins both the **zkdtvm release** (the proving side) and the **Z-Dec release** (the program whose verifying key the digest commits to). A bump on either side invalidates some of the shipped artifacts:

- A **zkdtvm** change invalidates the shipped `pkg-node/` / `pkg-web/` WASM artifacts **and** the verifying-key digest under `zkdtvm_vks/`.
- A **Z-Dec** change invalidates the verifying-key digest under `zkdtvm_vks/` only.

| Date       | zkdtvm | Z-Dec  | Backend                                       |
| ---------- | ------ | ------ | --------------------------------------------- |
| 2026-04-29 | v0.6.1 | v0.6.1 | `zkdtvm-stark-verifier` (open-source, GitHub) |

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

- **`compressed_proof.bin`** — serialized bytes of the proof produced by zkdtvm.
- **`compressed_vk.bin`** — serialized bytes of the **hash digest of the verifying key**, not the full verifying key. Only the digest is shipped so the verifier doesn't have to recompute it on every call.

---

## Smoke test

Run all fixtures in one command:

```bash
npm run verify:node
```

Output:

```
Running 4 fixture(s):

[example_1]
  proof fixtures/example_1/proof.bin (2349642 bytes)
  vk    fixtures/example_1/vk.bin (32 bytes)
  OK 128.81 ms

[example_2]
  OK 96.03 ms

[example_3]
  OK 96.21 ms

[example_4]
  OK 99.09 ms

Done: 4 passed, 0 failed
```

Or verify a specific proof/vk pair:

```bash
node verify-node.mjs /path/to/compressed_proof.bin /path/to/compressed_vk.bin
```

To verify against the production VK digest, point the second argument at `zkdtvm_vks/v0.6.1/vk.bin`:

```bash
node verify-node.mjs /path/to/compressed_proof.bin zkdtvm_vks/v0.6.1/vk.bin
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
├── zkdtvm_vks/           # Production verifying-key digests by zkdtvm release
│   └── v0.6.1/vk.bin     # Digest pinned to zkdtvm v0.6.1
├── fixtures/             # Sample proof & digest files (smoke test / demo)
│   ├── index.json        # Fixture manifest (auto-discovered)
│   └── example_{1..4}/   # Sample compressed proofs (valid)
├── demo/                 # Browser demo UI
├── serve.mjs             # Local HTTP server for the demo
├── verify-node.mjs       # Node.js smoke test (runs all fixtures)
└── package.json
```

---

## License

This project is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).