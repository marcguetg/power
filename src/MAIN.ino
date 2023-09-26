#include "Particle.h"
#include "ModbusMaster.h"
#include <array>

#include "publisher.h"
#include "solar.h"
#include "power.h"


SYSTEM_THREAD(ENABLED);



void setup() {
	Solar::setup();

	new Thread("solar", Solar::thread);
	new Thread("power", Power::thread);
	new Thread("publisher", Publisher::thread);
	Particle.function("measure_A0", Power::measure_A0);
	Particle.function("measure_A1", Power::measure_A1);
	Particle.function("measure_A2", Power::measure_A2);
}
