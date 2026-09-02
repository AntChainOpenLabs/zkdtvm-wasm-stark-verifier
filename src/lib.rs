//! WASM surface for reusable, elided L4 compressed-proof verification.
//!
//! Inputs are bincode-serialized byte buffers:
//! - `proof_bytes`: `DTReduceProof<RootSC>`.
//! - `vk_bytes`: bincode-serialized `DTVerifyingKey`.

use std::cell::OnceCell;
use wasm_bindgen::prelude::*;
use zkdtvm_stark_verifier::CompressedVerifier;

const L4_VERIFIER_ARTIFACT: &[u8] = include_bytes!("../artifacts/v0.8.0-l4-verifier.bin");

thread_local! {
    static VERIFIER: OnceCell<Result<CompressedVerifier, String>> = const { OnceCell::new() };
}

fn with_verifier<T>(f: impl FnOnce(&CompressedVerifier) -> Result<T, String>) -> Result<T, String> {
    VERIFIER.with(|cell| {
        match cell.get_or_init(|| CompressedVerifier::from_artifact_bytes(L4_VERIFIER_ARTIFACT)) {
            Ok(verifier) => f(verifier),
            Err(error) => Err(error.clone()),
        }
    })
}

#[wasm_bindgen(js_name = initVerifierRuntime)]
pub fn init_verifier_runtime() -> Result<(), JsValue> {
    console_error_panic_hook::set_once();
    with_verifier(|_| Ok(())).map_err(|e| JsValue::from_str(&e))
}

#[wasm_bindgen(js_name = verifyCompressedBytes)]
pub fn verify_compressed_bytes(proof_bytes: &[u8], vk_bytes: &[u8]) -> Result<(), JsValue> {
    with_verifier(|verifier| verifier.verify_compressed_bytes(proof_bytes, vk_bytes))
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen(js_name = verifyCompressedOk)]
pub fn verify_compressed_ok(proof_bytes: &[u8], vk_bytes: &[u8]) -> bool {
    with_verifier(|verifier| verifier.verify_compressed_bytes(proof_bytes, vk_bytes)).is_ok()
}
