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
	Particle.function("measure", Power::measure_timeseries);
	Particle.function("wavelength", Power::set_wavelength);
	Particle.variable("analog", Power::analog);
	Particle.variable("ppower", Power::ppower);
}
