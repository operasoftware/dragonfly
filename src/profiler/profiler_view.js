"use strict";

/**
 * @constructor
 * @extends ViewBase
 */
var ProfilerView = function(id, name, container_class, html, default_handler)
{
  var SUCCESS = 0;

  var event_types = ProfilerService.EventTypes;
  var TYPE_GENERIC = event_types.GENERIC;
  var TYPE_PROCESS = event_types.PROCESS;
  var TYPE_DOCUMENT_PARSING = event_types.DOCUMENT_PARSING;
  var TYPE_CSS_PARSING = event_types.CSS_PARSING;
  var TYPE_SCRIPT_COMPILATION = event_types.SCRIPT_COMPILATION;
  var TYPE_THREAD_EVALUATION = event_types.THREAD_EVALUATION;
  var TYPE_REFLOW = event_types.REFLOW;
  var TYPE_STYLE_RECALCULATION = event_types.STYLE_RECALCULATION;
  var TYPE_CSS_SELECTOR_MATCHING = event_types.CSS_SELECTOR_MATCHING;
  var TYPE_LAYOUT = event_types.LAYOUT;
  var TYPE_PAINT = event_types.PAINT;

  var modes = ProfilerService.Modes;
  var MODE_ALL = modes.ALL;
  var MODE_REDUCE_UNIQUE_TYPES = modes.REDUCE_UNIQUE_TYPES;
  var MODE_REDUCE_UNIQUE_EVENTS = modes.REDUCE_UNIQUE_EVENTS;
  var MODE_REDUCE_ALL = modes.REDUCE_ALL;

  var SESSION_ID = 0;
  var TIMELINE_LIST = 2;
  var TIMELINE_ID = 0;

  var AGGREGATED_EVENTS_WIDTH = parseInt(document.styleSheets.getDeclaration(".profiler-timeline").left) || 0;

  // Parent-children relationships
  this._children = {};
  this._children[TYPE_STYLE_RECALCULATION] = TYPE_CSS_SELECTOR_MATCHING;

  this._default_types = [
    //TYPE_GENERIC,
    //TYPE_PROCESS,
    TYPE_DOCUMENT_PARSING,
    TYPE_CSS_PARSING,
    TYPE_SCRIPT_COMPILATION,
    TYPE_THREAD_EVALUATION,
    TYPE_REFLOW,
    TYPE_STYLE_RECALCULATION,
    TYPE_LAYOUT,
    TYPE_PAINT
  ];

  this._reset = function()
  {
    this._table = null;
    this._current_session_id = null;
    this._old_session_id = null;
    this._current_timeline_id = null;
    this._event_id = null;
    this._event_type = null;
    this._timeline_list = [];
    this._aggregated_list = [];
    this._reduced_list = [];
    this._details_time = 0;
  };

  this._reset_details = function()
  {
    this._table = null;
    this._details_time = 0;
  };

  this._start_profiler = function()
  {
    this._reset_details();
    this._container.clearAndRender(this._templates.empty("Profiling"));
    this._profiler.start_profiler(null, null, (function(status, msg) {
      this._old_session_id = this._current_session_id;
      this._current_session_id = msg[SESSION_ID];
    }).bind(this));
  };

  this._stop_profiler = function()
  {
    this._container.clearAndRender(this._templates.empty("Calculating…"));
    this._profiler.stop_profiler(this._current_session_id, this._handle_stop_profiler.bind(this));
  };

  this._handle_stop_profiler = function(status, msg)
  {
    if (status === SUCCESS)
    {
      if (this._old_session_id)
        this._profiler.release_session(this._old_session_id);
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
                              this._default_types,
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
                              this._default_types,
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
    var zero_point = this._get_zero_point();
    var has_details_events = this._table && this._table.get_data().length > 0;
    var template = this._timeline_list.eventList && this._timeline_list.eventList[0]
        ? this._templates.main(has_details_events,
                               this._templates.legend(this._aggregated_list),
                               this._templates.event_list_all(this._timeline_list,
                                                              this._event_id,
                                                              this._container.clientWidth - AGGREGATED_EVENTS_WIDTH,
                                                              zero_point),
                               this._templates.details(this._table),
                               this._templates.status(this._details_time))
        : this._templates.empty("Press the Record button to start profiling");
    this._container.clearAndRender(template);
  };

  this.createView = function(container)
  {
    this._container = container;
    this._update_view();
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(this._templates.disabled_view());
  };

  this.ondestroy = function() {};

  this.focus = function() {};

  this.blur = function() {};

  this.onclick = function() {};

  this.onresize = function()
  {
    this._update_view();
  };

  /**
   * Starts the profiler if it's active, or stops it otherwise.
   */
  this._start_stop_profiler = function()
  {
    if (this._profiler.is_active)
      this._stop_profiler();
    else
      this._start_profiler();
  };

  this._show_details_list = function()
  {
    var child_type = this._children[this._event_type];
    if (child_type)
    {
      this._profiler.get_events(this._current_session_id,
                                this._current_timeline_id,
                                MODE_REDUCE_UNIQUE_EVENTS,
                                this._event_id,
                                null,
                                [child_type],
                                null,
                                this._handle_details_list.bind(this, child_type));
    }
    else
    {
      this._reset_details();
      this._update_view();
    }
  };

  this._handle_details_list = function(child_type, status, msg)
  {
    var sortby = this._table ? this._table.sortby : "time";
    var reversed = this._table && this._table.reversed;
    var table_def = this._templates._tabledefs[child_type];
    this._table = new SortableTable(table_def,
                                    null,
                                    table_def.column_order,
                                    sortby,
                                    null,
                                    reversed);
    var data = this._get_top_list_data(new cls.Profiler["1.0"].EventList(msg));
    this._table.set_data(data);
    this._details_time = data.reduce(function(prev, curr) {
      return prev + curr.time;
    }, 0);
    this._update_view();
  };

  this._get_top_list_data = function(events)
  {
    var type = events.eventList && events.eventList[0] && events.eventList[0].type;
    switch (type)
    {
    case TYPE_CSS_SELECTOR_MATCHING:
      return events.eventList.map(function(event) {
        return {
          selector: event.cssSelectorMatching.selector,
          time: event.time,
          hits: event.hits
        };
      });
    }
    return [];
  };

  this._get_event_details = function(event, target)
  {
    this._event_id = Number(target.getAttribute("data-event-id")) || null;
    this._event_type = Number(target.getAttribute("data-event-type"));
    this._show_details_list();
  };

  // TODO: this should not be in the view
  /**
   * Get an event based on its ID. If no event has the ID, returns null.
   *
   * @param {Number} id The id of the event to return
   * @return {Event|null} An event in case one was found with ID `id`,
   *         otherwise `null`.
   */
  this._get_event_by_id = function(id)
  {
    var timeline_list = this._timeline_list;
    var events = timeline_list && timeline_list.eventList;
    if (events)
    {
      for (var i = 0, event; event = events[i]; i++)
      {
        if (event.eventID === id)
          return event;
      }
    }
    return null;
  };

  this._reload_window = function(event, target)
  {
    if (this._current_session_id)
      this._profiler.release_session(this._old_session_id);
    this._reset();
    window.services.scope.enable_profile(window.app.profiles.PROFILER);
  };

  this._on_profile_enabled = function(msg)
  {
    if (msg.profile === window.app.profiles.PROFILER)
      window.runtimes.reloadWindow();
  };

  this._get_zero_point = function()
  {
    return this._has_zero_at_first_event
         ? (this._timeline_list &&
            this._timeline_list.eventList &&
            this._timeline_list.eventList[0] &&
            this._timeline_list.eventList[0].interval.start)
         : 0;
  };

  this._on_settings_changed = function(msg)
  {
    if (msg.id === this.id && msg.key === "zero-at-first-event")
      this._has_zero_at_first_event = msg.value;
  };

  this._on_settings_initialized = function(msg)
  {
    if (msg.view_id === this.id)
      this._has_zero_at_first_event = msg.settings["zero-at-first-event"];
  };

  this._ontooltip = function(event, target)
  {
    var id = Number(target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._get_event_by_id(id);
    if (timeline_event)
    {
      this._tooltip.show(this._templates.get_title_all(timeline_event));
      if (timeline_event.type === TYPE_PAINT)
      {
        var area = timeline_event.paint.area;
        this._overlay.create_overlay(null, {x: area.x, y: area.y, w: area.w, h:area.h});
      }
    }
  };

  this._ontooltiphide = function()
  {
    this._overlay.remove_overlay();
  };

  this._init = function(id, name, container_class, html, default_handler)
  {
    View.prototype.init.call(this, id, name, container_class, html, default_handler);
    this.required_services = ["profiler"];
    this._profiler = new ProfilerService();
    this._overlay = new OverlayService();
    this._templates = new ProfilerTemplates();
    this._has_zero_at_first_event = false;
    this._reset();

    this._tooltip = Tooltips.register("profiler-event", true, false);
    this._tooltip.ontooltip = this._ontooltip.bind(this);
    this._tooltip.onhide = this._ontooltiphide.bind(this);

    this._on_profile_enabled_bound = this._on_profile_enabled.bind(this);
    this._on_settings_changed_bound = this._on_settings_changed.bind(this);
    this._on_settings_initialized_bound = this._on_settings_initialized.bind(this);
    window.messages.addListener("profile-enabled", this._on_profile_enabled_bound);
    window.messages.addListener("setting-changed", this._on_settings_changed_bound);
    window.messages.addListener("settings-initialized", this._on_settings_initialized_bound);

    window.event_handlers.click["profiler-start-stop"] = this._start_stop_profiler.bind(this);
    window.event_handlers.click["profiler-reload-window"] = this._reload_window.bind(this);
    window.event_handlers.click["profiler-get-event-details"] = this._get_event_details.bind(this);
  };

  this._init(id, name, container_class, html, default_handler);
};

ProfilerView.prototype = ViewBase;

ProfilerView.create_ui_widgets = function()
{
  new ToolbarConfig(
    "profiler_all",
    [
      {
        handler: "profiler-start-stop",
        title: "Start profiling" // FIXME: ui string
      }
    ]
  );

  new Settings(
    "profiler_all",
    {
      "zero-at-first-event": false
    },
    {
      "zero-at-first-event": "Change start time to first event"
    }
  );

  new Switches(
    "profiler_all",
    [
      "zero-at-first-event"
    ]
  );
};

