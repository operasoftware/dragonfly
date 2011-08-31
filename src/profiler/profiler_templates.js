window.templates || (window.templates = {});
window.templates.profiler = {};

(function() {

const GENERIC = cls.ProfilerService.GENERIC;
const PROCESS = cls.ProfilerService.PROCESS;
const DOCUMENT_PARSING = cls.ProfilerService.DOCUMENT_PARSING;
const CSS_PARSING = cls.ProfilerService.CSS_PARSING;
const SCRIPT_COMPILATION = cls.ProfilerService.SCRIPT_COMPILATION;
const THREAD_EVALUATION = cls.ProfilerService.THREAD_EVALUATION;
const REFLOW = cls.ProfilerService.REFLOW;
const STYLE_RECALCULATION = cls.ProfilerService.STYLE_RECALCULATION;
const CSS_SELECTOR_MATCHING = cls.ProfilerService.CSS_SELECTOR_MATCHING;
const LAYOUT = cls.ProfilerService.LAYOUT;
const PAINT = cls.ProfilerService.PAINT;

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

const BAR_MIN_WIDTH = 5;
const BAR_HEIGHT = 11;

// TODO: rename parameters
window.templates.profiler.main = function(aggregated_events, timeline, details_list, status)
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

window.templates.profiler.event_list_all = function(event_list, container_width)
{
  var ret = [];
  var order = [GENERIC, DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION,
               THREAD_EVALUATION, REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];

  if (event_list && event_list.eventList && event_list.eventList[0])
  {
    // Calculate scaling, to fit all events into the view.
    // We first calculate a prelimiary scaling, to know the width
    // if the last event. We then calculate the real scaling where
    // the width of the last event is taken into account
    var start = event_list.interval.start;
    var interval = event_list.interval.end - start;
    var ms_unit = container_width / interval;
    var last_event = event_list.eventList.slice(-1)[0];
    var extra_width = Math.max(BAR_MIN_WIDTH,
                           Math.round((last_event.interval.end -
                                       last_event.interval.start) *
                                       ms_unit));
    ms_unit = (container_width - extra_width) / interval;


    event_list.eventList.forEach(function(event) {
      // TODO: rename to interval, rename current interval
      var width = Math.max(BAR_MIN_WIDTH,
                           Math.round((event.interval.end -
                                       event.interval.start) *
                                       ms_unit));
      var time = Math.max(BAR_MIN_WIDTH, Math.round(event.time * ms_unit));
      var event_start = Math.round((event.interval.start - start) * ms_unit);
      var column = order.indexOf(event.type);
      var top = column * BAR_HEIGHT;
      var title = get_title_all(event);
      ret.push(["div",
          ["div",
            "style", "width: " + time + "px;",
            "class", "profiler-event profiler-timeline-selftime event-type-" + event.type,
            "data-event-id", String(event.eventID),
            "data-event-type", String(event.type),
            "handler", "profiler-get-event-details"
          ],
          "style",
            "width: " + width + "px;" +
            "left: " + event_start + "px;" +
            "top:" + top + "px;",
          "title", title,
          "class", "profiler-event profiler-event-interval event-type-" + event.type,
          "data-event-id", String(event.eventID),
          "data-event-type", String(event.type),
          "handler", "profiler-get-event-details"
        ]
      )
    });
  }
  else
  {
    ret = ["div", "No events"];
  }
  return ret;
};

window.templates.profiler.event_list_unique_types = function(event_list, container_width)
{
  var ret = [];
  if (event_list && event_list.eventList && event_list.eventList[0])
  {
    // Sort by longest time
    event_list.eventList.sort(function(a, b) {
      return b.time - a.time;
    });

    var start = event_list.interval.start;
    var interval = event_list.interval.end - start;
    var ms_unit = container_width / interval;

    event_list.eventList.forEach(function(event, idx) {
      var width = Math.max(BAR_MIN_WIDTH, Math.round(event.time * ms_unit));
      ret.push(["div",
        "style",
          "width: " + width + "px;" +
          "top:" + (idx * BAR_HEIGHT) + "px;",
        "title", get_title_unique_types(event),
        "class", "profiler-event event-type-" + event.type,
        "data-event-id", String(event.eventID),
        "data-event-type", String(event.type),
        "handler", "profiler-get-event-details"
      ]);
    });
  }
  return ret;
};

window.templates.profiler.event_list_aggregated = function(event_list)
{
  var ret = [];
  if (event_list && event_list.eventList && event_list.eventList[0])
  {
    // Sort by longest time
    event_list.eventList.sort(function(a, b) {
      return b.time - a.time;
    });

    var data = event_list.eventList.map(function(event) {
      return {
        amount: event.time,
        data: {
          title: get_title_unique_types(event),
          class_name: "event-type-" + event.type,
          event_type: String(event.type)
        }
      };
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

window.templates.profiler.event_list_unique_events = function(event_list, container_width)
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

    var t = 0;
    event_list.eventList.forEach(function(event, idx) {
      var width = Math.max(BAR_MIN_WIDTH, Math.round(event.time * ms_unit));
      t += event.time;
      ret.push(["div",
        "style",
          "width: " + width + "px;" +
          "top:" + (idx * BAR_HEIGHT) + "px;",
        "title", get_title_unique_events(event),
        "class", "profiler-event event-type-" + event.type,
        "data-event-id", String(event.eventID),
        "data-event-type", String(event.type),
        "handler", "profiler-get-event-details"
      ]);
    });
  }

  return ret;
};

window.templates.profiler.details = function(table)
{
  return table && table.render() || window.templates.profiler.no_events();
};

window.templates.profiler.status = function(time)
{
  return ["div", "Total time: " + time];
};

window.templates.profiler.no_events = function()
{
  return ["div", "No event details", "class", "profiler-no-events"];
};

// Helper functions

function get_title_all(event)
{
  var details = get_details_title(event);
  return type_map[event.type] + ", " +
         format_time(event.interval.end - event.interval.start) +
         " (self-time: " + format_time(event.time) + ") at " +
         format_time(event.interval.start) +
         (details ? " [" + details + "]" : "");
}

function get_title_unique_types(event)
{
  return type_map[event.type] + ", " +
         format_time(event.time);
}

function get_title_unique_events(event)
{
  var details = get_details_title(event);
  return type_map[event.type] + "," +
         " self-time: " + format_time(event.time) +
         " [" + event.hits + " hits" +
           (details ? ", " + details : "") +
         "]";
}

function get_details_title(event)
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

function format_time(time)
{
  var unit = "ms";
  var fractions = 1;
  if (time >= 1000) // if at least on second
  {
    time /= 1000;
    unit = "s";
    fractions = 3;
  }
  return time.toFixed(fractions) + " " + unit;
}

})();

