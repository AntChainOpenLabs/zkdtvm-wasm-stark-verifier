import fs from 'node:fs';

// Preserve the previous explicit .cjs entry point without duplicating generated glue.
fs.writeFileSync(
  new URL('../pkg-node/dt_wasm_verifier.cjs', import.meta.url),
  "'use strict';\nmodule.exports = require('./dt_wasm_verifier.js');\n",
);
