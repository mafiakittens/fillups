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
        var axis_names = ["Odometer reading", "Price (dollars per gallon)",
            "Number of gallons purchased", "Miles traveled since prev filling"]
        var button_names = ["Odometer", "Price", "Gallons", "Miles Traveled"]
        var axisUpdate, updatePoints, setTimeScale;

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
            var page_width = that.innerWidth*0.8;
            var min_width = 600;
            if(page_width >min_width) {
                graph_width = page_width - graph_margin.left - graph_margin.right; }
            else {
                graph_width = min_width - graph_margin.left - graph_margin.right; }
            graphAreaSize();   // update graphing area size based on window size
            updateXScale();    // update variable scaling based on window size
            updateXAxis();     // update bottom axis based on window size
            updatePoints();    // update point location based on window size
        }

        var graphAreaSize = function() {
            timeseriesSVG.attr("width",
                            graph_width + graph_margin.left + graph_margin.right)
                         .attr("height",
                            height + graph_margin.top + graph_margin.bottom);
            graphingArea.attr("width",graph_width)
                .attr("height",height);
            graphBackground.attr("width",graph_width)
                .attr("height",height);
        }

        var data = [];
        var assignData = function(_) {
            var that = this;
            if (!arguments.length) return data;
            data = _;
            return that;
        }

        var timeScale, current_y_scale, current_y_scale_name;
        var updateXScale = function() {
            timeScale = d3.scaleTime()
                .range([0, graph_width]);
        }


        // y axis scale options
        var updateYScale = function(num) {
            current_y_scale = d3.scaleLinear()
                .domain([0, d3.max(data, function(d,i) {
                    return +d[data.columns[num]];
                })  ])
                .range([height, 0]);
            current_y_scale_name = axis_names[num-1];
        };
        var buttons = function(){
            // change button colors on click
            var onClickButtonColoring = function(me) {
                // indicate which buttons haven't been selected
                d3.selectAll(".button").style("background-color", "#aaaaaa")
                // indicate which button has been selected
                d3.select(me).style("background-color", "#57bec1");
            }
            // update data plotted based on which button is clicked
            d3.select("#data1")
                .html(button_names[0])
                .on("click", function() {           // when button #1 is clicked
                    plot(1);                        // plot column 1 data from csv
                    onClickButtonColoring(this);    // change button colors
                })
            d3.select("#data2")
                .html(button_names[1])
                .on("click", function() {
                    plot(2);                        // plot column 2 data from csv
                    onClickButtonColoring(this);    // change button colors
                })
            d3.select("#data3")
                .html(button_names[2])
                .on("click", function() {
                    plot(3)                         // plot column 3 data from csv
                    onClickButtonColoring(this);    // change button colors
                })
            d3.select("#data4")
                .html(button_names[3])
                .on("click", function() {
                    plot(4);                        // plot column 4 data from csv
                    onClickButtonColoring(this);    // change button colors
                })
        }
        buttons();

        var plot = function(num) {

            // set up the x axis scale as a time scale
            // NOTE: requires that the json array be sorted chronologically by date
            var dateFormatter = function(date) {
                return d3.timeParse("%m-%d-%y")(date); }
            setTimeScale = function(d) {
                var mindate = dateFormatter(d[0][d.columns[0]]),
                    maxdate = dateFormatter(d[d.length-1][d.columns[0]]);
                timeScale.domain([mindate, maxdate])
            }

            // initialize the graphing area
            graphAreaSize();
            updateXScale();
            updateYScale(num);
            setTimeScale(data);

            // Specify which graph you're graphing with these variables
            var y_data = function() { return data.Date; } // don't format b/c want short version in tooltip
            var x_data = function(data) {
                return data[data.columns[num]];
                // return data.odo_diff;
              }

            var translate = function(d,i,x,y) {
                var y_val = current_y_scale(d[data.columns[num]]);
                var transform  = "translate(" + (  timeScale(dateFormatter(d.Date)) + x )
                    + ","
                    + (  current_y_scale(d[data.columns[num]])  + y )
                    + ")";
                if(isNaN(y_val)){ // check for NAN values
                    // transform y value by the delta y value only
                    transform  = "translate(" + (  timeScale(dateFormatter(d.Date)) + x )
                        + "," + y + ")"; // TODO: PUT AT BOTTOM OF GRAPH, NOT TOP
                }
                return transform;
            }

            //TODO: create function that WONT graph a point if it's an n/a value
            // ENTER FUNCTION to create points on the graph
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

            // UPDATE FUNCTION to move points on graph
            updatePoints = function() {
                setTimeScale(data);
                var selection = graphingArea.selectAll("path.pt")
                    .data(data)
                    .attr("transform", function(d,i) {
                        return translate(d,i,0,0); })
            }
            updatePoints();

            // TODO: add a trend line to the graph.


            // label the x axis at the bottom of the figure
            var xAxis = d3.axisBottom(timeScale);
            graphingArea.append("g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + height + ")")

            // label the y axis at the left of the figure
            var yAxis = d3.axisLeft(current_y_scale);
            graphingArea.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")

            // now add titles to the axes
            timeseriesSVG.append("text")
                .attr("id", "xAxisLabel")
                .attr("class", "axisLabel")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor

            timeseriesSVG.append("text")
                .attr("id", "yAxisLabel")
                .attr("class", "axisLabel")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor


            // function to be primarily used when window width is resized
            updateXAxis = function () {
                // label the x axis at the bottom of the figure
                var xAxis = d3.axisBottom(timeScale);
                graphingArea.select('.x.axis').call(xAxis);
                timeseriesSVG.select("#xAxisLabel")
                    .attr("transform", "translate("
                        + (graph_width/2 + graph_margin.left) +","
                        + (height + graph_margin.top + 3*graph_margin.bottom/4)+")")  // centre below axis
                    .text("Date");
                // move the axis title aat the bottom of the graph
            }
            // function to be used when adjusting data plotted
            updateYAxis = function () {
                // label the y axis at the bottom of the figure
                var yAxis = d3.axisLeft(current_y_scale);
                graphingArea.select('.y.axis').call(yAxis);
                timeseriesSVG.select("#yAxisLabel")
                    .attr("transform", "translate("
                        + 12+ "," // TODO: THIS SIZE SHOULD BE DYNAMICALLY CHOSEN BASED ON TEXT SIZE OF THIS ELEMENT
                        + (height/2 + graph_margin.top)+")rotate(-90)")
                        // text is drawn off the screen top left, move down and out and rotate
                    .text(current_y_scale_name);
            }
            updateXAxis();
            updateYAxis();
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
