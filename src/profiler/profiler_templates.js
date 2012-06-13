"use strict";

/**
 * @constructor
 */
var ProfilerTemplates = function()
{
  var event_type = ProfilerService.EventType;
  var TYPE_GENERIC = event_type.GENERIC;
  var TYPE_PROCESS = event_type.PROCESS;
  var TYPE_DOCUMENT_PARSING = event_type.DOCUMENT_PARSING;
  var TYPE_CSS_PARSING = event_type.CSS_PARSING;
  var TYPE_SCRIPT_COMPILATION = event_type.SCRIPT_COMPILATION;
  var TYPE_THREAD_EVALUATION = event_type.THREAD_EVALUATION;
  var TYPE_REFLOW = event_type.REFLOW;
  var TYPE_STYLE_RECALCULATION = event_type.STYLE_RECALCULATION;
  var TYPE_CSS_SELECTOR_MATCHING = event_type.CSS_SELECTOR_MATCHING;
  var TYPE_LAYOUT = event_type.LAYOUT;
  var TYPE_PAINT = event_type.PAINT;

  var thread_type = ProfilerService.ScriptThreadType;
  var THREAD_TYPE_UNKNOWN = thread_type.UNKNOWN;
  var THREAD_TYPE_COMMON = thread_type.COMMON;
  var THREAD_TYPE_TIMEOUT = thread_type.TIMEOUT;
  var THREAD_TYPE_EVENT = thread_type.EVENT;
  var THREAD_TYPE_INLINE_SCRIPT = thread_type.INLINE_SCRIPT;
  var THREAD_TYPE_JAVASCRIPT_URL = thread_type.JAVASCRIPT_URL;
  var THREAD_TYPE_HISTORY_NAVIGATION = thread_type.HISTORY_NAVIGATION;
  var THREAD_TYPE_JAVA_EVAL = thread_type.JAVA_EVAL;
  var THREAD_TYPE_DEBUGGER_EVAL = thread_type.DEBUGGER_EVAL;

  var script_type = ProfilerService.ScriptType;
  var SCRIPT_TYPE_UNKNOWN = script_type.UNKNOWNM
  var SCRIPT_TYPE_LINKED = script_type.LINKED;
  var SCRIPT_TYPE_INLINE = script_type.INLINE;
  var SCRIPT_TYPE_GENERATED = script_type.GENERATED;
  var SCRIPT_TYPE_EVAL = script_type.EVAL;
  var SCRIPT_TYPE_TIMEOUT = script_type.TIMEOUT;
  var SCRIPT_TYPE_URI = script_type.URI;
  var SCRIPT_TYPE_EVENT_HANDLER = script_type.EVENT_HANDLER;
  var SCRIPT_TYPE_USERJS = script_type.USERJS;
  var SCRIPT_TYPE_BROWSERJS = script_type.BROWSERJS;
  var SCRIPT_TYPE_EXTENSIONJS = script_type.EXTENSIONJS;
  var SCRIPT_TYPE_DEBUGGER = script_type.DEBUGGER;

  // TODO: use ui strings
  var type_string_map = {};
  type_string_map[TYPE_GENERIC] = "Generic";
  type_string_map[TYPE_PROCESS] = "Process";
  type_string_map[TYPE_DOCUMENT_PARSING] = "Document parsing";
  type_string_map[TYPE_CSS_PARSING] = "CSS parsing";
  type_string_map[TYPE_SCRIPT_COMPILATION] = "Script compilation";
  type_string_map[TYPE_THREAD_EVALUATION] = "Thread evaluation";
  type_string_map[TYPE_REFLOW] = "Reflow";
  type_string_map[TYPE_STYLE_RECALCULATION] = "Style recalculation";
  type_string_map[TYPE_CSS_SELECTOR_MATCHING] = "CSS selector matching";
  type_string_map[TYPE_LAYOUT] = "Layout";
  type_string_map[TYPE_PAINT] = "Paint";

  var thread_type_string_map = {};
  thread_type_string_map[THREAD_TYPE_UNKNOWN] = "Unknown";
  thread_type_string_map[THREAD_TYPE_COMMON] = "Common";
  thread_type_string_map[THREAD_TYPE_TIMEOUT] = "Timeout or interval";
  thread_type_string_map[THREAD_TYPE_EVENT] = "Event";
  thread_type_string_map[THREAD_TYPE_INLINE_SCRIPT] = "Inline script";
  thread_type_string_map[THREAD_TYPE_JAVASCRIPT_URL] = "javascript: URL";
  thread_type_string_map[THREAD_TYPE_HISTORY_NAVIGATION] = "History navigation";
  thread_type_string_map[THREAD_TYPE_JAVA_EVAL] = "Java (LiveConnect)";
  thread_type_string_map[THREAD_TYPE_DEBUGGER_EVAL] = "Debugger";

  var script_type_string_map = {};
  script_type_string_map[SCRIPT_TYPE_UNKNOWN] = "Unknown";
  script_type_string_map[SCRIPT_TYPE_LINKED] = "External";
  script_type_string_map[SCRIPT_TYPE_INLINE] = "Inline";
  script_type_string_map[SCRIPT_TYPE_GENERATED] = "document.write()";
  script_type_string_map[SCRIPT_TYPE_EVAL] = "Eval";
  script_type_string_map[SCRIPT_TYPE_TIMEOUT] = "Timeout or interval";
  script_type_string_map[SCRIPT_TYPE_URI] = "javascript: URL";
  script_type_string_map[SCRIPT_TYPE_EVENT_HANDLER] = "Event";
  script_type_string_map[SCRIPT_TYPE_USERJS] = "UserJS";
  script_type_string_map[SCRIPT_TYPE_BROWSERJS] = "BrowserJS";
  script_type_string_map[SCRIPT_TYPE_EXTENSIONJS] = "Extension";
  script_type_string_map[SCRIPT_TYPE_DEBUGGER] = "Debugger";

  var BAR_MIN_WIDTH = 3; // min-width for .profiler-event
  var BAR_HEIGHT = 18; // offset height of .profiler-timeline-row

  this._order = [
    TYPE_DOCUMENT_PARSING,
    TYPE_CSS_PARSING,
    TYPE_SCRIPT_COMPILATION,
    TYPE_THREAD_EVALUATION,
    TYPE_REFLOW,
    TYPE_STYLE_RECALCULATION,
    TYPE_LAYOUT,
    TYPE_PAINT
  ];
  this._expandables = [TYPE_STYLE_RECALCULATION];
  this._event_colors = {}; // Will be populated lazily

  this.main = function(has_details_events, legend, timeline, details_list, status)
  {
    return [
      ["div",
         legend,
       "class", "profiler-legend"
      ],
      ["div",
         timeline,
       "class", "profiler-timeline",
       "handler", "profiler-zoom-timeline"
      ],
      ["div",
         details_list,
       "class", "profiler-details-list" + (has_details_events ? "" : " profiler-no-status")
      ],
      (has_details_events
       ? ["div",
            status,
          "class", "profiler-status"
         ]
       : []
      )
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
          var percentage = 100 - Math.round(event.time / total_time * 100);
          template[index] =
            ["div",
               ["span",
                  type_string_map[event.type] + " ",
                "class", "profiler-legend-label"
               ],
               ["span",
                  this.format_time(event.time),
                "class", "profiler-legend-amount"
               ],
             "class", "profiler-legend-row profiler-timeline-row" + (index % 2 ? " odd" : ""),
             "data-event-type", String(event.type),
             "handler", "profiler-event",
             "style", "background-image: -o-linear-gradient(0deg," +
                                                           "transparent " + percentage + "%," +
                                                           "rgba(118, 159, 225, 0.90) 100%);"
            ];
        }
      }, this);
      return template;
    }
  };

  this.timeline_markers = function(width, start, duration, ms_unit)
  {
    var MIN_MARKER_GAP = 120;
    var MIN_MARKERS = 2;
    var cell_amount = Math.max(MIN_MARKERS, Math.round(width / MIN_MARKER_GAP));
    var marker_time = duration / cell_amount;
    var fractions = marker_time < 10 ? 1 : 0;
    var template = [];
    for (var i = 0; i < cell_amount; i++)
    {
      var left = Math.round(marker_time * i * ms_unit);
      var time = (marker_time * i) + start;
      if (time === 0)
        fractions = 0;
      template.push(
        ["div",
         "class", "profiler-timeline-marker",
         "style", "left:" + left + "px"
        ],
        ["div",
           time.toFixed(fractions) + " ms",
         "class", "profiler-timeline-marker-time" + (i === 0 ? " first" : ""),
         "style", "left:" + left + "px"
        ]
      );
    }

    template.push(
      ["div",
         (start + duration).toFixed(fractions) + " ms",
       "class", "profiler-timeline-marker-time last",
       "style", "right:2px"
      ]
    );

    return template;
  };

  this.event_list_all = function(events, selected_id, container_width, start, end)
  {
    var template = [];
    var event_list = events && events.eventList;
    if (event_list && event_list.length)
    {
      var interval_start = start || 0;
      var interval_end = events.interval.end;
      var duration = interval_end - interval_start;
      var ms_unit = (container_width - BAR_MIN_WIDTH) / duration;

      // Add time markers
      template.push(this.timeline_markers(container_width, interval_start, duration, ms_unit));

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
        var self_time = Math.max(BAR_MIN_WIDTH, Math.round(event.time * ms_unit));
        var event_start = Math.round((event.interval.start - interval_start) * ms_unit);
        var column = this._order.indexOf(event.type);
        var is_expandable = this._expandables.indexOf(event.type) != -1 && event.childCount > 1;
        var color = this._event_colors[event.type] || (this._event_colors[event.type] = this._get_color_for_type(event.type));
        template.push(
          ["div",
           "style",
             "width: " + interval + "px;" +
             "left: " + event_start + "px;" +
             "top:" + ((column * BAR_HEIGHT) + 1) + "px;" +
             "background-image: -o-linear-gradient(90deg,transparent 0, rgba(255,255,255,.25) 100%), " +
                               "-o-linear-gradient(0," + color + " 0," +
                                                  color + " " + self_time + "px," +
                                                  "transparent " + self_time + "px);",
           "class", "profiler-event profiler-event-interval event-type-" + event.type +
                    (event.eventID == selected_id ? " selected" : ""),
           "data-event-id", String(event.eventID),
           "data-event-type", String(event.type),
           "handler", "profiler-event",
           "data-isexpandable", String(is_expandable),
           "data-tooltip", "profiler-event"
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
           "handler", "profiler-event"
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
    return ["div", "Total self time: " + this.format_time(time)];
  };

  this.no_events = function()
  {
    return ["div", "No event details", "class", "profiler-empty"];
  };

  this.format_time = function(time, ms_fractions)
  {
    var unit = "ms";
    var fractions = ms_fractions || time < 1 ? 1 : 0;
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
    return (
      ["div",
        ["h2",
           type_string_map[event.type]
        ],
        ["div",
          this.get_title_interval_bar(event),
          ["ul",
             ["li",
                "Start: " + this.format_time(event.interval.start)
             ],
             ["li",
                "Duration: " + this.format_time(event.interval.end - event.interval.start)
             ],
             ["li",
                "Self time: " + this.format_time(event.time)
             ],
             (details
              ? details
              : []
             )
          ],
         "class", "profiler-event-tooltip-info"
        ],
       "class", "profiler-event-tooltip"
      ]
    );
  };

  this.get_title_aggregated = function(event)
  {
    return this.format_time(event.time);
  };

  this.get_title_unique_events = function(event)
  {
    var details = this.get_details_title(event);
    return type_string_map[event.type] + "," +
           " self time: " + this.format_time(event.time) +
           " [" + event.hits + " hits" +
             (details ? details : []) +
           "]";
  };

  this.get_details_title = function(event)
  {
    switch (event.type)
    {
    case TYPE_CSS_SELECTOR_MATCHING:
      return (
        ["li",
           "Selector: " + event.cssSelectorMatching.selector
        ]
      );

    case TYPE_THREAD_EVALUATION:
      var title = [];
      var thread_type = event.threadEvaluation.threadType;
      var event_name = event.threadEvaluation.eventName;

      if (thread_type)
      {
        title.push(["li",
                      "Thread type: " + thread_type_string_map[thread_type]
                   ]);
      }

      if (event_name)
      {
        title.push(["li",
                      "Event type: " + event_name
                   ]);
      }

      return title;

    case TYPE_DOCUMENT_PARSING:
      var url = event.documentParsing.url;
      return url
           ? ["li",
                "URL: " + url
             ]
           : [];

    case TYPE_CSS_PARSING:
      var url = event.cssParsing.url;
      return url
           ? ["li",
                "URL: " + url
             ]
           : [];

    case TYPE_SCRIPT_COMPILATION:
      var title = [];
      var url = event.scriptCompilation.url;
      var script_type = event.scriptCompilation.scriptType;

      if (url)
      {
        title.push(["li",
                      "URL: " + url
                   ]);
      }

      if (script_type)
      {
        title.push(["li",
                      "Script type: " + script_type_string_map[script_type]
                   ]);
      }

      return title;

    case TYPE_PAINT:
      var area = event.paint.area;
      return (
        [
          ["li",
             "Location: " + area.x + ", " + area.y
          ],
          ["li",
             "Area: " + area.w + "×" + area.h
          ]
        ]
      );
    }
    return [];
  };

  this.get_title_interval_bar = function(event)
  {
    var WIDTH = 200;
    var interval = event.interval.end - event.interval.start;
    var ms_unit = WIDTH / interval;
    var self_time = Math.round(event.time * ms_unit);
    var color = this._event_colors[event.type] || (this._event_colors[event.type] = this._get_color_for_type(event.type));
    return (
      ["div",
       "style",
         "width: " + WIDTH + "px; " +
         "background-image: -o-linear-gradient(90deg,transparent 0, rgba(255,255,255,.25) 100%), " +
                           "-o-linear-gradient(0," + color + " 0," +
                                              color + " " + self_time + "px," +
                                              "transparent " + self_time + "px);",
       "class", "profiler-event profiler-event-interval event-type-" + event.type
      ]
    );
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

  this._get_color_for_type = function(type)
  {
    return document.styleSheets.getDeclaration(".event-type-" + type + "-selftime").backgroundColor;
  };

  this._tabledefs = {};
  // TODO: implement sorters. E.g. hits should sort by hits and then by time
  this._tabledefs[TYPE_CSS_SELECTOR_MATCHING] = {
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
};

