// Shorthand for $( document ).ready()
$(function() {

    // Set up the scales, padding, and buffer ratios
    // var page_margin = {"top": 40, "right": 100, "bottom": 40, "left": 100};
    var graph_margin = {"top": 40, "right": 100, "bottom": 60, "left": 100};
    var width = 1200 - graph_margin.left - graph_margin.right;
    var height = 400 - graph_margin.top - graph_margin.bottom;

    // resize & place the svg for the time series graph
    var timeseriesSVG = d3.select("#timeseries")
        .attr("width", width + graph_margin.left + graph_margin.right)
        .attr("height", height + graph_margin.top + graph_margin.bottom)
      ;

  // This is the element the points and axes will be appended to
    var graphingArea = timeseriesSVG
        .append("g")
        .attr("transform", "translate(" + graph_margin.left + "," + graph_margin.top + ")");

    // visualize the graphing area
    graphingArea.append("rect")
        .style("fill","#f5f5f5")
        .attr("width",width)
        .attr("height",height)
        .attr("class", "canvas");

    // get the data
    d3.csv("data/2012_Toyota_Corolla_Celia.csv", function(error, data) {
        // console.log(data);

        // set up the x axis scale as a time scale
        // requires that the json array be sorted chronologically by date
        var dateFormatter = function(date) {
            return d3.timeParse("%m-%d-%y")(date);
        }
        var mindate = dateFormatter(data[0].Date),
            maxdate = dateFormatter(data[data.length-1].Date);
        var timeScale = d3.scaleTime()
            .domain([mindate,maxdate])
            .range([0, width]);
        // console.log(timeScale(data[0].Date))

        // y axes scale options
        // TODO: encapsulate three graphing views as single object/class
        // (scales, axes label names, what variable to call within d)
        var ODO_scale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d,i) {
                return +d.ODO;  })  ])
            .range([height, 0]);
        var gallons_scale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d,i) {
                return +d.gallons;  })   ])
            .range([height,0]);
        var cost_scale = d3.scaleLinear()
            .domain([0, d3.max(data, function(d,i) {
                return +d.dollars_per_gal;  })   ])
            .range([height,0]);

        // create points on the graph
        graphingArea.selectAll("path.ODO")
            .data(data)
            .enter()
            .append("path")
            .attr("class", "ODO")
            .attr("d", d3.symbol().type(d3.symbolCircle).size(50)) // choose more dynamically based on width and heigth (maybe width/6)
            .style("opacity", .5)
            .attr("transform", function(d,i) {
                return "translate("
                    + timeScale(dateFormatter(d.Date))     + "," +
                    + ODO_scale(d.ODO)         + ")";
                    // + gallons_scale(d.gallons)             + ")";
                    // + cost_scale(d.dollars_per_gal)        + ")";
            })
            // add details with hover effects
            .on("mouseover", function(d) {
                var tooltip = graphingArea.append("g")
                    .attr("class", "tooltip")
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9)
                    .attr("transform", "translate("
                            + (timeScale(dateFormatter(d.Date))-30)     + "," // dynamically half of width of tooltip
                            + (ODO_scale(d.ODO)-40)             + ")"); // move it vertically by tooltip height + 10
                tooltip.append("rect")
                            .attr("class", "tooltip-bkg");
                // append two text lines: one for date and one for
                // associated y data value
                tooltip.append("text")
                    .html(d.Date)
                    .attr("transform", "translate(30,12)") // dynamically based on tooltip size
                tooltip.append("text")
                    .html(d.ODO)
                    .attr("transform", "translate(30,23)");// dynamically based on tooltip size
                })
            .on("mouseout", function(d) {
                var tooltip = graphingArea.selectAll(".tooltip");
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
                // remove so html remains unburdened with the weight of
                // a million tooltip info
                tooltip.selectAll("rect").remove();
                tooltip.selectAll("text").remove();
            });

        // label the x axis at the bottom of the figure
        var xAxis = d3.axisBottom(timeScale);
        graphingArea.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

        // label the y axis at the left of the figure
        var yAxis = d3.axisLeft(ODO_scale);
        graphingArea.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .call(yAxis);

        // now add titles to the axes
        timeseriesSVG.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("
                + (graph_margin.left)/2 + ","
                + (height/2 + graph_margin.top)+")rotate(-90)")
                // text is drawn off the screen top left, move down and out and rotate
            .text("Odometer reading");
        timeseriesSVG.append("text")
            .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
            .attr("transform", "translate("
                + (width/2 + graph_margin.left) +","
                + (height + graph_margin.top + 3*graph_margin.bottom/4)+")")  // centre below axis
            .text("Date");
    });
});
