var ProfilerTemplates = function() {
  const GENERIC = ProfilerService.GENERIC;
  const PROCESS = ProfilerService.PROCESS;
  const DOCUMENT_PARSING = ProfilerService.DOCUMENT_PARSING;
  const CSS_PARSING = ProfilerService.CSS_PARSING;
  const SCRIPT_COMPILATION = ProfilerService.SCRIPT_COMPILATION;
  const THREAD_EVALUATION = ProfilerService.THREAD_EVALUATION;
  const REFLOW = ProfilerService.REFLOW;
  const STYLE_RECALCULATION = ProfilerService.STYLE_RECALCULATION;
  const CSS_SELECTOR_MATCHING = ProfilerService.CSS_SELECTOR_MATCHING;
  const LAYOUT = ProfilerService.LAYOUT;
  const PAINT = ProfilerService.PAINT;

  // TODO: use ui strings
  var type_map = {};
  type_map[GENERIC] = "Generic";
  type_map[PROCESS] = "Process";
  type_map[DOCUMENT_PARSING] = "Document parsing";
  type_map[CSS_PARSING] = "CSS parsing";
  type_map[SCRIPT_COMPILATION] = "Script compilation";
  type_map[THREAD_EVALUATION] = "Thread evaluation";
  type_map[REFLOW] = "Reflow";
  type_map[STYLE_RECALCULATION] = "Style recalculation";
  type_map[CSS_SELECTOR_MATCHING] = "CSS selector matching";
  type_map[LAYOUT] = "Layout";
  type_map[PAINT] = "Paint";

  const BAR_MIN_WIDTH = 5; // min-width for .profiler-event
  const BAR_HEIGHT = 14; // height of .profiler-timeline-row

  this.empty = function(text)
  {
    return ["div", text, "class", "profiler-empty"];
  };

  this.main = function(aggregated_events, timeline, details_list, status)
  {
    return [
      ["div",
         aggregated_events,
       "id", "profiler-aggregated"],
      ["div",
         timeline,
       "id", "profiler-timeline"],
      ["div",
         details_list,
       "id", "profiler-details-list"],
      ["div",
         status,
       "id", "profiler-status"]
    ];
  };

  this.timeline_markers = function(width, start, interval, ms_unit)
  {
    const MIN_MARKER_GAP = 100;
    var marker_amount = Math.max(2, Math.floor(width / MIN_MARKER_GAP));
    var marker_time = interval / marker_amount;
    var ret = [];
    for (var i = 1; i < marker_amount; i++)
    {
      var left = Math.floor(marker_time * i * ms_unit);
      ret.push(["div",
                 "class", "profiler-timeline-marker",
                 "style", "left:" + left + "px"
               ],
               ["div",
                 this.format_time(start + (marker_time * i)),
                 "class", "profiler-timeline-marker-time",
                 "style", "left:" + left + "px"
               ]);
    }
    return ret;
  };

  this.event_list_all = function(event_list, container_width)
  {
    var ret = [];
    var order = [DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION, THREAD_EVALUATION,
                 REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];

    if (event_list && event_list.eventList && event_list.eventList[0])
    {
      // Calculate scaling, to fit all events into the view.
      // We first calculate a prelimiary scaling, to know the width
      // of the last event. We then calculate the real scaling where
      // the width of the last event is taken into account
      var start = event_list.interval.start;
      var total_interval = event_list.interval.end - start;
      var last_event = event_list.eventList.slice(-1)[0];
      var last_event_time = last_event.interval.end - last_event.interval.start;
      var ms_unit = container_width / total_interval;
      var extra_width = Math.max(BAR_MIN_WIDTH, Math.round(last_event_time * ms_unit));
      ms_unit = (container_width - extra_width) / total_interval;

      // Add time markers
      ret.push(this.timeline_markers(container_width - extra_width, start, total_interval, ms_unit));

      order.forEach(function(row, idx) {
        ret.push(["div",
                   "class", "profiler-timeline-row " + (idx % 2 ? "odd" : "")
                 ]);
      });

      event_list.eventList.forEach(function(event) {
        var interval = Math.round((event.interval.end - event.interval.start) * ms_unit);
        var self_time = Math.round(event.time * ms_unit);
        var event_start = Math.round((event.interval.start - start) * ms_unit);
        var column = order.indexOf(event.type);
        ret.push(
          // Interval
          ["div",
            // Self-time
            ["div",
              "style", "width: " + self_time + "px;",
              "class", "profiler-event profiler-timeline-selftime event-type-" + event.type
            ],
            "style",
              "width: " + interval + "px;" +
              "left: " + event_start + "px;" +
              "top:" + (column * BAR_HEIGHT) + "px;",
            "title", this.get_title_all(event),
            "class", "profiler-event profiler-event-interval event-type-" + event.type,
            "data-event-id", String(event.eventID),
            "data-event-type", String(event.type),
            "handler", "profiler-get-event-details"
          ]
        )
      }, this);
    }
    return ret;
  };

  this.event_list_aggregated = function(event_list, process_event)
  {
    var ret = [];
    if (event_list && event_list.eventList && event_list.eventList[0] && process_event)
    {
      var total_time = event_list.eventList.reduce(function(prev, curr) {
        return prev + curr.time;
      }, 0);

      // Filter out event types with zero time
      var data = event_list.eventList.filter(function(event) {
        return event.time != 0;
      });

      data = data.map(function(event) {
        return {
          amount: event.time,
          data: {
            title: this.get_title_aggregated(event),
            class_name: "event-type-" + event.type,
            event_type: String(event.type)
          }
        };
      }, this);

      // Add the Process event (so we can show how much of the total amount
      // that we didn't profile)
      data.push({
        amount: process_event.time - total_time,
        data: {
          title: this.get_title_aggregated({
                   type: process_event.type,
                   time: process_event.time - total_time
                 }),
          class_name: "event-type-" + process_event.type,
          event_type: String(process_event.type)
        }
      });

      // Sort by time
      data.sort(function(a, b) {
        return b.amount - a.amount;
      });

      var chart = new Chart(data);
      var pie_chart = chart.get_pie_chart(110);
      var slices = pie_chart.slices.map(function(slice) {
        return [
          "path",
            ["title", slice.data.title],
          "d", slice.path,
          "class", slice.data.class_name,
          "handler", "profiler-get-event-details",
          "data-event-type", slice.data.event_type
        ];
      });

      var ret = [
        "svg:svg",
          slices,
        "width", String(pie_chart.size),
        "height", String(pie_chart.size)
      ];
    }
    return ret;
  };

  this.event_list_unique_events = function(event_list, container_width)
  {
    var ret = [];
    if (event_list && event_list.eventList.length)
    {
      // Sort by longest time
      event_list.eventList.sort(function(a, b) {
        return b.time - a.time;
      });

      var interval = event_list.eventList[0].time;
      var ms_unit = container_width / interval;

      event_list.eventList.forEach(function(event, idx) {
        var width = Math.round(event.time * ms_unit);
        ret.push(["div",
          "style",
            "width: " + width + "px;" +
            "top:" + (idx * BAR_HEIGHT) + "px;",
          "title", this.get_title_unique_events(event),
          "class", "profiler-event event-type-" + event.type,
          "data-event-id", String(event.eventID),
          "data-event-type", String(event.type),
          "handler", "profiler-get-event-details"
        ]);
      }, this);
    }

    return ret;
  };

  this.details = function(table)
  {
    return table && table.data.length && table.render() || this.no_events();
  };

  this.status = function(time)
  {
    return ["div", "Total time: " + time];
  };

  this.no_events = function()
  {
    return ["div", "No event details", "class", "profiler-empty"];
  };

  this.format_time = function(time)
  {
    var unit = "ms";
    var fractions = 0;
    if (time >= 1000) // if at least on second
    {
      time /= 1000;
      unit = "s";
      fractions = 3;
    }
    return time.toFixed(fractions) + " " + unit;
  }

  this.get_title_all = function(event)
  {
    var details = this.get_details_title(event);
    return type_map[event.type] + ", " +
           this.format_time(event.interval.end - event.interval.start) +
           " (self-time: " + this.format_time(event.time) + ") at " +
           this.format_time(event.interval.start) +
           (details ? " [" + details + "]" : "");
  }

  this.get_title_aggregated = function(event)
  {
    var details = (event.type == PROCESS) ? " (amount not profiled)" : "";
    return type_map[event.type] + ", " +
           this.format_time(event.time) +
           details;
  }

  this.get_title_unique_events = function(event)
  {
    var details = this.get_details_title(event);
    return type_map[event.type] + "," +
           " self-time: " + this.format_time(event.time) +
           " [" + event.hits + " hits" +
             (details ? ", " + details : "") +
           "]";
  }

  this.get_details_title = function(event)
  {
    switch (event.type)
    {
    case CSS_SELECTOR_MATCHING:
      return event.cssSelectorMatching.selector;

    case THREAD_EVALUATION:
      return event.threadEvaluation.eventName;

    case DOCUMENT_PARSING:
      return event.documentParsing.url;

    case CSS_PARSING:
      return event.cssParsing.url;

    case SCRIPT_COMPILATION:
      // TODO: type
      return event.scriptCompilation.url;

    case PAINT:
      var area = event.paint.area;
      return area.w + "×" + area.h + " at (" + area.x + "," + area.y + ")";
    }
    return "";
  }
};

