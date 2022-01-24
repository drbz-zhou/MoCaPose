
const colors = ["#FF355E", "#FD5B78", "#FF6037", "#FF9966", "#FF9933", "#FFCC33", "#FFFF66", "#FFFF66", "#CCFF00", "#66FF66", "#AAF0D1", "#50BFE6", "#FF6EFF", "#EE34D2", "#FF00CC", "#FF00CC"];

//plotly data initial
var gaugedata_Temp = [{
  domain: { x: [0, 1], y: [0, 1] },
  value: 0.1,
  type: "indicator",
  mode: "gauge+number",
  number: { suffix: "°C" },
  delta: { reference: 0.5 },
  gauge: {
    axis: { range: ranges.temp },
    bar: { color: "blue" },
    threshold: {
      line: { color: "red", width: 4 },
      thickness: 0.75,
      value: 0.7 * (ranges.temp[1] - ranges.temp[0]) + ranges.temp[0]
    }
  }
}];
var gaugedata_Press = [{
  domain: { x: [0, 1], y: [0, 1] },
  value: 0.1,
  type: "indicator",
  mode: "gauge+number",
  number: { suffix: "mbar" },
  delta: { reference: 0.5 },
  gauge: {
    axis: { range: ranges.press },
    bar: { color: "blue" },
    threshold: {
      line: { color: "red", width: 4 },
      thickness: 0.75,
      value: 0.7 * (ranges.press[1] - ranges.press[0]) + ranges.press[0]
    }
  }
}];
var gaugedata_Hum = [{
  domain: { x: [0, 1], y: [0, 1] },
  value: 0.1,
  type: "indicator",
  mode: "gauge+number",
  number: { suffix: "%" },
  delta: { reference: 0.5 },
  gauge: { //shape:"bullet",
    axis: { range: ranges.hum },
    bar: { color: "blue" },
    threshold: {
      line: { color: "red", width: 4 },
      thickness: 0.75,
      value: 0.7 * (ranges.hum[1] - ranges.hum[0]) + ranges.hum[0]
    }
  }
}];

var frameBufferSize = 200; //data size for calculation
var graphData = { acc_x: [], acc_y: [], acc_z: [], gyr_x: [], gyr_y: [], gyr_z: [], mag_x: [], mag_y: [], mag_z: [] };
for (i = 0; i < frameBufferSize; i++) {
  graphData.acc_x.push(0); graphData.acc_y.push(0); graphData.acc_z.push(0);  //acc
  graphData.gyr_x.push(0); graphData.gyr_y.push(0); graphData.gyr_z.push(0);  //gyro
  graphData.mag_x.push(0); graphData.mag_y.push(0); graphData.mag_z.push(0);  //temps
}

var sampleRate = 1000 / 80;  // sampling rate TBD
var xaxis = [];
for (i = 0; i < frameBufferSize; i++) {
  xaxis.push((i * sampleRate) / frameBufferSize + " Hz");
}


function initGraph() {

  //Large Plots (Diagram)
  var traceData_Acc = [];
  var traceData_Gyr = [];
  var traceData_Mag = [];
  var properties_Acc = ["acc_x", "acc_y", "acc_z"];
  var properties_Gyr = ["gyr_x", "gyr_y", "gyr_z"];
  var properties_Mag = ["mag_x", "mag_y", "mag_z"];

  // initialize legend 
  properties_Acc.forEach(function (key) {
    var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
    traceData_Acc.push(trace);
  });
  properties_Gyr.forEach(function (key) {
    var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
    traceData_Gyr.push(trace);
  });
  properties_Mag.forEach(function (key) {
    var trace = { y: [], mode: 'scatter', opacity: 0.7, name: key };
    traceData_Mag.push(trace);
  });
  Plotly.plot('plot_Acc', traceData_Acc,
    {
      plot_bgcolor: '#000001',
      paper_bgcolor: '#000001',
      margin: { l: 30, r: 30, b: 25, t: 25 },
      color: '#000001',
      'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
      'yaxis': { 'range': [-20, 20] }
    });

  Plotly.plot('plot_Gyr', traceData_Gyr,
    {
      plot_bgcolor: '#000001',
      paper_bgcolor: '#000001',
      margin: { l: 30, r: 30, b: 25, t: 25 },
      color: '#000001',
      'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
      'yaxis': { 'range': [-10, 10] }
    });

  Plotly.plot('plot_Mag', traceData_Mag,
    {
      plot_bgcolor: '#000001',
      paper_bgcolor: '#000001',
      margin: { l: 30, r: 30, b: 25, t: 25 },
      color: '#000001',
      'xaxis': { 'range': [frameBufferSize], 'autorange': "true" },
      'yaxis': { 'range': [-10000, 10000] }
    });


  //Small Plots (Gauge)
  var layout = {
    width: 200, height: 200,
    margin: { 'b': 0, 'l': 20, 't': 0, 'r': 20 },
    plot_bgcolor: '#000001',
    paper_bgcolor: '#000001',
    color: '#000001',
    font: { color: '#aaaaaa' }
  };

  Plotly.newPlot('gauge_Temp', gaugedata_Temp, layout);
  Plotly.newPlot('gauge_Press', gaugedata_Press, layout);
  Plotly.newPlot('gauge_Hum', gaugedata_Hum, layout);
}

// redraw plots
function updatePlots(indata) {
  //indata type defined in kit_data
  graphData.acc_x.push(indata.acc_x); graphData.acc_y.push(indata.acc_y); graphData.acc_z.push(indata.acc_z);
  graphData.gyr_x.push(indata.gyr_x); graphData.gyr_y.push(indata.gyr_y); graphData.gyr_z.push(indata.gyr_z);
  graphData.mag_x.push(indata.mag_x); graphData.mag_y.push(indata.mag_y); graphData.mag_z.push(indata.mag_z);

  // shift oldest sample to maintain frameBufferSize
  if (graphData.acc_x.length > frameBufferSize) {
    graphData.acc_x.shift();
    graphData.acc_y.shift();
    graphData.acc_z.shift();
    graphData.gyr_x.shift();
    graphData.gyr_y.shift();
    graphData.gyr_z.shift();
    graphData.mag_x.shift();
    graphData.mag_y.shift();
    graphData.mag_z.shift();
  }
  // Update graph
  Plotly.update('plot_Acc', {
    y: [graphData.acc_x.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.acc_y.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.acc_z.slice(frameBufferSize - graphWindow, frameBufferSize)]
  });
  Plotly.update('plot_Gyr', {
    y: [graphData.gyr_x.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.gyr_y.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.gyr_z.slice(frameBufferSize - graphWindow, frameBufferSize)]
  });
  Plotly.update('plot_Mag', {
    y: [graphData.mag_x.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.mag_y.slice(frameBufferSize - graphWindow, frameBufferSize),
    graphData.mag_z.slice(frameBufferSize - graphWindow, frameBufferSize)]
  });
  Plotly.update('gauge_Temp', { value: indata.temp });
  Plotly.update('gauge_Press', { value: indata.press });
  Plotly.update('gauge_Hum', { value: indata.hum });

}
