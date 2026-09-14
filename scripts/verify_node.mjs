import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const defaultProof = path.join(root, 'web/samples/block_25954917.seal');
const defaultVk = path.join(root, 'zkdtvm_vks/v0.8.0/vk.bin');

const proofPath = process.argv[2] ?? defaultProof;
const vkPath = process.argv[3] ?? defaultVk;

const wasm = require(path.join(root, 'pkg-node', 'dt_wasm_verifier.js'));
const { initVerifierRuntime, verifyCompressedBytes } = wasm;

initVerifierRuntime();
for (const [inputPath, limit] of [[proofPath, 4 * 1024 * 1024], [vkPath, 1024 * 1024]]) {
  if (fs.statSync(inputPath).size > limit) {
    throw new Error(`DTV_INPUT_TOO_LARGE: ${inputPath} exceeds ${limit} bytes`);
  }
}
const proof = fs.readFileSync(proofPath);
const vk = fs.readFileSync(vkPath);
console.log('proof', proofPath, proof.length);
console.log('vk', vkPath, vk.length);

try {
  for (let round = 1; round <= 2; round += 1) {
    verifyCompressedBytes(proof, vk);
    console.log(`verify #${round} OK`);
  }
} catch (err) {
  console.error('FAIL', err);
  process.exit(1);
}
