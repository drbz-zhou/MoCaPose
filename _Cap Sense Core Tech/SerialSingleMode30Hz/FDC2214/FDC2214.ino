
#include <Wire.h>
#include "Cap_2214.h"

#define CHAN_COUNT 4

Cap_2214 Cap;
Cap_2214 Cap_1;
unsigned int num;


int led_State = LOW;
void blinkLED(void)
{
  if (led_State == LOW) {
    led_State = HIGH;
    digitalWrite(LED_BUILTIN, LOW);
  } else {
    led_State = LOW;
    digitalWrite(LED_BUILTIN, HIGH);
  }
}

 
void setup() {

  pinMode(LED_BUILTIN, OUTPUT);
  //SD,INTB,ADDR_Cap, ADDR_Cap_1
  //pinMode(6, OUTPUT);
  //digitalWrite(6, LOW);
  //pinMode(5, INPUT);
  //pinMode(9, OUTPUT);
  //digitalWrite(9, HIGH);
  //pinMode(10, OUTPUT);
  //digitalWrite(10, LOW); 

  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  delay(1000);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  delay(1000);                       // wait for a second

  
  // ### Start serial
  Serial.begin(115200);
  Serial.println("Serial Started");
  // ### Start I2C 
  Wire.begin();
  Serial.println("I2C Started");
  
  delay(100); 
  
  //Start FDC, select the channels being used, select the I2C address
  //Sample Rate:  0x2FFF: around 50Hz(four channel)   0xFFFF: around 10Hz(four channel)  0x4FFF: around 30Hz(four channel), not for sure, test when using.
  
  bool Cap_init = Cap.init(0xF, 0x2A, 0x4FFF);  
  if (Cap_init) Serial.println("FDC passed");  
  else Serial.println("FDC failed");  
  delay(5); 
 
  // second sensing board
  
  bool Cap_1_init = Cap_1.init(0xF, 0x2B, 0x4FFF);  
  if (Cap_1_init) Serial.println("FDC passed");  
  else Serial.println("FDC failed");  
  
}


void loop() {
  signed long capa[CHAN_COUNT]; // variable to store data from FDC
  signed long capa_1[CHAN_COUNT]; // variable to store data from FDC
  //unsigned long Start = millis();
  for (int i = 0; i < CHAN_COUNT; i++){ // for each channel
    capa[i]= Cap.Read(i,0x2A);//  
    Serial.print(capa[i]);  
    if (i < CHAN_COUNT-1) Serial.print(",");
    //else Serial.println("");
    else Serial.print(",");  // change to this line when using second sensing board.

  }

  // second sensing board
  
  for (int i = 0; i < CHAN_COUNT; i++){ // for each channel
    capa_1[i]= Cap_1.Read(i,0x2B);//  
    Serial.print(capa_1[i]);  
    if (i < CHAN_COUNT-1) Serial.print(",");
    else Serial.println("");
  }
  
  num++;
  if (num == 10){
    blinkLED();
    num = 0;
  }

}
