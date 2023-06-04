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

    // Read the data from CSV
    d3.csv(dataFileName).then(function(data) {
      
      // Convert data types
      data.forEach(function(d) {
        d.year2020 = +d.year2020;
        d.year2022 = +d.year2022;
      });


    function highlightLine(e) {

      let d = e.target.__data__;

      if (!d.line) {

        d = {
          line: d
        }
      }



      

       // All other lines are lighter
       var allLinesCssSelector = ".line";
       var allLines = d3.selectAll(allLinesCssSelector);

       allLines.attr("opacity", .1)

       // This line, darker
       var thisLineCssSelector = "#line-" + d.line.idState;
       var thisLine = d3.select(thisLineCssSelector);

       thisLine.attr("opacity", 1);

       // Specific value labels visible
       d3.select("#value-label-" + d.line.idState + "-2020")
        .attr("visibility", "visible");

       d3.selectAll("#value-label-" + d.line.idState + "-2022")
        .attr("visibility", "visible");

      // All state labels, lighter
      d3.selectAll(".state-name-label")
        .attr("opacity", .1);

      // This state label, darker
      d3.select("#" + d.line.idState + "-label")
        .attr("opacity", 1)
        .attr("font-size", "14px");

    }

    function removeLineHighlight() {

       // All lines darker
       var allLinesCssSelector = ".line";
       var allLines = d3.selectAll(allLinesCssSelector);
       allLines.attr("opacity", 1)

      // All value labels invisible
      d3.selectAll(".value-label-2020")
        .attr("visibility", "hidden");

      d3.selectAll(".value-label-2022")
        .attr("visibility", "hidden");

      // All state labels darker
      d3.selectAll(".state-name-label")
        .attr("opacity", 1)
        .attr("font-size", "10px");

    }

    const cont = document.querySelector('.chart-slopes');

    var chartWidth = +window.getComputedStyle(cont).width.slice(0,-2);

    //var charWidth = window.innerWidth >= 600 ? 600 : window.innerWidth; 

    // Set up dimensions and scales
    var margin = { top: 20, right: 110, bottom: 35, left: 110 },  // add margin to left and right
        width = chartWidth - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;


    // Scales
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

      // Add botom axis
      svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x).tickSizeOuter(0).tickPadding(16));

      // Add Y axis right
      svg.append("g")
            .attr("transform", "translate(" + width + ",0)")
            .call(d3.axisRight(y).ticks(0).tickSize(0).tickFormat(''))


      // Add Y axis left
      svg.append("g")
            //.attr("transform", "translate(" - width + ",0)")
            .call(d3.axisLeft(y).ticks(0).tickSize(0).tickFormat(''))


      // Add lines
      var lines = svg.append("g")
        .attr("class", "line-wrapper")
        .selectAll(".line")
        .data(data)
        .enter()
        .append("line")
        .attr("class", function(d) { return d.year2022 > d.year2020 ? "line" : "line non-increasing"; })
        .attr("id", d => "line-" + d.idState)
        .attr("x1", function(d) { return x("2020"); })
        .attr("y1", function(d) { return y(d.year2020); })
        .attr("x2", function(d) { return x("2022"); })
        .attr("y2", function(d) { return y(d.year2022); })
        .attr("stroke", color);

      // For each line, add the corresponding 2020 and 2022 value slightly above the axis
      var valueLabels2020 = svg.append("g")
        .attr("class", "value-label-wrapper-2020")
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label-2020")
        .attr("id", d => "value-label-" + d.idState + '-2020')
        .attr("x", x("2020"))
        .attr("dx", 5)
        .attr("y", d => y(d.year2020))
        .attr("dy", d => d.year2020 >= d.year2022 ? - 5 : 10)
        .attr("fill", "#1b1b1b")
        .attr("font-size", "12px")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("visibility", "hidden")
        .text(d => Math.round(d.year2020) + "%");

      // For each line, add the corresponding 2020 and 2022 value slightly above the axis
      var valueLabels2020 = svg.append("g")
        .attr("class", "value-label-wrapper-2022")
        .selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "value-label-2022")
        .attr("id", d => "value-label-" + d.idState + '-2022')
        .text(d => Math.round(d.year2022) + "%")
        .attr("x", x("2022"))
        .attr("dx", -25)
        .attr("y", d => y(d.year2022))
        .attr("dy", d => d.year2020 < d.year2022 ? - 5 : 10)
        .attr("fill", "#1b1b1b")
        .attr("font-size", "12px")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "bold")
        .attr("visibility", "hidden")
        .text(d => Math.round(d.year2022) + "%");


      // We will add a voronoi tesselation to facilitate the tooltip selection

      // Number of points per line
      var numPoints = 10;

      // Compute an array of points for each line
      var points = [];
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        var y1 = y(d.year2020);
        var y2 = y(d.year2022);
        var x1 = x("2020");
        var x2 = x("2022");

        for (var j = 0; j <= numPoints; j++) {
          var t = j / numPoints;
          var xPoint = x1 + t * (x2 - x1);
          var yPoint = y1 + t * (y2 - y1);
          points.push({x: xPoint, y: yPoint, line: d});
        }
      }


      // Create Voronoi tessellation
      var voronoi = d3.Delaunay.from(points, d => d.x, d => d.y).voronoi([0, 0, width, height]);


      svg.append("g")
      .attr("class", "voronoi-wrapper")
      .selectAll("path")
      .data(points)
      .join("path")
        .attr("opacity", 0.5)
        .attr("stroke", "#ff1493") // Hide overlay
        .attr("fill", "none")
          .style("visibility", "hidden")
        .style("pointer-events", "all")
        .attr("d", (d,i) => voronoi.renderCell(i))
      ;
      d3.selectAll('.voronoi-wrapper path')
        .on("click", function(d){
          removeLineHighlight(d);
          highlightLine(d);
        })
        .on("mouseover", function(d){

          highlightLine(d);

        })
        .on("mouseout", function(d){

          removeLineHighlight(d);

        })
      ;

      if (dataFileName.includes("percentageDesiertos.csv")) {

        // Add state names – DY varies according to file
        var text = svg.selectAll(".text")
          .append("g")
          .attr("class", "state-name-label-wrapper")
          .data(data)
          .enter()
          .append("text")
          .attr("class", "state-name-label")
          .attr("id", d => d.idState + "-label")
          .attr("x", function(d) { return d.year2022 > d.year2020 ? x("2022") + 10 : x("2020") - 10; })
          .attr("y", function(d) { return d.year2022 > d.year2020 ? y(d.year2022) : y(d.year2020); })
          .attr("dy", function(d) { return ['Amazonas', 'Barinas'].includes(d.state) ? -6 : 0;  })
          .text(function(d) { return d.state; })
          .attr("text-anchor", function(d) { return d.year2022 > d.year2020 ? "start" : "end"; })
          .attr("font-weight", function(d) { return d.year2022 > d.year2020 ? "bolder" : "light"; })
          .attr("alignment-baseline", "middle")
          .attr("fill", color)
          .attr("font-size", "10px")
          .attr("font-family", "sans-serif")
          .on("click", function(e){

              /*
              var dd = {
                  "line": d
              }*/

              removeLineHighlight(e);
              highlightLine(e);
            })
          .on("mouseover", function(e){

              /*var dd = {
                  "line": d
              }*/

            highlightLine(e);
          })
          .on("mouseout", function(e){

              /*var dd = {
                  "line": d
              }*/

              removeLineHighlight(e);
            });
          }

      else if (dataFileName.includes("percentageDesiertosModerados.csv")) {

      var text = svg.selectAll(".text")
        .append("g")
        .attr("class", "state-name-label-wrapper")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "state-name-label")
        .attr("id", d => d.idState + "-label")
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
        .attr("font-weight", function(d) { return d.year2022 > d.year2020 ? "bolder" : "light"; })
        .attr("alignment-baseline", "middle")
        .attr("fill", color)
        .attr("font-size", "10px")
        .attr("font-family", "sans-serif")
        .on("click", function(d){

            /*var dd = {
                "line": d
            }*/

            removeLineHighlight(d);
            highlightLine(d);
          })
        .on("mouseover", function(d){

            /*var dd = {
                "line": d
            }*/

            highlightLine(d);
          })
        .on("mouseout", function(d){

            /*
            var dd = {
                "line": d
            }*/

            removeLineHighlight(d);
          });

        }


      else if (dataFileName.includes("percentageNoDesiertos.csv")){

        var text = svg.selectAll(".text")
        .append("g")
        .attr("class", "state-name-label-wrapper")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "state-name-label")
        .attr("id", d => d.idState + "-label")
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
        .attr("font-weight", function(d) { return d.year2022 > d.year2020 ? "bolder" : "light"; })
        .attr("alignment-baseline", "middle")
        .attr("fill", color)
        .attr("font-size", "10px")
        .attr("font-family", "sans-serif")
        .on("click", function(d){

          /*
            var dd = {
                "line": d
            }*/

            removeLineHighlight(d);
            highlightLine(d);
          })
        .on("mouseover", function(d){

            highlightLine(d);
          })
        .on("mouseout", function(d){

            removeLineHighlight(d);
          });



      }

  });

}

