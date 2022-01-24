/***
 * 
 * Version: 1.0
 * Sensors:
 * MCU: Adafruit Feather Nano Sense
 * Author: 
***/
#include <bluefruit.h>
#include <Adafruit_LittleFS.h>
#include <InternalFileSystem.h>

#include <Adafruit_APDS9960.h>
#include <Adafruit_BMP280.h>
#include <Adafruit_LIS3MDL.h>
#include <Adafruit_LSM6DS3.h>
#include <Adafruit_SHT31.h>
#include <Adafruit_Sensor.h>
#include <PDM.h>

#define PAKET_LEN 20

// BLE Service
BLEDfu bledfu;   // OTA DFU service
BLEDis bledis;   // device information
BLEUart bleuart; // uart over ble
BLEBas blebas;   // battery

// Sensors
Adafruit_LSM6DS3 lsm6ds3; // accelerometer, gyroscope
Adafruit_LIS3MDL lis3mdl; // magnetometer
Adafruit_BMP280 bmp280;   // temperature, barometric pressure
Adafruit_SHT31 sht30;     // humidity

float datapaket[PAKET_LEN] = {0};

float accel_x, accel_y, accel_z;
float gyro_x, gyro_y, gyro_z;
float magnetic_x, magnetic_y, magnetic_z;
float temperature, pressure, altitude;
float humidity;

void setup()
{
  Serial.begin(115200);
  Serial.println("Start Bluefruit Feather Sense");

  // SETUP BLE
  Bluefruit.autoConnLed(true);
  Bluefruit.configPrphBandwidth(BANDWIDTH_MAX);

  Bluefruit.begin();
  Bluefruit.setTxPower(4);
  Bluefruit.Periph.setConnectCallback(connect_callback);
  Bluefruit.Periph.setDisconnectCallback(disconnect_callback);

  bledfu.begin();

  bledis.setManufacturer("Adafruit Industries");
  bledis.setModel("Bluefruit Feather52");
  bledis.begin();

  bleuart.begin();

  blebas.begin();
  blebas.write(100);

  startAdv();

  // SETUP SENSORS
  lsm6ds3.begin_I2C();
  lis3mdl.begin_I2C();
  bmp280.begin();
  sht30.begin();
}

void loop()
{
  // Read sensors and assign to datapaket

  // Adafruit_LSM6DS3
  sensors_event_t accel;
  sensors_event_t gyro;
  sensors_event_t temp;
  lsm6ds3.getEvent(&accel, &gyro, &temp);
  datapaket[0] = accel.acceleration.x;
  datapaket[1] = accel.acceleration.y;
  datapaket[2] = accel.acceleration.z;
  datapaket[3] = gyro.gyro.x;
  datapaket[4] = gyro.gyro.y;
  datapaket[5] = gyro.gyro.z;

  // Adafruit_LIS3MDL
  lis3mdl.read();
  datapaket[6] = lis3mdl.x;
  datapaket[7] = lis3mdl.y;
  datapaket[8] = lis3mdl.z;

  // Adafruit_BMP280
  datapaket[9] = bmp280.readTemperature();
  datapaket[10] = bmp280.readPressure() / 100; //results in mbar

  // Adafruit_SHT31
  datapaket[11] = sht30.readHumidity();

  // Add capacity data later
  datapaket[12] = 0;
  datapaket[13] = 0;
  datapaket[14] = 0;
  datapaket[15] = 0;
  datapaket[16] = 0;
  datapaket[17] = 0;
  datapaket[18] = 0;
  datapaket[19] = 0;

  // Forward data from HW Serial to BLEUART
  bleuart.write((byte *)&datapaket, PAKET_LEN * 4);

  // Forward from BLEUART to HW Serial
  while (bleuart.available())
  {
    uint8_t ch;
    ch = (uint8_t)bleuart.read();
    Serial.write(ch);
  }
  delay(50);
}

void startAdv(void)
{
  // Advertising packet
  Bluefruit.Advertising.addFlags(BLE_GAP_ADV_FLAGS_LE_ONLY_GENERAL_DISC_MODE);
  Bluefruit.Advertising.addTxPower();

  // Include bleuart 128-bit uuid
  Bluefruit.Advertising.addService(bleuart);

  Bluefruit.ScanResponse.addName();
  Bluefruit.Advertising.restartOnDisconnect(true);
  Bluefruit.Advertising.setInterval(32, 244); // in unit of 0.625 ms
  Bluefruit.Advertising.setFastTimeout(30);   // number of seconds in fast mode
  Bluefruit.Advertising.start(0);             // 0 = Don't stop advertising after n seconds
}

void connect_callback(uint16_t conn_handle)
{
  BLEConnection *connection = Bluefruit.Connection(conn_handle);
  char central_name[32] = {0};
  connection->getPeerName(central_name, sizeof(central_name));
  Serial.print("Connected to ");
  Serial.println(central_name);
}

void disconnect_callback(uint16_t conn_handle, uint8_t reason)
{
  (void)conn_handle;
  (void)reason;
  Serial.println();
  Serial.print("Disconnected, reason = 0x");
  Serial.println(reason, HEX);
}
