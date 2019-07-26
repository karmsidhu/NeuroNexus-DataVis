
class Bar extends Chart {
  constructor(svg, height, width, margin, trnsTime) {
    super(svg, height, width, margin, trnsTime);

    this._initializeHelperFunctions();
    this._initializeChart();
  }

  _initializeHelperFunctions() {
    this.xPosition = d3.scaleLinear()
      .domain([0, 1])
      .range([0, this.width - this.margin.left - this.margin.right])

    this.yPosition = d3.scaleBand()
      .domain([0, 1 , 2])
      .range([0, this.height - this.margin.top - this.margin.bottom])
      .padding(0.1);
  }

  _initializeChart() {
    this.svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio' , 'xMinYMin meet');
      // .attr('width', this.width)
      // .attr('height', this.height);

    this.xAxis = this.svg.append('g')
      .attr('transform', 
        `translate(${this.margin.left},${this.height - this.margin.top})`)
      .call(d3.axisBottom(this.xPosition));
    
    this.yAxis = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .call(d3.axisLeft(this.yPosition).tickSize(0));
    
    this.bars = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)

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
    this.data = data.sort((a, b) => d3.descending(a.value, b.value));
  }

  drawChart() {
    // const color = d3.scaleOrdinal()
    //   .domain(data)
    //   .range(d3.schemePaired);

    // Update Axis's
    this.yPosition.domain(this.data.map(d => d.key)); // Change d.key to d.name
    this.yAxis
      .call(d3.axisLeft(this.yPosition));
    
    this.xPosition
      .domain(d3.extent([0, d3.max(this.data, d => d.value)])).nice();
    this.xAxis
      .transition()
        .duration(this.transitionTime)
        .call(d3.axisBottom(this.xPosition));

    
    // Update bars
    this.bars.selectAll('*').remove();

    this.bars
      .selectAll('rect')
      .data(this.data)
      .enter()
      .append('rect')
        .attr("height", this.yPosition.bandwidth())
        .attr("x", this.xPosition(0))
        .attr("y", d => this.yPosition(d.key))
        .attr("width", this.xPosition(0))
        .attr('opacity', 0.6)
        .style('fill', (d, i) => this.color(i)); // Set color function

    this.bars
      .selectAll('rect')
      .transition()
      .duration(this.transitionTime)
        .attr('x', d => {return this.xPosition(0);})
        .attr('width', d => {return this.xPosition(d.value);});
    
    this.bars
      .selectAll('rect')
        .on('mouseover', this.handleMouseOver)
        .on('mousemove', this.handleMouseMove)
        .on('mouseleave', this.handleMouseLeave);
  }

  setOnBarMouseMove(onMouseMove) {
    this.handleMouseMove = onMouseMove;
  }

  setOnBarMouseOver(onMouseOver) {
    this.handleMouseOver = onMouseOver;
  }

  setOnBarMouseLeave(onMouseLeave) {
    this.handleMouseLeave = onMouseLeave;
  }
}
