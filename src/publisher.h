namespace Publisher {
	const size_t MSG_LENGTH = 600;
	const size_t BUFFER_LENGTH = 32;
	const size_t EXTRA_BUFFER = 10;

	class Queue {
		std::array<char[MSG_LENGTH + EXTRA_BUFFER], BUFFER_LENGTH> buffer;
		size_t insert, remove;

		public:
			Queue(): insert(0), remove(0) {}

			char* get() {
				if (insert == remove) {
					return nullptr;
				} else {
					return &(buffer[remove][0]);
				}
			}

			void add(const char* msg) {
				if (((insert + 1) % BUFFER_LENGTH) != remove) {
					strcpy(buffer[insert], msg);
					insert = (insert + 1) % BUFFER_LENGTH;
				}
			}

			void pop() {
				remove = (remove + 1) % BUFFER_LENGTH;
			}

			uint8_t free_size() {
				return BUFFER_LENGTH - ((insert + BUFFER_LENGTH - remove) % BUFFER_LENGTH);
			}
	} QUEUE;


	class Publisher {
		char buffer[MSG_LENGTH + EXTRA_BUFFER];
		size_t i;

		void diagnostic_msg() {
			*this << 'b';
			uint32_t buffer = Time.now() >> 6;	// Time 22 bit
			*this << buffer; 			// Time [1-6]
			*this << buffer; 			// Time [7-12]
			*this << buffer; 			// Time [13-18]

			buffer += QUEUE.free_size() << 4;	// Len 5 bit
			*this << buffer; 			// Time [19-22] + Buff[1-2]

			buffer += (millis() / 600000) << 3;
			*this << buffer; 			// Buff[3-5] + Up[1-3]
			*this << buffer; 			// Up [4-9]
			*this << buffer; 			// Up [10-15]
		}

		public:
			Publisher(): i(0) {}

			void operator<<(uint8_t c) {
				buffer[i++] = c;
			}

			void operator<<(uint32_t& data) {
				this->operator<<(static_cast<uint8_t>((data & 0x3f) + ' '));
				data >>= 6;
			}

			void request(size_t n) {
				if (i + n >= MSG_LENGTH) {
					flush();
				}
			}

			void flush() {
				if (i) {
					diagnostic_msg();
					buffer[i] = 0;
					i = 0;

					QUEUE.add(buffer);
				}
			}
	} PUBLISHER;


	void thread() {
		unsigned long lastSync = 0;
		unsigned long sync_delay = 24 * 60 * 60 * 1000;

		while (true) {
			char* msg = QUEUE.get();

			if (Particle.connected()) {
				if (millis() - lastSync > sync_delay) {
					Particle.syncTime();
					lastSync = millis();
				}

				if (msg != nullptr) {
    				if (Particle.publish("Solar stream", msg)) {
						QUEUE.pop();
					}
				}
			}

			delay(1100);
		}
	}
}
