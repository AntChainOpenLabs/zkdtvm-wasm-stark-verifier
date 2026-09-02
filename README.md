# zkdtvm-wasm-stark-verifier

WASM verifier for zkdtvm v0.8.0 compressed STARK proofs. The public verification API has two inputs:

```text
verifyCompressedBytes(proofBytes, vkBytes)
```

- `proofBytes`: bincode-serialized `DTReduceProof<RootSC>`.
- `vkBytes`: bincode-serialized full `DTVerifyingKey` (the program/core VK).

This build accepts only the compact **elided** proof form. A full proof containing the L4 preprocessing opening (the roughly 290 KB form) is rejected, even if it is otherwise valid. For the Desktop fixture, elision changes the serialized size from 292,030 to 252,290 bytes; the 39,740-byte difference is that fixed L4 opening.

The L4 machine, program and VK are verifier-release material. They are embedded in the WASM package and are not API inputs. See [the v0.8.0 verifier design](docs/v0.8.0-elided-wasm-verifier.md) for the binding and performance model.

## Backend revision

The verifier backend is pinned to the immutable Git revision that contains the reusable elided L4 verifier:

```text
https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier.git
6bb8a737bdc5473332b980820921c090211069c7
```

An ordinary WASM build does not require a sibling backend checkout.

## Build and test on macOS

Install the prerequisites:

```bash
xcode-select --install
rustup target add wasm32-unknown-unknown
cargo install wasm-pack --version 0.13.1 --locked
brew install binaryen
```

Clone and select the verifier branch if it is not already present:

```bash
mkdir -p ~/projects/learn-from-openvm
cd ~/projects/learn-from-openvm
git clone https://github.com/AntChainOpenLabs/zkdtvm-wasm-stark-verifier.git
git -C zkdtvm-wasm-stark-verifier switch v0.8.0-verifier
```

Build the Node target and verify the files on the Mac Desktop:

```bash
cd ~/projects/learn-from-openvm/zkdtvm-wasm-stark-verifier
npm run wasm:node
node scripts/verify_node.mjs ~/Desktop/proof.bin ~/Desktop/vk.bin
```

The script reports initialization separately and runs verification twice to show reuse. On the development Mac, the 252,290-byte fixture measured approximately:

```text
init          1.8 s
verify #1    19 ms
verify #2     6 ms
```

Exact times depend on the CPU and Node version. Initialization performs one L4 setup and keeps its fixed preprocessing data for the lifetime of the worker. Each later verification reuses that state; it does not build L1-L4 or rerun setup.

Other build targets:

```bash
npm run wasm:web     # browser package in pkg-web/
npm run wasm:all     # bundler, browser and Node packages
npm run test:node    # checked-in sample pair
```

The release profile uses `opt-level = 3`, LTO and `wasm-opt -O3` for verification speed.

## Rebuilding the fixed L4 artifact

The checked-in [`artifacts/v0.8.0-l4-verifier.bin`](artifacts/v0.8.0-l4-verifier.bin) is release material. Rebuild it only when the fixed verifier/L4 machine changes:

```bash
cd ..
git clone https://github.com/AntChainOpenLabs/zkdtvm-stark-verifier.git zkdtvm-stark-verifier-v0.8.0
cd zkdtvm-stark-verifier-v0.8.0
git checkout 6bb8a737bdc5473332b980820921c090211069c7
cargo run --release \
  -p zkdtvm-stark-verifier \
  --bin build_l4_verifier_artifact -- \
  ../zkdtvm-wasm-stark-verifier/artifacts/v0.8.0-l4-verifier.bin
```

Then rebuild all WASM packages and run the fixture test. The current artifact is 382,685 bytes and has SHA-256:

```text
88494d848419a9ac47fadf1c85c08bfff5b4d5abafaf0ee81ac988d3d8dfc8ff
```

It stores the fixed L4 program and VK. It intentionally does not embed the derived PCS prover data, which serializes to roughly 350 MiB; that data is derived once during `initVerifierRuntime()` and then retained.

## JavaScript API

| Function | Signature | Behavior |
| --- | --- | --- |
| `initVerifierRuntime()` | `() -> void` | Initializes and caches the verifier; throws on failure. |
| `verifyCompressedBytes(proof, vk)` | `(Uint8Array, Uint8Array) -> void` | Verifies an elided proof; throws on failure. |
| `verifyCompressedOk(proof, vk)` | `(Uint8Array, Uint8Array) -> boolean` | Same verification, returning `false` on failure. |

For `pkg-web`, first call its generated asynchronous WASM loader. The Node package loads the WASM module automatically.

Malformed bytes, a mismatched program VK, a mismatched fixed L4 VK, an invalid proof, and a non-elided proof all fail closed.

## Updating the backend dependency

Test backend changes through a local path dependency first. After the backend change is published, pin its immutable Git `rev`, rebuild the artifact and WASM packages, and rerun the same positive and negative fixture tests.

## License

Licensed under the [Apache License 2.0](LICENSE).
