//! WASM surface for `zkdtvm_stark_verifier::verify_compressed_bytes`
//! (compressed RootSC reduce proof + full program verifying key).
//!
//! Inputs are bincode-serialized byte buffers:
//! - `proof_bytes`: `DTReduceProof<RootSC>`.
//! - `vk_bytes`: bincode-serialized `DTVerifyingKey`.

use wasm_bindgen::prelude::*;
use zkdtvm_stark_verifier::verify_compressed_bytes as backend_verify_compressed_bytes;

#[wasm_bindgen(js_name = initVerifierRuntime)]
pub fn init_verifier_runtime() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen(js_name = verifyCompressedBytes)]
pub fn verify_compressed_bytes(proof_bytes: &[u8], vk_bytes: &[u8]) -> Result<(), JsValue> {
    backend_verify_compressed_bytes(proof_bytes, vk_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen(js_name = verifyCompressedOk)]
pub fn verify_compressed_ok(proof_bytes: &[u8], vk_bytes: &[u8]) -> bool {
    backend_verify_compressed_bytes(proof_bytes, vk_bytes).is_ok()
}
