var data = [
    {label: "Digital", value: 236, percent: 32.7},
    {label: "Impreso", value: 19, percent: 4.2},
    {label: "Radio", value: 295, percent: 55.5},
    {label: "TV", value: 68, percent: 7.},
];



// Sort data
data.sort(function(a, b) { return b.value - a.value; });

//const cont = document.querySelector('.chart-container');

//var chartWidth = +window.getComputedStyle(cont).width.slice(0,-2);

//var chartWidth = window.innerWidth >= 600 ? 600 : window.innerWidth; 

// Set up dimensions and scales
var margin = { top: 20, right: 30, bottom: 35, left: 90 },  // add margin to left and right
    width = chartWidth - margin.left - margin.right,
    height = data.length * (barHeight + barSpacing);  // total height based on the number of data points, the bar height, and the bar spacing

var y = d3.scaleLinear().domain([0, data.length]).range([0, data.length * (barHeight + barSpacing)]),
    x = d3.scaleLinear().range([0, width]).domain([0, 100]),
    barHeight = 30,
    barSpacing = 5;


var svg = d3.select(".tipo-medios").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


svg.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("y", function(d, i) { return i * (barHeight + barSpacing); })  // position each bar at the index times the sum of the bar height and bar spacing
    .attr("height", barHeight)
    .attr("x", 0)
    .attr("width", function(d) { return x(d.percent); })
    .style("fill", function(d, i) { return i === 0  ? "#266FB0" : "#a0c0e0"; }); // Lighter color for bars other than the first one;

// svg.selectAll(".text")   
//     .data(data)
//     .enter()
//     .append("text")
//     .attr("class","percent-label")
//     .attr("y", function(d, i) { return i * (barHeight + barSpacing) + barHeight / 2 + 4; })  // same y position as the bar, adjusted to align with the middle of the bar        .attr("x", function(d) { return x(d.percent) + 3; })
//     .attr("x", function(d) { return x(d.percent) + 3; })  // x position to the right of the end of the bar
//     .text(function(d) { return d.value + " medios"});

svg.selectAll(".category-label")   
    .data(data)
    .enter()
    .append("text")
    .attr("class","category-label")
    .attr("y", function(d, i) { return i * (barHeight + barSpacing) + barHeight / 2 + 4; })  // same y position as the bar, adjusted to align with the middle of the bar        .attr("x", -6)
    .attr("x", -6)  // x position to the left of the start of the bar 
    .attr("text-anchor", "end")
    .text(function(d) { return d.label; });

svg.selectAll(".percent")   
    .data(data)
    .enter()
    .append("text")
    .attr("class","percent")
    .attr("y", function(d, i) { return i * (barHeight + barSpacing) + barHeight / 2 + 4; })  // same y position as the bar, adjusted to align with the middle of the bar        .attr("x", function(d) { return x(d.percent) - 3; })
    .attr("x", function(d) { return x(d.percent) - 3; })  // x position over the right edge of the bar
    .attr("text-anchor", "end")
    .text(function(d) { 
        //console.log(chartWidth);
        if ((chartWidth <= 400) & (d.percent <= 12)) {
            return "" 
        }
        else if (d.percent >= 5) {
            return d.percent.toFixed(0) + '%';
        }
   });