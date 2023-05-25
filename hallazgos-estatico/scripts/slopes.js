function drawChart(dataFileName, legendFileName, color) {

  // Remove old svg
  d3.select("#slopes").select("svg").remove();

  // Remove old legend
  d3.select("img.slope-legend").remove();

  // Load new legend
  d3.select(".slope-legend-container")
    .append("img")
    .attr("src", legendFileName)
    .attr("class", "slope-legend")
    .attr("width", 300);

  var charWidth = window.innerWidth >= 600 ? 600 : window.innerWidth; 

  // Set up dimensions and scales
  var margin = { top: 20, right: 100, bottom: 30, left: 100 },  // add margin to left and right
      width = charWidth - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

  var x = d3.scalePoint().domain(["2020", "2022"]).range([0, width]),
      y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

 // Adds new chart
  var svg = d3.select("#slopes")
    .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "slopes")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Draw axes
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "axis")
    .call(d3.axisBottom(x).tickSizeOuter(0));

  // svg.append("g")
  //   .attr("class", "axis")
  //   .call(d3.axisLeft(y).tickSize(-width).tickSizeOuter(0).tickValues([0, 1]).tickFormat((d) => d * 100 + "%"))
  //   .selectAll(".tick line")
  //     .attr("stroke", "#d3d3d3")
  //     .attr("stroke-dasharray", "2,2");

  // svg.append("g")
  //     .attr("transform", "translate(" + width + ",0)")
  //     .call(d3.axisRight(y).ticks(5).tickSize(-width).tickFormat(''))
  //     .selectAll(".tick line")
  //     .attr("stroke", "#d3d3d3")
  //     .attr("stroke-dasharray", "2,2");

// Add Y axis
svg.append("g")
      .attr("transform", "translate(" + width + ",0)")
      .call(d3.axisRight(y).ticks(0).tickSize(0).tickFormat(''))


// Add Y axis
svg.append("g")
      .attr("transform", "translate(" - width + ",0)")
      .call(d3.axisLeft(y).ticks(0).tickSize(0).tickFormat(''))

