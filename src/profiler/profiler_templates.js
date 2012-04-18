"use strict";

/**
 * @constructor
 */
var ProfilerTemplates = function()
{
  var GENERIC = ProfilerService.GENERIC;
  var PROCESS = ProfilerService.PROCESS;
  var DOCUMENT_PARSING = ProfilerService.DOCUMENT_PARSING;
  var CSS_PARSING = ProfilerService.CSS_PARSING;
  var SCRIPT_COMPILATION = ProfilerService.SCRIPT_COMPILATION;
  var THREAD_EVALUATION = ProfilerService.THREAD_EVALUATION;
  var REFLOW = ProfilerService.REFLOW;
  var STYLE_RECALCULATION = ProfilerService.STYLE_RECALCULATION;
  var CSS_SELECTOR_MATCHING = ProfilerService.CSS_SELECTOR_MATCHING;
  var LAYOUT = ProfilerService.LAYOUT;
  var PAINT = ProfilerService.PAINT;

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

  var BAR_MIN_WIDTH = 5; // min-width for .profiler-event
  var BAR_HEIGHT = 18; // offset height of .profiler-timeline-row

  this._order = [DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION, THREAD_EVALUATION,
                 REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];
  this._expandables = [STYLE_RECALCULATION];

  this.main = function(legend, timeline, details_list, status)
  {
    return [
      ["div",
         legend,
       "id", "profiler-legend"],
      ["div",
         timeline,
       "id", "profiler-timeline",
       "handler", "profiler-zoom-timeline"],
      ["div",
         details_list,
       "id", "profiler-details-list"],
      ["div",
         status,
       "id", "profiler-status"]
    ];
  };

  this.legend = function(events)
  {
    if (events && events.eventList && events.eventList[0])
    {
      // TODO: style recalc includes selector matching, so should use aggregatedTime
      var total_time = events.eventList.reduce(function(prev, curr) {
        return prev + curr.time;
      }, 0);

      return this._order.map(function(row, idx) {
        // TODO: do this once outside the loop
        var event = events.eventList.filter(function(event) {
          return event.type == row;
        })[0];
        return (["div",
                   // TODO: this might end up as less than 100%, fix
                   ["span",
                      type_map[row] + " ",
                    "class", "label"
                   ],
                   ["span",
                      ((Math.round(event.time / total_time * 100)) + " %"),
                    "class", "amount"
                   ],
                 "class", "profiler-timeline-row" + (idx % 2 ? " odd" : ""),
                 "title", this.get_title_aggregated(event),
                 "data-event-type", String(event.type),
                 "handler", "profiler-get-event-details"
               ]);
      }, this);
    }
  };

  this.timeline_markers = function(width, interval, ms_unit)
  {
    var MIN_MARKER_GAP = 120;
    var cell_amount = Math.max(2, Math.round(width / MIN_MARKER_GAP));
    var marker_time = interval / cell_amount;
    var ret = [];
    for (var i = 0; i < cell_amount; i++)
    {
      var left = Math.round(marker_time * i * ms_unit);
      ret.push(["div",
                "class", "profiler-timeline-marker",
                "style", "left:" + left + "px"
               ],
               ["div",
                  this.format_time(marker_time * i),
                "class", "profiler-timeline-marker-time",
                "style", "left:" + left + "px"
               ]);
    }

    //// Add the last one at the exact end of the interval
    //ret.push(["div",
    //           "class", "profiler-timeline-marker",
    //           "style", "left:" + width + "px"
    //         ],
    //         ["div",
    //           this.format_time(interval),
    //           "class", "profiler-timeline-marker-time",
    //           "style", "left:" + width + "px"
    //         ]);

    return ret;
  };

  this.event_list_all = function(events, selected_id, container_width)
  {
    var ret = [];

    if (events && events.eventList && events.eventList[0])
    {
      // Calculate scaling, to fit all events into the view.
      // We first calculate a prelimiary scaling, to know the width
      // of the last event. We then calculate the real scaling where
      // the width of the last event is taken into account
      var interval_end = events.interval.end;
      var last_event = events.eventList.slice(-1)[0];
      var last_event_interval = last_event.interval.end - last_event.interval.start;
      var ms_unit = container_width / interval_end;
      var extra_width = Math.max(BAR_MIN_WIDTH, Math.ceil(last_event_interval * ms_unit));
      ms_unit = (container_width - extra_width) / interval_end;

      // Add time markers
      ret.push(this.timeline_markers(container_width, interval_end, ms_unit));

      this._order.forEach(function(row, idx) {
        ret.push(["div",
                   "class", "profiler-timeline-row" + (idx % 2 ? " odd" : "")
                 ]);
      });

      events.eventList.forEach(function(event) {
        var interval = Math.round((event.interval.end - event.interval.start) * ms_unit);
        var self_time = Math.round(event.time * ms_unit);
        var event_start = Math.round(event.interval.start * ms_unit);
        var column = this._order.indexOf(event.type);
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
             "top:" + ((column * BAR_HEIGHT) + 1) + "px;",
           "title", this.get_title_all(event),
           "class", "profiler-event profiler-event-interval event-type-" + event.type + (event.eventID == selected_id ? " selected" : ""),
           "data-event-id", String(event.eventID),
           "data-event-type", String(event.type),
           "handler", "profiler-get-event-details",
           "data-isexpandable", String(this._expandables.indexOf(event.type) != -1 && event.childCount > 1)
          ]);
      }, this);
    }
    return ret;
  };

  this.event_list_unique_events = function(events, container_width)
  {
    var ret = [];
    if (events && events.eventList.length)
    {
      // Sort by longest time
      events.eventList.sort(function(a, b) {
        return b.time - a.time;
      });

      var interval = events.eventList[0].time;
      var ms_unit = container_width / interval;

      events.eventList.forEach(function(event, idx) {
        var width = Math.ceil(event.time * ms_unit);
        ret.push(
          ["div",
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

  this.empty = function(text)
  {
    return ["div", text, "class", "profiler-empty"];
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

  this.format_time = function(time, ms_fractions)
  {
    var unit = "ms";
    var fractions = ms_fractions || 0;
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
    return this.format_time(event.time);
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

  this._tabledefs = {};
  // TODO: implements sorters. E.g. hits should sort by hits and then by time
  this._tabledefs[CSS_SELECTOR_MATCHING] = {
    column_order: ["selector", "time", "hits"],
    // TODO: ui strings
    columns: {
      "selector": {
        label: "Selector"
      },
      "time": {
        label: "Time",
        align: "right",
        renderer: (function(event) {
          return this.format_time(event.time, 1);
        }).bind(this),
        classname: "profiler-details-time"
      },
      "hits": {
        label: "Hits",
        align: "right",
        renderer: function(event) {
          return String(event.hits);
        },
        classname: "profiler-details-hits"
      }
    }
  };

  this.disabled_view = function()
  {
    return (
      ["div",
        ["span",
         "class", "container-button ui-button reload-window",
         "handler", "profiler-reload-window",
         "tabindex", "1"
        ],
        ["p",
          "To get accurate data from the profiler, the document has to be reloaded."
        ],
       "class", "info-box"
      ]
    );
  };
};

