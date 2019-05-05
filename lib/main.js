const DATAURL = 'https://gist.githubusercontent.com/karmsidhu'+
	'/d5b91316c786148084d3b9547cb3d015/raw/9eee233dcb56b01f5'+
	'ff3bd114c3614330cc1f69e/allprovinces.csv'

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
			},

			filterByProvince: () => {
				var index = view.provSelection.selectedIndex;
				if(index != 0) {
					var province = view.provSelection[index].text;
					model.filterData('province', province);
					model.groupBySum('program', 'value');
					view.updateProvinceSelection([province]);
					view.provSelection.selectedIndex = 1;
					console.log(model.data);
					console.log(model.pieData);
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
			}
		};

		handler.initializeEventListeners();
		view.updateProvinceSelection(model.getDistinctValues('province'));
	})
	.catch(function(exception){
		console.log(exception);
	});


