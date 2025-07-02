import { EditorView, 
  basicSetup, 
  wast, 
  EditorState, 
  syntaxHighlighting, 
  HighlightStyle, 
  tags as t, 
  GutterMarker,
  gutter } from './codemirrorDependencies.bundle.js';

// Placeholders
let doc = ';; This is just a placeholder\n(func $one_plus_one\ni32.const 1\ni32.const 1\ni32.add\ndrop\n)';
let lineToFidPc = new Map([[1, [-1, -1]], [2, [0, -1]], [3, [0, 1]], [4, [0, 2]], [5, [0, 3]], [6, [0, 4]], [7, [0, -1]]]);




const fidPcLineGutter = gutter({
  lineMarker(view, line) {
    const lineNumber = view.state.doc.lineAt(line.from).number;
    return new class extends GutterMarker {
      toDOM() { return document.createTextNode(parseFidPc(lineToFidPc.get(lineNumber), lineNumber)); }
    };
  },
  initialSpacer: () => new class extends GutterMarker {
    toDOM() { return document.createTextNode("[99,99]"); }
  }
});

function parseFidPc(fidPc, lineNumber) {
  console.log(fidPc);
  console.log(lineNumber);
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

const clickEvent = EditorView.domEventHandlers({
  // Attach a click event listener to the editor's DOM element
  click(event, view) {
    // Get the position in the document from the click coordinates
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });

    if (pos !== null) {
      // Get the line object at that position
      const line = view.state.doc.lineAt(pos);

      // Print the line number (1-based) and its text
      console.log(`Clicked line number: ${line.number}`);
      console.log(`Line content: "${line.text}"`);
      if (lineToFidPc) {
        if (lineToFidPc.has(line.number)) {
          console.log(`Function ID & Program Counter: ${lineToFidPc.get(line.number)}`);
        } else {
          console.log(lineToFidPc);
        }
      } else {
        console.log('no lineToFidPc');
      }
    }
  },
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
      clickEvent,
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