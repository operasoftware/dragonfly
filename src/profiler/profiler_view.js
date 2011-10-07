window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ProfilerView = function(id, name, container_class, html, default_handler) {
  this._profiler = new cls.ProfilerService();
  this._current_session_id = null;
  this._current_timeline_id = null;
  this._event_id = null;
  this._event_type = null;
  this._templates = window.templates.profiler;
  this._details_time = 0;
  this._timeline_list = [];
  this._aggregated_list = [];
  this._reduced_list = [];

  // Event types
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

  // Modes
  const MODE_ALL = 1;
  const MODE_REDUCE_UNIQUE_TYPES = 2;
  const MODE_REDUCE_UNIQUE_EVENTS = 3;
  const MODE_REDUCE_ALL = 4;

  const SESSION_ID = 0;
  const TIMELINE_LIST = 2;
  const TIMELINE_ID = 0;

  // Parent-children relationships
  this._children = {};
  this._children[STYLE_RECALCULATION] = [CSS_SELECTOR_MATCHING];

  this._tabledefs = {};
  // TODO: implements sorters. E.g. hits should sort by hits and then by time
  this._tabledefs[CSS_SELECTOR_MATCHING] = {
    column_order: ["selector", "time", "hits"],
    // TODO: ui strings
    columns: {
      selector: {
        label: "Selector"
      },
      time: {
        label: "Time",
        align: "right",
        renderer: function(event) {
          return format_time(event.time);
        },
        classname: "profiler-details-time"
      },
      hits: {
        label: "Hits",
        align: "right",
        renderer: function(event) {
          return String(event.hits);
        },
        classname: "profiler-details-hits"
      }
    }
  };

  this._default_types = [GENERIC, PROCESS, DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION,
                         THREAD_EVALUATION, REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];

  this._init = function(id, name, container_class, html, default_handler)
  {
    ViewBase.init.call(this, id, name, container_class, html, default_handler);
  };

  // TODO: this is also in templates, should not be in both
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

  this._start_profiler = function(container)
  {
    this._container.clearAndRender(this._templates.empty("Profiling"));
    this._profiler.start_profiler(null, null, (function(status, msg) {
      this._current_session_id = msg[SESSION_ID];
    }).bind(this));
  };

  this._stop_profiler = function(container)
  {
    this._container.clearAndRender(this._templates.empty("Stopped profiling. Calculating..."));
    this._profiler.stop_profiler(this._current_session_id, this._handle_stop_profiler.bind(this));
  };

  this._handle_stop_profiler = function(status, msg)
  {
    if (status == 0)
    {
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
    this._aggregated_list.eventList.push(this._reduced_list.eventList[1]);
    this._update_view();
  };


  this._update_view = function()
  {
    this._container.clearAndRender(
        this._timeline_list.eventList && this._timeline_list.eventList[0]
        ? this._templates.main(this._templates.event_list_aggregated(this._aggregated_list),
                               this._templates.event_list_all(this._timeline_list, this._container.clientWidth - 120), // FIXME: don't hardcode
                               this._templates.details(this._table),
                               this._templates.status(format_time(this._details_time)))
        : this._templates.empty("Press the “Start profiling” button to start profiling")
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
      this._table = null;
      this._details_time = 0;
      this._update_view();
    }
  };

  this._handle_details_list = function(status, msg)
  {
    var sortby = this._table ? this._table.sortby : "time";
    var reversed = this._table && this._table.reversed;
    this._table = new SortableTable(this._tabledefs[CSS_SELECTOR_MATCHING],
                                    null,
                                    this._tabledefs[CSS_SELECTOR_MATCHING].column_order,
                                    sortby,
                                    null,
                                    reversed);
    this._table.data = this._get_top_list_data(new cls.Profiler["1.0"].EventList(msg));
    this._details_time = this._table.data.reduce(function(prev, curr) {
      return prev + curr.time;
    }, 0);
    this._update_view();
  };

  this._get_top_list_data = function(event_list)
  {
    var data = event_list.eventList.map(function(event) {
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

  window.eventHandlers.click["profiler-start-stop"] = this._start_stop_profiler.bind(this);
  window.eventHandlers.click["profiler-get-event-details"] = this._get_event_details.bind(this);

  this._init(id, name, container_class, html, default_handler);
};
cls.ProfilerView.prototype = ViewBase;

cls.ProfilerView.create_ui_widgets = function()
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

