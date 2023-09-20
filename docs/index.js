'use strict';
if(typeof console === undefined) {
	var console = {log: function() {}};
}


const PLOT_OPT = {
	id: "chart1",
	class: "my-chart",
	width: 400,
	height: 400,
	series: [
		{label: 'step'},
		{stroke: "red"},
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
	  }
};

var app = angular.module('App', []);


function date_formater(date) {
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = (date.getDate()).toString().padStart(2, "0");
	return `${date.getFullYear()}.${month}.${day}`;
}


class Day {
	constructor(date, scope) {
		this.name = date.toLocaleDateString(
			'de-ch',
			{
				weekday:"long",
				year: "numeric",
				month: "numeric",
				day: "numeric"
			}
		);
		this.path = date_formater(date)
		this.draw_visible = false;
		this.scope = scope;
		this.load();
	}

	load() {
		this.status = "fetching ...";
		fetch(`${this.scope.url}?path=${this.path}`)
			.then(
				resp => resp.json()
					.then(
						data => this.parse(data),
						err => this.error(err)
					),
				err => this.error(err)
			);
	}

	parse(raw) {
		[this.status, this.data, this.corrupted] = parse(raw.data);

		this.draw_visible = true;
		this.scope.draw();
		this.scope.$apply();
	}

	error(err) {
		this.status = err;
		this.scope.$apply();
		throw(err);
	}
}


class DrawManager {
	draw(data) {
		if (this.power_plot === undefined) {
			this.init_plots();
		}

		this.power_plot.setData([data.solar.date, data.solar.power]);
		this.voltage_plot.setData([data.solar.date, data.solar.voltage]);
		this.frequency_plot.setData([data.solar.date, data.solar.frequency]);
		this.buffer_plot.setData([data.diagnostic.date, data.diagnostic.buffer]);
		this.uptime_plot.setData([data.diagnostic.date, data.diagnostic.uptime]);
	}

	init_plots() {
		let power_canvas = document.getElementById("power");
		this.power_plot = new uPlot(PLOT_OPT, [], power_canvas);
		let voltage_canvas = document.getElementById("voltage");
		this.voltage_plot = new uPlot(PLOT_OPT, [], voltage_canvas);
		let frequency_canvas = document.getElementById("frequency");
		this.frequency_plot = new uPlot(PLOT_OPT, [], frequency_canvas);
		let buffer_canvas = document.getElementById("buffer");
		this.buffer_plot = new uPlot(PLOT_OPT, [], buffer_canvas);
		let uptime_canvas = document.getElementById("uptime");
		this.uptime_plot = new uPlot(PLOT_OPT, [], uptime_canvas);
	}

	set_xscale(min, max) {
		this.power_plot.setScale('x', {min, max});
		this.voltage_plot.setScale('x', {min, max});
		this.frequency_plot.setScale('x', {min, max});
		this.buffer_plot.setScale('x', {min, max});
		this.uptime_plot.setScale('x', {min, max});
	}
}

var draw_manger = new DrawManager();

class DayManager {
	constructor(scope) {
		this.store = [new Day(new Date(), scope)];
		this.store[0].load();
		this.scope = scope;
	}

	load(days) {
		for (let i = this.store.length; i<days; i++) {
			let date = new Date();
			date.setDate(date.getDate() - i);
			this.store.push(new Day(date, this.scope));
		}
	}
}


class CombinedData {
	update(days) {
		this.solar = {
			date: [],
			power: [],
			voltage: [],
			frequency: [],
		}

		this.power_test = {
			date: [],
			power: [],
		};

		this.diagnostic = {
			date: [],
			buffer: [],
			uptime: [],
		}

		for (let day of days.store) {
			if (day.draw_visible) {
				let d = day.data;
				for (let group of Object.keys(this)) {
					for (let key of Object.keys(this[group])) {
						this[group][key] = d[group][key].concat(this[group][key]);
					}
				}
			}
		}
	}
}


app.controller('world', function ($scope) {
	$scope.status = 'init';
	window.SCOPE = $scope; // Debug
	$scope.draw_manger = draw_manger;
	$scope.combined_data = new CombinedData();
	$scope.url = localStorage.getItem('url');

	$scope.draw = function() {
		$scope.combined_data.update($scope.days);
		$scope.draw_manger.draw($scope.combined_data);
	}

	$scope.store_url = function(url) {
		console.log(url)
		localStorage.setItem('url', url);
	}

	$scope.download = function() {
		const link = document.createElement("a");
		const content = JSON.stringify($scope.combined_data);
		const file = new Blob([content], { type: 'text/plain' });
		link.href = URL.createObjectURL(file);
		link.download = "power.json";
		link.click();
		URL.revokeObjectURL(link.href);
	}

	$scope.days = new DayManager($scope);
});
