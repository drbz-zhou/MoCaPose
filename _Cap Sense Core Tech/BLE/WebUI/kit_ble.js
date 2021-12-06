// fill your peripheral service and characteristic UUIDs here:
const imuService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';//'917649a0-d98e-11e5-9eec-0002a5d5c51b';
const imuChar = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';//'917649a1-d98e-11e5-9eec-0002a5d5c51b';

let encoder = new TextEncoder('utf-8');
var BluetoothName = ""

function status(stat) {
  infoBar.innerHTML = stat;
}

// connect to the Bluetooth peripheral:
function connect() {
  navigator.bluetooth.requestDevice({
    acceptAllDevices: 'true', optionalServices: [imuService]//filters: [{ services: [imuService] }]
  }).then(function (device) {
    myDevice = device;
    BluetoothName = device.name
    console.log(myDevice);
    status('Connecting to GATT server...'); return device.gatt.connect();
  }).then(function (server) {
    status('Getting service...'); return server.getPrimaryService(imuService);
  }).then(function (service) {
    status('Getting characteristics...'); return service.getCharacteristics();
  }).then(function (characteristics) {
    myCharacteristics = characteristics;
    status('Subscribing...');

    //Start timer for writing data into file
    LastSaveToFile = new Date().getTime();

    for (c in characteristics) {

      myCharRX = characteristics[c];
      myCharRX.addEventListener('characteristicvaluechanged', handleData);
      myCharRX.startNotifications();

    }
    infoBar.innerHTML = "Connected"; ConnectButton.style.backgroundColor = "#00ffff";
  })
    .catch(function (error) {
      // catch any errors:
      console.error('Connection failed!', error);
    });

}


// disconnect function:
function disconnect() {
  if (myDevice) {
    // disconnect:
    myDevice.gatt.disconnect();
  }
}
