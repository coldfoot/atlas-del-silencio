var chartWidth = 100;
var chartHeight = 100

// Set up dimensions and scales
var margin = { top: 20, right: 70, bottom: 30, left: 50 }, 
width = chartWidth - margin.left - margin.right,
height = chartHeight - margin.top - margin.bottom;

var color = d3.scaleOrdinal()
.domain(["Desierto", "Desierto Moderado", "No desierto", "Sin información"])
.range(["#EA7875", "#EDAE70", "#19A476", "#EAEAEA"]);

// Define the scale for the circles' radii
var radius = d3.scaleSqrt()
.range([3, 20]); // Adjust these values as needed

d3.csv("./data/bubbles.csv").then(function(data) {


    // Tooltip utilities
    var tooltip = d3.select(".bubble-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid black");

    function formatPopulation(number) {
        var formatMillion = d3.format(".1f"),  // 1 decimal place for millions
            formatThousand = d3.format(".0f"); // 0 decimal places for thousands

        var absNumber = Math.abs(number);
        if (absNumber >= 1e6) {
            return formatMillion(number / 1e6) + " millon" + (absNumber >= 2e6 ? "es" : "");  // Pluralize for 2 or more
        } else if (absNumber >= 1e3) {
            return formatThousand(number / 1e3) + " mil";
        } else {
            return formatThousand(number);
        }
    }

    function tooltipCreate(element, e) {

        let d = e.target.__data__;
        tooltip.html("<b>" + d.name + "</b><br>" + formatPopulation(d.population) + " habitantes")
                .style("visibility", "visible");
            d3.selectAll(".city-circle").style("opacity", 0.1);
            element.style("opacity", 1);

    }


    function tooltipUpdate(d) {
        tooltip.style("top", (d.pageY-10)+"px")
               .style("left",(d.pageX+10)+"px");
    }

    function tooltipClear(d) {
        tooltip.style("visibility", "hidden");
        d3.selectAll(".city-circle").style("opacity", 1);
    }

    // parse data and setup domains
    data.forEach(function(d) {
        d.population = +d.population;
    });

    // Set the domain for the radius scale
    radius.domain(d3.extent(data, function(d) { return d.population; }));

    // Prepare the data, Vanilla
    const estados = data.map(d => d.parent_name).filter( (d,i,a) => a.indexOf(d) == i);
    const groupedData = [];
    estados.forEach(estado => {
        const items = data.filter(d => d.parent_name == estado);

        const el = {
            key : estado,
            values : items
        }

        groupedData.push(el);
    })
    // Prepare the data
    /*
    var groupedData = d3.nest()
        .key(function(d) { return d.parent_name; })
        .entries(data);
    */

    var divs = d3.select("#bubbles")
        .selectAll("div")
        .data(groupedData)
        .enter()
        .append("div")
        .attr("class", "bubble-multiple")
        .each(function(data){

            var title = data.key;

            // Add state name text
            var stateName = d3.select(this)
              .append("p")
              .attr("class", "small-multiple-title")
              .html(title);

                var centers = {
                    "Sin información": {x: chartWidth / 3, y: chartHeight / 2},
                    "Desierto": {x: chartWidth / 3, y: chartHeight / 2},
                    "Desierto Moderado": {x: chartWidth / 2, y: chartHeight / 2},
                    "No desierto": {x: 2 * chartWidth / 3, y: chartHeight / 2},
                };


                var svg = d3.select(this)
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                
                var nodes = svg.selectAll("circle")
                    .data(data.values)
                    .enter().append("circle")
                    .attr("r", function(d) { return radius(d.population); })
                    .attr("class", "city-circle")
                    .style("fill", function(d) { return color(d.category); })
                    .on("mouseover", function(d) {
                        var element = d3.select(this);
                        tooltipCreate(element, d);
                    })
                    .on("mousemove", function(d) {
                        tooltipUpdate(d);
                    })
                    .on("mouseout", function(d) {
                        tooltipClear(d);
                    });
                    // .on("click", function(element, d) {
                    //     var element = d3.select(this);
                    //     tooltipClear(d);
                    //     tooltipCreate(element, d);
                    // });


                var force = d3.forceSimulation(data.values)
                    .force("charge", d3.forceManyBody().strength(20))
                    .force("center", d3.forceCenter(width / 2, height / 2))
                    .force("collide", d3.forceCollide(.5).radius(function(d) {
                        return radius(d.population);
                    }))
                    .force("x", d3.forceX().x(function(d) { return centers[d.category].x; }).strength(2))
                    .force("y", d3.forceY().y(function(d) { return centers[d.category].y; }).strength(2));


                force.on("tick", function() {
                    nodes.attr("cx", function(d) { return d.x; })
                        .attr("cy", function(d) { return d.y; });
                });


            });



});
