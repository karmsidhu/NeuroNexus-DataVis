const DATAURL = 'https://gist.githubusercontent.com/TeoU2015/' + 
	'0b826ea1b067800fbe19fd2bbdc2f30d/raw/a4a51d51c550755529f12' +
	'435f59b46472abf3ecb/AllProvinces.csv';

var transitionTime = 1000;

var updateAll = null;

var graphs = {
	pie: {
		height: 500,
		width: 500,
		margin: 40,
		svg: (selection) => {return d3.select(selection).append('svg');},
		pie: (data) => {
			const arcs = d3.pie()
				.sort((a,b) => {return d3.ascending(a.value, b.value);})
				.value(data => data.value);
			return arcs(data);
		},
		getArcFunction: function() {
			return d3.arc()
				.innerRadius(0)
				.outerRadius(Math.min(this.width, this.height) / 2 - this.margin);
		},
		getArcLabel: function() {
			const radius = Math.min(this.width, this.height) / 2 * 0.8;
			const arcLabel = d3.arc().innerRadius(radius).outerRadius(radius);
			return arcLabel;
		},
	},

	bar: {
		height: 300,
		width: 700,
		margin: {
			top: 15,
			bottom: 15,
			right: 200,
			left: 25
		},
		svg: (selection) => {return d3.select(selection).append('svg');},
		getHorizontalAxisFunction: function(data) {
			return d3.scaleLinear()
				.range([0, this.width - (this.margin.right + this.margin.left)])
				.domain([0, d3.max(data, (d) => {return d.value;})]);
		},
		getVerticalAxisFunction: function(data) {
			return d3.scaleBand()
				.range([this.height - (this.margin.top + this.margin.bottom), 0])
				.domain(data.map((d) => {return d.name;}))
				.padding(0.1);
		}
	},

	line: {
		height: 300,
		width: 600,
		margin: {
			top: 30,
			bottom: 30,
			left: 50,
			right: 20
		},
		svg: (selection) => {return d3.select(selection).append('svg');},
		getHorizontalAxisFunction: function(data) {
			return d3.scaleTime()
				.range([0, this.width - (this.margin.left + this.margin.right)])
				.domain(data.value.dateRange);
		},
		getVerticalAxisFunction: function(data) {
			return d3.scaleLinear(data)
				.range([this.height - (this.margin.top + this.margin.bottom), 0])
				.domain([0, data.value.max]);
		}
	},

	getColorFunction: function(domain){
		return d3.scaleOrdinal()
			.domain(domain)
			.range(d3.schemeDark2);
	}
};

var domElements = {
	resetButton: document.getElementById('resetProvinceButton'),
	provSelection: document.getElementById('provinceSelection'),
	radioButton: document.getElementById('dataTypeForm'),
	expendCaseloadsRadioButton: document.getElementById('expendVsCaseloads')
};

