// Shorthand for $( document ).ready()
$(function() {

    var my_viz_lib = my_viz_lib || {};

    my_viz_lib.scatterPlot = function() {
        // Set up the scales, padding, and buffer ratios
        // TODO: dynamically resize page and graph based on window size
        // var page_margin = {"top": 40, "right": 100, "bottom": 40, "left": 100};
        var graph_margin = {"top": 40, "right": 40, "bottom": 40, "left": 60};
        var graph_width = 800 - graph_margin.left - graph_margin.right;
        var height = 400 - graph_margin.top - graph_margin.bottom;
        var axisUpdate;

        // resize & place the svg for the time series graph
        var timeseriesSVG = d3.select("#timeseries");

        // This is the element the points and axes will be appended to
        var graphingArea = timeseriesSVG.append("g")
            .attr("class","graphingArea")
            .attr("transform", "translate(" + graph_margin.left + "," + graph_margin.top + ")")
        var graphBackground = graphingArea.append("rect")
            .attr("class", "canvas")
            .style("fill","#f5f5f5");

        // create tooltip
        // TODO: need to figure out how to make it hover ON TOP of the points
        var tooltip_height = 30, // in px
            tooltip_width = tooltip_height * 2; // in px
        var tooltip_text_size = tooltip_height/3; // in px
        var tooltip = graphingArea.append("g")
            .attr("class", "tooltip")
            .attr("id", "t");
        tooltip.append("rect")
            .attr("class", "tooltip-bkg")
            .attr("width", tooltip_width)
            .attr("height", tooltip_height);
        tooltip.append("text")
            .attr("id", "tip1")
            .html("hello")
            .attr("transform", // based on tooltip size
                "translate("
                + tooltip_width/2 + ","
                + tooltip_text_size*1.25 +")")
            .style("font-size", tooltip_text_size + "px")
        tooltip.append("text")
            .attr("id", "tip2")
            .html("h3ll0")
            .attr("transform", // based on tooltip & font size
                "translate("
                + tooltip_width/2 + ","
                + tooltip_text_size*2.5 +")")
            .style("font-size", tooltip_text_size + "px")

        // update sizing & scaling based on window size
        window.onresize = window.onload = function() {
            var that = this;
            // console.log(that);
            var page_width = that.innerWidth*0.8;
            var min_width = 600;
            if(page_width >min_width) {
                graph_width = page_width - graph_margin.left - graph_margin.right; }
            else {
                graph_width = min_width - graph_margin.left - graph_margin.right; }
            graphAreaSize();
            scale();
            // JOHN: This is your first problem, you shouldn't call axisUpdate on the resize callback
            // because that function *appends* the axis again, you need to update it, not create it again.
            // Separate the append part (as you have for everything else on line 32+) from the updating
            // part
            // axisUpdate();

            // JOHN: second problem, you need to update your xAxis object, that was done on axisUpdate,
            // but that function also appended another axis, so separate that code
            xAxis = d3.axisBottom(timeScale);
            graphingArea.select('.x.axis').call();

            // JOHN: Your third problem is that you need to update all your dots positions. The 
            // cleanest way to achieve that for me is to have an update function that handle 
            // all the enter, update, and exit cases. Your plot only handled enter

        }

        var graphAreaSize = function() {
            timeseriesSVG.attr("width",
                            graph_width + graph_margin.left + graph_margin.right)
                         .attr("height",
                            height + graph_margin.top + graph_margin.bottom);
            console.log(graph_width)
            graphingArea.attr("width",graph_width)
                .attr("height",height);
            graphBackground.attr("width",graph_width)
                .attr("height",height);
            // TODO: make tooltip resize dynamically
            var tooltip_height = 30, // in px
                tooltip_width = tooltip_height * 2; // in px
            var tooltip_text_size = tooltip_height/3; // in px
        }


        var tooltip_height = 30, // in px
            tooltip_width = tooltip_height * 2; // in px
        var tooltip_text_size = tooltip_height/3; // in px

        var data = [];
        var assignData = function(_) {
            var that = this;
            if (!arguments.length) return data;
            data = _;
            return that;
        }

        var ODO_scale, gallons_scale, cost_scale, mile_diff_scale, timeScale;
        var scale = function() {
            // y axes scale options
            // TODO: encapsulate three graphing views as single object/class
            // (scales, axes label names, what variable to call within d)
            ODO_scale = d3.scaleLinear()
                .domain([0, d3.max(data, function(d,i) {
                    return +d.ODO;              })  ])
                .range([height, 0]);
            gallons_scale = d3.scaleLinear()
                .domain([0, d3.max(data, function(d,i) {
                    return +d.gallons;          })   ])
                .range([height,0]);
            cost_scale = d3.scaleLinear()
                .domain([0, d3.max(data, function(d,i) {
                    return +d.dollars_per_gal;  })   ])
                .range([height,0]);
            mile_diff_scale = d3.scaleLinear()
                .domain([0, d3.max(data, function(d,i) {
                    return +d.odo_diff;         })  ])
                .range([height,0]);
            timeScale = d3.scaleTime()
                // .domain([mindate,maxdate])
                .range([0, graph_width]);
                // console.log(graph_width)
        };
        // scale();

        var plot = function(num) {
            // initialize the graphing area
            graphAreaSize();
            scale();

            // set up the x axis scale as a time scale
            // NOTE: requires that the json array be sorted chronologically by date
            var dateFormatter = function(date) {
                return d3.timeParse("%m-%d-%y")(date);
            }
            var mindate = dateFormatter(data[0][data.columns[0]]),
                maxdate = dateFormatter(data[data.length-1][data.columns[0]]);
            timeScale.domain([mindate, maxdate])

            // Specify which graph you're graphing with these variables
            var y_data = function() {
                console.log(data.Date);
                return data.Date; } // don't format; want short version in tooltip?
            var x_data = function(data) { return data.odo_diff;  }
            var current_y_scale = mile_diff_scale;
            var current_y_scale_name = "Number miles driven since previous filling";
            var translate = function(d,i,x,y) {
                var y_val = current_y_scale(d[data.columns[4]]);
                var transform  = "translate(" + (  timeScale(dateFormatter(d.Date)) + x )
                    + ","
                    + (  current_y_scale(d[data.columns[4]])  + y )
                    + ")";
                if(isNaN(y_val)){ // check for NAN values
                    // transform y value by the delta y value only
                    transform  = "translate(" + (  timeScale(dateFormatter(d.Date)) + x )
                        + "," + y + ")"; // TODO: PUT AT BOTTOM OF GRAPH, NOT TOP
                }
                return transform;
            }

            // JOHN: error, you are only handling enter, not update or exit
            //TODO: create function that WONT graph a point if it's an n/a value
            // create points on the graph
            var points = graphingArea.selectAll("path.pt")
                .data(data)
                .enter()
                .append("path")
                .attr("class", "pt")
                .attr("d", d3.symbol().type(d3.symbolCircle).size(50)) // TODO: choose more dynamically based on width and height (maybe width/6)
                .attr("transform", function(d,i) {
                    var val = translate(d,i,0,0);
                    return val; })
                .style("opacity", .5)

                // add details with hover effects
                .on("mouseover", function(d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .7)
                        .attr("transform", translate(d,i,
                            ((-1)*tooltip_width/2), // half tooltip width
                            (-1.2) * tooltip_height // move above mouse
                        ));
                    d3.select(this).attr("class", "hover");

                    // append two text lines: one for date and one for
                    // associated y data value
                    tooltip.select("#tip1")
                        .html(y_data(d));
                    tooltip.select("#tip2")
                        .html(x_data(d));
                })
                .on("mousout", function(d) {
                    d3.select(this).attr("class","pt");
                    // TODO: FIGURE OUT HOW TO UN-HIGHLIGHT THE HOVER POINT
                })

            // TODO: add a trend line to the graph.


            axisUpdate = function () {
                // label the x axis at the bottom of the figure
                var xAxis = d3.axisBottom(timeScale);
                graphingArea.append("g")
                      .attr("class", "x axis")
                      .attr("transform", "translate(0," + height + ")")
                      .call(xAxis);
                // console.log("x-axis run");

                // label the y axis at the left of the figure
                var yAxis = d3.axisLeft(current_y_scale);
                graphingArea.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(0,0)")
                    .call(yAxis);

                // now add titles to the axes
                timeseriesSVG.append("text")
                    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                    .attr("transform", "translate("
                        + (graph_width/2 + graph_margin.left) +","
                        + (height + graph_margin.top + 3*graph_margin.bottom/4)+")")  // centre below axis
                    .text("Date");
                timeseriesSVG.append("text")
                    .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                    .attr("transform", "translate("
                        + 12+ "," // TODO: THIS SIZE SHOULD BE DYNAMICALLY CHOSEN BASED ON TEXT SIZE OF THIS ELEMENT
                        + (height/2 + graph_margin.top)+")rotate(-90)")
                        // text is drawn off the screen top left, move down and out and rotate
                    .text(current_y_scale_name);
            }
            axisUpdate();
        };
        // public accessor functions to customize the scatter plot
        var public = {
            "plot": plot,
            "assignData": assignData
            //   "loglog": setLogScale,
            //   "width": w_,
            //   "height": h_
        };
        return public;
    }

    d3.csv("data/2012_Toyota_Corolla_Celia.csv", function(error, d) {
        var num = 1;

        // TODO: cycle through d to remove any NaN/error values
        // var odo_reading = d.map(function(a) {return a.ODO;});
        // console.log(d[num],d[num][d.columns[num]]);

        // Create a variable to track difference in miles from previous filling
        // NOTE: only makes sense if this is already chronologically sorted.
        var odo_prev = 0;
        for(i = 0; i < d.length; i++) {
            if(i==0) {  d[i].odo_diff = 0; }
            else {      d[i].odo_diff = d[i][d.columns[1]] - odo_prev; }
            odo_prev = d[i][d.columns[1]];
        }
        d.columns.push("odo_diff");

        var myPlot =  my_viz_lib.scatterPlot();
        myPlot.assignData(d);
        myPlot.plot(1);
    })
});
