import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const defaultProof = path.join(root, 'web/samples/compressed_proof.bin');
const defaultVk = path.join(root, 'web/samples/compressed_vk.bin');

const proofPath = process.argv[2] ?? defaultProof;
const vkPath = process.argv[3] ?? defaultVk;

const wasm = require(path.join(root, 'pkg-node', 'dt_wasm_verifier.cjs'));
const { initVerifierRuntime, verifyCompressedBytes } = wasm;

const initStart = performance.now();
initVerifierRuntime();
console.log('init', (performance.now() - initStart).toFixed(2), 'ms');
const proof = fs.readFileSync(proofPath);
const vk = fs.readFileSync(vkPath);
console.log('proof', proofPath, proof.length);
console.log('vk', vkPath, vk.length);

try {
  for (let round = 1; round <= 2; round += 1) {
    const t0 = performance.now();
    verifyCompressedBytes(proof, vk);
    console.log(`verify #${round} OK`, (performance.now() - t0).toFixed(2), 'ms');
  }
} catch (err) {
  console.error('FAIL', err);
  process.exit(1);
}
