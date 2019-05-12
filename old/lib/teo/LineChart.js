// Set the dimensions of the canvas / graph
var lineChartMargin = {top: 30, right: 20, bottom: 30, left: 50},
    lineChartWidth = 600 - lineChartMargin.left - lineChartMargin.right,
    lineChartHeight = 270 - lineChartMargin.top - lineChartMargin.bottom;

// Parse the date / time
var parseDate = d3.timeParse("%Y-%m-%d");
var formatYear = d3.timeFormat("%Y");

// A color scale: one color for each group (copy pasted from tutorials)
var myColor = d3.scaleOrdinal(d3.schemeSet2);

// Set the ranges
var x = d3.scaleTime().range([0, lineChartWidth]);

var y = d3.scaleLinear().range([lineChartHeight, 0]);

//axis calls
var xAxisCall = d3.axisBottom(x)
var yAxisCall = d3.axisLeft(y)

// Define the line
var valueline = d3.line()
    .x(function(d) {return x(d.date); })
    .y(function(d) {return y(d.value); });

// Adds the svg canvas
var chartSVG = d3.select("#lineChart")
    .append("svg")
        .attr("width", lineChartWidth + lineChartMargin.left + lineChartMargin.right)
        .attr("height", lineChartHeight + lineChartMargin.top + lineChartMargin.bottom)
    .append("g")
        .attr("transform", 
              "translate(" + lineChartMargin.left + "," + lineChartMargin.top + ")");

var filterText = d3.select("#title");
var dropDown = d3.select("#selectButton")
var updateLineChart = null;

// Get the data
d3.csv("./data/AllProvinces.csv", d => {
    return{
        province: d.Province,
		program: d.Program,
		pType: d['Program Type'],
		gvtMinistry: d['Government Ministry (At Present)'],
		pComponent: d['Program Component'],
		units: d.Units,
		date: (parseDate(d["Fiscal Year end date"])),
		value: +d.value
    };
})
.then(function(csv){

    //Transform flat data / create nested data structure
    var nestedCsv = d3.nest()
        .key(function(d){
            return d.province;
        })
        .rollup(function(v){
            var dateRange = d3.extent(v, function(d) { // get date range for x axis
                return d.date;
            })
            var max = d3.max(v, function(d){ //get max for y axis range
                return d.value
            })
            var Program = d3.nest().key(function(d){ //get name of program
                return d.program
            })
            var LineType = d3.nest().key(function(d){ //get name of program
                return d.program+d.pComponent;
            })
            .entries(v);
            
            return {max:max, Program:Program, dateRange:dateRange, LineType:LineType};
            })
    .entries(csv)

    console.log(nestedCsv);
    //Creation of Drop-down filter
    //add options to select
    dropDown
        .append("select")
        .attr("id", "selectionGroup")
        .selectAll('option')
        .data(nestedCsv)//using list of provinces
        .enter()
        .append('option')
        .text(function (d) {return d.key;})//make text with them
        .attr("value", function (d) {return d.key;})

    //filter with nested structure
    var filteredNest = nestedCsv.filter(function(d){
        return d.key == nestedCsv[0].key;
    })

    // Scale the range of the data for Axis creation
    // get initial x and y ranges for axis
    x.domain(filteredNest[0].value.dateRange);
    y.domain([0, filteredNest[0].value.max]);

    //Add the X Axis
    chartSVG.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + lineChartHeight + ")")//not sure why the x axis requires a height adjustment, should work fine with margins...
    .call(d3.axisBottom(x));

    // Add the Y Axis
    chartSVG.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y));

    //function for make initial graph
    //'filter' is just the province name
    var initialGraph = function(filter){

        //get that filtered data
        filteredNest = nestedCsv.filter(function(d){return d.key == filter;})

        //attach the data and greate group for all paths
        var selectProvGroup = chartSVG.selectAll(".provinceGroups")
            .data(filteredNest, function(d){return d;})
            .enter()
            .append("g")
            .attr("class", "provinceGroups");

        //attach individual programs to paths
        var initialPath = selectProvGroup.selectAll(".line")
            .data(function(d){return d.value.LineType;})
            .enter()
            .append("path")

        // creates the line and adds color
        initialPath.attr("d", function(d){
                return valueline(d.values);
            })
            .attr("class", "line")
            .style('stroke', (d, i) => myColor(i));
            
    }

    //Make the initial graph
    initialGraph("Alberta");

    //function to update the chart
    //set as global variable
    //Due to being a prototype and the troubles involved with using .data
    //this simply wipes the old lines and adds the new.
    //Axis's are appropriately handled however.
    updateLineChart = function(filter){

        //delete ALL THE LINES!
        chartSVG.selectAll(".provinceGroups").remove();

        //re-create the whole group as above, but with new data.
        filteredNest = nestedCsv.filter(function(d){return d.key == filter;})
        var selectProvGroup = chartSVG.selectAll(".provinceGroups")
            .data(filteredNest)
            .enter()
            .append("g")
            .attr("class", "provinceGroups");

        //update axis normally
        //Important that this is done before plotting lines
        x.domain(filteredNest[0].value.dateRange);
        y.domain([0, filteredNest[0].value.max]);
        yAxisCall.scale(y);
        xAxisCall.scale(x);

        //update y axis
        d3.select(".y")
            .transition()//placeholder, no transistions yet
            .call(yAxisCall);
        d3.select(".x axis")
            .call(xAxisCall);
      
        //finally draw the new lines
        var newPaths = selectProvGroup.selectAll(".line")
            .data(function(d){return d.value.LineType;})
            .enter()
            .append("path")
      
        newPaths.attr("d", function(d){
                return valueline(d.values);
            })
            .attr("class", "line")
            .style('stroke', (d, i) => myColor(i));        
    }
      
    //add filter functionality on the dropdown menu
    dropDown.on('change', function(){
        var newProv = d3.select(this)
            .select("select")
            .property("value");

        //call update
        updateLineChart(newProv)
    });

    var mouseG = chartSVG.append("g")
      .attr("class", "mouse-over-effects");

    mouseG
        .data(filteredNest)
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

    mousePerLine.append("circle")
      .attr("r", 7)
      .style("stroke",(d, i) => myColor(i))
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("opacity", "0");

    mousePerLine.append("text")
      .attr("transform", "translate(10,3)");

    mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', width) // can't catch mouse events on a g element
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() { // on mouse out hide line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "0");
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
      })//I HAVE NO IDEA WHAT'S HAPPENING BELOW
      .on('mousemove', function() { // mouse moving over canvas
        var mouse = d3.mouse(this);
        d3.select(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + height;
            d += " " + mouse[0] + "," + 0;
            return d;
          });

        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {
            console.log(width/mouse[0])
            var xDate = x.invert(mouse[0]),
                bisect = d3.bisector(function(d) { return d.date; }).left;
                idx = bisect(xDate);
                console.log(idx);
            
            var beginning = 0,
                end = lines[i].getTotalLength(),
                target = null;

            while (true){
              target = Math.floor((beginning + end) / 2);
              pos = lines[i].getPointAtLength(target);
              if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                  break;
              }
              if (pos.x > mouse[0])      end = target;
              else if (pos.x < mouse[0]) beginning = target;
              else break; //position found
            }
            
            d3.select(this).select('text')
              .text(y.invert(pos.y).toFixed(2));
              
            return "translate(" + mouse[0] + "," + pos.y +")";
          });
      });
      
})
.catch(function(error){console.log("Something has gone horribly wrong in the line chart!")})

