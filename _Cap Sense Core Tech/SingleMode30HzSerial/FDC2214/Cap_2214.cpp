

// This is a driver file for FDC2214
// By szb, DFKI, 01.05.2021
// This file is based on related driver files by Chris Nelson, and Harijs Zablockis
//
// Addressed the double read issue.
//
// Feel free to use, modify, comment, and share.
//


#include "Arduino.h"
#include <Wire.h>
#include "Cap_2214.h"


// address
//uint8_t i2caddr;
//uint8_t i2caddr = 0x2B;

// Verify the chip
boolean Cap_2214::init(uint8_t CHs, uint8_t Add, uint16_t Sample_Rate) {
    Wire.begin();  
    Serial.println("before");
    int ID = read_Cap(Cap_2214_DEVICE_ID, Add);
    Serial.println("after");
    if (ID != 0x3055) {
        return false;
    }
    Channel_Select(CHs, Sample_Rate, Add);
    return true;
}


//Internal routine to do actual chip init
void Cap_2214::Channel_Select(uint8_t Ch_Mask, uint16_t Sample_Rate, uint8_t Add) {

    //write_Cap(Cap_2214_CONFIG, 0x1601, Add);  //internal Oscillator
    write_Cap(Cap_2214_CONFIG, 0x1E81, Add);   // External Oscillator
	
    //select ch1:
	if (Ch_Mask & 0x01) {
      write_Cap(Cap_2214_SETTLECOUNT_CH0, 0x012C, Add);     // 25.05.2021 300
		  //write_Cap(Cap_2214_RCOUNT_CH0, 0xFFFF, Add);
      //0x2FFF: around 50Hz(four channel)   0xFFFF: around 10Hz(four channel)  0x4FFF: around 30Hz(four channel)
      write_Cap(Cap_2214_RCOUNT_CH0, Sample_Rate, Add);   // drop reslution, increase conversion speed
		  write_Cap(Cap_2214_OFFSET_CH0, 0x0000, Add);
      write_Cap(Cap_2214_CLOCK_DIVIDERS_CH0, 0x2001, Add);  // 25.05.2021  0.01 to 10 MHz, single mode
      //write_Cap(Cap_2214_CLOCK_DIVIDERS_CH0, 0x1001, Add);  // 25.05.2021  0.01 to 8.75MHz, double mode
		  write_Cap(Cap_2214_DRIVE_CH0, 0xF800, Add);
	}
	// select ch2:
	if (Ch_Mask & 0x02) {
		  write_Cap(Cap_2214_SETTLECOUNT_CH1, 0x012C, Add);
		  //write_Cap(Cap_2214_RCOUNT_CH1, 0xFFFF, Add);
      write_Cap(Cap_2214_RCOUNT_CH1, Sample_Rate, Add);   // drop reslution, increase conversion speed
		  write_Cap(Cap_2214_OFFSET_CH1, 0x0000, Add);
      write_Cap(Cap_2214_CLOCK_DIVIDERS_CH0, 0x2001, Add);
		  //write_Cap(Cap_2214_CLOCK_DIVIDERS_CH1, 0x1001, Add); // 25.05.2021  0.01 to 8.75MHz, double mode
		  write_Cap(Cap_2214_DRIVE_CH1, 0xF800, Add);
	}
    // select ch3:
	if (Ch_Mask & 0x04) {
		  write_Cap(Cap_2214_SETTLECOUNT_CH2, 0x012C, Add);
		  //write_Cap(Cap_2214_RCOUNT_CH2, 0xFFFF, Add);
      write_Cap(Cap_2214_RCOUNT_CH2, Sample_Rate, Add);   // drop reslution, increase conversion speed
		  write_Cap(Cap_2214_OFFSET_CH2, 0x0000, Add); 
      write_Cap(Cap_2214_CLOCK_DIVIDERS_CH0, 0x2001, Add);
		  //write_Cap(Cap_2214_CLOCK_DIVIDERS_CH2, 0x1001, Add); // 25.05.2021  0.01 to 8.75MHz, double mode
		  write_Cap(Cap_2214_DRIVE_CH2, 0xF800, Add);
	}
    // select ch4:
	if (Ch_Mask & 0x08) {
		write_Cap(Cap_2214_SETTLECOUNT_CH3, 0x012C, Add);
		//write_Cap(Cap_2214_RCOUNT_CH3, 0xFFFF, Add);
    write_Cap(Cap_2214_RCOUNT_CH3, Sample_Rate, Add);   // drop reslution, increase conversion speed
		write_Cap(Cap_2214_OFFSET_CH3, 0x0000, Add);
    write_Cap(Cap_2214_CLOCK_DIVIDERS_CH0, 0x2001, Add);
		//write_Cap(Cap_2214_CLOCK_DIVIDERS_CH3, 0x1001, Add); // 25.05.2021  0.01 to 8.75MHz, double mode
		write_Cap(Cap_2214_DRIVE_CH3, 0xF800, Add);
	}	

    uint8_t RR_Se = 0x06;
    uint8_t glitchfilter = 0x05;
	uint16_t mux = 0x0208 | ((uint16_t)RR_Se << 13) | glitchfilter;
    write_Cap(Cap_2214_MUX_CONFIG, mux, Add);
    
}

unsigned long Cap_2214::Read(uint8_t Ch, uint8_t Add) {

  unsigned long result = 0;
  uint8_t add_MSB;
	uint8_t add_LSB;
	uint8_t UnreadConv;
	switch (Ch){
		case (0):
			add_MSB = Cap_2214_DATA_CH0_MSB;
			add_LSB = Cap_2214_DATA_CH0_LSB;
			UnreadConv = 0x0008;
		break;
		case (1):
			add_MSB = Cap_2214_DATA_CH1_MSB;
			add_LSB = Cap_2214_DATA_CH1_LSB;
			UnreadConv = 0x0004;
		break;
		case (2):
			add_MSB = Cap_2214_DATA_CH2_MSB;
			add_LSB = Cap_2214_DATA_CH2_LSB;
			UnreadConv = 0x0002;
		break;
		case (3):
			add_MSB = Cap_2214_DATA_CH3_MSB;
			add_LSB = Cap_2214_DATA_CH3_LSB;
			UnreadConv = 0x0001;
		break;
		default: return 0;
	}
	
    int status = read_Cap(Cap_2214_STATUS, Add);
    while (!(status & UnreadConv)) {
        status = read_Cap(Cap_2214_STATUS, Add);
    }
    result = (uint32_t)(read_Cap(add_MSB, Add) & 0x0FFF) << 16;
    result |= read_Cap(add_LSB, Add);
    return result;
}


// Read 2 bytes
uint16_t Cap_2214::read_Cap(uint16_t address, uint8_t Add) {
    uint16_t data;
    Wire.beginTransmission(Add);
    Wire.write(address);
    Wire.endTransmission(false);
    Wire.requestFrom(Add, (uint8_t) 2);
    while (!Wire.available());
    data = Wire.read();
    data <<= 8;
    while (!Wire.available());
    data |= Wire.read();
    Wire.endTransmission(true);
    return data;
}


// write 2 bytes
void Cap_2214::write_Cap(uint16_t address, uint16_t data, uint8_t Add) {
    Wire.beginTransmission(Add);
    Wire.write(address & 0xFF);
    Wire.write(data >> 8);
    Wire.write(data);
    Wire.endTransmission();
}
