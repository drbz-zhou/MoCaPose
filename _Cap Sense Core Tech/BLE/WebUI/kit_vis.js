
const colors = ["#FF355E", "#FD5B78", "#FF6037", "#FF9966", "#FF9933", "#FFCC33", "#FFFF66", "#FFFF66", "#CCFF00", "#66FF66", "#AAF0D1", "#50BFE6", "#FF6EFF", "#EE34D2", "#FF00CC", "#FF00CC"];

var frameBufferSize = 200; //data size for calculation
var graphData = { cap_1_1: [], cap_1_2: [], cap_1_3: [], cap_1_4: [], cap_2_1: [], cap_2_2: [], cap_2_3: [], cap_2_4: [] };
for (i = 0; i < frameBufferSize; i++) {
  graphData.cap_1_1.push(0); graphData.cap_1_2.push(0); graphData.cap_1_3.push(0); graphData.cap_1_4.push(0);  //Cap_1
  graphData.cap_2_1.push(0); graphData.cap_2_2.push(0); graphData.cap_2_3.push(0); graphData.cap_2_4.push(0);  //Cap_2

}

var sampleRate = 1000 / 80;  // sampling rate TBD
var xaxis = [];
for (i = 0; i < frameBufferSize; i++) {
  xaxis.push((i * sampleRate) / frameBufferSize + " Hz");
}


function initGraph() {

  //Large Plots (Diagram)
  var traceData_Cap_1 = [];
  var traceData_Cap_2 = [];
  var properties_Cap_1 = ["cap_1_1", "cap_1_2", "cap_1_3", "cap_1_4"];
  var properties_Cap_2 = ["cap_2_1", "cap_2_2", "cap_2_3", "cap_2_4"];

  // initialize legend 
  properties_Cap_1.forEach(function (key) {
    var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
    traceData_Cap_1.push(trace);
  });
  properties_Cap_2.forEach(function (key) {
    var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
    traceData_Cap_2.push(trace);
  });
  Plotly.plot('plot_Cap_1', traceData_Cap_1,
    {
      plot_bgcolor: '#000001',
      paper_bgcolor: '#000001',
      margin: { l: 30, r: 30, b: 25, t: 25 },
      color: '#000001',
      'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
      'yaxis': { 'range': [28000000, 30000000] }
    });

  Plotly.plot('plot_Cap_2', traceData_Cap_2,
    {
      plot_bgcolor: '#000001',
      paper_bgcolor: '#000001',
      margin: { l: 30, r: 30, b: 25, t: 25 },
      color: '#000001',
      'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
      'yaxis': { 'range': [28000000, 30000000] }
    });
}

// redraw plots
function updatePlots(indata) {
  //indata type defined in kit_data
  graphData.cap_1_1.push(indata.cap_1_1); graphData.cap_1_2.push(indata.cap_1_2); graphData.cap_1_3.push(indata.cap_1_3); graphData.cap_1_4.push(indata.cap_1_4);  //Cap_1
  graphData.cap_2_1.push(indata.cap_2_1); graphData.cap_2_2.push(indata.cap_2_2); graphData.cap_2_3.push(indata.cap_2_3); graphData.cap_2_4.push(indata.cap_2_4);  //Cap_2
  // shift oldest sample to maintain frameBufferSize
  if (graphData.cap_1_1.length > frameBufferSize) {
    graphData.cap_1_1.shift();
    graphData.cap_1_2.shift();
    graphData.cap_1_3.shift();
    graphData.cap_1_4.shift();
    graphData.cap_2_1.shift();
    graphData.cap_2_2.shift();
    graphData.cap_2_3.shift();
    graphData.cap_2_4.shift();
  }
  // Update graph
  Plotly.update('plot_Cap_1', {
    y: [graphData.cap_1_1.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.cap_1_2.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.cap_1_3.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.cap_1_4.slice(frameBufferSize - graphWindow, frameBufferSize)]
  });
  Plotly.update('plot_Cap_2', {
    y: [graphData.cap_2_1.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.cap_2_2.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.cap_2_3.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.cap_2_4.slice(frameBufferSize - graphWindow, frameBufferSize)]
  });

}

function updateData(indata) {
  document.getElementById("cap_1_1").innerHTML = indata.cap_1_1;
  document.getElementById("cap_1_2").innerHTML = indata.cap_1_2;
  document.getElementById("cap_1_3").innerHTML = indata.cap_1_3;
  document.getElementById("cap_1_4").innerHTML = indata.cap_1_4;
  document.getElementById("cap_2_1").innerHTML = indata.cap_2_1;
  document.getElementById("cap_2_2").innerHTML = indata.cap_2_2;
  document.getElementById("cap_2_3").innerHTML = indata.cap_2_3;
  document.getElementById("cap_2_4").innerHTML = indata.cap_2_4;
}
