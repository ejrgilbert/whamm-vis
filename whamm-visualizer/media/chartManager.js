// // chartManager.js
// import * as defaultChart from './defaultChart';
// import * as pieChart from './pieChart';
// import * as graph from './graph';



// /**
//  * chartManager.js
//  * This file manages different chart scripts and dynamically updates the chart in the webview.
//  */

// function loadChart(chartType) {
//     let chartScript;
//     switch (chartType) {
//         case 'pie':
//             chartScript = pieChart;
//             break;
//         case 'graph':
//             chartScript = graph;
//             break;
//         case 'default':
//         default:
//             chartScript = defaultChart;
//             break;
//     }

//     const chartContainer = document.getElementById('chart-container');
//     if (chartContainer) {
//         // Clear previous chart
//         chartContainer.innerHTML = '';
//         chartScript.initializeChart();
//     }

// }

// // Make the function accessible to the outside
// window.loadChart = loadChart;
// loadChart('default');