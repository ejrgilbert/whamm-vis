(function () {

    if(!window.chartFunctions){
        window.chartFunctions = new Map();
    }
    window.chartFunctions.set('3DMemoryHotness', threeDMemoryHotnessChart);

    let handleMessage;
    let handleResize;


    function threeDMemoryHotnessChart() {
        // Defer initialization to allow the DOM to render.
        const timeoutId = setTimeout(function () {

            

            // Initialize ECharts instance
            const chartDom = document.getElementById('chart-container');
            const outerChartDom = document.getElementById('outer-chart-container');
            
            chartDom.style.height = outerChartDom.clientHeight + 'px';
            
            window.myChart = echarts.init(chartDom, 'dark');

            const cellPrefix = "Address: ";

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
                data.push({name: (i * 256 + j), value: [i, j, i / (j+1) / 2]});
                }
                xData.push(i);
            }
            for (let j = 0; j < 256; j++) {
                yData.push(j);
            }

            option = {
                tooltip: {formatter: function (param) {
                        return cellPrefix + param.data.name + " " + param.value[2];
                    }},
                visualMap: {
                show: true,
                min: 1,
                max: 6,
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
                    '#a50026'
                    ]
                }
                },
                xAxis3D: {
                type: 'category',
                
                },
                yAxis3D: {
                type: 'category'
                },
                zAxis3D: {
                type: 'value',
                max: 10,
                min: 0
                },
                grid3D: {
                axisLine: {
                    lineStyle: { color: '#fff' }
                },
                axisPointer: {
                    lineStyle: { color: '#fff' }
                },
                viewControl: {
                    // autoRotate: true
                    distance: 200 // default is 200
                },
                light: {
                    main: {
                    shadow: false,
                    quality: 'low',
                    intensity: 1.5
                    }
                },
                boxWidth: 250,   // default is 100
                boxHeight: 150,  // default is 100
                boxDepth: 250,   // default is 100
                },
                series: [
                {
                    selectedMode: 'single',
                    select: {
                        itemStyle: {
                            borderColor: '#39db54',
                            borderWidth: 3
                        }
                    },
                    type: 'bar3D',
                    data: data,
                    shading: 'color',
                    label: {
                    fontSize: 16,
                    borderWidth: 1,
                    
                    },
                    emphasis: {
                    label: {
                        fontSize: 0,
                        color: '#090'
                    },
                    itemStyle: {
                        color: '#090'
                    }
                    }
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
                        updateChart(payload.title, payload.chartData, payload.maxValue, payload.xSize, payload.ySize);
                        cachedOption = window.myChart.getOption();
                        break;
  
                }
                
            };
            window.addEventListener('message', handleMessage);

            function updateChart(title, chartData, maxValue, xSize, ySize){
                let data = [];
                for (let i = 0; i < xSize * ySize; i++){
                   data[i] = {name: i, value: [Math.floor(i / ySize), i % ySize, 0]};
                }

                let xData = [];
                for (let i = 0; i < xSize; i++){
                    xData.push(i);
                }

                let yData = [];
                for (let i = 0; i < ySize; i++){
                    yData.push(i);
                }



                for (let entry of chartData){
                    const modLocation = entry.location % (xSize * ySize);
                    const xLocation = Math.floor(modLocation / ySize);
                    const yLocation = modLocation % ySize;
                    data[modLocation] = {name: modLocation, value: [xLocation, yLocation, entry.value]};
                }
                let newOptions = {
                    title: {
                        top: 30,
                        left: 'center',
                        text: title
                    },
                    tooltip: {formatter: function (param) {
                            return cellPrefix + param.data.name + "<br/>Value: " + param.value[2];
                        }},
                    visualMap: {
                        range: [0.1, maxValue],
                        show: true,
                        min: 0,
                        max: maxValue,
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
                            '#a50026'
                            ]
                        },
                        outOfRange: {
                            color: [
                                '#000000',
                            ]
                        },
                    },
                    xAxis3D: {
                        type: 'category',
                    },
                    yAxis3D: {
                        type: 'category',
                    },
                    zAxis3D: {
                        type: 'value',
                        max: maxValue,
                        min: 0,
                    },
                    grid3D: {
                    axisLine: {
                        lineStyle: { color: '#fff' }
                    },
                    axisPointer: {
                        lineStyle: { color: '#fff' }
                    },
                    viewControl: {
                        distance: 200 // default is 200
                    },
                    boxWidth: 250,   // default is 100
                    boxHeight: 150,  // default is 100
                    boxDepth: 250,   // default is 100
                    },
                    series: [
                    {
                        selectedMode: 'single',
                        select: {
                            itemStyle: {
                                borderColor: '#39db54',
                                borderWidth: 3
                            }
                        },
                        type: 'bar3D',
                        data: data,
                        shading: 'color',
                        label: {
                        fontSize: 16,
                        borderWidth: 1,
                        
                        },
                        emphasis: {
                        label: {
                            fontSize: 0,
                            color: '#090'
                        },
                        itemStyle: {
                            color: '#090'
                        }
                        }
                    }
                    ]
                };
                window.myChart.setOption(newOptions);
            }

            const handleClick = function (params) {
                const currentPage = params.data.name;
                const dropdown = document.getElementById('chart-specific-dropdown');
                if (dropdown) {
                    dropdown.value = currentPage;
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