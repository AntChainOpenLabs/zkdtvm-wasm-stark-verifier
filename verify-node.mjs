import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));

const { initVerifierRuntime, verifyCompressedBytes } = await import(
  path.join(root, 'pkg-node', 'dt_wasm_verifier.js')
);

initVerifierRuntime();

// If explicit paths are given, verify that single pair and exit.
if (process.argv[2] && process.argv[3]) {
  verifySingle(process.argv[2], process.argv[3]);
  process.exit(0);
}

// Otherwise, run all fixtures from fixtures/index.json.
const indexPath = path.join(root, 'fixtures', 'index.json');
const fixtures = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

console.log(`Running ${fixtures.length} fixture(s):\n`);

let passed = 0;
let failed = 0;

for (const fixture of fixtures) {
  const proofPath = path.join(root, fixture.proof.replace(/^\//, ''));
  const vkPath = path.join(root, fixture.vk.replace(/^\//, ''));
  const expectFail = fixture.expect === 'fail';

  console.log(`[${fixture.name}]${expectFail ? ' (expect: fail)' : ''}`);

  const ok = runVerify(proofPath, vkPath);

  if (expectFail && !ok) {
    console.log('  ✓ correctly rejected');
    passed++;
  } else if (expectFail && ok) {
    console.log('  ✗ should have failed but passed!');
    failed++;
  } else if (!expectFail && ok) {
    passed++;
  } else {
    failed++;
  }
  console.log('');
}

console.log(`Done: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

function runVerify(proofPath, vkPath) {
  const proof = fs.readFileSync(proofPath);
  const vk = fs.readFileSync(vkPath);

  console.log('  proof', proofPath, `(${proof.length} bytes)`);
  console.log('  vk   ', vkPath, `(${vk.length} bytes)`);

  const t0 = performance.now();
  try {
    verifyCompressedBytes(proof, vk);
    console.log('  OK', (performance.now() - t0).toFixed(2), 'ms');
    return true;
  } catch (err) {
    console.log('  FAIL', String(err), `(${(performance.now() - t0).toFixed(2)} ms)`);
    return false;
  }
}
