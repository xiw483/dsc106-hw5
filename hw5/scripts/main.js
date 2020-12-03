// Global constants
const DEBUG = true;
const Knife_PRICE = 14.25;
const Fork_PRICE = 9.99;

// Some little helpers
const log = msg => (DEBUG ? console.log(msg) : '');
const select = id => document.getElementById(id);

let mapConfig = {
	shapes: [
		{
			type: 'zingchart.maps',
			options: {
				name: 'world.continents',
				zooming: false,
				panning: false,
				scrolling: false,
				style: {
					controls: {
						visible: false
					}
				}
			}
		}
	]
}
let mapHighlight = {
	backgroundColor: '#7CA82B',
	hoverState: {
		backgroundColor: '#0C3'
	}
}

function plotMap() {
	zingchart.loadModules('maps, maps-world-continents', function (e) {
		zingchart.render({
			id: 'myMap',
			data: mapConfig
		});
	});
}

function plotSales(sales) {
	// Plot the world map
	plotMap();

	// Make sales data available globally
	data = sales;

	// Setup EventListener to respond to continent clicks
	zingchart.bind('myMap', 'shape_click', function (e) {
		let continent = {}
		continent[e.shapeid] = mapHighlight;
		mapConfig['shapes'][0]['options']['style']['items'] = continent;
		zingchart.exec('myMap', 'setdata', {
			data: mapConfig
		});
		plotColumn(e.shapeid);
		plotPie(e.shapeid);
		updateScoreCards(e.shapeid);
	});
}

function plotColumn(continent) {
	let KnifeValues = {
		values: [],
		text: "Knife"
	}
	let ForkValues = {
		values: [],
		text: "Fork"
	}
	let sales = data[continent];
	for (const datum of sales) {
		let month = datum['Month'];
		let Knife = datum['Knife'];
		let Fork = datum['Fork'];
		KnifeValues['values'].push([month, Knife]);
		ForkValues['values'].push([month, Fork]);
	}
	let myConfig = {
		type: 'bar',
		legend: {},
		title: {
			text: 'Monthly Sales'
		},
		'scale-x': {
			label: {
				text: 'Month'
			}
		},
		'scale-y': {
			label: {
				text: 'Number of units sold'
			}
		},
		series: [
			KnifeValues,
			ForkValues
		]
	};
	zingchart.render({
		id: 'salesPerMonthChart',
		data: myConfig,
		height: '100%',
		width: '100%'
	})
}

function plotPie(continent) {
	if (continent === 'ANTARCTICA') {
		zingchart.exec('totalSalesChart', 'destroy');
		return;
	}
	let KnifeValues = {
		values: [],
		text: "Knife"
	}
	let ForkValues = {
		values: [],
		text: "Fork"
	}
	let sales = data[continent];
	let Knifees = 0, Forks = 0;
	for (const datum of sales) {
		Knifees += datum['Knife'];
		Forks += datum['Fork'];
	}
	KnifeValues['values'].push(Knifees);
	ForkValues['values'].push(Forks);
	let myConfig = {
		type: 'pie',
		legend: {},
		title: {
			text: 'Total Sales'
		},
		series: [
			KnifeValues,
			ForkValues
		]
	};
	zingchart.render({
		id: 'totalSalesChart',
		data: myConfig,
		height: '100%',
		width: '100%'
	})
}

function updateScoreCards(continent) {
	let sales = data[continent];
	let Knifees = 0, Forks = 0;
	for (const datum of sales) {
		Knifees += datum['Knife'];
		Forks += datum['Fork'];
	}
	let revenue = Knife_PRICE * Knifees + Fork_PRICE * Forks;
	select('dingusSold').innerHTML = Knifees;
	select('widgetSold').innerHTML = Forks;
	select('totalSales').innerHTML = revenue.toFixed(2);
}

async function loadJSON(path) {
	let response = await fetch(path);
	let dataset = await response.json(); // Now available in global scope
	return dataset;
}

function plotStocks(stocks) {
	let prices = [];
	for (datum of stocks) {
		log(datum);
		prices.push([datum['Date'], datum['Adj Close']]);
	}
	let myConfig = {
		type: 'area',
		scaleX: {
			transform: {
				type: 'date',
				all: '%m/%d/%y'
			},
			zooming: true,
			label: {
				text: 'Date'
			}
		},
		scaleY: {
			zooming: true,
			guide: {
				'line-style': 'dotted'
			},
			label: {
				text: 'Adj Close Stock Price'
			}
		},
		'crosshair-x': {
			'plot-label': {
				text: "$%v",
				decimals: 2
			},
			'scale-label': {
				visible: true
			}
		},
		'crosshair-y': {
			type: 'multiple',
			'scale-label': {
				visible: true
			}
		},
		title: {
			text: 'Dynamic Growth'
		},
		subtitle: {
			text: 'Stock Prices of K&F Corp. from 2015-Present',
		},
		series: [
			{
				values: prices
			}
		]
	};

	zingchart.render({
		id: 'stockChart',
		data: myConfig,
		height: 400
	});
}

function init() {
	salesPromise = loadJSON('./data/sales.json');
	stocksPromise = loadJSON('./data/stocks.json');
	salesPromise.then(function (sales) {
		plotSales(sales);
	});
	stocksPromise.then(function (stocks) {
		plotStocks(stocks);
	});
}

document.addEventListener('DOMContentLoaded', init, false);