// Button click event handlers
var desiertosButton = document.getElementById("Desiertos");
desiertosButton.addEventListener("click", function(e){ 
    drawChart("./data/percentageDesiertos.csv?v=123",
    "./imgs/legends/2x/how-to-read-desiertos@2x.png",
     "#EA7875"); 
    document.querySelector(".category-selected").classList.remove("category-selected");
    e.target.classList.add("category-selected");
});

var desiertosModeradosButton = document.getElementById("DesiertosModerados");
desiertosModeradosButton.addEventListener("click", function(e) { 
    drawChart("./data/percentageDesiertosModerados.csv?v=123", 
                "./imgs/legends/2x/how-to-read-desiertos-moderados@2x.png",
                "#EDAE70");
    document.querySelector(".category-selected").classList.remove("category-selected");
    e.target.classList.add("category-selected");

});

var noDesiertosButton = document.getElementById("NoDesiertos");
noDesiertosButton.addEventListener("click", function(e) {
 drawChart("./data/percentageNoDesiertos.csv?v=123",
    "./imgs/legends/2x/how-to-read-no-desiertos@2x.png",
    "#19A476"); 
    document.querySelector(".category-selected").classList.remove("category-selected");
    e.target.classList.add("category-selected");
});

// Initially draw the chart with the first data file
desiertosButton.classList.add("category-selected");
drawChart("./data/percentageDesiertos.csv", "imgs/legends/2x/how-to-read-desiertos@2x.png", "#EA7875");