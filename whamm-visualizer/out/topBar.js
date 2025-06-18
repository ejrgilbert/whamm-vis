"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTopBar = generateTopBar;
function generateTopBar(labels, options) {
    const optionsHTML = options.map(obj => `<vscode-option>${obj}</vscode-option>`).join('\n');
    return `
        <div id="top-bar">
            <div class="dropdown-container">
                <label for="options-dropdown">${labels[0]}</label>
                <vscode-dropdown id="options-dropdown">
                    ${optionsHTML}
                </vscode-dropdown>
            </div>
            <div class="dropdown-container">
                <label for="confirm-button">${labels[1]}</label>
                <vscode-button id="confirm-button">Confirm</vscode-button>
            </div>
        </div>`;
}
//# sourceMappingURL=topBar.js.map