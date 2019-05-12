var mapWidth = 900;
var mapHeight = 250;
var active = d3.select(null);//keep track of active province

var mapSVG = d3.select("#map")
  .append("svg")
  .attr("width", mapWidth)
  .attr("height", mapHeight)

var canadaMap = mapSVG.append("g").attr("id", "mapGroup");
var projection = d3.geoMercator()
                    .scale(450)
                    .translate([mapWidth*1.2, mapHeight*2.4]);

var path = d3.geoPath().projection(projection);

//Changes filter and the color of active province
function changeFilter(d){

  //check if selected provinces is already active
  //reset if true
  //otherwise remove active from current, and make selection active
  if(active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  //change the title (Potentially remove)
  //filterText.text(this.__data__.properties.name);

  //call updateChart from LineChart.js
  //this.__data__.properties.name == Province name (string)
  updateAll(this.__data__.properties.name)
}

//reset selection
function reset(){
  active.classed("active", false);
  active = d3.select(null);
}

//load map data
d3.json("https://gist.githubusercontent.com/TeoU2015/24b4cde7c29d527311f051f549ca987e/raw/80bc06c0e6407cd650d648ad9f661318c90f3075/canadaprovtopo.json")
.then(function(canada){
  //draw the provinces
  canadaMap.selectAll("path")
        .data(topojson.feature(canada, canada.objects.canadaprov).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "provBorders")
        .on("click", changeFilter);
 }).catch(function(error){ console.log("Something went Horribly Wrong!");})