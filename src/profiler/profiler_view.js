"use strict";

/**
 * @constructor
 * @extends ViewBase
 */
var ProfilerView = function(id, name, container_class, html, default_handler)
{
  // Event types
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

  // Modes
  var MODE_ALL = 1;
  var MODE_REDUCE_UNIQUE_TYPES = 2;
  var MODE_REDUCE_UNIQUE_EVENTS = 3;
  var MODE_REDUCE_ALL = 4;

  var SESSION_ID = 0;
  var TIMELINE_LIST = 2;
  var TIMELINE_ID = 0;

  // Parent-children relationships
  this._children = {};
  this._children[STYLE_RECALCULATION] = [CSS_SELECTOR_MATCHING];

  this._default_types = [GENERIC, PROCESS, DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION,
                         THREAD_EVALUATION, REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];

  this._init = function(id, name, container_class, html, default_handler)
  {
    this._profiler = new ProfilerService();
    this._templates = new ProfilerTemplates();
    this._current_session_id = null;
    this._old_session_id = null;
    this._current_timeline_id = null;
    this._event_id = null;
    this._event_type = null;
    this._timeline_list = [];
    this._aggregated_list = [];
    this._reduced_list = [];
    this._details_time = 0;

    View.prototype.init.call(this, id, name, container_class, html, default_handler);
  };

  this._start_profiler = function()
  {
    this._reset_data();
    this._container.clearAndRender(this._templates.empty("Profiling"));
    this._profiler.start_profiler(null, null, (function(status, msg) {
      this._old_session_id = this._current_session_id;
      this._current_session_id = msg[SESSION_ID];
    }).bind(this));
  };

  this._stop_profiler = function()
  {
    this._container.clearAndRender(this._templates.empty("Stopped profiling. Calculating..."));
    this._profiler.stop_profiler(this._current_session_id, this._handle_stop_profiler.bind(this));
  };

  this._handle_stop_profiler = function(status, msg)
  {
    if (status == 0)
    {
      if (this._old_session_id) this._profiler.release_session(this._old_session_id);
      this._current_timeline_id = msg[TIMELINE_LIST][0][TIMELINE_ID];
      this._profiler.get_events(this._current_session_id,
                                this._current_timeline_id,
                                MODE_ALL,
                                null,
                                null,
                                this._default_types,
                                null,
                                this._handle_timeline_list.bind(this));
    }
    else
    {
      this._container.clearAndRender(this._templates.empty("Profiling failed"));
    }
  };

  this._handle_timeline_list = function(status, msg)
  {
    this._timeline_list = new cls.Profiler["1.0"].EventList(msg);
    this._profiler.get_events(this._current_session_id,
                              this._current_timeline_id,
                              MODE_REDUCE_UNIQUE_TYPES,
                              null,
                              null,
                              null,
                              null,
                              this._handle_aggregated_list.bind(this));
  };

  this._handle_aggregated_list = function(status, msg)
  {
    this._aggregated_list = new cls.Profiler["1.0"].EventList(msg);
    this._profiler.get_events(this._current_session_id,
                              this._current_timeline_id,
                              MODE_REDUCE_ALL,
                              null,
                              null,
                              null,
                              null,
                              this._handle_reduced_list.bind(this));
  };

  this._handle_reduced_list = function(status, msg)
  {
    this._reduced_list = new cls.Profiler["1.0"].EventList(msg);
    this._update_view();
  };

  this._update_view = function()
  {
    var AGGREGATED_EVENTS_WIDTH = 240; // FIXME: calculate automatically
    this._container.clearAndRender(
        this._timeline_list.eventList && this._timeline_list.eventList[0]
        ? this._templates.main(this._templates.event_list_aggregated(this._aggregated_list, this._reduced_list.eventList[1]),
                               this._templates.event_list_all(this._timeline_list, this._container.clientWidth - AGGREGATED_EVENTS_WIDTH),
                               this._templates.details(this._table),
                               this._templates.status(this._templates.format_time(this._details_time)))
        : this._templates.empty("Press the Record button to start profiling")
    );
  };

  this.createView = function(container)
  {
    this._container = container;
    this._update_view();
  };

  this.ondestroy = function() {};

  this.focus = function() {};

  this.blur = function() {};

  this.onclick = function() {};

  this.onresize = function()
  {
    this._update_view();
  };

  this._start_stop_profiler = function(event, target)
  {
    !this._profiler.is_active ? this._start_profiler()
                              : this._stop_profiler();
  };

  this._reset_data = function()
  {
    this._table = null;
    this._details_time = 0;
  };

  this._show_details_list = function()
  {
    var children = this._children[this._event_type];
    if (children)
    {
      this._profiler.get_events(this._current_session_id,
                                this._current_timeline_id,
                                MODE_REDUCE_UNIQUE_EVENTS,
                                this._event_id,
                                null,
                                children,
                                null,
                                this._handle_details_list.bind(this));
    }
    else
    {
      this._reset_data();
      this._update_view();
    }
  };

  this._handle_details_list = function(status, msg)
  {
    var sortby = this._table ? this._table.sortby : "time";
    var reversed = this._table && this._table.reversed;
    this._table = new SortableTable(this._templates._tabledefs[CSS_SELECTOR_MATCHING],
                                    null,
                                    this._templates._tabledefs[CSS_SELECTOR_MATCHING].column_order,
                                    sortby,
                                    null,
                                    reversed);
    this._table.data = this._get_top_list_data(new cls.Profiler["1.0"].EventList(msg));
    this._details_time = this._table.data.reduce(function(prev, curr) {
      return prev + curr.time;
    }, 0);
    this._update_view();
  };

  this._get_top_list_data = function(events)
  {
    var data = events.eventList.map(function(event) {
      return {
        selector: event.cssSelectorMatching.selector,
        time: event.time,
        hits: event.hits
      };
    });
    return data || [];
  };

  this._get_event_details = function(event, target)
  {
    this._event_id = parseInt(target.getAttribute("data-event-id")) || null;
    this._event_type = parseInt(target.getAttribute("data-event-type"));
    this._show_details_list();
  };

  this._zoom_timeline = function(event, target)
  {
  };

  window.eventHandlers.click["profiler-start-stop"] = this._start_stop_profiler.bind(this);
  window.eventHandlers.click["profiler-get-event-details"] = this._get_event_details.bind(this);
  window.eventHandlers.mousewheel["profiler-zoom-timeline"] = this._zoom_timeline.bind(this);

  this._init(id, name, container_class, html, default_handler);
};

ProfilerView.prototype = ViewBase;

ProfilerView.create_ui_widgets = function()
{
  new ToolbarConfig
  (
    "profiler_all",
    [
      {
        handler: "profiler-start-stop",
        title: "Start profiling" // FIXME: ui string
      }
    ],
    null,
    null,
    null,
    true
  );
};

