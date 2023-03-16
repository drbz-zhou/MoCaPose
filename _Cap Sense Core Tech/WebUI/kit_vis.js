
const colors = ["#FF355E", "#FD5B78", "#FF6037", "#FF9966", "#FF9933", "#FFCC33", "#FFFF66", "#FFFF66", "#CCFF00", "#66FF66", "#AAF0D1", "#50BFE6", "#FF6EFF", "#EE34D2", "#FF00CC", "#FF00CC"];

var frameBufferSize = 200; //data size for calculation
var graphData = { cap_0_0: [], cap_0_1: [], cap_0_2: [], cap_0_3: [], cap_1_0: [], cap_1_1: [], cap_1_2: [], cap_1_3: [] };
for (i = 0; i < frameBufferSize; i++) {
    graphData.cap_0_0.push(0); graphData.cap_0_1.push(0); graphData.cap_0_2.push(0); graphData.cap_0_3.push(0);  //Cap_1
    graphData.cap_1_0.push(0); graphData.cap_1_1.push(0); graphData.cap_1_2.push(0); graphData.cap_1_3.push(0);  //Cap_2

}

var sampleRate = 1000 / 80;  // sampling rate TBD
var xaxis = [];
for (i = 0; i < frameBufferSize; i++) {
    xaxis.push((i * sampleRate) / frameBufferSize + " Hz");
}


function initGraph() {

    //Large Plots (Diagram)
    var traceData_Cap_0 = [];
    var traceData_Cap_1 = [];
    var properties_Cap_0 = ["cap_0_0", "cap_0_1", "cap_0_2", "cap_0_3"];
    var properties_Cap_1 = ["cap_1_0", "cap_1_1", "cap_1_2", "cap_1_3"];

    // initialize legend 
    properties_Cap_0.forEach(function (key) {
        var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
        traceData_Cap_0.push(trace);
    });
    properties_Cap_1.forEach(function (key) {
        var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
        traceData_Cap_1.push(trace);
    });
    Plotly.plot('plot_Cap_0', traceData_Cap_0,
        {
            plot_bgcolor: '#2e2e2e',
            paper_bgcolor: '#2e2e2e',
            font: { color: '#ffffff' },
            margin: { l: 30, r: 30, b: 25, t: 25 },
            color: '#2e2e2e',
            'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
            'yaxis': { 'autorange': "true" }
        });

    Plotly.plot('plot_Cap_1', traceData_Cap_1,
        {

            plot_bgcolor: '#2e2e2e',
            paper_bgcolor: '#2e2e2e',
            font: { color: '#ffffff' },
            margin: { l: 30, r: 30, b: 25, t: 25 },
            color: '#2e2e2e',
            'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
            'yaxis': { 'autorange': "true" }

        });
}

// redraw plots
function updatePlots(indata) {
    //indata type defined in kit_data
    graphData.cap_0_0.push(indata.cap_0_0); graphData.cap_0_1.push(indata.cap_0_1); graphData.cap_0_2.push(indata.cap_0_2); graphData.cap_0_3.push(indata.cap_0_3);  //Cap_0
    graphData.cap_1_0.push(indata.cap_1_0); graphData.cap_1_1.push(indata.cap_1_1); graphData.cap_1_2.push(indata.cap_1_2); graphData.cap_1_3.push(indata.cap_1_3);  //Cap_1
    // shift oldest sample to maintain frameBufferSize
    if (graphData.cap_0_0.length > frameBufferSize) {
        graphData.cap_0_0.shift();
        graphData.cap_0_1.shift();
        graphData.cap_0_2.shift();
        graphData.cap_0_3.shift();
        graphData.cap_1_0.shift();
        graphData.cap_1_1.shift();
        graphData.cap_1_2.shift();
        graphData.cap_1_3.shift();
    }
    // Update graph
    Plotly.update('plot_Cap_0', {
        y: [graphData.cap_0_0.slice(frameBufferSize - graphWindow, frameBufferSize),
        graphData.cap_0_1.slice(frameBufferSize - graphWindow, frameBufferSize),
        graphData.cap_0_2.slice(frameBufferSize - graphWindow, frameBufferSize),
        graphData.cap_0_3.slice(frameBufferSize - graphWindow, frameBufferSize)]
    });
    Plotly.update('plot_Cap_1', {
        y: [graphData.cap_1_0.slice(frameBufferSize - graphWindow, frameBufferSize),
        graphData.cap_1_1.slice(frameBufferSize - graphWindow, frameBufferSize),
        graphData.cap_1_2.slice(frameBufferSize - graphWindow, frameBufferSize),
        graphData.cap_1_3.slice(frameBufferSize - graphWindow, frameBufferSize)]
    });

}

function updateData(indata) {
    document.getElementById("cap_0_0").innerHTML = indata.cap_0_0;
    document.getElementById("cap_0_1").innerHTML = indata.cap_0_1;
    document.getElementById("cap_0_2").innerHTML = indata.cap_0_2;
    document.getElementById("cap_0_3").innerHTML = indata.cap_0_3;
    document.getElementById("cap_1_0").innerHTML = indata.cap_1_0;
    document.getElementById("cap_1_1").innerHTML = indata.cap_1_1;
    document.getElementById("cap_1_2").innerHTML = indata.cap_1_2;
    document.getElementById("cap_1_3").innerHTML = indata.cap_1_3;
}
