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
	new Thread("publisher", Publisher::thread);
	Particle.function("measure", Power::measure_timeseries);
}
