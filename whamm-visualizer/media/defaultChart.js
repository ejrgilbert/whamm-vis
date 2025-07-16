
function defaultChart() {
    // Defer initialization until the DOM is ready and rendered to ensure the
    // container has its dimensions calculated by the browser.
    setTimeout(function () {

        // Initialize ECharts instance
        var myChart = echarts.init(document.getElementById('chart-container'));

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