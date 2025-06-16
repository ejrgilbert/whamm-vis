"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInfo = getInfo;
function getInfo() {
    return `<div id="main" style="width: 600px;height:400px;"></div>

    <script type="text/javascript">
        // Your JavaScript code from above goes here
        import("echarts").then((echarts) => {
            var myChart = echarts.init(document.getElementById('main'));
            console.log("HELLO" + myChart);
            myChart.setOption({
                title: {
                    text: 'ECharts Getting Started Example'
                },
                tooltip: {},
                xAxis: {
                    data: ['shirt', 'cardigan', 'chiffon', 'pants', 'heels', 'socks']
                },
                yAxis: {},
                series: [
                    {
                        name: 'sales',
                        type: 'bar',
                        data: [5, 20, 36, 10, 10, 20]
                    }
                ]
            });
        }).catch(error => {
            console.error("Failed to dynamically import echarts in extension host:", error);
            vscode.window.showErrorMessage("Failed to load charting library (echarts) in the extension host.");
            panel.webview.html = getWebviewContent("", "", "Error loading charting library. Check extension logs.");
			
        });
    </script>`;
}
//# sourceMappingURL=info.js.map