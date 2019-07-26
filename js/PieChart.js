
class Pie extends Chart {
  constructor(svg, height, width, margin = 10, innerRadius = 0) {
    super(svg, height, width, margin);

    this._initializeHelperFunctions(innerRadius);
    this._initializeChart();
  }

  _initializeHelperFunctions(innerRadius) {
    this.calcArcs = d3.pie()
      .sort((a, b) => d3.ascending(a.value, b.value))
      .value(data => data.value);

    this.calcArcPath = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(Math.min(this.width, this.height) / 2 - this.margin);

    const radius = Math.min(this.width, this.height) / 2 * 0.8;
    this.calcLabelPosition = d3.arc()
      .innerRadius(radius)
      .outerRadius(radius);
  }

  _initializeChart() {
    this.svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio' , 'xMinYMin meet')
      // .attr('width', this.width)
      // .attr('height', this.height)
      .attr("text-anchor", "middle");
    
    this.slices = this.svg.append('g')
      .attr('transform', `translate(${this.width/2},${this.height/2})`);

    this.handleMouseOver = function() {
      d3.select(this)
        .style("opacity", 1);
    };

    this.handleMouseLeave = function() {
      d3.select(this)
        .style("opacity", 0.6);
    };
  }

  setData(data) {
    this.data = this.calcArcs(data);
  }

  setInnerRadius(innerRadius) {
    this._initializeHelperFunctions(innerRadius);
  }

  drawChart() {
    this.slices.selectAll('*').remove();

    this.slices
      .selectAll('path')
      .data(this.data)
      .enter()
      .append('path')
        .attr('fill', (d, i) => this.color(i))
        .transition()
        .duration(this.transitionTime)
        .attrTween('d', d => {
          var i = d3.interpolate(d.startAngle, d.endAngle);
          return (t) => {
              d.endAngle = i(t);
          return this.calcArcPath(d);
        }});
    
    this.slices
      .selectAll('path')
        .attr('stroke', 'white')
        .attr('stroke-width', '2')
        .attr('opacity', 0.6);
    
    this.slices
      .selectAll('path')
        .on('mouseover', this.handleMouseOver)
        .on('mousemove', this.handleMouseMove)
        .on('mouseleave', this.handleMouseLeave);
  }

  setOnSliceMouseMove(onMouseMove) {
    this.handleMouseMove = onMouseMove;
  }

  setOnSliceMouseOver(onMouseOver) {
    this.handleMouseOver = onMouseOver;
  }

  setOnSliceMouseLeave(onMouseLeave) {
    this.handleMouseLeave = onMouseLeave;
  }
}
