//! Single-threaded WASM byte API for SealProof v6 and SDK application key schema 1.
use wasm_bindgen::prelude::*;
use zkdtvm_stark_verifier::validate_input_lengths;

#[wasm_bindgen(js_name = initVerifierRuntime)]
pub fn init_verifier_runtime() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    zkdtvm_stark_verifier::init_verifier_runtime().map_err(|e| JsValue::from_str(&e))
}

#[wasm_bindgen(js_name = verifyCompressedBytes)]
pub fn verify_compressed_bytes(
    proof_bytes: js_sys::Uint8Array,
    vk_bytes: js_sys::Uint8Array,
) -> Result<(), JsValue> {
    verify_js_inputs(&proof_bytes, &vk_bytes).map_err(|e| JsValue::from_str(&e))
}

#[wasm_bindgen(js_name = verifyCompressedOk)]
pub fn verify_compressed_ok(proof_bytes: js_sys::Uint8Array, vk_bytes: js_sys::Uint8Array) -> bool {
    verify_js_inputs(&proof_bytes, &vk_bytes).is_ok()
}

fn verify_js_inputs(proof: &js_sys::Uint8Array, vk: &js_sys::Uint8Array) -> Result<(), String> {
    // Accept the JS objects at the ABI boundary, then enforce limits before either copy.
    validate_input_lengths(proof.length() as usize, vk.length() as usize)?;
    let proof = proof.to_vec();
    let vk = vk.to_vec();
    zkdtvm_stark_verifier::verify_compressed_bytes(&proof, &vk)
}
