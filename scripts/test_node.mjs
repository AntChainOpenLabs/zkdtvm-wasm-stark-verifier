import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const wasm = require(path.join(root, 'pkg-node/dt_wasm_verifier.js'));
const proof = fs.readFileSync(path.join(root, 'web/samples/block_25954917.seal'));
const vk = fs.readFileSync(path.join(root, 'zkdtvm_vks/v0.8.0/vk.bin'));
const negatives = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'target/negative-fixtures');
if (!process.argv[2]) {
  const metadata = JSON.parse(execFileSync('cargo', ['metadata', '--locked', '--format-version', '1'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  }));
  const backend = metadata.packages.find(pkg => pkg.name === 'zkdtvm-stark-verifier');
  assert.ok(backend?.source?.startsWith('git+'), 'Expected the Git backend resolved by Cargo');
  execFileSync('cargo', ['test', '--manifest-path', backend.manifest_path, '--locked', '--release', '--workspace'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      CARGO_TARGET_DIR: path.join(root, 'target/native-tests'),
      DTV_NEGATIVE_FIXTURES_DIR: negatives,
    },
  });
}
assert.equal(proof.length, 267918);

wasm.initVerifierRuntime();
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
for (const size of [0, 1, 4, 35, 36, 256, proof.length - 1]) {
  rejects('truncation-' + size, proof.subarray(0, size));
}
rejects('trailing-proof', Buffer.concat([proof, Buffer.from([0])]));
rejects('trailing-vk', proof, Buffer.concat([vk, Buffer.from([0])]));
rejects('digest-only-vk', proof, vk.subarray(0, 32));
rejects('oversize-proof', new Uint8Array(4 * 1024 * 1024 + 1));
rejects('oversize-vk', proof, new Uint8Array(1024 * 1024 + 1));
const wrongVersion = Buffer.from(proof);
wrongVersion.writeUInt32LE(5);
rejects('wrong-version', wrongVersion);
const wrongIdentity = Buffer.from(proof);
wrongIdentity[4] ^= 1;
rejects('wrong-identity', wrongIdentity);
for (const name of ['missing-input-batch', 'changed-public', 'incomplete-root', 'changed-root-vk', 'changed-sumcheck', 'changed-merkle', 'nested-oversize']) {
  rejects(name, fs.readFileSync(path.join(negatives, name + '.bin')));
}
rejects('wrong-vk', proof, fs.readFileSync(path.join(negatives, 'wrong-vk.bin')));
console.log('PASS', passed, 'negative cases; valid runtime reused after every rejection');
