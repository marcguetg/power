namespace Power {
	const size_t N_MEASURE = 1000;

	int measure_timeseries(int pin) {
		uint16_t buffer[N_MEASURE];
		for (size_t i=0; i<N_MEASURE; i++) {
			buffer[i] = analogRead(pin);
			delay(3);
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

	int measure_A0(String) {
		return measure_timeseries(A0);
	}

	int measure_A1(String) {
		return measure_timeseries(A1);
	}

	int measure_A2(String) {
		return measure_timeseries(A2);
	}


	class Power {
		const char header;
		const int pin;
		const uint64_t conversion_factor;
		const int threshold;

		bool state;
		int64_t tic;
		int smoothed_power;

		void stream(uint32_t power) {
			Publisher::PUBLISHER.request(8);
			Publisher::PUBLISHER << header;		// Power header
			uint32_t buffer = Time.now() - 1690000000;	// Time 28 bit
			Publisher::PUBLISHER << buffer; 		// Time [1-6]
			Publisher::PUBLISHER << buffer; 		// Time [7-12]
			Publisher::PUBLISHER << buffer; 		// Time [13-18]
			Publisher::PUBLISHER << buffer; 		// Time [19-24]

			buffer += (power & 0xfffff) << 4;		// Power 20 bit
			Publisher::PUBLISHER << buffer; 		// Time [25-28] + Power [1-2]
			Publisher::PUBLISHER << buffer; 		// Power [3-8]
			Publisher::PUBLISHER << buffer; 		// Power [9-14]
			Publisher::PUBLISHER << buffer; 		// Power [15-20]
		}

		public:
			Power(const char header, const int pin, const uint64_t conversion_factor, const int threshold):
				header(header),
				pin(pin),
				conversion_factor(conversion_factor),
				threshold(threshold) {
					state = analogRead(pin) > threshold;
					tic = System.millis();
					smoothed_power = 0;
				}

			void measure() {
				smoothed_power = smoothed_power * 0.8 + analogRead(pin) * 0.2;
				if (state ^ (smoothed_power > threshold)) {
					state ^= true;
					if (state) {
						uint64_t toc = System.millis();
						uint64_t power = 10ULL * 1000ULL * 1000ULL * 3600ULL / (toc - tic) / conversion_factor;
						tic = toc;
						stream(power);
					}
				}
			}
	} POWER0('c', A0, 800, 2500);


	void thread() {
		while (true) {
			delay(3);
			POWER0.measure();
		}
	}
}

