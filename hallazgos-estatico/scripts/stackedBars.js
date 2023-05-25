// Define your data
var data = [
  {
    year: '2020',
    values: [
      { category: 'Desiertos', value: 5287827, color: '#EA7875' },
      { category: 'Desiertos moderados', value: 8810486, color: '#EDAE70' },
      { category: 'No desiertos', value: 17931593, color: '#19A476' },
      { category: 'Sin información', value: 573192, color: '#EAEAEA' }
    ]
  },
  {
    year: '2022',
    values: [
      { category: 'Desiertos', value: 7025427, color: '#EA7875' },
      { category: 'Desiertos moderados', value: 8081085, color: '#EDAE70' },
      { category: 'No desiertos', value: 18203650, color: '#19A476' },
      { category: 'Sin información', value: 47689, color: '#EAEAEA' }
    ]
  }
];

// Calculate total for each year
data.forEach(function(yearData) {
  yearData.total = yearData.values.reduce(function(sum, d) { return sum + d.value; }, 0);
    yearData.values.forEach(function(d) { d.percentage = (d.value / yearData.total) * 100; });
});

console.log(data);

// Define the size of the SVG
var svg = d3.select("#bars")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "150px");

// What is the size of the SVG?
var svgDims = svg.node().getBoundingClientRect();
console.log(svgDims);

var marginLeft = 50;

// For each year, add a 'g' group element
var year = svg.selectAll("g")
  .data(data)
  .enter()
  .append("g")
  .attr("transform", function(d, i) { return "translate(" + marginLeft + "," + (i * 50 + 20) + ")"; });  // adjusted for increased space and added left margin

var widthScale = d3.scaleLinear()
    .domain([0, 100])
    .range([0, svgDims.width - marginLeft]);

var xPositionScale = d3.scaleLinear()
    .domain([0, 100])
    .range([marginLeft, svgDims.width - marginLeft]);


// For each group, add a 'rect' and a 'text' for each category
year.each(function(yearData) {

    console.log(yearData);

      var yearGroup = d3.select(this);
      var cumulativeWidth = 0;

    // Add year label
    yearGroup.append("text")
        .attr("x", "-10")  // position relative to the bars
        .attr("y", "25")
        .text(yearData.year)
        .style("fill", "black")
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "16px")
        .style("text-anchor", "end");  // aligned to the right, so it's right next to the bars


  yearData.values.forEach(function(valueData, index) {

    var currentBarWidth = widthScale(valueData.percentage);

    yearGroup.append("rect")
      .attr("width", currentBarWidth)
      .attr("height", 40)
      .attr("x", cumulativeWidth)
      .attr("opacity", 1)
      .style("fill", valueData.color)
      .on("mouseover", function(d){
        var element = d3.select(this);
            element.transition(1).attr("opacity", ".5");
      })
     .on("mouseout", function(d){
        var element = d3.select(this);
            element.transition(1).attr("opacity", "1");
      })

    // Skip last text element
    if(index !== yearData.values.length - 1) {
      yearGroup.append("text")
        .attr("x", cumulativeWidth)
        .attr("dx", 5)
        .attr("y", "25")  // adjust as needed for vertical alignment
        .text(valueData.percentage.toFixed(0) + '%') // display percentage to 1 decimal place
        .style("fill", "#fff")
        .style("font-family", "Roboto, sans-serif")
        .style("font-size", "14px")
        .style("font-weight", "bold");
    }

    cumulativeWidth += currentBarWidth;


  });
});