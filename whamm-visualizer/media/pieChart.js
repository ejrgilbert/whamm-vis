// media/chart.js
// This script runs inside the webview

(function () {
  const vscode = acquireVsCodeApi(); // Get the VS Code API for communication

  // Initialize ECharts instance
  const chartDom = document.getElementById('chart-container');
  const myChart = echarts.init(chartDom, 'dark');

  // Show a loading animation or placeholder until data arrives
  myChart.showLoading({ text: 'Loading chart data...' });

  // Default options structure (data will be filled by message)
  let chartOption = {
    title: [{ text: 'Chart', subtext: '', left: 'center' }],
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{ name: 'Data', type: 'pie', radius: '50%', center: ['50%', '50%'], data: [], dataGroupId: 0}],
    
  };

  // Optional: Handle resizing to make the chart responsive
  window.addEventListener('resize', () => {
    myChart.resize();
  });

  // Optional: Listen for messages from the extension host
  window.addEventListener('message', event => {
    const message = event.data; // The JSON data sent from the extension host

    switch (message.command) {
      case 'updateChartData':
        myChart.hideLoading();


        
        let requiredHeightPercent = 100;
        if (message.payload.length > 4) {
          // Calculate required height for multiple rows
          // Last row's center_y is 30 + 45 * (numRows - 1) %
          // Radius is 20%. Add some margin (e.g., 5%).
          requiredHeightPercent = (30 + 45 * (Math.ceil(message.payload.length / 2))) - 20;
        }
        chartDom.style.height = `${requiredHeightPercent}%`;


        // Assuming message.payload contains [{ data: [{name: '', value: number}], title: ''}, ...]
        const payload = message.payload;
        if (message.payload.length > 1){ // Multiple charts will be 2 columns, a single one will fill the whole area
          for (let i = 0; i < payload.length; i++){

            chartOption.series[i] = generateSeriesObject();
            chartOption.title[i] = generateTitleObject();

            chartOption.series[i].dataGroupId = i;

            // Adds each line of data
            chartOption.series[i].data = payload[i].data.map(obj => ({name: obj.name + ": ", value: obj.value}));

            // Sets the positions
            if (i % 2) {
              chartOption.title[i].left = '55%';
              chartOption.series[i].center[0] = '75%';
            } else {
              chartOption.title[i].left = '5%';
              chartOption.series[i].center[0] = '25%';
            }
            chartOption.title[i].top = (10 + (45 * Math.floor(i/2))) / requiredHeightPercent * 100 + "%";
            chartOption.series[i].center[1] = (30 + (45 * Math.floor(i / 2))) / requiredHeightPercent * 100 + "%";
            chartOption.title[i].textAllign = 'left';
            chartOption.title[i].textVerticalAllign = 'top';

            // Sets the title
            chartOption.title[i].text = payload[i].title;
            chartOption.series[i].name = payload[i].title;
            
            chartOption.series[i].radius = '20%';

            
          }
        } else {

            chartOption.series.dataGroupId = 0;

            // Adds the line of data
            chartOption.series[0].data = payload[0].data.map(obj => ({name: obj.name + ": ", value: obj.value}));

            // Sets the title
            chartOption.title[0].text = payload[0].title;
            chartOption.series[0].name = payload[0].title;
            
        }

        // Add emphasis style if not already part of the base chartOption
        chartOption.series[0].emphasis = {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        };
        myChart.setOption(chartOption, true); // true to not merge with previous options
        myChart.resize(); // Ensure chart adapts to new container height
        break;
    }
  });

  // Optional: Send messages back to the extension host
  // For example, when a user clicks on a chart element
  myChart.on('click', function (params) {
    vscode.postMessage({
      command: 'chartClicked',
      data: params.data
    });
  });

  function generateSeriesObject(){
    return ({ name: 'Data', type: 'pie', radius: '50%', center: ['50%', '50%'], data: [], dataGroupId: 0});
  }

  function generateTitleObject(){
    return ({ text: 'Chart', subtext: '', left: 'center' });
  }
}());