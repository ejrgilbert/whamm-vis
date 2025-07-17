(function () {

    if(!window.chartFunctions){
        window.chartFunctions = new Map();
    }
    window.chartFunctions.set('default', defaultChart);

    function defaultChart() {
        // Defer initialization until the DOM is ready and rendered to ensure the
        // container has its dimensions calculated by the browser.
        setTimeout(function () {

            const chart = echarts.getInstanceByDom(document.getElementById('chart-container'));
            if (chart) {
                // Clear previous chart
                echarts.dispose(chart);
            }

            
            // Initialize ECharts instance
            const chartDom = document.getElementById('chart-container');
            const outerChartDom = document.getElementById('outer-chart-container');
            
            console.log(outerChartDom.clientHeight);
            chartDom.style.height = outerChartDom.clientHeight + 'px';
            
            var myChart = echarts.init(chartDom, 'dark');

            option = {
                // backgroundColor: 'red',
                graphic: {
                    elements: [
                    {
                        type: 'text',
                        left: 'center',
                        top: 'center',
                        style: {
                        text: 'Whamm Vis',
                        fontSize: 80,
                        fontWeight: 'bold',
                        lineDash: [0, 200],
                        lineDashOffset: 0,
                        fill: 'transparent',
                        stroke: '#fff',
                        lineWidth: 1
                        },
                        keyframeAnimation: {
                        duration: 3000,
                        loop: false,
                        keyframes: [
                            {
                            percent: 0.7,
                            style: {
                                fill: 'transparent',
                                lineDashOffset: 200,
                                lineDash: [200, 0]
                            }
                            },
                            {
                            // Stop for a while.
                            percent: 0.8,
                            style: {
                                fill: 'transparent'
                            }
                            },
                            {
                            percent: 1,
                            style: {
                                fill: 'white'
                            }
                            }
                        ]
                        }
                    }
                    ]
                }
            };
            myChart.setOption(option);
        }, 1);
    }
}());