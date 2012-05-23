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
       "id", "profiler-legend"
      ],
      ["div",
         timeline,
       "id", "profiler-timeline",
       "handler", "profiler-zoom-timeline"
      ],
      ["div",
         details_list,
       "id", "profiler-details-list"
      ],
      ["div",
         status,
       "id", "profiler-status"
      ]
    ];
  };

  this.legend = function(events)
  {
    var event_list = events && events.eventList;
    if (event_list && event_list.length)
    {
      var template = [];
      var total_time = event_list.reduce(function(prev, curr) {
        return prev + curr.time;
      }, 0);
      event_list.forEach(function(event) {
        var index = this._order.indexOf(event.type);
        if (index !== -1)
        {
          template[index] =
            ["div",
               ["span",
                  type_map[event.type] + " ",
                "class", "profiler-legend-label"
               ],
               ["span",
                  // This is an approximation, the total will not necessarily
                  // end up as 100 %
                  (Math.round(event.time / total_time * 100)) + " %",
                "class", "profiler-legend-amount"
               ],
             "class", "profiler-timeline-row" + (index % 2 ? " odd" : ""),
             "title", this.get_title_aggregated(event),
             "data-event-type", String(event.type),
             "handler", "profiler-get-event-details"
            ];
        }
      }, this);
      return template;
    }
  };

  this.timeline_markers = function(width, duration, ms_unit)
  {
    var MIN_MARKER_GAP = 120;
    var MIN_MARKERS = 2;
    var cell_amount = Math.max(MIN_MARKERS, Math.round(width / MIN_MARKER_GAP));
    var marker_time = duration / cell_amount;
    var template = [];
    for (var i = 0; i < cell_amount; i++)
    {
      var left = Math.round(marker_time * i * ms_unit);
      template.push(
        ["div",
         "class", "profiler-timeline-marker",
         "style", "left:" + left + "px"
        ],
        ["div",
           this.format_time(marker_time * i),
         "class", "profiler-timeline-marker-time",
         "style", "left:" + left + "px"
        ]
      );
    }
    return template;
  };

  this.event_list_all = function(events, selected_id, container_width, start, end)
  {
    var template = [];
    var event_list = events && events.eventList;
    if (event_list && event_list.length)
    {
      // Calculate scaling, to fit all events into the view.
      // We first calculate a preliminary scaling to know the width
      // of the last event. We then calculate the real scaling where
      // the width of the last event is taken into account.
      var interval_start = start || 0;
      var interval_end = events.interval.end;
      var duration = interval_end - interval_start;
      var last_event = event_list[event_list.length-1];
      var last_event_interval = last_event.interval.end - last_event.interval.start;
      var ms_unit = container_width / duration;
      var extra_width = Math.max(BAR_MIN_WIDTH, Math.ceil(last_event_interval * ms_unit));
      ms_unit = (container_width - extra_width) / duration;

      // Add time markers
      template.push(this.timeline_markers(container_width, interval_end, ms_unit));

      // Background bars
      this._order.forEach(function(row, idx) {
        template.push(
          ["div",
           "class", "profiler-timeline-row" + (idx % 2 ? " odd" : "")
          ]
        );
      });

      event_list.forEach(function(event) {
        var interval = Math.round((event.interval.end - event.interval.start) * ms_unit);
        var self_time = Math.round(event.time * ms_unit);
        var event_start = Math.round(event.interval.start * ms_unit);
        var column = this._order.indexOf(event.type);
        template.push(
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
          ]
        );
      }, this);
    }
    return template;
  };

  this.event_list_unique_events = function(events, container_width)
  {
    var template = [];
    var event_list = events && events.eventList;
    if (event_list && event_list.length)
    {
      // Sort by longest time
      event_list.sort(function(a, b) {
        return b.time - a.time;
      });

      var interval = event_list[0].time;
      var ms_unit = container_width / interval;

      event_list.forEach(function(event, idx) {
        var width = Math.ceil(event.time * ms_unit);
        template.push(
          ["div",
           "style",
             "width: " + width + "px;" +
             "top:" + (idx * BAR_HEIGHT) + "px;",
           "title", this.get_title_unique_events(event),
           "class", "profiler-event event-type-" + event.type,
           "data-event-id", String(event.eventID),
           "data-event-type", String(event.type),
           "handler", "profiler-get-event-details"
          ]
        );
      }, this);
    }

    return template;
  };

  this.empty = function(text)
  {
    return ["div", text, "class", "profiler-empty"];
  };

  this.details = function(table)
  {
    return table && table.get_data().length && table.render() || this.no_events();
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
  };

  this.get_title_all = function(event)
  {
    var details = this.get_details_title(event);
    return type_map[event.type] + ", " +
           this.format_time(event.interval.end - event.interval.start) +
           " (self-time: " + this.format_time(event.time) + ") at " +
           this.format_time(event.interval.start) +
           (details ? " [" + details + "]" : "");
  };

  this.get_title_aggregated = function(event)
  {
    return this.format_time(event.time);
  };

  this.get_title_unique_events = function(event)
  {
    var details = this.get_details_title(event);
    return type_map[event.type] + "," +
           " self-time: " + this.format_time(event.time) +
           " [" + event.hits + " hits" +
             (details ? ", " + details : "") +
           "]";
  };

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
  };

  this._tabledefs = {};
  // TODO: implement sorters. E.g. hits should sort by hits and then by time
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
         "class", "ui-button reload-window",
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

