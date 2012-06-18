"use strict";

/**
 * @constructor
 */
var ProfilerTemplates = function()
{
  var event_type = ProfilerService.EventType;
  var EVENT_TYPE_GENERIC = event_type.GENERIC;
  var EVENT_TYPE_PROCESS = event_type.PROCESS;
  var EVENT_TYPE_DOCUMENT_PARSING = event_type.DOCUMENT_PARSING;
  var EVENT_TYPE_CSS_PARSING = event_type.CSS_PARSING;
  var EVENT_TYPE_SCRIPT_COMPILATION = event_type.SCRIPT_COMPILATION;
  var EVENT_TYPE_THREAD_EVALUATION = event_type.THREAD_EVALUATION;
  var EVENT_TYPE_REFLOW = event_type.REFLOW;
  var EVENT_TYPE_STYLE_RECALCULATION = event_type.STYLE_RECALCULATION;
  var EVENT_TYPE_CSS_SELECTOR_MATCHING = event_type.CSS_SELECTOR_MATCHING;
  var EVENT_TYPE_LAYOUT = event_type.LAYOUT;
  var EVENT_TYPE_PAINT = event_type.PAINT;

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

  var event_type_string_map = {};
  event_type_string_map[EVENT_TYPE_GENERIC] = ui_strings.S_EVENT_TYPE_GENERIC;
  event_type_string_map[EVENT_TYPE_PROCESS] = ui_strings.S_EVENT_TYPE_PROCESS;
  event_type_string_map[EVENT_TYPE_DOCUMENT_PARSING] = ui_strings.S_EVENT_TYPE_DOCUMENT_PARSING;
  event_type_string_map[EVENT_TYPE_CSS_PARSING] = ui_strings.S_EVENT_TYPE_CSS_PARSING;
  event_type_string_map[EVENT_TYPE_SCRIPT_COMPILATION] = ui_strings.S_EVENT_TYPE_SCRIPT_COMPILATION;
  event_type_string_map[EVENT_TYPE_THREAD_EVALUATION] = ui_strings.S_EVENT_TYPE_THREAD_EVALUATION;
  event_type_string_map[EVENT_TYPE_REFLOW] = ui_strings.S_EVENT_TYPE_REFLOW;
  event_type_string_map[EVENT_TYPE_STYLE_RECALCULATION] = ui_strings.S_EVENT_TYPE_STYLE_RECALCULATION;
  event_type_string_map[EVENT_TYPE_CSS_SELECTOR_MATCHING] = ui_strings.S_EVENT_TYPE_CSS_SELECTOR_MATCHING;
  event_type_string_map[EVENT_TYPE_LAYOUT] = ui_strings.S_EVENT_TYPE_LAYOUT;
  event_type_string_map[EVENT_TYPE_PAINT] = ui_strings.S_EVENT_TYPE_PAINT;

  var thread_type_string_map = {};
  thread_type_string_map[THREAD_TYPE_UNKNOWN] = ui_strings.S_THREAD_TYPE_UNKNOWN;
  thread_type_string_map[THREAD_TYPE_COMMON] = ui_strings.S_THREAD_TYPE_COMMON;
  thread_type_string_map[THREAD_TYPE_TIMEOUT] = ui_strings.S_THREAD_TYPE_TIMEOUT;
  thread_type_string_map[THREAD_TYPE_EVENT] = ui_strings.S_THREAD_TYPE_EVENT;
  thread_type_string_map[THREAD_TYPE_INLINE_SCRIPT] = ui_strings.S_THREAD_TYPE_INLINE_SCRIPT;
  thread_type_string_map[THREAD_TYPE_JAVASCRIPT_URL] = ui_strings.S_THREAD_TYPE_JAVASCRIPT_URL;
  thread_type_string_map[THREAD_TYPE_HISTORY_NAVIGATION] = ui_strings.S_THREAD_TYPE_HISTORY_NAVIGATION;
  thread_type_string_map[THREAD_TYPE_JAVA_EVAL] = ui_strings.S_THREAD_TYPE_JAVA_EVAL;
  thread_type_string_map[THREAD_TYPE_DEBUGGER_EVAL] = ui_strings.S_THREAD_TYPE_DEBUGGER_EVAL;

  var script_type_string_map = {};
  script_type_string_map[SCRIPT_TYPE_UNKNOWN] = ui_strings.S_SCRIPT_TYPE_UNKNOWNM
  script_type_string_map[SCRIPT_TYPE_LINKED] = ui_strings.S_SCRIPT_TYPE_LINKED;
  script_type_string_map[SCRIPT_TYPE_INLINE] = ui_strings.S_SCRIPT_TYPE_INLINE;
  script_type_string_map[SCRIPT_TYPE_GENERATED] = ui_strings.S_SCRIPT_TYPE_GENERATED;
  script_type_string_map[SCRIPT_TYPE_EVAL] = ui_strings.S_SCRIPT_TYPE_EVAL;
  script_type_string_map[SCRIPT_TYPE_TIMEOUT] = ui_strings.S_SCRIPT_TYPE_TIMEOUT;
  script_type_string_map[SCRIPT_TYPE_URI] = ui_strings.S_SCRIPT_TYPE_URI;
  script_type_string_map[SCRIPT_TYPE_EVENT_HANDLER] = ui_strings.S_SCRIPT_TYPE_EVENT_HANDLER;
  script_type_string_map[SCRIPT_TYPE_USERJS] = ui_strings.S_SCRIPT_TYPE_USERJS;
  script_type_string_map[SCRIPT_TYPE_BROWSERJS] = ui_strings.S_SCRIPT_TYPE_BROWSERJS;
  script_type_string_map[SCRIPT_TYPE_EXTENSIONJS] = ui_strings.S_SCRIPT_TYPE_EXTENSIONJS;
  script_type_string_map[SCRIPT_TYPE_DEBUGGER] = ui_strings.S_SCRIPT_TYPE_DEBUGGER;

  var BAR_MIN_WIDTH = 3; // min-width for .profiler-event
  var BAR_HEIGHT = 18; // offset height of .profiler-timeline-row

  this._order = [
    EVENT_TYPE_DOCUMENT_PARSING,
    EVENT_TYPE_CSS_PARSING,
    EVENT_TYPE_SCRIPT_COMPILATION,
    EVENT_TYPE_THREAD_EVALUATION,
    EVENT_TYPE_REFLOW,
    EVENT_TYPE_STYLE_RECALCULATION,
    EVENT_TYPE_LAYOUT,
    EVENT_TYPE_PAINT
  ];
  this._expandables = [EVENT_TYPE_STYLE_RECALCULATION];
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
      ["div",
         status,
       "class", "profiler-status " + (has_details_events ? "" : " profiler-no-status")
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
          var percentage = 100 - Math.round(event.time / total_time * 100);
          template[index] =
            ["div",
               ["span",
                  event_type_string_map[event.type] + " ",
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
       "class", "profiler-timeline-marker-time last"
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

      // Background bars
      this._order.forEach(function(row, idx) {
        template.push(
          ["div",
           "class", "profiler-timeline-row" + (idx % 2 ? " odd" : "")
          ]
        );
      });

      // Add time markers
      template.push(this.timeline_markers(container_width, interval_start, duration, ms_unit));

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
                    (event.eventID == selected_id ? " selected" : "") +
                    (is_expandable ? " expandable" : " non-expandable"),
           "data-event-id", String(event.eventID),
           "data-event-type", String(event.type),
           "handler", "profiler-event",
           "data-tooltip", "profiler-event"
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
    return ["div", ui_strings.S_PROFILER_TOTAL_SELF_TIME + ": " + this.format_time(time)];
  };

  this.no_events = function()
  {
    return ["div", ui_strings.S_PROFILER_NO_DETAILS, "class", "profiler-empty"];
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
           event_type_string_map[event.type]
        ],
        ["div",
          this.get_title_interval_bar(event),
          ["ul",
             ["li",
                ui_strings.S_PROFILER_START_TIME + ": " + this.format_time(event.interval.start)
             ],
             ["li",
                ui_strings.S_PROFILER_DURATION + ": " + this.format_time(event.interval.end - event.interval.start)
             ],
             ["li",
                ui_strings.S_PROFILER_SELF_TIME + ": " + this.format_time(event.time)
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

  this.get_details_title = function(event)
  {
    switch (event.type)
    {
    case EVENT_TYPE_CSS_SELECTOR_MATCHING:
      return (
        ["li",
           ui_strings.S_PROFILER_TYPE_SELECTOR + ": " + event.cssSelectorMatching.selector
        ]
      );

    case EVENT_TYPE_THREAD_EVALUATION:
      var title = [];
      var thread_type = event.threadEvaluation.threadType;
      var event_name = event.threadEvaluation.eventName;

      if (thread_type)
      {
        title.push(["li",
                      ui_strings.S_PROFILER_TYPE_THREAD + ": " + thread_type_string_map[thread_type]
                   ]);
      }

      if (event_name)
      {
        title.push(["li",
                      ui_strings.S_PROFILER_TYPE_EVENT + ": " + event_name
                   ]);
      }

      return title;

    case EVENT_TYPE_DOCUMENT_PARSING:
      var url = event.documentParsing.url;
      return url
           ? ["li",
                "URL: " + url
             ]
           : [];

    case EVENT_TYPE_CSS_PARSING:
      var url = event.cssParsing.url;
      return url
           ? ["li",
                "URL: " + url
             ]
           : [];

    case EVENT_TYPE_SCRIPT_COMPILATION:
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
                      ui_strings.S_PROFILER_TYPE_SCRIPT + ": " + script_type_string_map[script_type]
                   ]);
      }

      return title;

    case EVENT_TYPE_PAINT:
      var area = event.paint.area;
      return (
        [
          ["li",
             ui_strings.S_PROFILER_AREA_LOCATION + ": " + area.x + ", " + area.y
          ],
          ["li",
             ui_strings.S_PROFILER_AREA_DIMENSION + ": " + area.w + "×" + area.h
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
          ui_strings.S_PROFILER_RELOAD,
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
  this._tabledefs[EVENT_TYPE_CSS_SELECTOR_MATCHING] = {
    column_order: ["selector", "time", "hits"],
    // TODO: ui strings
    columns: {
      "selector": {
        label: ui_strings.S_PROFILER_TYPE_SELECTOR,
      },
      "time": {
        label: ui_strings.S_TABLE_HEADER_TIME,
        align: "right",
        renderer: (function(event) {
          return this.format_time(event.time, 1);
        }).bind(this),
        classname: "profiler-details-time"
      },
      "hits": {
        label: ui_strings.S_TABLE_HEADER_HITS,
        align: "right",
        renderer: function(event) {
          return String(event.hits);
        },
        classname: "profiler-details-hits"
      }
    }
  };
};

