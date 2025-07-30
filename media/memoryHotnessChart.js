(function () {

    if(!window.chartFunctions){
        window.chartFunctions = new Map();
    }
    window.chartFunctions.set('memoryHotness', memoryHotnessChart);

    let handleMessage;
    let handleResize;


    function memoryHotnessChart() {
        // Defer initialization to allow the DOM to render.
        const timeoutId = setTimeout(function () {

            

            // Initialize ECharts instance
            const chartDom = document.getElementById('chart-container');
            const outerChartDom = document.getElementById('outer-chart-container');
            
            chartDom.style.height = outerChartDom.clientHeight + 'px';
            
            window.myChart = echarts.init(chartDom, 'dark');

            let cellPrefix = "Address: ";
            let dropdownSuffix = '';
            let navigable = false;

            handleResize = () => {
                chartDom.style.height = outerChartDom.clientHeight + 'px';
                window.myChart.resize();
            };
            window.addEventListener('resize', handleResize);

            let xData = [];
            let yData = [];

            let data = [];
            for (let i = 0; i <= 256; i++) {
                for (let j = 0; j <= 256; j++) {
                data.push({name: (i * 256 + j), value: [i, j, i / (j + 1) / 2]});
                }
                xData.push(i);
            }
            for (let j = 0; j < 256; j++) {
                yData.push(j);
            }

            option = {
            tooltip: {formatter: function (param) {
                            return cellPrefix + param.data.name + "\nValue: " + param.value[2];
                        }},
            xAxis: {
                type: 'category',
                data: xData,
                show: false 
            },
            yAxis: {
                type: 'category',
                data: yData,
                inverse: true,
                axisLabel: {
                    formatter: function (value, index) {
                        return value * 256;
                }},
            },
            visualMap: {
                type: 'piecewise',
                min: 0,
                max: 1,
                // calculable: true,
                realtime: false,
                // Use pieces to define specific ranges and their colors
                pieces: [
                    {
                        value: 0, // When the value is exactly 0
                        color: '#000000'
                    },
                    {
                        gt: 0, // When the value is greater than 0
                        // This range will use the original color gradient
                        color: [
                            '#313695',
                            '#4575b4',
                            '#74add1',
                            '#abd9e9',
                            '#e0f3f8',
                            '#ffffbf',
                            '#fee090',
                            '#fdae61',
                            '#f46d43',
                            '#d73027',
                            '#a50026'
                        ]
                    }
                ],
            },
            dataZoom: [
                {
                    id: 'horizontal-inside',
                    type: 'inside',
                    orient: 'horizontal',
                filerMode: 'none'
                },
                {
                    id: 'vertical-inside',
                    type: 'inside',
                    orient: 'vertical',
                filerMode: 'none'
                },
            ],
            title: {
                top: 30,
                left: 'center',
                text: 'Placeholder'
            },
            series: [
                {
                name: 'Gaussian',
                type: 'heatmap',
                data: data,
                emphasis: {
                    itemStyle: {
                    borderColor: '#333',
                    borderWidth: 1
                    }
                },
                progressive: 1000,
                animation: false
                }
            ]
            };
            window.myChart.setOption(option);

            // Recieves the messages
            handleMessage = event => {
                const message = event.data; // The JSON data sent from the extension host

                const payload = message.payload;
                switch (message.command) {
                    /*
                        const payload: memoryHotnessChartPayload = {
                            title: this.fileName,
                            chartData: data,
                            maxValue: maxValue,
                        };
                    */
                    case 'updateChartData':
                        window.myChart.hideLoading();
                        cellPrefix = payload.prefix;
                        dropdownSuffix = payload.dropdownSuffix;
                        navigable = payload.navigable;
                        updateChart(payload.title, payload.chartData, payload.maxValue, payload.xSize, payload.ySize, payload.minAddress, payload.maxAddress);
                        cachedOption = window.myChart.getOption();
                        break;
  
                }
                
            };
            window.addEventListener('message', handleMessage);

            function updateChart(title, chartData, maxValue, xSize, ySize, minAddress, maxAddress){
                let data = [];
                for (let i = 0; i < Math.min(ySize * xSize, maxAddress + 1 - minAddress); i++){
                   data[i] = {name: i, value: [i % xSize, Math.floor(i / xSize), 0]};
                }

                let xData = [];
                for (let i = 0; i < ySize; i++){
                    xData.push(i);
                }

                let yData = [];
                for (let i = 0; i < xSize; i++){
                    yData.push(i);
                }



                for (let entry of chartData){
                    const modLocation = entry.location % (ySize * xSize);
                    const xLocation = modLocation % xSize;
                    const yLocation = Math.floor(modLocation / xSize);
                    data[modLocation] = {name: entry.location, value: [xLocation, yLocation, entry.value]};
                }

                let newOptions = {
                    tooltip: {formatter: function (param) {
                        return cellPrefix + param.data.name + "</br>Value: " + param.value[2];
                    }},
                    title: {
                        top: 30,
                        left: 'center',
                        text: title
                    },
                    series: [
                        {
                        
                        name: 'Gaussian',
                        type: 'heatmap',
                        data: data,
                        emphasis: {
                            itemStyle: {
                            borderColor: '#333',
                            borderWidth: 1
                            }
                        },
                        progressive: 1000,
                        animation: false
                        }
                    ],
                    visualMap: {
                        type: 'continuous',
                        min: 0,
                        max: maxValue,
                        range: [0.1, maxValue],
                        // calculable: true,
                        realtime: false,
                        inRange: {
                            color: [
                                '#313695', 
                                '#4575b4',
                                '#74add1',
                                '#abd9e9',
                                '#e0f3f8',
                                '#ffffbf',
                                '#fee090',
                                '#fdae61',
                                '#f46d43',
                                '#d73027',
                                '#a50026' // Color for 'maxValue'
                            ]
                        },
                        outOfRange: {
                            color: [
                                '#000000',
                            ]
                        },
                    },
                    xAxis: {
                        type: 'category',
                        data: xData,
                        show: false 
                    },
                    yAxis: {
                        type: 'category',
                        data: yData,
                        inverse: true,
                        axisLabel: {
                            formatter: function (value, index) {
                                return value * xSize;
                        }},
                    },
                };
                window.myChart.setOption(newOptions);
            }

            const handleClick = function (params) {
                if(!navigable){ return; }
                const currentPage = params.data.name;
                const dropdown = document.getElementById('chart-specific-dropdown');
                if (dropdown) {
                    dropdown.value = currentPage + dropdownSuffix;
                    // Dispatch a 'change' event so that other listeners can react to the new value.
                    // This will trigger the 'chartSpecificDropdownChanged' message to the extension backend.
                    dropdown.dispatchEvent(new Event('change'));
                }
            };
            window.myChart.on('click', handleClick);
   
        }, 1);

        
        // --- Return a cleanup function ---
        return function cleanup() {
        clearTimeout(timeoutId);
        const chart = echarts.getInstanceByDom(document.getElementById('chart-container'));
        if (chart) {
            // Event listeners are bound to the chart instance, so disposing the chart should be enough.
            // If they were on `window`, we would need to remove them explicitly.
            // For this implementation, we can just dispose the chart.
            chart.dispose();
        }
        // If you had window listeners set up inside pieChart function, you would remove them here:
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('message', handleMessage);
        };
    }
}());