// media/chart.js
// This script runs inside the webview

(function () {
  const vscode = acquireVsCodeApi(); // Get the VS Code API for communication

  // Initialize ECharts instance
  const chartDom = document.getElementById('chart-container');
  const myChart = echarts.init(chartDom, 'dark');

  // Show a loading animation or placeholder until data arrives
  myChart.showLoading({ text: 'Loading chart data...' });

  

  let cachedOption = {};

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
        const payload = message.payload;
        updateChart(payload);
        break;
    }
  });

  let focused = false;

  myChart.on('dblclick', function (params) {
    if (!focused){
      cachedOption = myChart.getOption();
      updateChart([{data: cachedOption.series[params.seriesIndex].data,
         title: cachedOption.title[params.seriesIndex].text,
         dataGroupId: cachedOption.series[params.seriesIndex].dataGroupId}]);
      focused = true;
    } else {
      updateChart(payloadFromOption(cachedOption));
      focused = false;
    }
  });

  function onBackButton(){
    updateChart(payloadFromOption(cachedOption));
    focused = false;
  }

  function generateSeriesObject(){
    return ({ name: 'Data', type: 'pie', radius: '50%', center: ['50%', '50%'], data: [], dataGroupId: 0});
  }

  function generateTitleObject(){
    return ({ text: 'Chart', subtext: '', left: 'center' });
  }

  /**
   * Updates the chart, extending downwards in rows of two
   * @param {[{data: [{name: string, value: number}], title: string, dataGroupId?: number}]} payload 
   */
  function updateChart(payload){ 

    // Default options structure (data will be filled by message)
    let chartOption = {
      toolbox: {
        feature: {
          myDrag: {
            show: true,
            title: 'Back Button',
            icon: 'image://'+ window.BACK_BUTTON_PATH,
            onclick: onBackButton
          }
        }
      },
      title: [{ text: 'Chart', subtext: '', left: 'center' }],
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{ name: 'Data', type: 'pie', radius: '50%', center: ['50%', '50%'], data: [], dataGroupId: 0}],
      tooltip: {trigger: 'item', formatter: '{a} <br/>{b} : {c} ({d}%)'},
    };

    let requiredHeightPercent = 100;
    if (payload.length > 4) {
      // Calculate required height for multiple rows
      requiredHeightPercent = 10 + 45 * (Math.ceil(payload.length / 2));
    }
    chartDom.style.height = `${requiredHeightPercent}%`;


    // Assuming payload contains [{ data: [{name: '', value: number}], title: '', dataGroupId?: number}, ...]
    if (payload.length > 1){ // Multiple charts will be 2 columns, a single one will fill the whole area
      for (let i = 0; i < payload.length; i++){

        chartOption.series[i] = generateSeriesObject();
        chartOption.title[i] = generateTitleObject();

        if (payload.dataGroupId !== null){
          chartOption.series[i].dataGroupId = payload.dataGroupId;
        } else {
          chartOption.series[i].dataGroupId = i;
        }

        // Adds each line of data
        chartOption.series[i].data = payload[i].data;

        // Sets the positions
        // TODO: make this with math so it can have more than 2 per row
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
        chartOption.series[0].data = payload[0].data;

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
    myChart.resize(); // Ensure chart adapts to new container height
    myChart.setOption(chartOption, true); // true to not merge with previous options
  }

  /**
   * 
   * @param {echarts.option} option 
   * @returns {[{data: [{name: string, value: number}], title: string, dataGroupId?: number}]}
   */
  function payloadFromOption(option){
    let payload = [];
    for (let i = 0; i < option.series.length; i++){
      let entry = {
        data: option.series[i].data,
        title: option.title[i].text,
        dataGroupId: option.series[i].dataGroupId
      };
      payload.push(entry);
    }

    return payload;

  }
}());