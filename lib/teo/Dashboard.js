var width = 900;
var height = 500;

var active = d3.select(null);//keep track of active province

var chartSVG = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height)

var canadaMap = chartSVG.append("g").attr("id", "mapGroup");
var projection = d3.geoMercator()
                    .scale(450)
                    .translate([width*1.25, height*1.27]);

var path = d3.geoPath().projection(projection);

//Changes filter and the color of active province
function changeFilter(d){

  //do some kind of magic to change a filter of some sort
  //potentially just change text, and have an .onChange on the text itself?

  //check if selected provinces is already active, reset if true
  //otherwise remove active from current, and make selection active
  if(active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);
}

//reset selection
function reset(){
  active.classed("active", false);
  active = d3.select(null);
}

//load map data
d3.json("./data/canadaprovtopo.json")
.then(function(canada){

  //draw the provinces
  canadaMap.selectAll("path")
        .data(topojson.feature(canada, canada.objects.canadaprov).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "provBorders")
        .on("click", changeFilter);

    /*END OF MAP CREATION */
    /*START OF LINE CHART*/


 }).catch(function(error){ console.log("Something went Horribly Wrong!");})