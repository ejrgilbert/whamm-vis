/**
 * 
 * @param labels The labels for various menus, currently only one is in use
 * @param options The options for the dropdown
 * @returns An HTML element for a top bar
 */
export function generateTopBar(labels: [string, string], options: string[]|number[]): string{
    const optionsHTML: string = options.map(obj => `<vscode-option>${obj}</vscode-option>`).join('\n');
    
    
    return `
        <div class="top-bar">
            <div class="dropdown-container">
                <label for="options-dropdown">${labels[0]}</label>
                <div class="dropdown-controls">
                    <vscode-dropdown id="options-dropdown">
                        ${optionsHTML}
                    </vscode-dropdown>
                    <vscode-button id="confirm-button">Filter</vscode-button>
                </div>
            </div>
        </div>`;
}