
#include <Wire.h>
#include "Cap_2214.h"
#include <bluefruit.h>

#define CHAN_COUNT 4

#define PAKET_LEN 9 // for 2 * 4 Channels + millis()

// BLE Service
BLEDfu bledfu;   // OTA DFU service
BLEDis bledis;   // device information
BLEUart bleuart; // uart over ble
BLEBas blebas;   // battery

unsigned long datapaket[PAKET_LEN] = {0};

Cap_2214 Cap;
Cap_2214 Cap_1;
unsigned int num;

int led_State = LOW;
void blinkLED(void)
{
  if (led_State == LOW)
  {
    led_State = HIGH;
    digitalWrite(LED_BUILTIN, LOW);
  }
  else
  {
    led_State = LOW;
    digitalWrite(LED_BUILTIN, HIGH);
  }
}

void setup()
{

  pinMode(LED_BUILTIN, OUTPUT);

  // SETUP BLE
  Bluefruit.autoConnLed(true);
  Bluefruit.configPrphBandwidth(BANDWIDTH_MAX);
  Bluefruit.begin();
  Bluefruit.setTxPower(4);
  Bluefruit.Periph.setConnectCallback(connect_callback);
  Bluefruit.Periph.setDisconnectCallback(disconnect_callback);

  //Set Name of BLE Device
  Bluefruit.setName("Head");

  bledfu.begin();

  bledis.setManufacturer("Adafruit Industries");
  bledis.setModel("Bluefruit Feather52");
  bledis.begin();

  bleuart.begin();

  blebas.begin();
  blebas.write(100);

  startAdv();

  pinMode(LED_BUILTIN, OUTPUT);
  //SD,INTB,ADDR_Cap, ADDR_Cap_1
  pinMode(6, OUTPUT);
  digitalWrite(6, LOW);
  pinMode(5, INPUT);
  pinMode(9, OUTPUT);
  digitalWrite(9, HIGH);
  pinMode(10, OUTPUT);
  digitalWrite(10, LOW); 

  // ### Start I2C 
  Wire.begin();
  
  // ### Start serial
  Serial.begin(115200);
  
  delay(100); 

  //Start FDC, select the channels being used, select the I2C address
  //Sample Rate:  0x2FFF: around 50Hz(four channel)   0xFFFF: around 10Hz(four channel)  0x4FFF: around 30Hz(four channel), not for sure, test when using.
  
  bool Cap_init = Cap.init(0xF, 0x2A, 0x2FFF);  
  if (Cap_init) Serial.println("FDC passed");  
  else Serial.println("FDC failed");  
  delay(5); 
 
  // second sensing board
  bool Cap_1_init = Cap_1.init(0xF, 0x2B, 0x2FFF);  
  if (Cap_1_init) Serial.println("FDC passed");  
  else Serial.println("FDC failed");  
  
}

void loop()
{
  for (int i = 0; i < CHAN_COUNT; i++)
  { // for each channel of first Cap Module
    datapaket[i] = Cap.Read(i,0x2A);
    /*
    Serial.print(datapaket[i]);
    if (i < CHAN_COUNT - 1)
      Serial.print(",");
    else
      Serial.println("");
    */
  }
  
  for (int i = 0; i < CHAN_COUNT; i++)
  { // for each channel of second Cap Module
    datapaket[i+4] =  Cap_1.Read(i,0x2B);
    /*
    Serial.print(datapaket[i+4]);  
    if (i < CHAN_COUNT-1) Serial.print(",");
    else Serial.println("");
    */
  }
  
  datapaket[8] = millis();

  // Forward data from HW Serial to BLEUART
  bleuart.write((byte *)&datapaket, PAKET_LEN * 4);

  num++;
  if (num == 10)
  {
    blinkLED();
    num = 0;
  }
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
