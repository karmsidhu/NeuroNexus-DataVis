class Line extends Chart {
  constructor(svg, height, width, margin, trnsTime) {
    super(svg, height, width, margin, trnsTime);

    this._initializeHelperFunctions();
    this._initializeChart();
  }

  _initializeHelperFunctions() {
    this.dateParse = d3.timeParse('%Y');

    this.xPosition = d3.scaleTime()
      .domain([0, 1])
      .range([0, this.width - this.margin.left - this.margin.right]);

    this.yPosition = d3.scaleLinear()
      .domain([0, 1])
      .range([0, this.height - this.margin.top - this.margin.bottom]);
  }

  _initializeChart() {
    // Make SVG Responsive
    this.svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio' , 'xMinYMin meet');

    // X-Axis Group
    this.xAxis = this.svg.append('g')
      .attr('transform', 
        `translate(${this.margin.left},${this.height - this.margin.top})`)
      .call(d3.axisBottom(this.xPosition));
    
    // Y-Axis Group
    this.yAxis = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`)
      .call(d3.axisLeft(this.yPosition).tickSize(0));
    
    // Lines Group
    this.lines = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Legend Group
    this.legend = this.svg.append('g')
      .attr('transform', `translate(${this.width-this.margin.right+20},
        ${this.margin.top+10})`);

    // Events Group - Layer ontop of the plot to draw components on
    this.plotEvents = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Events Group - Vertical Line indicating mouse position
    this.plotEvents
      .append('path')
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .style('opacity', 0);

    // Events Group - SVG to trigger events
    this.plotEvents
      .append('svg:rect')
        .attr('width', this.width - this.margin.left)
        .attr('height', this.height - this.margin.top)
        .attr('pointer-events', 'all')
        .attr('fill', 'none');

    // Default Mouse Events Below
    this.handleMouseOver = () => {
      this.plotEvents
        .select('path')
          .style('opacity', 1)

      this.plotEvents
        .selectAll('circle')
          .style("opacity", 1);

      this.plotEvents
        .selectAll('text')
        .style('opacity', 1);
    };

    this.handleMouseLeave = () => {
      this.plotEvents
        .select('path')
          .style('opacity', 0)

      this.plotEvents
        .selectAll('circle')
          .style("opacity", 0);

      this.plotEvents
        .selectAll('text')
          .style('opacity', 0);
    };

    this.handleMouseMove = () => {
      const dateFormat = d3.timeFormat('%Y'),
            [min, max] = this.xPosition.domain().map(d => dateFormat(d)),
            yearList = d3.range(min, parseInt(max) + 1)
              .map(d => this.dateParse(d)),
            mouseX = this.xPosition.invert(d3.mouse(d3.event.target)[0]),
            index = d3.bisectLeft(yearList, mouseX) - 1,
            xPos = this.xPosition(yearList[index]) + 0.5, 
              // 0.5 to match xAxis tick translation done by d3
            bisect = d3.bisector(d => this.dateParse(d.year)).left; 

      // Vertical Line Position
      this.plotEvents
        .select('path')
          .attr('d', `M${xPos} ${this.height - 
            this.margin.bottom - this.margin.bottom} ${xPos} ${0}`);
      
      // Circle Indicator and Annotation Position
      this.plotEvents
        .selectAll('g')
          .attr('transform', (d, nodeIndex, nodes) => {
            const targetIndex = bisect(d.value, mouseX) - 1, 
                  i = targetIndex < 0 ? 0: targetIndex,
                  y = this.yPosition(d.value[i].value),
                  x = this.xPosition(this.dateParse(d.value[i].year));

            d3.select(nodes[nodeIndex])
              .select('text')
                .text(d.value[i].value.toFixed(2));

            return `translate(${x},${y})`;
          });
      
      // Legend Value Update
      this.legend
        .selectAll('text')
          .text((d) => {
            const targetIndex = bisect(d.value, mouseX) - 1, 
                  i = targetIndex < 0 ? 0: targetIndex;

            return `${d.value[i].value.toFixed(2)} Units: ${d.key}`;
          });
    }
  }

  setData(data) {
    this.data = data.map(d => {
      [d.minYear, d.maxYear] = d3.extent(d.value, d => this.dateParse(d.year));
      return d;
    });
  }

  drawChart() {
    // Update X and Y Axis
    this.yPosition
      .domain([d3.max(this.data, d => d3.max(d.value, d => d.value)), 0])
      .nice();
    this.yAxis
      .call(d3.axisLeft(this.yPosition));

    this.xPosition
      .domain([d3.min(this.data, d => d.minYear), 
        d3.max(this.data, d => d.maxYear)])
      .nice();
    this.xAxis
      .transition()
      .duration(this.transitionTime)
        .call(
          d3.axisBottom(this.xPosition)
            .ticks(d3.timeYear.every(1))
            .tickFormat(d3.timeFormat('%Y'))
        );

    const calcLines = d3.line()
      .x(d => this.xPosition(this.dateParse(d.year)))
      .y(d => this.yPosition(d.value));

    // Update lines
    this.lines.selectAll('*').remove();

    this.lines
      .selectAll('path')
      .data(this.data)
      .enter()
      .append('path')
        .attr('d', d => calcLines(d.value))
        .attr('fill', 'none')
        .attr('stroke', (d, i) => this.color(i))
        .attr('stroke-width', 4)
        .style('opacity', 0.6)
        .attr('stroke-dasharray', function() {return this.getTotalLength()})
        .attr('stroke-dashoffset', function() {return this.getTotalLength()})
      .transition()
      .duration(this.transitionTime)
        .attr('stroke-dashoffset', 1);

    // Legend Positioning and Text
    this.legend
      .selectAll('text')
      .data(this.data)
      .enter()
      .append('text')
        .text(d => d.key)
        .attr('transform', (d, i) => `translate(${0},${i*20})`)

    // Legend Color References
    this.legend
      .selectAll('rect')
      .data(this.data)
      .enter()
      .append('rect')
        .attr('x', -10)
        .attr('y', -10)
        .attr('width', 10)  
        .attr('height', 10)
        .attr('transform', (d, i) => `translate(${-5},${i*20})`)
        .attr('fill', (d, i) => this.color(i))
        .style('opacity', 0.6);

    // Circle and Text Elements for Plot Events
    const plotMarkers = this.plotEvents.selectAll('g')
      .data(this.data)
      .enter()
      .append('g')
        .attr('pointer-events', 'none');

    plotMarkers
      .append('circle')
        .attr("r", 7)
        .style("stroke",(d, i) => this.color(i))
        .style("fill", "none")
        .style("stroke-width", 1)
        .style("opacity", 0);

    plotMarkers
      .append("text")
        .style('font', '14px sans-serif')
        .attr("transform", "translate(10,3)");

    // Set Event Listeners on Transparent SVG Rectangle over the Plot
    this.plotEvents
      .select('rect')
        .on('mouseover', this.handleMouseOver)
        .on('mousemove', this.handleMouseMove)
        .on('mouseleave',this.handleMouseLeave);
  }

  setOnPlotMouseMove(onMouseMove) {
    this.handleMouseMove = onMouseMove;
  }

  setOnPlotMouseOver(onMouseOver) {
    this.handleMouseOver = onMouseOver;
  }

  setOnPlotLeave(onMouseLeave) {
    this.handleMouseLeave = onMouseLeave;
  }
}