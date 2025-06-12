// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as wizVis from './wizVis';

import AnsiToHtml from 'ansi-to-html';

const ansiToHtml = new AnsiToHtml();


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "whamm-visualizer" is now active!');

	context.subscriptions.push(
		vscode.commands.registerCommand('whamm-visualizer.opens-std-display', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage('No active editor found!');
				return;
			}
			const filePath = editor.document.uri.fsPath;
			// Option 1: Use the file path
			const output = wizVis.wizVisFromFile(filePath, true);

			// Option 2: Use the file content
			// const csvContent = editor.document.getText();
			// const output = wizVis.wizVisFromString(csvContent, true);

			const panel = vscode.window.createWebviewPanel(
				'wizVis',
				'WizVis Output',
				vscode.ViewColumn.One,
				{}
			);
			panel.webview.html = getWebviewContent(ansiToHtml.toHtml(output));
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getWebviewContent(visualization: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Output</title>
</head>
<body>
    <pre>${visualization}</pre>
</body>
</html>`;
}