var StorageData = []
var LastSaveToFile = 0;
var SamplingStart = 0;
var SamplingCounter = 0;
var databundle = {

  cap_0_0: 0, cap_0_1: 0, cap_0_2: 0, cap_0_3: 0,
  cap_1_0: 0, cap_1_1: 0, cap_1_2: 0, cap_1_3: 0,
  time_feather: 0,
  time_unix: 0
}

// handle incoming data:
function handleData(event) {
  // get the data  from the peripheral:
  //console.log(event.target.value)
  databundle.cap_0_0 = event.target.value.getInt32(0, true);  //0
  databundle.cap_0_1 = event.target.value.getInt32(4, true);  //1
  databundle.cap_0_2 = event.target.value.getInt32(8, true);  //2
  databundle.cap_0_3 = event.target.value.getInt32(12, true); //3
  databundle.cap_1_0 = event.target.value.getInt32(16, true); //4
  databundle.cap_1_1 = event.target.value.getInt32(20, true); //5
  databundle.cap_1_2 = event.target.value.getInt32(24, true); //6
  databundle.cap_1_3 = event.target.value.getInt32(28, true); //7
  databundle.time_feather = event.target.value.getInt32(32, true); //8

  databundle.time_unix = new Date().getTime();

  //calculate sampling rate
  SamplingCounter += 1;
  if ((databundle.time_unix - SamplingStart) > 1000) {
    SamplingStart = databundle.time_unix;
    document.getElementById("sampling").innerHTML = SamplingCounter;
    SamplingCounter = 0;
  }

  // update plots if selected
  if (document.getElementById("UseGraphs").checked == true) {
    document.getElementById("GraphContainer").style.display = "block";
    updatePlots(databundle);
  }
  else {
    document.getElementById("GraphContainer").style.display = "none";
  }

  //update raw data print
  updateData(databundle);

  //Store Data and download file after specific intervall
  StorageData.push(Object.assign({}, databundle));
  if (new Date().getTime() - LastSaveToFile > 300000) {
    download(false)
    LastSaveToFile = new Date().getTime();
  }
}

//Save Data to File
function download(buttonClick) {
  //Change Button Color for 500ms to improve usability
  if (buttonClick === true) {
    var el = document.getElementById('downloadJson');
    var original = el.style.color;
    el.style.color = 'green';
    window.setTimeout(function () { el.style.color = original; }, 500);
  }

  var customFileName = document.getElementById('customFileName').value
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(StorageData, null, 2)));

  //special case for Jacket to add L and R to filename
  BluetoothNameFile = BluetoothName;
  if (BluetoothName === "LeftArm") {
    BluetoothNameFile = "L";
  }
  if (BluetoothName === "RightArm") {
    BluetoothNameFile = "R";
  }
  if (customFileName == "") {
    element.setAttribute('download', `${BluetoothNameFile}.json`);
  }
  else {
    element.setAttribute('download', `${customFileName}_${BluetoothNameFile}.json`);
  }
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function resetRecording() {
  //Change Button Color for 500ms to improve usability
  var el = document.getElementById('resetRecording');
  var original = el.style.color;
  el.style.color = 'green';
  window.setTimeout(function () { el.style.color = original; }, 500);

  StorageData = [];
  LastSaveToFile = new Date().getTime();
}


