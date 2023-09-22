'use strict';
const SHIFT = 32;

function is_valid_sep(raw, i) {
	return raw[0] > 96;
}


class SolarData {
	constructor() {
		this.date = [];
		this.power = [];
		this.voltage = [];
		this.frequency = [];
	}

	parse(raw, i) {
		if (is_valid_sep(raw, i + 12)) {
			let buffer = (raw[i + 1] - SHIFT);
			buffer += (raw[i + 2] - SHIFT) << 6;
			buffer += (raw[i + 3] - SHIFT) << 12;
			buffer += (raw[i + 4] - SHIFT) << 18;
			buffer += (raw[i + 5] - SHIFT) << 24;
			this.date.push((buffer & 0xfffffff) + 1690000000);
			buffer >>= 28;

			buffer += (raw[i + 6] - SHIFT) << 2;
			buffer += (raw[i + 7] - SHIFT) << 8;
			buffer += (raw[i + 8] - SHIFT) << 14;
			this.power.push((buffer & 0x7fff) / 10);
			buffer >>= 15;

			buffer += (raw[i + 9] - SHIFT) << 5;
			this.frequency.push(((buffer & 0x7ff) + 4000) / 100);

			buffer = (raw[i + 10] - SHIFT);
			buffer += (raw[i + 11] - SHIFT) << 6;
			this.voltage.push((buffer + 1000) / 10);

			return [false, i + 12];
		} else {
			return [true, strip_to_sep(raw, i + 1)];
		}
	}
}


class PowerData {
	constructor() {
		this.date = [];
		this.power = [];
	}

	parse(raw, i) {
		if (is_valid_sep(raw, i + 8)) {
			let buffer = (raw[i + 1] - SHIFT);
			buffer += (raw[i + 2] - SHIFT) << 6;
			buffer += (raw[i + 3] - SHIFT) << 12;
			buffer += (raw[i + 4] - SHIFT) << 18;
			buffer += (raw[i + 5] - SHIFT) << 24;
			this.date.push((buffer & 0xfffffff) + 1690000000);
			buffer >>= 28;

			buffer += (raw[i + 6] - SHIFT) << 2;
			buffer += (raw[i + 7] - SHIFT) << 8;
			buffer += (raw[i + 8] - SHIFT) << 14;
			this.power.push(buffer / 10);

			return [false, i + 8];
		} else {
			return [true, strip_to_sep(raw, i + 1)];
		}
	}
}


class DiagnosticData {
	constructor() {
		this.date = [];
		this.buffer = [];
		this.uptime = [];
	}

	parse(raw, i) {
		if (is_valid_sep(raw, i + 8)) {
			let buffer = (raw[i + 1] - SHIFT);
			buffer += (raw[i + 2] - SHIFT) << 6;
			buffer += (raw[i + 3] - SHIFT) << 12;
			buffer += (raw[i + 4] - SHIFT) << 18;
			this.date.push(((buffer & 0x3fffff) << 6) + 1690000000);
			buffer >>= 22;

			buffer += (raw[i + 5] - SHIFT) << 2;
			this.buffer.push(buffer & 0x1f);
			buffer >>= 5;

			buffer += (raw[i + 6] - SHIFT) << 3;
			buffer += (raw[i + 7] - SHIFT) << 9;
			this.uptime.push(buffer / 6);

			return [false, i + 8];
		} else {
			return [true, strip_to_sep(raw, i + 1)];
		}
	}
}


function parse(raw) {
	let data = {
		solar: new SolarData(),
		power_test: new PowerData(),
		diagnostic: new DiagnosticData(),
	};

	if (raw === undefined) {
		return ['file not found', data, 0];
	}

	raw = new TextEncoder().encode(raw);
	let i = strip_to_sep(raw, 0);
	let resp;
	let corrupted = 0;
	while (i < raw.length) {
		switch (raw[i]) {
			case 97:
				resp = data.solar.parse(raw, i);
				break;
			case 98:
				resp = data.diagnostic.parse(raw, i);
				break;
			case 120:
				resp = data.power_test.parse(raw, i);
				break;
			default:
				resp = [true, strip_to_sep(raw, i + 1)];
		}

		corrupted += resp[0];
		i = resp[1];
	}

	return ['', data, corrupted];
}


function strip_to_sep(raw, i) {
	for (;;i++) {
		if ((raw.length == i) || (is_valid_sep(raw, i))) {
			return i;
		}
	}
}






// 'use strict';
// const SHIFT = 32;

// function is_valid_sep(raw, i) {
// 	return raw[0) > 96;
// }


// class SolarData {
// 	constructor() {
// 		this.date = [];
// 		this.power = [];
// 		this.voltage = [];
// 		this.frequency = [];
// 	}

