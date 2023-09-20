namespace Power {
	const size_t N_MEASURE = 2000;

	int measure_timeseries(String) {
		const int pin = A0;

		int buffer[N_MEASURE];
		for (size_t i=0; i<N_MEASURE; i++) {
			buffer[i] = analogRead(pin);
			delay(1);
		}

		char txt[600];
		char* pos = &txt[0];
		size_t i = 0;

		while (true) {
			pos += sprintf(pos, ",%d", buffer[i++]);

			if (i >= N_MEASURE) {
				Particle.publish("timeseries", txt, PRIVATE);
				return 0;
			}

			if ((pos - txt) > 550) {
				Particle.publish("timeseries", txt, PRIVATE);
				pos = &txt[0];
				delay(1100);
			}
		}
	}


	class Power {
		const char header;
		const int pin;
		const double conversion_factor;
		const int threshold;

		bool state;
		int64_t tic;

		void stream(uint32_t power) {
			Publisher::PUBLISHER.request(8);
			Publisher::PUBLISHER << header;		// Power header
			uint32_t buffer = Time.now();	// Time 28 bit
			Publisher::PUBLISHER << buffer; 		// Time [1-6]
			Publisher::PUBLISHER << buffer; 		// Time [7-12]
			Publisher::PUBLISHER << buffer; 		// Time [13-18]
			Publisher::PUBLISHER << buffer; 		// Time [19-24]

			buffer += power << 4;		// Power 20 bit
			Publisher::PUBLISHER << buffer; 		// Time [25-28] + Power [1-2]
			Publisher::PUBLISHER << buffer; 		// Power [3-8]
			Publisher::PUBLISHER << buffer; 		// Power [9-14]
			Publisher::PUBLISHER << buffer; 		// Power [15-20]
		}

		public:
			Power(const char header, const int pin, const double conversion_factor, const int threshold):
				header(header),
				pin(pin),
				conversion_factor(conversion_factor),
				threshold(threshold) {
					state = analogRead(pin) > threshold;
					tic = millis();
				}

			void measure() {
				if (state ^ (analogRead(pin) > threshold)) {
					uint32_t toc = millis();
					uint32_t power = 10000 * 3600 * conversion_factor / (tic - toc);
					stream(power);
				}
			}
	} POWER0('x', A0, 400.0, 1000);
}
