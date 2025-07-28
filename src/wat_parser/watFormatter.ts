import wabt from 'wabt';

/**
 * Takes the contents of a .wat file and formats them based on wabt
 * @param wat The contents of a .wat file
 * @returns The content of a .wat file reformatted
 */
export async function formatWatToWat(wat: string): Promise<string> {
    const wabtModule = await wabt();
    // The wabt parser is strict. Some tools may generate WAT with invalid identifiers,
    // such as `$"#func179 dummy"`. This is a workaround to sanitize known invalid
    // patterns before parsing. The ideal solution is to fix the WAT source.
    const sanitizedWat = wat.replace(/\$"\#([^"]+)"/g, (match, group1) => {
        // Replace the invalid space character with an underscore.
        return `$${group1.replace(/\s/g, '_')}`;
    });
    const wasmModule = wabtModule.parseWat('reformat.wat', sanitizedWat, {annotations: true});
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


// NOTE/TODO FSM Reorganizes when calculating, breaking line/fidpc pairing