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
		this.solar = new SolarData();
		this.diagnostic = new DiagnosticData();
		this.power_test = new PowerData();

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


var app = angular.module('App', []);
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
