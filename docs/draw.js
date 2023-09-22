'use strict';


const width = Math.min(window.innerWidth - 30, 500);
const PLOT_OPT = {
	id: "chart1",
	class: "my-chart",
	width: width,
	height: width,
	plugins: [
		touchZoomPlugin()
	],
	hooks: {
		setScale: [
		  (u, key) => {
			if (key == 'x') {
				let min = u.scales.x.min;
				let max = u.scales.x.max;
				draw_manger.set_xscale(min, max);
			}
		  }
		]
	  },
	  axes: [
		{
		  space: 40,
		  incrs: [
			 // minute divisors (# of secs)
			 1, 5, 10, 15, 30,
			 // hour divisors
			 60, 60 * 5, 60 * 10, 60 * 15, 60 * 30,
			 // day divisors
			 3600, 3600 * 6, 3600 * 24,
			 // week divisor
			 3600 * 24 * 7,
		  ],
		  values: [
		  // tick incr          default           year                             month    day                        hour     min                sec       mode
			[3600 * 24 * 365,   "{YYYY}",         null,                            null,    null,                      null,    null,              null,        1],
			[3600 * 24 * 28,    "{MMM}",          "\n{YYYY}",                      null,    null,                      null,    null,              null,        1],
			[3600 * 24,         "{D}.{M}",        "\n{YYYY}",                      null,    null,                      null,    null,              null,        1],
			[3600,              "{H}",		      "\n{D}.{M}.{YY}",                null,    "\n{D}.{M}",               null,    null,              null,        1],
			[60,                "{H}:{mm}",       "\n{D}.{M}.{YY}",                null,    "\n{D}.{M}",               null,    null,              null,        1],
			[1,                 ":{ss}",          "\n{D}.{M}.{YY} {H}:{mm}",       null,    "\n{D}.{M} {H}:{mm}",      null,    "\n{H}:{mm}",      null,        1],
			[0.001,             ":{ss}.{fff}",    "\n{D}.{M}.{YY} {H}:{mm}",       null,    "\n{D}.{M} {H}:{mm}",      null,    "\n{H}:{mm}",      null,        1],
		  ],
		},
	  ],
};


const PLOTS = [
	{
		title: 'Power',
		series: [{label: 'blob'},
			{label: 'Solar [W]', stroke: 'darkslateblue'},
			{label: 'Test [W]', stroke: 'dodgerblue'}
		],
	}, {
		title: 'Voltage',
		series: [{}, {label: 'Grid Voltage [V]', stroke: 'black'}],
	}, {
		title: 'Frequency',
		series: [{}, {label: 'Grid Frequency [Hz]', stroke: 'black'}],
	}, {
		title: 'Buffer',
		series: [{}, {label: 'Free buffer', stroke: 'black'}],
	}, {
		title: 'Uptime',
		series: [{}, {label: 'Uptime [h]', stroke: 'black'}],
	}
]



function date_formater(date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = (date.getDate()).toString().padStart(2, "0");
	return `${date.getFullYear()}.${month}.${day}`;
}

class DrawManager {
	constructor() {
		for (const opt of Object.values(PLOTS)) {
			const canvas = document.getElementById(opt.title);
			Object.assign(opt, PLOT_OPT);
			this[opt.title] = new uPlot(opt, [], canvas);
		}
	}

	draw(data) {
		let solar = data.draw_solar ? [data.solar.date, data.solar.power] : [[], []];
		let power = data.draw_power ? [data.power_test.date, data.power_test.power] : [[], []];

		let dd = uPlot.join([
			solar,
			[data.solar.date, data.solar.voltage],
			[data.solar.date, data.solar.frequency],
			[data.diagnostic.date, data.diagnostic.buffer],
			[data.diagnostic.date, data.diagnostic.uptime],
			power,
		]);

		this.Power.setData([dd[0], dd[1], dd[6]]);
		this.Voltage.setData([dd[0], dd[2]]);
		this.Frequency.setData([dd[0], dd[3]]);
		this.Buffer.setData([dd[0], dd[4]]);
		this.Uptime.setData([dd[0], dd[5]]);
	}

	set_xscale(min, max) {
		Object.values(this).forEach(p => p.setScale('x', {min, max}));
	}
}

var draw_manger = new DrawManager();