// // Add Y axis line
// svg.append("g")
//   .attr("transform", "translate(" + width + ",0)")
//   .call(d3.axisRight(y).ticks(0));

  // Read the data from CSV
  d3.csv(dataFileName).then(function(data) {
    // Convert data types
    data.forEach(function(d) {
      d.year2020 = +d.year2020;
      d.year2022 = +d.year2022;
    });

    console.log(data);

    // Calculate the domains for the y scale
    var yMin = d3.min(data, function(d) { return Math.min(d.year2020, d.year2022); });
    var yMax = d3.max(data, function(d) { return Math.max(d.year2020, d.year2022); });

    // Add lines
    var lines = svg.selectAll(".line")
      .data(data)
      .enter()
      .append("line")
      .attr("class", function(d) { return d.year2022 > d.year2020 ? "line" : "line non-increasing"; })
      .attr("x1", function(d) { return x("2020"); })
      .attr("y1", function(d) { return y(d.year2020); })
      .attr("x2", function(d) { return x("2022"); })
      .attr("y2", function(d) { return y(d.year2022); })
      .attr("stroke", color);

    if (dataFileName.includes("percentageDesiertos.csv")) {

      // Add state names – DY varies according to file
      var text = svg.selectAll(".text")
        .data(data)
        .enter()
        .append("text")
        .attr("x", function(d) { return d.year2022 > d.year2020 ? x("2022") + 10 : x("2020") - 10; })
        .attr("y", function(d) { return d.year2022 > d.year2020 ? y(d.year2022) : y(d.year2020); })
        .attr("dy", function(d) { return ['Amazonas', 'Barinas'].includes(d.state) ? -6 : 0;  })
        .text(function(d) { return d.state; })
        .attr("text-anchor", function(d) { return d.year2022 > d.year2020 ? "start" : "end"; })
        .attr("font-weight", function(d) { return d.year2022 > d.year2020 ? "bolder" : "lighter"; })
        .attr("alignment-baseline", "middle")
        .attr("fill", color)
        .attr("font-size", "10px")
        .attr("font-family", "sans-serif");

    }

    else if (dataFileName.includes("percentageDesiertosModerados.csv")) {

    var text = svg.selectAll(".text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", function(d) { return d.year2022 > d.year2020 ? x("2022") + 10 : x("2020") - 10; })
      .attr("y", function(d) { return d.year2022 > d.year2020 ? y(d.year2022) : y(d.year2020); })
      .attr("dy", function(d) { 
        if (d.state == 'Táchira') { return -6; }
        else if (d.state == 'Barinas') { return 0; }
        else if (d.state == 'Zulia') { return -5; }
        else if (d.state == 'Vargas') { return -8; }
        else if (d.state == 'Nueva Esparta') { return -5; }
        else if (d.state == 'Sucre') { return 6; }

      })
      .text(function(d) { return d.state; })
      .attr("text-anchor", function(d) { return d.year2022 > d.year2020 ? "start" : "end"; })
      .attr("font-weight", function(d) { return d.year2022 > d.year2020 ? "bolder" : "lighter"; })
      .attr("alignment-baseline", "middle")
      .attr("fill", color)
      .attr("font-size", "10px")
      .attr("font-family", "sans-serif");
    }

    else if (dataFileName.includes("percentageNoDesiertos.csv")){

      var text = svg.selectAll(".text")
      .data(data)
      .enter()
      .append("text")
      .attr("x", function(d) { return d.year2022 > d.year2020 ? x("2022") + 10 : x("2020") - 10; })
      .attr("y", function(d) { return d.year2022 > d.year2020 ? y(d.year2022) : y(d.year2020); })
      .attr("dy", function(d) { 
        if (d.state == 'Mérida') { return 3; }
        else if (d.state == 'Anzoátegui') { return -4; }
        else if (d.state == 'Portuguesa') { return 4; }
        else if (d.state == 'Guárico') { return 3; }
        else if (d.state == 'Nueva Esparta') { return -5; }
        else if (d.state == 'Apure') { return 5; }
        else if (d.state == 'Cojedes') { return 8; }
        else if (d.state == 'Vargas') { return -10; }


      })
      .text(function(d) { return d.state; })
      .attr("text-anchor", function(d) { return d.year2022 > d.year2020 ? "start" : "end"; })
      .attr("font-weight", function(d) { return d.year2022 > d.year2020 ? "bolder" : "lighter"; })
      .attr("alignment-baseline", "middle")
      .attr("fill", color)
      .attr("font-size", "10px")
      .attr("font-family", "sans-serif");

    }

      // Select tooltip
      var tooltip = d3.select("#tooltip");

      // Add mouse events
      lines.on("mouseover", function(event, d) {
        console.log(event, d);
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html("State: " + d.state + "<br/>2020: " + d.year2020 + "<br/>2022: " + d.year2022)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });


  });

}

// Button click event handlers
var desiertosButton = document.getElementById("Desiertos");
desiertosButton.addEventListener("click", function(e){ 
    drawChart("./data/percentageDesiertos.csv",
    "./imgs/legends/slope-legend-desiertos@2x.png",
     "#EA7875"); 
    document.querySelector(".category-selected").classList.remove("category-selected");
    e.target.classList.add("category-selected");
});

var desiertosModeradosButton = document.getElementById("DesiertosModerados");
desiertosModeradosButton.addEventListener("click", function(e) { 
    drawChart("./data/percentageDesiertosModerados.csv", 
                "./imgs/legends/slope-legend-desiertos-moderados@2x.png",
                "#EDAE70");
    document.querySelector(".category-selected").classList.remove("category-selected");
    e.target.classList.add("category-selected");

});

var noDesiertosButton = document.getElementById("NoDesiertos");
noDesiertosButton.addEventListener("click", function(e) {
 drawChart("./percentageNoDesiertos.csv",
    "./imgs/legends/slope-legend-no-desiertos@2x.png",
    "#19A476"); 
    document.querySelector(".category-selected").classList.remove("category-selected");
    e.target.classList.add("category-selected");
});

// Initially draw the chart with the first data file
desiertosButton.classList.add("category-selected");
drawChart("./data/percentageDesiertos.csv", "./imgs/legends/slope-legend-desiertos@2x.png", "#EA7875");