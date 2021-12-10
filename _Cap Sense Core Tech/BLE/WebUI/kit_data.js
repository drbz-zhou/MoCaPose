var StorageData = []
var LastSaveToFile = 0;
var prevTime = 0;
var databundle = {

  cap_1_1: 0, cap_1_2: 0, cap_1_3: 0, cap_1_4: 0,
  cap_2_1: 0, cap_2_2: 0, cap_2_3: 0, cap_2_4: 0,
  time_feather: 0,
  time_unix: 0
}

// handle incoming data:
function handleData(event) {
  // get the data  from the peripheral:
  //console.log(event.target.value)
  databundle.cap_1_1 = event.target.value.getInt32(0, true);  //0
  databundle.cap_1_2 = event.target.value.getInt32(4, true);  //1
  databundle.cap_1_3 = event.target.value.getInt32(8, true);  //2
  databundle.cap_1_4 = event.target.value.getInt32(12, true); //3
  databundle.cap_2_1 = event.target.value.getInt32(16, true); //4
  databundle.cap_2_2 = event.target.value.getInt32(20, true); //5
  databundle.cap_2_3 = event.target.value.getInt32(24, true); //6
  databundle.cap_2_4 = event.target.value.getInt32(28, true); //7
  databundle.time_feather = event.target.value.getInt32(32, true); //8

  databundle.time_unix = new Date().getTime();

  //calculate sampling rate
  document.getElementById("sampling").innerHTML = Math.round(1000 / (databundle.time_unix - prevTime));
  prevTime = databundle.time_unix;

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
  StorageData.push(JSON.parse(JSON.stringify(databundle)))
  if (new Date().getTime() - LastSaveToFile > 300000) {
    download()
    LastSaveToFile = new Date().getTime();
  }
}

//Save Data to File
function download() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(StorageData, null, 2)));
  element.setAttribute('download', `${BluetoothName}.json`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

