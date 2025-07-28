// This file defines the CodeMirror modules that will be bundled together.
export { EditorView, basicSetup } from "codemirror";
export { EditorState, StateField, StateEffect, Compartment } from "@codemirror/state";
export { GutterMarker, gutter, lineNumbers, } from "@codemirror/view";
export { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
export { tags } from '@lezer/highlight';
export { wast } from "@codemirror/lang-wast";

// run when changed:
// npx rollup media/codemirrorDependencies.mjs -f es -o media/codemirrorDependencies.bundle.js -p @rollup/plugin-node-resolve