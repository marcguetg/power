namespace Solar {
	ModbusMaster node(1);

	void setup() {
		node.begin(9600);
		node.enableTXpin(A5);
	}

	void thread() {
		while (true) {
			delay(1900);
			uint8_t result = node.readInputRegisters(36, 3);

			if (result == node.ku8MBSuccess) {
				uint32_t time = Time.now() - 1690000000;
				uint16_t power = node.getResponseBuffer(0); // Power (100mW)
				uint16_t frequency = node.getResponseBuffer(1) - 4000; // Frequency (10mHz)
				uint16_t voltage = node.getResponseBuffer(2) - 1000; // Voltage (100mV)

				if (power > 0) {
					Publisher::PUBLISHER.request(12);

					Publisher::PUBLISHER << 'a';			// Solar header
					uint32_t buffer = time;		// Time 28 bit
					Publisher::PUBLISHER << buffer; 		// Time [1-6]
					Publisher::PUBLISHER << buffer; 		// Time [7-12]
					Publisher::PUBLISHER << buffer; 		// Time [13-18]
					Publisher::PUBLISHER << buffer; 		// Time [19-24]

					buffer += power << 4;		// Power 15 bit
					Publisher::PUBLISHER << buffer; 		// Time [25-28] + Power [1-2]
					Publisher::PUBLISHER << buffer; 		// Power [3-8]
					Publisher::PUBLISHER << buffer; 		// Power [9-14]

					buffer += frequency << 1;	// Frequency 11 bit
					Publisher::PUBLISHER << buffer; 		// Power [15] + Frequency [1-5]
					Publisher::PUBLISHER << buffer; 		// Frequency [6-11]

					buffer = voltage;			// Voltage 12 bit
					Publisher::PUBLISHER << buffer; 		// Voltage [1-6]
					Publisher::PUBLISHER << buffer; 		// Voltage [7-12]
				}
			}
		}
	}
}
