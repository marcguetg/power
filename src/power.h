namespace Power {
	const size_t N_MEASURE = 1000;

	int measure_timeseries(String) {
		const int pin = A0;

		uint16_t buffer[N_MEASURE];
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

	int WAVELENGTH = 2000;
	int set_wavelength(String val) {
		WAVELENGTH = val.toInt();
		return 0;
	}

	int analogRead(int) {
		return  (millis() / WAVELENGTH) % 2000;
	}

	int analog = 0;
	int ppower = 0;


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
			uint32_t buffer = Time.now() - 1690000000;	// Time 28 bit
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
					tic = System.millis();
				}

			void measure() {
				if (state ^ (analogRead(pin) > threshold)) {
					state ^= true;
					uint64_t toc = System.millis();
					uint32_t power = 10 * 1000 * 3600 * conversion_factor / (toc - tic);
					tic = toc;
					stream(power);
					ppower = power;
				}
			}
	} POWER0('x', A0, 1/400.0, 1000);


	void thread() {
		while (true) {
			delay(10);
			POWER0.measure();
			analog = analogRead(2);
		}
	}
}
