'use strict';
if(typeof console === undefined) {
	var console = {log: function() {}};
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
		[this.status, this.data] = parse(raw.data);

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


class DayManager {
	constructor(scope) {
		this.store = [new Day(new Date(), scope)];
		this.scope = scope;
	}

	load(days) {
		const n = this.store.length;
		for (let i = n; i<(days+n); i++) {
			let date = new Date();
			date.setDate(date.getDate() - i);
			this.store.push(new Day(date, this.scope));
		}
	}
}


class CombinedData {
	constructor() {
		this.draw_solar = true;
		this.draw_power = true;
		this.draw_unten = true;
	}

	update(days) {
		this.solar = new SolarData();
		this.diagnostic = new DiagnosticData();
		this.power_oben = new PowerData();
		this.power_unten = new PowerData();

		for (let day of days.store) {
			if (day.draw_visible) {
				let d = day.data;
				for (let group of Object.keys(this)) {
					if (group.startsWith('draw')) {
						continue;
					}
					for (let key of Object.keys(this[group])) {
						if (key[0] == '_') {
							continue;
						}

						this[group][key] = d[group][key].concat(this[group][key]);
					}
				}
			}
		}
	}

	set_visible(name) {
		this[name] ^= true;
	}
}


var app = angular.module('App', []);
app.controller('world', function ($scope) {
	$scope.width = window.innerWidth;
	$scope.status = 'init';
	$scope.debug = true;
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
		location.reload();
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

	$scope.toggle_visible = function(day) {
		day.draw_visible ^= true;
		$scope.draw();
	}

	$scope.days = new DayManager($scope);
});
