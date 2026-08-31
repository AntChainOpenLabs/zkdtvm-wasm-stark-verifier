/* tslint:disable */
/* eslint-disable */

export function initVerifierRuntime(): void;

export function verifyCompressedBytes(proof_bytes: Uint8Array, vk_bytes: Uint8Array): void;

export function verifyCompressedOk(proof_bytes: Uint8Array, vk_bytes: Uint8Array): boolean;
