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
				uint16_t voltage = node.getResponseBuffer(2) - 1500; // Voltage (100mV)

				if (power > 0) {
					Publisher::PUBLISHER.request(12);

					Publisher::PUBLISHER << 'e';	// Solar header
					uint32_t buffer = time;		// Time 28 bit
					Publisher::PUBLISHER << buffer;	// Time [1-6]
					Publisher::PUBLISHER << buffer;	// Time [7-12]
					Publisher::PUBLISHER << buffer;	// Time [13-18]
					Publisher::PUBLISHER << buffer;	// Time [19-24]

					buffer += power << 4;		// Power 16 bit
					Publisher::PUBLISHER << buffer;	// Time [25-28] + Power [1-2]
					Publisher::PUBLISHER << buffer;	// Power [3-8]
					Publisher::PUBLISHER << buffer;	// Power [9-14]

					buffer += (frequency & 0x7ff) << 2;	// Frequency 11 bit
					Publisher::PUBLISHER << buffer;	// Power [15-16] + Frequency [1-4]
					Publisher::PUBLISHER << buffer;	// Frequency [5-10]

					buffer = (voltage & 0x7ff) << 1; // Voltage 11 bit
					Publisher::PUBLISHER << buffer;	// Frequency[11] + Voltage [1-5]
					Publisher::PUBLISHER << buffer; // Voltage [6-11]
				}
			}
		}
	}
}
