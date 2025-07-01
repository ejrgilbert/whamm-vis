// Make sure to rebundle after changing things
//node_modules/.bin/rollup media/codeDisplay.mjs -f iife -o media/codeDisplay.bundle.js -p @rollup/plugin-node-resolve

import { EditorView, basicSetup, wast, EditorState, syntaxHighlighting, HighlightStyle, tags as t } from './codemirrorDependencies.bundle.js';

const view = new EditorView({
  parent: document.getElementById('wat-editor-container'),
  state: EditorState.create({
    doc: `(function $one_plus_one\ni32.const 1\ni32.const 1\ni32.add\ndrop\n)`,
    extensions: [
      wast(),
      EditorView.editable.of(false),
      basicSetup, // Includes line numbers, syntax highlighting, etc.
      EditorView.domEventHandlers({
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
          }
        },
      }),
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
      ]))
    ],
  }),
});

window.addEventListener('message', event => {
      const message = event.data; // The JSON data sent from the extension host

      const payload = message.payload;
      switch (message.command) {
        case 'updateWatContent':
          // Get the current state
          const currentState = view.state;
          console.log(payload.newCode);
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