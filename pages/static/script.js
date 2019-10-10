function getLoad(res) {
    $.post("/admint/load", {
        uid: $.cookie("uid")
    }, (data) => {
        if (data.hasOwnProperty("err")) {
            return res(new Error(data.err));
        }
        sys.innerText = data.os;

        chartLoad.data.labels.push((new Date()).toLocaleTimeString());
        chartLoad.data.datasets[0].data.push(data.cpu);
        if(chartLoad.data.datasets[0].data.length > 100){
            chartLoad.data.datasets[0].data.shift();
            chartLoad.data.labels.shift();
        }
        chartLoad.update();

        chartMem.data.labels.push((new Date()).toLocaleTimeString());
        chartMem.options.scales.yAxes[0].ticks.max = data.ram.totalMemMb;
        chartMem.data.datasets[0].data.push(data.ram.usedMemMb);
        if(chartMem.data.datasets[0].data.length > 100){
            chartMem.data.datasets[0].data.shift();
            chartMem.data.labels.shift();
        }
        chartMem.update();

        chartDisk.data.datasets[0].data = [
            data.disk,
            100 - data.disk
        ];
        chartDisk.update();
        return res();
    });
}

function getNetStat(res) {
    $.post("/admint/net", {
        uid: $.cookie("uid")
    }, (data) => {
        if (data.hasOwnProperty("err")) {
            res(new Error(data.err));
        }
        chartNet.data.labels.push((new Date()).toLocaleTimeString());
        chartNet.data.datasets.forEach(dataset => {
            dataset.data.push(data[dataset.label.toLowerCase()] == Infinity ? 0 : data[dataset.label.toLowerCase()])
        });
        if(chartNet.data.datasets[0].data.length > 100){
            chartNet.data.datasets[0].data.shift();
            chartNet.data.labels.shift();
        }
        chartNet.update();
        return res();
    });
}

function setPresentation(name) {
    $.post("/admint/setPres", {
        uid: $.cookie("uid"),
        presentation: name
    }, (data) => {
        if (data.hasOwnProperty("err")) {
            throw res(new Error(data.err));
        }
    })
}

var options = {
    maintainAspectRatio: false,
    responsive: true,
    spanGaps: false,
    elements: {
        line: {
            tension: 0.5
        }
    },
    plugins: {
        filler: {
            propagate: false
        }
    },
    xAxes: [{
        stacked: true,
        ticks: {
            fontColor: "white"
        },
        tickColor: "white",
        gridColor: "white",
        lineColor: "white"
    }],
    yAxes: [{
        stacked: true,
        gridLines: {
            display: true,
            color: "white"
        },
        ticks: {
            fontColor: "white"
        },
        tickColor: "white",
        gridColor: "white",
        lineColor: "white"
    }],
    legend: {
        labels: {
            fontColor: "white"
        }
    }
};

var opts1 = {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                backgroundColor: "#bfd5f3",
                borderColor: "#2c7be5",
                data: [],
                label: 'Usage',
                fill: "origin"
            }
        ]
    },
    options: Chart.helpers.merge(options, {
        title: {
            text: "CPU usage",
            display: true
        },
        scales: {
            yAxes: [{
                ticks: {
                    min: 0,
                    max: 100
                }
            }]
        }
    })
};

var opts2 = {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                backgroundColor: "#f4bec5",
                borderColor: "#D7263D",
                data: [],
                label: 'RAM',
                fill: "origin"
            }
        ]
    },
    options: Chart.helpers.merge(options, {
        title: {
            text: "RAM",
            display: true
        },
        scales: {
            yAxes: [{
                ticks: {
                    min: 0,
                    max: 0
                }
            }]
        }
    })
};

var opts3 = {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                backgroundColor: "#eec3e8",
                borderColor: "#CB48B7",
                data: [],
                label: 'Upload',
                fill: "origin"
            },
            {
                backgroundColor: "#caeac7",
                borderColor: "#4CB944",
                data: [],
                label: 'Download',
                fill: "origin"
            }
        ]
    },
    options: Chart.helpers.merge(options, {
        title: {
            text: "Network",
            display: true
        },
        scales: {
            yAxes: [{
                display: true,
                type: "linear",
                ticks: {
                    min: 0,
                }
            }]
        }
    })
};

var opts4 = {
    type: 'doughnut',
    data: {
        datasets: [{
            data: [],
            backgroundColor: [
                "rgb(75, 192, 192)",
                "rgb(255, 205, 86)"
            ],
            label: 'Disk'
        }],
        labels: [
            "Used",
            "Free"
        ]
    },
    options: {
        responsive: true,
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Disk'
        },
        animation: {
            animateScale: true,
            animateRotate: true
        }
    }
};