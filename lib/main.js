const DATAURL = 'https://gist.githubusercontent.com/karmsidhu'+
	'/d5b91316c786148084d3b9547cb3d015/raw/9eee233dcb56b01f5'+
	'ff3bd114c3614330cc1f69e/allprovinces.csv';

d3.csv(DATAURL, d => {
	return {
		province: d.Province,
		program: d.Program,
		pType: d['Program Type'],
		gvtMinistry: d['Government Ministry (At Present)'],
		pComponent: d['Program Component'],
		units: d.Units,
		year: d['Fiscal Year end date'],
		value: parseFloat(d.value)
	};
})
	.then(loadedData => {
		console.log(`Successfully accessed ${DATAURL}`);

		var model = {
			data: loadedData,
			pieData: null,
			filterData: (attr, val) => {
				model.data = model.data.filter(d => {
					return d[attr].trim() === val.trim();
				})
			},
			groupBySum: (attr, sumAttr) => {
				model.data =  model.data.reduce(function (acc, obj) {
					var key = obj[attr];
					if (!acc[key]) {
						acc[key] = 0;
					}
					if (obj[sumAttr] >= 0){
						acc[key] += obj[sumAttr];
					}
					return acc;
				}, {});
				model.setPieGraphData();
			},
			setPieGraphData: () => {
				var pieData = [];
				for (var key in model.data){
					pieData.push({
						name: key,
						value: model.data[key]
					});
				}
				model.pieData = pieData;
			},
			getDistinctValues: (attr) => {
				var allValues = model.data.map(d => {return d[attr];})
				return new Set(allValues);
			},
			resetData: () => {
				model.data = loadedData;
			}
		};

		var handler = {
			resetDataEvent: () => {
				model.resetData();
				view.updateProvinceSelection(model.getDistinctValues('province'));
				d3.select('#pieGraph').html('');
			},

			filterByProvince: () => {
				var index = view.provSelection.selectedIndex;
				if(index != 0) {
					var province = view.provSelection[index].text;
					model.filterData('province', province);
					model.filterData('units', 'Millions'); // Needs an option for caseloads
					model.groupBySum('program', 'value');
					view.updateProvinceSelection([province]);
					view.provSelection.selectedIndex = 1;
					view.pieGraph.generateChart(model.pieData, 500, 500);
				}
			},

			updatePieChart: () => {
				
			},

			initializeEventListeners: () => {
				view.resetButton.addEventListener('click', handler.resetDataEvent);
				view.provSelection.addEventListener('change', handler.filterByProvince);
			}
		};

		var view = {
			resetButton: document.getElementById('resetProvinceButton'),
			provSelection: document.getElementById('provinceSelection'),
			updateProvinceSelection: (provinces) => {
				view.provSelection.options.length = 1;
				provinces.forEach(province => {
					var prov = document.createElement('option');
					prov.text = province;
					view.provSelection.add(prov);
				})
			},
			pieGraph: {
				pie: (data) => {
					const arcs = d3.pie()
						.sort((a,b) => {return a.value >= b.value})
						.value(data => data.value);
					return arcs(data);
				},
				arc: (width, height) => {
					const arc = d3.arc()
						.innerRadius(0)
						.outerRadius(Math.min(width, height) / 2 - 1);
					return arc;
				},
				arcLabel: (width, height) => {
					const radius = Math.min(width, height) / 2 * 0.8;
					const arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);
					return arcLabel;
				},
				color: (data) => {
					const color = d3.scaleOrdinal()
						.domain(data)
						.range(["#a6cee3","#1f78b4","#b2df8a",
						"#33a02c","#fb9a99","#e31a1c","#fdbf6f",
						"#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]);
					return color(data);
				},
				generateChart: (data, width, height) => {
					const arcs = view.pieGraph.pie(data);
					const svg = d3.select('#pieGraph')
						.append('svg')
							.attr('width', width)
							.attr('height', height)
							.attr("text-anchor", "middle")
							.style("font", "12px sans-serif");
					const g = svg.append("g")
						.attr("transform", `translate(${width / 2},${height / 2})`);
					var tooltip = d3.select('#pieGraph')
						.append('div')
							.style('opacity', 0)
							.attr('id', 'tooltip')
							.style('background-color', 'white')
							.style('font', '16px sans-serif')
							.style("padding", "5px");

					var mouseover = function(d) {
						tooltip.style("opacity", 1);
						d3.select(this)
							.style("stroke", "black")
							.style("opacity", 1);
					}
					var mousemove = function(d) {
						tooltip.html(d.data.name + ': ' + d.value.toLocaleString())
							.style("left", (d3.mouse(this)[0]+70) + "px")
							.style("top", (d3.mouse(this)[1]) + "px");
					}
					var mouseleave = function(d) {
						tooltip.style("opacity", 0);
						d3.select(this)
							.style("stroke", "none")
							.style("opacity", 0.8);
					}

					g.selectAll("path")
						.data(arcs)
						.enter().append("path")
							.attr("fill", d => view.pieGraph.color(d.data.name))
							.attr("stroke", "white")
							.attr("d", view.pieGraph.arc(width, height))
							.on('mouseover', mouseover)
							.on('mousemove', mousemove)
							.on('mouseleave', mouseleave)
						.append("title")
							.text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

					const text = g.selectAll("text")
					.data(arcs)
					.enter().append("text")
						.attr("transform", d => `translate(${view.pieGraph
							.arcLabel(width, height).centroid(d)})`)
						.attr("dy", "0.35em");
				
					text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
						.attr("x", 0)
						.attr("y", "0.7em")
						.attr("fill-opacity", 0.7)
						.text(d => d.data.value.toLocaleString());
				}
			}
		};
		handler.initializeEventListeners();
		view.updateProvinceSelection(model.getDistinctValues('province'));
	})
	.catch(function(exception){
		console.log(exception);
	});

