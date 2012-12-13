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

  var style_sheets = document.styleSheets;
  var profiler_event_decl = style_sheets.getDeclaration(".profiler-event");
  var profiler_event_small_decl = style_sheets.getDeclaration(".profiler-event-small");
  var profiler_timeline_row_decl = style_sheets.getDeclaration(".profiler-timeline-row");
  var EVENT_MIN_WIDTH = profiler_event_decl ? parseInt(profiler_event_decl.minWidth) : 1;
  var EVENT_SMALL_MIN_WIDTH = profiler_event_small_decl ? parseInt(profiler_event_small_decl.minWidth) : 1;
  var EVENT_HEIGHT = profiler_timeline_row_decl
                   ? (parseInt(profiler_timeline_row_decl.height) +
                      parseInt(profiler_timeline_row_decl.paddingTop) +
                      parseInt(profiler_timeline_row_decl.paddingBottom))
                   : 1;
  var EVENT_SMALL_HEIGHT = profiler_event_small_decl ? parseInt(profiler_event_small_decl.height) : 1;

  var MIN_DURATION = ProfilerView.MIN_DURATION;

  var HAS_UNPREFIXED_GRADIENTS = (function() {
    var ele = document.createElement("div");
    ele.style.backgroundImage = "-o-linear-gradient(0, transparent 0, transparent 0)";
    return ele.style.backgroundImage === "";
  }());

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

  this.legend = function(event_list)
  {
    if (event_list)
    {
      var template = [];
      var total_time = event_list.reduce(function(prev, curr) {
        return prev + curr.time;
      }, 0);
      event_list.forEach(function(event, index) {
        var self_time_amount = total_time
                             ? event.time / total_time * 100
                             : 0;
        template.push(
          ["div",
            ["div",
              ["span",
                 event_type_string_map[event.type],
               "class", "profiler-legend-label"
              ],
              ["span",
                 this.format_time(event.time, 0),
               "class", "profiler-legend-time"
              ],
             "class", "profiler-legend-row"
            ],
           "class", "profiler-timeline-row" + (index % 2 ? "" : " even"),
           "data-event-type", String(event.type),
           "handler", "profiler-event"
          ]
        );
      }, this);
      return template;
    }
  };

  this.timeline_markers = function(interval_start, interval_end, container_width)
  {
    var MIN_MARKER_GAP = 80;
    var MIN_MARKERS = 2;
    var duration = Math.max(interval_end - interval_start, MIN_DURATION);
    var ms_unit = (container_width - EVENT_MIN_WIDTH) / duration;
    var cell_amount = Math.max(MIN_MARKERS, Math.round(container_width / MIN_MARKER_GAP));
    var marker_time = duration / cell_amount;
    var fractions = marker_time < 10 ? 1 : 0;
    var template = [];
    for (var i = 0; i < cell_amount; i++)
    {
      var left = Math.round(marker_time * i * ms_unit);
      var time = (marker_time * i) + interval_start;
      if (time === 0)
        fractions = 0;
      template.push(
        ["div",
         "class", "profiler-timeline-marker",
         "style", "left: " + left + "px"
        ],
        ["div",
           this.format_time(time, fractions),
         "class", "profiler-timeline-marker-time" + (i === 0 ? " first" : ""),
         "style", "left: " + left + "px"
        ]
      );
    }

    template.push(
      ["div",
         this.format_time(interval_start + duration, fractions),
       "class", "profiler-timeline-marker-time last"
      ]
    );

    return template;
  };

  this.event_list_full = function(event_list, interval_end, container_width)
  {
    var template = [];
    if (event_list)
    {
      var duration = Math.max(interval_end, MIN_DURATION);
      var ms_unit = (container_width - EVENT_SMALL_MIN_WIDTH) / duration;

      template.extend(event_list.map(this._full_timeline_event.bind(this, ms_unit)));
    }
    return template;
  };

  this.event_list_all = function(event_list, interval_start, interval_end, container_width)
  {
    var template = [];
    if (event_list)
    {
      var duration = Math.max(interval_end - interval_start, MIN_DURATION);
      var ms_unit = (container_width - EVENT_MIN_WIDTH) / duration;

      template.extend(event_list.map(this._timeline_event.bind(this, interval_start, ms_unit)));
    }
    return template;
  };

  this._full_timeline_event = function(ms_unit, event)
  {
    var duration = event.interval.end - event.interval.start;
    var width = Math.round(duration * ms_unit); // min-width is specified in .profiler-event-small
    var left = Math.round(event.interval.start * ms_unit);
    var column = this._order.indexOf(event.type);
    return (
      ["div",
       "style",
         "width: " + width + "px; " +
         "left: " + left + "px; " +
         "top: " + (column * EVENT_SMALL_HEIGHT) + "px;",
       "class", "profiler-event-small event-type-" + event.type + "-selftime" // not actually selftime, just using that color
      ]
    );
  };

  this._timeline_event = function(interval_start, ms_unit, event)
  {
    var duration = Math.max(event.interval.end - event.interval.start, MIN_DURATION);
    var self_time_amount = duration
                         ? (event.time / duration * 100).toFixed(2)
                         : 0;
    var width = Math.round(duration * ms_unit); // min-width is specified in .profiler-event
    var left = Math.round((event.interval.start - interval_start) * ms_unit);
    var column = this._order.indexOf(event.type);
    var is_expandable = this._expandables.contains(event.type) && event.childCount > 1;
    var color = this._get_color_for_type(event.type);
    return (
      ["div",
       "style",
         "width: " + width + "px; " +
         "left: " + left + "px; " +
         "top: " + (column * EVENT_HEIGHT) + "px; " +
         (width > 46340 ? ("background-size: " + Math.floor(46340 / width * 100) + "%; ") : "") + // workaround for CORE-48579
         (HAS_UNPREFIXED_GRADIENTS
           ? "background-image: linear-gradient(0deg, transparent 0, rgba(255, 255, 255, .25) 100%), " +
                               "linear-gradient(90deg, " + color + " 0, " +
                                                color + " " + self_time_amount + "%, " +
                                               "transparent " + self_time_amount + "%);"
           : "background-image: -o-linear-gradient(90deg, transparent 0, rgba(255, 255, 255, .25) 100%), " +
                               "-o-linear-gradient(0deg, " + color + " 0, " +
                                                   color + " " + self_time_amount + "%, " +
                                                  "transparent " + self_time_amount + "%);"
         ),
       "id", "profiler-event-" + event.eventID,
       "class", "profiler-event event-type-" + event.type +
                " profiler-event-" + (is_expandable ? "expandable" : "non-expandable"),
       "data-event-id", String(event.eventID),
       "data-event-type", String(event.type),
       "data-tooltip", "profiler-event"
      ]
    );
  };

  this.get_title_interval_bar = function(event)
  {
    var duration = event.interval.end - event.interval.start;
    var self_time_amount = duration
                         ? (event.time / duration * 100).toFixed(2)
                         : 0;
    var color = this._get_color_for_type(event.type);
    return (
      ["div",
       "style",
         "width: 100%; " +
         (HAS_UNPREFIXED_GRADIENTS
           ? "background-image: linear-gradient(0deg, transparent 0, rgba(255, 255, 255, .25) 100%), " +
                               "linear-gradient(90deg, " + color + " 0, " +
                                                color + " " + self_time_amount + "%, " +
                                               "transparent " + self_time_amount + "%);"
           : "background-image: -o-linear-gradient(90deg, transparent 0, rgba(255, 255, 255, .25) 100%), " +
                               "-o-linear-gradient(0deg, " + color + " 0, " +
                                                   color + " " + self_time_amount + "%, " +
                                                  "transparent " + self_time_amount + "%);"
         ),
       "class", "profiler-event event-type-" + event.type
      ]
    );
  };

  this.empty = function(text)
  {
    return ["div", text, "class", "profiler-empty"];
  };

  this.details = function(table)
  {
    return table && table.get_data().length && table.render() || this.empty(ui_strings.S_PROFILER_NO_DETAILS);
  };

  this.status = function(time)
  {
    return ["div", ui_strings.S_PROFILER_TOTAL_SELF_TIME + ": " + this.format_time(time)];
  };

  this.format_time = function(time, fractions)
  {
    fractions = (fractions != null) ? fractions
                                    : (time < 1 ? 2 : 1);
    return time.toFixed(fractions) + " ms";
  };

  this.get_title_all = function(event, range_start)
  {
    return (
      ["div",
        ["h2",
           event_type_string_map[event.type]
        ],
        ["div",
          this.get_title_interval_bar(event),
          ["ul",
             ["li",
                ["span",
                   ui_strings.S_PROFILER_START_TIME + ": ",
                 "class", "profiler-event-tooltip-label"
                ],
                this.format_time(event.interval.start) +
                " (Δ: " + this.format_time(event.interval.start - range_start) + ")"
             ],
             ["li",
                ["span",
                   ui_strings.S_PROFILER_DURATION + ": ",
                 "class", "profiler-event-tooltip-label"
                ],
                this.format_time(event.interval.end - event.interval.start)
             ],
             ["li",
                ["span",
                   ui_strings.S_PROFILER_SELF_TIME + ": ",
                 "class", "profiler-event-tooltip-label"
                ],
                this.format_time(event.time)
             ],
             this.get_details_title(event) || []
          ],
         "class", "profiler-event-tooltip-info"
        ],
       "class", "profiler-event-tooltip"
      ]
    );
  };

  this.get_details_title = function(event)
  {
    switch (event.type)
    {
    case EVENT_TYPE_CSS_SELECTOR_MATCHING:
      return (
        ["li",
           ["span",
              ui_strings.S_PROFILER_TYPE_SELECTOR + ": ",
            "class", "profiler-event-tooltip-label"
           ],
           event.cssSelectorMatching.selector
        ]
      );

    case EVENT_TYPE_THREAD_EVALUATION:
      var title = [];
      var thread_type = event.scriptThreadEvaluation.scriptThreadType;
      var event_name = event.scriptThreadEvaluation.eventName;

      if (thread_type)
      {
        title.push(["li",
                      ["span",
                         ui_strings.S_PROFILER_TYPE_THREAD + ": ",
                       "class", "profiler-event-tooltip-label"
                      ],
                      thread_type_string_map[thread_type]
                   ]);
      }

      if (event_name)
      {
        title.push(["li",
                      ["span",
                         ui_strings.S_PROFILER_TYPE_EVENT + ": ",
                       "class", "profiler-event-tooltip-label"
                      ],
                      event_name
                   ]);
      }

      return title;

    case EVENT_TYPE_DOCUMENT_PARSING:
      var url = event.documentParsing.url;
      return url
           ? ["li",
                ["span",
                   "URL: ",
                 "class", "profiler-event-tooltip-label"
                ],
                url,
              "data-tooltip", "profiler-tooltip-url",
              "data-tooltip-text", url
             ]
           : [];

    case EVENT_TYPE_CSS_PARSING:
      var url = event.cssParsing.url;
      return url
           ? ["li",
                ["span",
                   "URL: ",
                 "class", "profiler-event-tooltip-label"
                ],
                url,
              "data-tooltip", "profiler-tooltip-url",
              "data-tooltip-text", url
             ]
           : [];

    case EVENT_TYPE_SCRIPT_COMPILATION:
      var title = [];
      var url = event.scriptCompilation.url;
      var script_type = event.scriptCompilation.scriptType;

      if (script_type)
      {
        title.push(["li",
                      ["span",
                         ui_strings.S_PROFILER_TYPE_SCRIPT + ": ",
                       "class", "profiler-event-tooltip-label"
                      ],
                      script_type_string_map[script_type]
                   ]);
      }

      if (url)
      {
        title.push(["li",
                      ["span",
                         "URL: ",
                       "class", "profiler-event-tooltip-label"
                      ],
                      url,
                    "data-tooltip", "profiler-tooltip-url",
                    "data-tooltip-text", url
                   ]);
      }

      return title;

    case EVENT_TYPE_PAINT:
      var area = event.paint.area;
      return (
        [
          ["li",
             ["span",
                ui_strings.S_PROFILER_AREA_LOCATION + ": ",
              "class", "profiler-event-tooltip-label"
             ],
             (window.services["profiler"].satisfies_version(1, 1)
              ? "(" + (area.x + area.ox) + ", " + (area.y + area.oy) + ")"
              : "(" + area.x + ", " + area.y + ")"
             )
          ],
          ["li",
             ["span",
                ui_strings.S_PROFILER_AREA_DIMENSION + ": ",
              "class", "profiler-event-tooltip-label"
             ],
             area.w + "×" + area.h
          ]
        ]
      );
    }
    return null;
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
    var color = this._event_colors[type];
    if (color)
      return color;
    var decl = document.styleSheets.getDeclaration(".event-type-" + type + "-selftime");
    color = decl ? decl.backgroundColor : "#000";
    this._event_colors[type] = color;
    return color;
  };
};

