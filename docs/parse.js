'use strict';
const SHIFT = 32;

function is_valid_sep(raw, i) {
	return raw[i] > 96;
}


class SolarData {
	constructor() {
		this.date = [];
		this.power = [];
		this.voltage = [];
		this.frequency = [];
		this._corrupted = 0;
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

			return i + 12;
		} else {
			this._corrupted++;
			return strip_to_sep(raw, i + 1);
		}
	}

	parse2(raw, i) {
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
			this.power.push((buffer & 0xffff) / 10);
			buffer >>= 16;

			buffer += (raw[i + 9] - SHIFT) << 4;
			buffer += (raw[i + 10] - SHIFT) << 10;
			this.frequency.push(((buffer & 0x7ff) + 4000) / 100);
			buffer >>= 11;

			buffer += (raw[i + 11] - SHIFT) << 5;
			this.voltage.push((buffer + 1500) / 10);

			return i + 12;
		} else {
			this._corrupted++;
			return strip_to_sep(raw, i + 1);
		}
	}

	create_status() {
		let sum_power = this.power.reduce((a, b) => a + b, 0);
		let avg_power = (sum_power / this.power.length) || 0;
		let dt = this.date.slice(-1) - this.date[0];
		let energy = Math.round(avg_power * dt / (3600)).toLocaleString('de-ch');
		let points = this.date.length.toLocaleString('de-ch');

		this._status = `${energy} Wh`;
		this._debug = points;
	}
}


class PowerData {
	constructor(ticks) {
		this.date = [];
		this.power = [];
		this._corrupted = 0;
		this._ticks = ticks;
	}

	parse(raw, i) {
		if (is_valid_sep(raw, i + 9)) {
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

			return i + 9;
		} else {
			this._corrupted++;
			return strip_to_sep(raw, i + 1);
		}
	}

	create_status() {
		let energy = Math.round(this.date.length * 1000 / this._ticks).toLocaleString('de-ch');
		this._status = `${energy} Wh`;
		this._debug = this.date.length.toLocaleString('de-ch');
	}
}


class DiagnosticData {
	constructor() {
		this.date = [];
		this.buffer = [];
		this.uptime = [];
		this._corrupted = 0;
	}

	parse(raw, i) {
		if (is_valid_sep(raw, i + 8) || (raw.length == i + 8)) {
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

			return i + 8;
		} else {
			this._corrupted++;
			return strip_to_sep(raw, i + 1);
		}
	}

	create_status() {
		let length = this.date.length.toLocaleString('de-ch');
		this._status = 'status/corr'
		this._debug = `${length}/${this._corrupted}`;
	}
}


function parse(raw) {
	let data = {
		solar: new SolarData(),
		power_oben: new PowerData(800),
		power_unten: new PowerData(10000),
		diagnostic: new DiagnosticData(),
	};

	if (raw === undefined) {
		return ['file not found', data];
	}

	raw = new TextEncoder().encode(raw);
	let i = strip_to_sep(raw, 0);
	let resp;
	let corrupted = 0;
	while (i < raw.length) {
		switch (raw[i]) {
			case 97:
				i = data.solar.parse(raw, i);
				break;
			case 98:
				i = data.diagnostic.parse(raw, i);
				break;
			case 99:
				i = data.power_oben.parse(raw, i);
				break;
			case 100:
				i += 12;
				break;
			case 101:
				i = data.solar.parse2(raw, i);
				break;
			case 102:
				i = data.power_unten.parse(raw, i);
				break;
			case 103:
				i = parse_entry_g(raw, i, data);
				break;
			default:
				corrupted++;
				console.log('corr ' + raw[i]);
				i = strip_to_sep(raw, i + 1);
		}

		data.diagnostic._corrupted +=
			data.solar._corrupted +
			data.power_oben._corrupted +
			corrupted;
	}

	if (corrupted) {
		console.log(`${corrupted} elements were corrupted`)
	}
	Object.values(data).forEach(p => p.create_status());

	return ['', data];
}


function parse_entry_g(raw, i, data) {
	i = data.diagnostic.parse_g(raw, i);
	while (i < raw.length) {
		switch (raw[i]) {

		}
	}
	data.diagnostic.parse()
}


function strip_to_sep(raw, i) {
	for (;;i++) {
		if ((raw.length == i) || (is_valid_sep(raw, i))) {
			return i;
		}
	}
}
