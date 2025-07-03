import { EditorView, 
  basicSetup, 
  wast, 
  EditorState, 
  syntaxHighlighting, 
  HighlightStyle, 
  tags as t, 
  StateEffect,
  GutterMarker,
  gutter } from './codemirrorDependencies.bundle.js';

// Placeholders
let doc = ';; This is just a placeholder\n(func $one_plus_one\ni32.const 1\ni32.const 1\ni32.add\ndrop\n)';
let lineToFidPc = new Map([[1, [-1, -1]], [2, [0, -1]], [3, [0, 1]], [4, [0, 2]], [5, [0, 3]], [6, [0, 4]], [7, [0, -1]]]);

let clickedLineNumber = -1;
const forceGutterRefresh = StateEffect.define();


const fidPcLineGutter = gutter({
  lineMarker(view, line) {
    const lineNumber = view.state.doc.lineAt(line.from).number;
    if (lineNumber === clickedLineNumber) {
      const fidPc = lineToFidPc.get(lineNumber);
      if (fidPc) {
        return new class extends GutterMarker {
          toDOM() { return document.createTextNode(parseFidPc(fidPc)); }
        };
      }
    }
    return null;
  },
  lineMarkerChange: (update) => {
    return update.transactions.some(tr => tr.effects.some(e => e.is(forceGutterRefresh)));
  },
  initialSpacer: () => new class extends GutterMarker {
    toDOM() { return document.createTextNode(""); }
  }
});

function parseFidPc(fidPc) {
  let fid = fidPc[0];
  let pc = fidPc[1];
  if (fid === -1){
    return "";
  }
  if (pc === -1){
    return `(${fid})`;
  }
  return `(${fid}, ${pc})`;
}

function selectLine(view, line) {
  clickedLineNumber = line.number;
  // Print the line number (1-based) and its text
  console.log(`Selected line number: ${line.number}`);
  console.log(`Line content: "${line.text}"`);
  if (lineToFidPc && lineToFidPc.has(line.number)) {
    console.log(`Function ID & Program Counter: ${lineToFidPc.get(line.number)}`);
    window.vscode.postMessage({
      command: 'codeSelectedFidPc',
      payload: {
        selectedFid: lineToFidPc.get(line.number)[0],
        selectedPc: lineToFidPc.get(line.number)[1]
      }
    });
  }
  view.dispatch({ effects: forceGutterRefresh.of(null) });
}

function deselectLine(view) {
  clickedLineNumber = -1;
  window.vscode.postMessage({
    command: 'codeSelectedFidPc',
    payload: {
      selectedFid: -1,
      selectedPc: -1
    }
  });
  view.dispatch({ effects: forceGutterRefresh.of(null) });
}

const selectionListener = EditorView.updateListener.of(update => {
  // We are only interested in selection changes.
  if (update.selectionSet) {
    const pos = update.state.selection.main.head;
    const line = update.state.doc.lineAt(pos);
    // Avoid re-triggering for the same line or deselecting on keyboard navigation.
    if (clickedLineNumber !== line.number) {
      selectLine(update.view, line);
    }
  }
});

window.addEventListener('message', event => {
  const message = event.data; // The JSON data sent from the extension host

  const payload = message.payload;
  switch (message.command) {
    case 'updateWatContent':
      // When a Map is sent via postMessage, it's converted to a plain Object.
      // We need to convert it back to a Map to use Map methods like .has() and .get().
      // The keys are strings after serialization, so we parse them back to numbers.
      lineToFidPc = new Map(Object.entries(payload.lineToFidPc).map(([key, value]) => [parseInt(key, 10), value]));
      // Get the current state
      const currentState = view.state;
      // Create a transaction to replace the entire document
      // The 'replace' effect is used to change the content
      const transaction = currentState.update({
        changes: {
          from: 0, // Start from the beginning of the document
          to: currentState.doc.length, // Go to the end of the document
          insert: payload.newCode, // Insert the new content
        },
      });
      view.dispatch(transaction);
      break;
    case 'updateCodeScroll':
      if (payload.lineNumber) {
        const lineNumber = Math.floor(payload.lineNumber);
        if (lineNumber > 0 && lineNumber <= view.state.doc.lines) {
          const line = view.state.doc.line(lineNumber);
          view.dispatch({
            effects: EditorView.scrollIntoView(line.from, { y: "center" }),
            selection: { anchor: line.from }
          });
        }
      }
      break;
  }

});

const view = new EditorView({
  parent: document.getElementById('wat-editor-container'),
  state: EditorState.create({
    doc: doc,
    extensions: [
      wast(),
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      EditorView.contentAttributes.of({tabindex: "0"}),
      basicSetup, // Includes line numbers, syntax highlighting, etc.
      selectionListener,
      // EditorView.theme({
      //   "&": {
      //     backgroundColor: "#100C2A", // Dark grey background
      //     color: "#ffffff", // Default text color
      //   },
      //   // You can add more specific styles here if needed
      // }),
      syntaxHighlighting(HighlightStyle.define([
        { tag: t.keyword, color: '#317CD6' },
        { tag: t.typeName, color: '#317CD6' },
        { tag: t.number, color: '#B5CE9B' },
        { tag: t.string, color: '#CE834D' },
        { tag: t.variableName, color: '#53B9FE' },
        { tag: t.lineComment, color: '#549955' },
        { tag: t.blockComment, color: '#549955' },
        { tag: t.paren, color: '#DA70CB' },
      ])),
      fidPcLineGutter
    ],
  }),
});