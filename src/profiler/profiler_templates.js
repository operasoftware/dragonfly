window.templates || (window.templates = {});

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

window.templates.event_list_all = function(event_list, container_width)
{
  var ret = [];
  var order = [GENERIC, PROCESS, DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION,
               THREAD_EVALUATION, REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];

  if (event_list && event_list.eventList.length)
  {
    // Calculate scaling, to fit all events into the view
    var start = event_list.interval.start;
    var interval = event_list.interval.end - start;
    var ms_unit = container_width / interval;

    event_list.eventList.forEach(function(event) {
      var width = Math.max(BAR_MIN_WIDTH,
                           Math.round((event.interval.end -
                                       event.interval.start) *
                                       ms_unit));
      var time = Math.round((event.interval.start - start) * ms_unit);
      var column = order.indexOf(event.type);
      ret.push(["div",
        "style",
          "width: " + width + "px;" +
          "left: " + time + "px;" +
          "top:" + (column * BAR_HEIGHT) + "px;",
        "title", get_title_all(event),
        "class", "profiler-event event-type-" + event.type,
        "data-event-id", String(event.eventID),
        "data-event-type", String(event.type),
        "handler", "expand-collapse-event"
      ]);
    });
  }
  return ret;
};

window.templates.event_list_unique_types = function(event_list, container_width)
{
  var ret = [];
  if (event_list && event_list.eventList.length)
  {
    var start = event_list.interval.start;
    var interval = event_list.interval.end - start;
    var ms_unit = container_width / interval;

    debugger;
    event_list.eventList.forEach(function(event) {
      var width = Math.max(BAR_MIN_WIDTH, Math.round(event.time * ms_unit));
      ret.push(["div",
        "style",
          "width: " + width + "px;" +
          "top:" + ((event.type-1) * BAR_HEIGHT) + "px;",
        "title", get_title_unique_types(event),
        "class", "profiler-event event-type-" + event.type,
        "data-event-id", String(event.eventID),
        "handler", "expand-collapse-event"
      ]);
    });
  }
  return ret;
};

window.templates.event_list_unique_events = function(event_list, container_width)
{
  var ret = [];
  if (event_list && event_list.eventList.length)
  {
    var start = event_list.interval.start;
    var interval = event_list.interval.end - start;
    var ms_unit = container_width / interval;

    // Sort by longest time
    event_list.eventList.sort(function(a, b) {
      return b.time - a.time;
    });

    event_list.eventList.forEach(function(event, idx) {
      var width = Math.max(BAR_MIN_WIDTH, Math.round(event.time * ms_unit));
      ret.push(["div",
        "style",
          "width: " + width + "px;" +
          "top:" + (idx * BAR_HEIGHT) + "px;",
        "title", get_title_unique_events(event),
        "class", "profiler-event event-type-" + event.type,
        "data-event-id", String(event.eventID),
        "data-event-type", String(event.type),
        "handler", "expand-collapse-event"
      ]);
    });
  }
  return ret;
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
  return type_map[event.type] + ", " +
         format_time(event.time) + // TODO: interval?
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
    var area = event.paintEvent.area; // TODO: this will be renamed
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

