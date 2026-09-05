import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.resolve(root, '../zkdtvm-stark-verifier-v0.8.0');
const require = createRequire(import.meta.url);
const wasm = require(path.join(root, 'pkg-node/dt_wasm_verifier.js'));
assert.equal(require(path.join(root, 'pkg-node/dt_wasm_verifier.cjs')), wasm);
const proof = fs.readFileSync(path.join(root, 'web/samples/compressed_proof.bin'));
const vk = fs.readFileSync(path.join(root, 'web/samples/compressed_vk.bin'));
const negatives = process.argv[2] ?? path.join(backend, 'target/negative-fixtures');
assert.equal(proof.length, 264238);

const start = performance.now();
wasm.initVerifierRuntime();
console.log('init', (performance.now() - start).toFixed(2), 'ms');
let passed = 0;
function valid() {
  wasm.verifyCompressedBytes(proof, vk);
  assert.equal(wasm.verifyCompressedOk(proof, vk), true);
}
function rejects(name, p, k = vk) {
  assert.throws(() => wasm.verifyCompressedBytes(p, k), error => {
    assert.ok(!(error instanceof WebAssembly.RuntimeError), name + ' must reject without trapping WASM');
    assert.match(String(error), /DTV_/);
    return true;
  }, name);
  assert.equal(wasm.verifyCompressedOk(p, k), false, name);
  valid();
  passed += 1;
}
valid();
// The checked-in vk.bin is a digest; only the full key is a valid API input.
wasm.verifyCompressedBytes(proof, fs.readFileSync(path.join(root, 'zkdtvm_vks/v0.8.0/vk-full.bin')));
rejects('core-vk-digest-not-full-vk', proof, fs.readFileSync(path.join(root, 'zkdtvm_vks/v0.8.0/vk.bin')));
for (const size of [0, 1, 4, 35, 36, 256, proof.length - 1]) {
  rejects('truncation-' + size, proof.subarray(0, size));
}
rejects('trailing-proof', Buffer.concat([proof, Buffer.from([0])]));
rejects('trailing-vk', proof, Buffer.concat([vk, Buffer.from([0])]));
rejects('digest-only-vk', proof, vk.subarray(0, 32));
rejects('oversize-proof', new Uint8Array(4 * 1024 * 1024 + 1));
rejects('oversize-vk', proof, new Uint8Array(1024 * 1024 + 1));
const wrongVersion = Buffer.from(proof);
wrongVersion.writeUInt32LE(12);
rejects('wrong-version', wrongVersion);
const wrongIdentity = Buffer.from(proof);
wrongIdentity[4] ^= 1;
rejects('wrong-identity', wrongIdentity);
rejects('legacy-elided', fs.readFileSync(path.join(backend, 'crates/verify/tests/fixtures/legacy-elided.bin')));
for (const name of ['current-elided', 'changed-public', 'changed-root-vk', 'changed-sumcheck', 'changed-merkle']) {
  rejects(name, fs.readFileSync(path.join(negatives, name + '.bin')));
}
rejects('wrong-vk', proof, fs.readFileSync(path.join(negatives, 'wrong-vk.bin')));
console.log('PASS', passed, 'negative cases; valid runtime reused after every rejection');