d3.csv(DATAURL, d => {
	var parseDate = d3.timeParse('%Y-%m-%d');
	return {
		province: d.Province,
		program: d.Program,
		pType: d['Program Type'],
		gvtMinistry: d['Government Ministry (At Present)'],
		pComponent: d['Program Component'],
		units: d.Units,
		date: parseDate(d['Fiscal Year end date']),
		value: parseFloat(d.value)
	};
})
	.then(loadedData => {
		console.log(`Successfully accessed ${DATAURL}`);

		var model = {
			data: loadedData,
			pieData: null,
			lineData: null,

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

			setLineGraphData: (attr) => {
				var nestedCSV = d3.nest()
					.key(function(d){return d.province;})
					.rollup(function(v){
						// get date range for x axis
						var dateRange = d3.extent(v, function(d) {return d.date;});
						//get max for y axis range
						var max = d3.max(v, function(d){return d.value;});
						//get name of program
						var Program = d3.nest().key(function(d){return d.program;});
						//get name of program
						var LineType = d3.nest()
							.key(function(d){return d.program+d.pComponent;})
							.entries(v);
						return {max:max, Program:Program, dateRange:dateRange, 
							LineType:LineType};
					})
					.entries(model.data);
				
				model.lineData = nestedCSV;
			},

			setBarGraphData: () => {
				var barData = [];
				for (var key in model.data){
					barData.push({

					});
				}
				model.barData = barData;
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
				d3.select('#barGraph').html('');
				d3.select('#lineGraph').html('');
			},

			filterByProvinceMap: (province) => {
				handler.resetDataEvent();
				model.filterData('province', province);
				model.filterData('units', handler.getSelectedFilterType());
				model.setLineGraphData(handler.getSelected());
				model.groupBySum(handler.getSelected(), 'value');
				console.log(model.lineData);
				//domElements.provSelection.selectedIndex = index;
				view.generatePieChart(model.pieData);
				view.generateBarChart(model.pieData);
				view.generateLineChart(model.lineData);
			},

			filterByProvince: () => {
				var index = domElements.provSelection.selectedIndex;
				if(index != 0) {
					handler.resetDataEvent();
					var province = domElements.provSelection[index].text;
					model.filterData('province', province);
					model.filterData('units', handler.getSelectedFilterType());
					model.setLineGraphData(handler.getSelected());
					model.groupBySum(handler.getSelected(), 'value');
					console.log(model.lineData);
					domElements.provSelection.selectedIndex = index;
					view.generatePieChart(model.pieData);
					view.generateBarChart(model.pieData);
					view.generateLineChart(model.lineData);
				}
			},

			initializeEventListeners: () => {
				domElements.resetButton.addEventListener('click', 
					handler.resetDataEvent);
				domElements.provSelection.addEventListener('change',
					handler.filterByProvince);
				domElements.radioButton.addEventListener('change', 
					handler.filterByProvince);
				domElements.expendCaseloadsRadioButton.addEventListener('change',
					handler.filterByProvince);
			},

			getSelected: () => {
				var list = domElements.radioButton;
				for(var i = 0; i < list.length; i++){
					if(list[i].checked){
						return list[i].defaultValue;
					}	
				}
			},

			getSelectedFilterType: () => {
				var list = domElements.expendCaseloadsRadioButton;
				for(var i = 0; i < list.length; i++){
					if(list[i].checked){
						return list[i].defaultValue;
					}	
				}
			}
		};

		var view = {
			updateProvinceSelection: (provinces) => {
				domElements.provSelection.options.length = 1;
				provinces.forEach(province => {
					var prov = document.createElement('option');
					prov.text = province;
					domElements.provSelection.add(prov);
				})
			},

			generatePieChart: (data) => {
				data = data.sort((a,b) => {return d3.ascending(a.value, b.value);});
				const 
					width = graphs.pie.width,
					height = graphs.pie.height,
					arcs = graphs.pie.pie(data),
					svg = graphs.pie.svg('#pieGraph'),
					color = graphs.getColorFunction(data),
					arc = graphs.pie.getArcFunction(),
					arcLabel = graphs.pie.getArcLabel();

				svg
					.attr('width', width)
					.attr('height', height)
					.attr("text-anchor", "middle")
						.style("font", "12px sans-serif");
				
				const g = svg.append('g')
					.attr("transform", `translate(${width / 2},${height / 2})`);

				g
					.selectAll('path')
					.data(arcs)
					.enter()
					.append('path')
						.attr('fill', (d, i) => {return color(i)})
						.transition()
						.duration(transitionTime)
						.attrTween('d', d => {
							var i = d3.interpolate(d.startAngle, d.endAngle);
							return (t) => {
									d.endAngle = i(t);
							return arc(d);
						}});
				
				g
					.selectAll('path')
					.attr('stroke', 'white')
					.attr('stroke-width', '2')
					.attr('opacity', 0.8)
					.append('title')
						.text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);
				
				const text = g.selectAll('text')
					.data(arcs)
					.enter()
					.append("text")
						.attr("transform", d => `translate(${arcLabel.centroid(d)})`)
						.attr("dy", "0.35em");
					
				text.filter(d => (d.endAngle - d.startAngle) > 0.25)
					.append("tspan")
						.attr("x", 0)
						.attr("y", "0.7em")
						.attr("fill-opacity", 0.7)
						.text(d => d.data.value.toLocaleString());
				
				var tooltip = d3.select('#pieGraph')
					.append('div')
						.attr('class', 'tooltip');
				
				var mouseover = function() {
					tooltip.style("opacity", 1);
					d3.select(this)
						.style("stroke", "black")
						.style("opacity", 1);
				}
				var mousemove = function(d) {
					tooltip.html(d.data.name + ': ' + d.value.toLocaleString())
						.style("left", (event.pageX+50) + "px")
						.style("top", (event.pageY-50) + "px");
				}
				var mouseleave = function() {
					tooltip.style("opacity", 0);
					d3.select(this)
						.style("stroke", 'white')
						.style('stroke-width', '2')
						.style("opacity", 0.8);
				}

				g.selectAll('path')
					.on('mouseover', mouseover)
					.on('mousemove', mousemove)
					.on('mouseleave', mouseleave);
			},

			generateBarChart: (data) => {
				data = data.sort((a,b) => {return d3.ascending(a.value, b.value);});
				const
					margin = graphs.bar.margin,
					width = graphs.bar.width,
					height = graphs.bar.height,
					svg = graphs.bar.svg('#barGraph'),
					color = graphs.getColorFunction(data),
					x = graphs.bar.getHorizontalAxisFunction(data),
					y = graphs.bar.getVerticalAxisFunction(data);
				
				svg 
					.attr('width', width+margin.left+margin.right)
					.attr('height', height+margin.top+margin.bottom)
					.append('g')
						.attr('transform', `translate(${margin.left},${margin.top})`);
				
				svg
					.append('g')
						.attr('class', 'y axis')
						.call(d3.axisLeft(y).tickSize(0))
						.attr('transform', `translate(${margin.left},${margin.top})`)
					.selectAll('text')
						.data(data)
						.attr('transform', `translate(${x(0)+margin.left},${0})` )
						.transition()
						.duration(transitionTime)
						.attr('transform', d => {return 'translate('
							+(x(d.value)+margin.left*0.9)+',0)';})
						.style("text-anchor", "start");
						
				svg
					.append("g")
					.attr("transform", `translate(${margin.left},${height-margin.top})`)
					.call(d3.axisBottom(x))
					.selectAll("text")
						.attr("transform", "translate(-10,0)rotate(-45)")
						.style("text-anchor", "end");

				var bars = svg.selectAll('bar')
					.data(data)
					.enter()
					.append('g')
						.attr('transform', `translate(${margin.left},${margin.top})`);
				
				bars
					.append('rect')
					.style('fill', d => color(d.name))
					.attr("y", d => {return y(d.name);})
					.attr("height", y.bandwidth())
					.attr("width", d => {return x(0);})
					.attr("x", x(0));

				bars
					.selectAll('rect')
					.attr('opacity', 0.8)
					.transition()
					.duration(transitionTime)
					.attr('x', d => {return x(0);})
					.attr('width', d => {return x(d.value);});

				var tooltip = d3.select('#barGraph')
					.append('div')
						.attr('class', 'tooltip');
				
				var mouseover = function(d) {
					tooltip.style("opacity", 1);
					d3.select(this)
						.style("stroke", "black")
						.style("opacity", 1);
				}
				var mousemove = function(d) {
					tooltip.html(d.name + ': ' + d.value.toLocaleString())
						.style("left", (event.pageX+50) + "px")
						.style("top", (event.pageY-50) + "px");
				}
				var mouseleave = function(d) {
					tooltip.style("opacity", 0);
					d3.select(this)
						.style("stroke", 'white')
						.style('stroke-width', '2')
						.style("opacity", 0.8);
				}

				bars
					.on('mouseover', mouseover)
					.on('mousemove', mousemove)
					.on('mouseleave', mouseleave);
			},

			generateLineChart: (data) => {
				console.log(data);
				const
					height = graphs.line.height,
					width = graphs.line.width,
					margin = graphs.line.margin,
					svg = graphs.line.svg('#lineGraph'),
					color = d3.scaleOrdinal(d3.schemeDark2),
					x = graphs.line.getHorizontalAxisFunction(data[0]),
					y = graphs.line.getVerticalAxisFunction(data[0]);
				
				const valueLine = d3.line()
					.x(d => {return x(d.date);})
					.y(d => {return y(d.value);});
				
				svg
					.attr('width', width + margin.left + margin.right)
					.attr('height', height + margin.top + margin.bottom)
				.append('g')
					.attr("transform",`translate(${margin.left+margin.right},
						${margin.top+margin.bottom})`);

				svg
					.append('g')
						.attr('class', 'yaxis')
						.attr('transform', `translate(${margin.left+margin.right},
							${margin.top+margin.bottom})`)
						.call(d3.axisLeft(y))
					.selectAll('text')
						.data(data[0].value);

				svg
					.append('g')
						.attr('class', 'xaxis')
						.attr('transform', `translate(${margin.left+margin.right}, 
							${height})`)
						.call(d3.axisBottom(x));

				const selectProvGroup = svg.selectAll('.provinceGroups')
					.data(data, d => {return d;})
					.enter()
					.append('g')
						.attr('class', 'provinceGroups')
						.attr('transform', `translate(${margin.left+margin.right}, 
							${margin.top+margin.bottom})`);

				const path = selectProvGroup.selectAll('.line')
					.data(d => {return d.value.LineType;})
					.enter()
					.append('path');

				
				path
					.attr('d', d => {return valueLine(d.values);})
					.attr('class', 'line')
					.style('stroke', (d, i) => color(i))
					.style('fill', 'none');

				var mouseG = svg.append("g")
					.attr("class", "mouse-over-effects")
					.attr("transform",`translate(${margin.left+margin.right},
						${margin.top+margin.bottom})`);
		
				mouseG
					.data(data)
					.enter()
					.append("path") // this is the black vertical line to follow mouse
						.attr("class", "mouse-line")
						.style("stroke", "black")
						.style("stroke-width", "1px")
						.style("opacity", "0");
					
				var lines = document.getElementsByClassName('line');
		
				var mousePerLine = mouseG.selectAll('.mouse-per-line')
					.data(function(d){return d.value.LineType;})
					.enter()
					.append("g")
						.attr("class", "mouse-per-line");
		
				mousePerLine
					.append("circle")
						.attr("r", 7)
						.style("stroke",(d, i) => color(i))
						.style("fill", "none")
						.style("stroke-width", "1px")
						.style("opacity", "0");
		
				mousePerLine
					.append("text")
						.style('font', '14px sans-serif')
						.attr("transform", "translate(10,3)");
				
				var mouseout = function() {
					d3.select(".mouse-line")
							.style("opacity", "0");
					d3.selectAll(".mouse-per-line circle")
						.style("opacity", "0");
					d3.selectAll(".mouse-per-line text")
						.style("opacity", "0");
				}

				var mouseover = function() {
					d3.select(".mouse-line")
							.style("opacity", "1");
					d3.selectAll(".mouse-per-line circle")
						.style("opacity", "1");
					d3.selectAll(".mouse-per-line text")
						.style("opacity", "1");
				}

				var mousemove = function() {
					var mouse = d3.mouse(this);
					d3.select(".mouse-line")
						.attr("d", function() {
							var d = "M" + mouse[0] + "," + height;
							d += " " + mouse[0] + "," + 0;
							return d;
						});
		
					d3.selectAll(".mouse-per-line")
						.attr("transform", function(d, i) {
							// console.log(width/mouse[0])
							var xDate = x.invert(mouse[0]),
									bisect = d3.bisector(function(d) {return d.date;}).left;
									idx = bisect(xDate);
							// console.log(idx);
						
							var beginning = 0,
									end = lines[i].getTotalLength(),
									target = null;
		
							while(true) {
								target = Math.floor((beginning + end) / 2);
								pos = lines[i].getPointAtLength(target);
								if ((target === end || target === beginning) 
									&& pos.x !== mouse[0]) {
									break;
								}
								if (pos.x > mouse[0]) {
									end = target;
								}
								else if (pos.x < mouse[0]) {
									beginning = target;
								}
								else {
									break;
								} //position found
							}
								
							d3.select(this).select('text')
								.text(y.invert(pos.y).toFixed(2));
								
							return "translate(" + mouse[0] + "," + pos.y +")";
						});
				}

				mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
					.attr('width', width) // can't catch mouse events on a g element
					.attr('height', height)
					.attr('fill', 'none')
					.attr('pointer-events', 'all')
					.on('mouseout', mouseout)
					.on('mouseover', mouseover)//I HAVE NO IDEA WHAT'S HAPPENING BELOW
					.on('mousemove', mousemove);
			}
		};

		handler.initializeEventListeners();
		view.updateProvinceSelection(model.getDistinctValues('province'));
		d3.select('#consoleLogData').on('click', () => {console.log(model.data);});
		updateAll = handler.filterByProvinceMap;
	})