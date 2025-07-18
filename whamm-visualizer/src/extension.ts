// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as textVis from './text_display/textVis';
import * as pieVis from './pie_chart_display/pieVis';
import * as graphVis from './graph_chart_display/graphVis';
import * as sideBySidePie from './pie_chart_display/sideBySidePie';
import * as sideBySideGraph from './graph_chart_display/SideBySideGraph';

import * as stdSideBySide from './std_side_by_side/stdSideBySide';
import * as stdSingle from './std_side_by_side/stdSingle';






// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "whamm-visualizer" is now active!');

	context.subscriptions.push(
		textVis.textDisplay()
	);

	context.subscriptions.push(
		pieVis.pieDisplay(context)
	);

	context.subscriptions.push(
		sideBySidePie.sidebySidePieDisplay(context)
	);

	context.subscriptions.push(
		graphVis.graphDisplay(context)
	);

	context.subscriptions.push(
		sideBySideGraph.sideBySideGraphDisplay(context)
	);

	context.subscriptions.push(
		stdSideBySide.stdSideBySideDisplay(context)
	);

	context.subscriptions.push(
		stdSingle.stdDisplay(context)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
