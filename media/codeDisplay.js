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

// Placeholder data and initialization
let doc = ';; This is just a placeholder\n(func $one_plus_one\ni32.const 1\ni32.const 1\ni32.add\ndrop\n)';
let lineToFidPc = new Map([[1, [-1, -1]], [2, [0, -1]], [3, [0, 1]], [4, [0, 2]], [5, [0, 3]], [6, [0, 4]], [7, [0, -1]]]);

let selectedLineNumber = -1;
const forceGutterRefresh = StateEffect.define();

/**
 * A codemirror extension with a gutter with (fid, pid)
 */
const fidPcLineGutter = gutter({
  lineMarker(view, line) {
    const lineNumber = view.state.doc.lineAt(line.from).number;
    if (lineNumber === selectedLineNumber) { // Limits the data shown to only the selected line
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
  },
});

/**
 * Formats number[fid, pc] into (fid) or (fid, pc) depending if pc is -1
 * @param {number[]} fidPc A tuple of fid and pc
 * @returns (fid) or (fid, pc)
 */
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

/**
 * Stores the selected line and updates the gutter 
 * 
 * Optionally emits the selected line's fid and pc 
 * @param {codemirror.EditorView} view 
 * @param {codemirror.line} line 
 * @param {boolean} emit Whether to emit `codeSelectedFidPc` or not, defaults to true
 */
function selectLine(view, line, emit = true) {
  selectedLineNumber = line.number;
  if (lineToFidPc && lineToFidPc.has(line.number)) {
    if (emit)  {
      window.vscode.postMessage({
        command: 'codeSelectedFidPc',
        payload: {
          selectedFid: lineToFidPc.get(line.number)[0],
          selectedPc: lineToFidPc.get(line.number)[1]
        }
      });
    }
  }
  view.dispatch({ effects: forceGutterRefresh.of(null) });
}

/**
 * Deselects all lines
 * 
 * Optionally emits fid: -1 and pc: -1
 * @param {codemirror.view} view 
 * @param {boolean} emit Whether to emit `codeSelectedFid` or not, defaults to true
 */
function deselectLine(view, emit = true) {
  selectedLineNumber = -1;
  if(emit){
    window.vscode.postMessage({
      command: 'codeSelectedFidPc',
      payload: {
        selectedFid: -1,
        selectedPc: -1
      }
    });
  }
  view.dispatch({ effects: forceGutterRefresh.of(null) });
}

/**
 * A codemirror extension calling `selectLine(view, line)` and `deselectLine(view)` when a line is clicked
 */
const clickListener = EditorView.domEventHandlers({
  click(event, view) {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) {
      return;
    }
    const line = view.state.doc.lineAt(pos);
    if (selectedLineNumber !== line.number) {
      selectLine(view, line);
    } else {
      deselectLine(view);
    }  },
});

/**
 * A codemirror extension calling `selectLine(view, line)` when a line is selected, 
 * except when it was selected by a click or by code
 */
const selectionListener = EditorView.updateListener.of(update => {
  // We are only interested in selection changes.
  if (update.selectionSet && !update.transactions.some(
    tr => tr.isUserEvent("select.pointer") || 
    tr.isUserEvent("code.scroll")
  )) {
    const pos = update.state.selection.main.head;
    const line = update.state.doc.lineAt(pos);
    // Avoid re-triggering for the same line or deselecting on keyboard navigation.
    if (selectedLineNumber !== line.number) {
      selectLine(update.view, line);
    }
  }
});

// Recieves the messages that are emitted elsewhere
window.addEventListener('message', event => {
  const message = event.data; // The JSON data sent from the extension host

  const payload = message.payload;
  switch (message.command) {
    /*
      {
          command: 'updateWatContent',
          payload: {
              newCode: newWatContent,
              lineToFidPc: Object.fromEntries(lineToFidPc) // Object.fromEntries(Map) due to not being able to pass maps
          }
      }
    */
    case 'updateWatContent':
      // Convert the array of [key, value] pairs into a map, specifically line => [fid, pc]
      lineToFidPc = new Map(Object.entries(payload.lineToFidPc).map(([key, value]) => [parseInt(key, 10), value]));
      const currentState = view.state;
      const transaction = currentState.update({
        changes: {
          from: 0,
          to: currentState.doc.length,
          insert: payload.newCode,
        },
      });
      view.dispatch(transaction);
      break;

    /*
      {
        command: 'updateCodeScroll',
        payload: {
            lineNumber: lineNumber
        }
      }
    */
    case 'updateCodeScroll':
      if (payload.lineNumber === -1) {
        deselectLine(view);
      } else if (payload.lineNumber){
        const lineNumber = Math.floor(payload.lineNumber);
        if (lineNumber > 0 && lineNumber <= view.state.doc.lines) {
          const line = view.state.doc.line(lineNumber);
          view.dispatch({
            effects: EditorView.scrollIntoView(line.from, { y: "center" }),
            selection: { anchor: line.from },
            userEvent: 'code.scroll'
          });
          selectLine(view, line, false);
        }
      }
      break;
  }

});

/**
 * Creates a codemirror.view
 */
const view = new EditorView({
  parent: document.getElementById('wat-editor-container'),
  state: EditorState.create({
    doc: doc,
    extensions: [
      wast(),
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      EditorView.contentAttributes.of({tabindex: "0"}),
      basicSetup, // TODO: maybe... switch this to only the ones that are actually needed
      clickListener,
      selectionListener,
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