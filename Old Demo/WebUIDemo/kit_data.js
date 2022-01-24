var StorageData = []

var databundle = {
  time: 0,
  acc_x: 0, acc_y: 0, acc_z: 0,
  gyr_x: 0, gyr_y: 0, gyr_z: 0,
  mag_x: 0, mag_y: 0, mag_z: 0,
  temp: 0,
  press: 0,
  hum: 0,
  cap_1: 0,
  cap_2: 0,
  cap_3: 0,
  cap_4: 0,
  cap_5: 0,
  cap_6: 0,
  cap_7: 0,
  cap_8: 0
}

var ranges = {
  temp: [0, 40],
  press: [800, 1400],
  hum: [0, 100],
}

var threshold = {
  temp: 0.7 * (ranges.temp[1] - ranges.temp[0]) + ranges.temp[0],
  press: 0.7 * (ranges.press[1] - ranges.press[0]) + ranges.press[0],
  hum: 0.7 * (ranges.hum[1] - ranges.hum[0]) + ranges.hum[0]
}

// handle incoming data:
function handleData(event) {
  // get the data  from the peripheral:
  //console.log(event.target.value)
  databundle.acc_x = event.target.value.getFloat32(0, true);  //0
  databundle.acc_y = event.target.value.getFloat32(4, true);  //1
  databundle.acc_z = event.target.value.getFloat32(8, true);  //2
  databundle.gyr_x = event.target.value.getFloat32(12, true); //3
  databundle.gyr_y = event.target.value.getFloat32(16, true); //4
  databundle.gyr_z = event.target.value.getFloat32(20, true); //5
  databundle.mag_x = event.target.value.getFloat32(24, true); //6
  databundle.mag_y = event.target.value.getFloat32(28, true); //7
  databundle.mag_z = event.target.value.getFloat32(32, true); //8

  databundle.temp = event.target.value.getFloat32(36, true); //9
  databundle.press = event.target.value.getFloat32(40, true); //10
  databundle.hum = event.target.value.getFloat32(44, true); //11

  databundle.cap_1 = event.target.value.getFloat32(48, true); //12
  databundle.cap_2 = event.target.value.getFloat32(52, true); //13
  databundle.cap_3 = event.target.value.getFloat32(56, true); //14
  databundle.cap_4 = event.target.value.getFloat32(60, true); //15
  databundle.cap_5 = event.target.value.getFloat32(64, true); //16
  databundle.cap_6 = event.target.value.getFloat32(68, true); //17
  databundle.cap_7 = event.target.value.getFloat32(72, true); //18
  databundle.cap_8 = event.target.value.getFloat32(76, true); //19

  databundle.time = new Date().getTime();
  //console.log(databundle)

  //Send CMD Commands to Feather
  /*
  if (mCMDqueued == 1) {
    myCharTX.writeValue(encoder.encode(mCMD));
    mCMDqueued = 0;
  }
  */

  // update plots
  updatePlots(databundle); // NB need to invert to match sensor coordinate system to our 3d model
  sentryAlert();
  //console.log(databundle)
  StorageData.push(JSON.parse(JSON.stringify(databundle)))
  //batteryCheck();

}


// threshold alert
function sentryAlert() {
  if (threshold.temp < databundle.temp) {
    document.getElementById("Temp_box").setAttribute("style", "border-color: red;");
  } else {
    document.getElementById("Temp_box").setAttribute("style", "border-color: #333333;");
  }

  if (threshold.press < databundle.press) {
    document.getElementById("Press_box").setAttribute("style", "border-color: red;");
  } else {
    document.getElementById("Press_box").setAttribute("style", "border-color: #333333;");
  }

  if (threshold.hum < databundle.hum) {
    document.getElementById("Hum_box").setAttribute("style", "border-color: red;");
  } else {
    document.getElementById("Hum_box").setAttribute("style", "border-color: #333333;");
  }
}

function batteryCheck() {
  let bat_perc = Math.round((databundle.bat - 3.0) / (4.0 - 3.0) * 100);
  if (bat_perc > 100) { bat_perc = 100; }
  document.getElementById("BatIndicator").textContent = bat_perc.toString() + "%";
  if (bat_perc > 30) { document.getElementById("BatIndicator").setAttribute("style", "background-color: green; float:right"); }
  else if (bat_perc < 10) { document.getElementById("BatIndicator").setAttribute("style", "background-color: red; float:right"); }
  else { document.getElementById("BatIndicator").setAttribute("style", "background-color: orange; float:right"); }
}

//Save Data to File
function download() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(StorageData, null, 2)));
  element.setAttribute('download', 'data.json');
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}