// 	parse(raw, i) {
// 		if (is_valid_sep(raw, i + 12)) {
// 			let buffer = (raw[i + 1) - SHIFT);
// 			buffer += (raw[i + 2) - SHIFT) << 6;
// 			buffer += (raw[i + 3) - SHIFT) << 12;
// 			buffer += (raw[i + 4) - SHIFT) << 18;
// 			buffer += (raw[i + 5) - SHIFT) << 24;
// 			this.date.push((buffer & 0xfffffff) + 1690000000);
// 			buffer >>= 28;

// 			buffer += (raw[i + 6) - SHIFT) << 2;
// 			buffer += (raw[i + 7) - SHIFT) << 8;
// 			buffer += (raw[i + 8) - SHIFT) << 14;
// 			this.power.push((buffer & 0x7fff) / 10);
// 			buffer >>= 15;

// 			buffer += (raw[i + 9) - SHIFT) << 5;
// 			this.frequency.push(((buffer & 0x7ff) + 4000) / 100);

// 			buffer = (raw[i + 10) - SHIFT);
// 			buffer += (raw[i + 11) - SHIFT) << 6;
// 			this.voltage.push((buffer + 1000) / 10);

// 			return [false, i + 12];
// 		} else {
// 			return [true, strip_to_sep(raw, i + 1)];
// 		}
// 	}
// }


// class PowerData {
// 	constructor() {
// 		this.date = [];
// 		this.power = [];
// 	}

// 	parse(raw, i) {
// 		if (is_valid_sep(raw, i + 8)) {
// 			let buffer = (raw[i + 1) - SHIFT);
// 			buffer += (raw[i + 2) - SHIFT) << 6;
// 			buffer += (raw[i + 3) - SHIFT) << 12;
// 			buffer += (raw[i + 4) - SHIFT) << 18;
// 			buffer += (raw[i + 5) - SHIFT) << 24;
// 			this.date.push((buffer & 0xfffffff) + 1690000000);
// 			buffer >>= 28;

// 			buffer += (raw[i + 6) - SHIFT) << 2;
// 			buffer += (raw[i + 7) - SHIFT) << 8;
// 			buffer += (raw[i + 8) - SHIFT) << 14;
// 			this.power.push(buffer / 10);

// 			return [false, i + 8];
// 		} else {
// 			return [true, strip_to_sep(raw, i + 1)];
// 		}
// 	}
// }


// class DiagnosticData {
// 	constructor() {
// 		this.date = [];
// 		this.buffer = [];
// 		this.uptime = [];
// 	}

// 	parse(raw, i) {
// 		if (is_valid_sep(raw, i + 8)) {
// 			let buffer = (raw[i + 1) - SHIFT);
// 			buffer += (raw[i + 2) - SHIFT) << 6;
// 			buffer += (raw[i + 3) - SHIFT) << 12;
// 			buffer += (raw[i + 4) - SHIFT) << 18;
// 			this.date.push(((buffer & 0x3fffff) << 6) + 1690000000);
// 			buffer >>= 22;

// 			buffer += (raw[i + 5) - SHIFT) << 2;
// 			this.buffer.push(buffer & 0x1f);
// 			buffer >>= 5;

// 			buffer += (raw[i + 6) - SHIFT) << 3;
// 			buffer += (raw[i + 7) - SHIFT) << 9;
// 			this.uptime.push(buffer / 6);

// 			return [false, i + 8];
// 		} else {
// 			return [true, strip_to_sep(raw, i + 1)];
// 		}
// 	}
// }


// function parse(raw) {
// 	console.trace();
// 	let data = {
// 		solar: new SolarData(),
// 		power_test: new PowerData(),
// 		diagnostic: new DiagnosticData(),
// 	};

// 	if (raw === undefined) {
// 		return ['file not found', data, 0];
// 	}

// 	let i = strip_to_sep(raw, 0);
// 	let resp;
// 	let corrupted = 0;
// 	while (i < raw.length) {
// 		switch (raw[i]) {
// 			case 'a':
// 				resp = data.solar.parse(raw, i);
// 				break;
// 			case 'b':
// 				resp = data.diagnostic.parse(raw, i);
// 				break;
// 			case 'x':
// 				resp = data.power_test.parse(raw, i);
// 				break;
// 			default:
// 				resp = [true, strip_to_sep(raw, i + 1)];
// 		}

// 		corrupted += resp[0];
// 		i = resp[1];
// 	}

// 	return ['', data, corrupted];
// }


// function strip_to_sep(raw, i) {
// 	for (;;i++) {
// 		if ((raw.length == i) || (is_valid_sep(raw, i))) {
// 			return i;
// 		}
// 	}
// }
