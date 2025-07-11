import wabt from 'wabt';

/**
 * Takes the contents of a .wat file and formats them based on wabt
 * @param wat The contents of a .wat file
 * @returns The content of a .wat file reformatted
 */
export async function formatWatToWat(wat: string): Promise<string> {
    const wabtModule = await wabt();
    const wasmModule = wabtModule.parseWat('reformat.wat', wat);
    wasmModule.validate();
    return wasmModule.toText({ foldExprs: false, inlineExport: false });
}

/**
 * Takes the contents of a .wasm file and formats them based on wabt
 * @param wasm The contents of a .wasm file
 * @returns The content of a .wat file reformatted
 */
export async function formatWasmToWat(wasm: Buffer | Uint8Array): Promise<string> {
    const wabtModule = await wabt();
    const wasmModule = wabtModule.readWasm(wasm, { readDebugNames: true });
    wasmModule.validate();
    return wasmModule.toText({ foldExprs: false, inlineExport: false });
}