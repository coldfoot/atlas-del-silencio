var data = {
  "twitter": [
    {"label": "Sí conozco", "percent": 7.9},
    {"label": "No conozco", "percent": 74.86},
    {"label": "No existen", "percent": 13.6},
    {"label": "No contestó", "percent": 3.7}
  ],
  "facebook": [
    {"label": "Sí conozco", "percent": 36.48},
    {"label": "No conozco", "percent": 55.08},
    {"label": "No existen", "percent": 6.84},
    {"label": "No contestó", "percent": 1.6}
  ],
  "instagram": [
    {"label": "Sí conozco", "percent": 46.3},
    {"label": "No conozco", "percent": 45.0},
    {"label": "No existen", "percent": 6.5},
    {"label": "No contestó", "percent": 2.2}
  ],
  "youtube": [
    {"label": "Sí conozco", "percent": 7.9},
    {"label": "No conozco", "percent": 74.9},
    {"label": "No existen", "percent": 13.6},
    {"label": "No contestó", "percent": 3.7}
  ]
}


//var chartWidth = window.innerWidth >= 600 ? 600 : window.innerWidth; 
//const cont = document.querySelector('.chart-container');

//var chartWidth = +window.getComputedStyle(cont).width.slice(0,-2);

var barHeight = 30;
var barSpacing = 5;

var margin = { top: 20, right: 30, bottom: 35, left: 90 };

var x = d3.scaleLinear().range([0, chartWidth - margin.left - margin.right]).domain([0, 100]);

var mainDiv = d3.select(".conoce-medios-redes-sociales");

Object.keys(data).forEach(function(medio) {
  var dataMedio = data[medio];
  var height = dataMedio.length * (barHeight + barSpacing);

  var y = d3.scaleLinear().domain([0, dataMedio.length]).range([0, height]);

  var divMedio = mainDiv.append("div")
    .attr("class", "sub-div")
    .attr("id", medio);


var htmlString = "<i>¿Conoces medios en <strong>" + medio.charAt(0).toUpperCase() + medio.slice(1) + "</strong>?</i>";
divMedio.append("p")
    .html(htmlString);



  var svg = divMedio.append("svg")
    .attr("width", chartWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.selectAll(".bar")
    .data(dataMedio)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("y", function(d, i) { return y(i); })
    .attr("height", barHeight)
    .attr("x", 0)
    .attr("width", function(d) { return x(d.percent); })
    .style("fill", "#BFA9E2");

  svg.selectAll(".category-label")   
    .data(dataMedio)
    .enter()
    .append("text")
    .attr("class","category-label")
    .attr("y", function(d, i) { return y(i) + barHeight / 2 + 4; })
    .attr("x", -6)
    .attr("text-anchor", "end")
    .text(function(d) { return d.label; });

  svg.selectAll(".percent")   
    .data(dataMedio)
    .enter()
    .append("text")
    .attr("class","percent")
    .attr("y", function(d, i) { return y(i) + barHeight / 2 + 4; })
    .attr("x", function(d) { return x(d.percent) - 3; })
    .attr("text-anchor", "end")
    .text(function(d) { 
      if ((chartWidth <= 400) & (d.percent <= 12)) {
        return "";
      }
      else if (d.percent >= 5) {
        return d.percent.toFixed(0) + '%';
      }
    });
});
