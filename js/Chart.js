class Chart {
  constructor(svg, height = 500, width = 500, margin, trnsTime = 0) {
    if (!svg) throw new Error('Base SVG reference not provided');

    this.svg = svg;
    this.height = height;
    this.width = width;
    this.margin = margin || {top: 30, bottom: 30, left: 30, right: 30};
    this.transitionTime = trnsTime;
    this.title = 'Title not set';
    this.color = d3.scaleOrdinal().range(d3.schemePaired);
  }

  _initializeChart() {
    throw new Error("Abstract Method Not Defined")
  }

  setData(data) {
    this.data = data;
  }

  setTitle(title) {
    this.title = title;
  }

  setTransitionTime(time) {
    this.transitionTime = time;
  }

  setColors(colorArray) {
    this.color = this.color.range(colorArray);
  }

  drawChart() {
    throw new Error("Abstract Method Not Defined")
  }

  clearSVG() {
    this.svg.selectAll('*').remove();
  }
}
