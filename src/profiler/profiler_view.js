"use strict";

/**
 * @constructor
 * @extends ViewBase
 */
var ProfilerView = function(id, name, container_class, html, default_handler)
{
  var SUCCESS = 0;

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

  var mode = ProfilerService.Mode;
  var MODE_ALL = mode.ALL;
  var MODE_REDUCE_UNIQUE_TYPES = mode.REDUCE_UNIQUE_TYPES;
  var MODE_REDUCE_UNIQUE_EVENTS = mode.REDUCE_UNIQUE_EVENTS;
  var MODE_REDUCE_ALL = mode.REDUCE_ALL;

  var SESSION_ID = 0;
  var TIMELINE_LIST = 2;
  var TIMELINE_ID = 0;

  var profiler_timeline_decl = document.styleSheets.getDeclaration(".profiler-timeline");
  var AGGREGATED_EVENTS_WIDTH = profiler_timeline_decl ? parseInt(profiler_timeline_decl.left) : 0;

  // Parent-children relationships
  this._children = {};
  this._children[TYPE_STYLE_RECALCULATION] = TYPE_CSS_SELECTOR_MATCHING;

  this._tabledefs = {};
  this._tabledefs[TYPE_CSS_SELECTOR_MATCHING] = {
    idgetter: function(item) { return item.cssSelectorMatching.selector; },
    column_order: ["selector", "time", "hits"],
    columns: {
      "selector": {
        label: ui_strings.S_PROFILER_TYPE_SELECTOR,
      },
      "time": {
        label: ui_strings.S_TABLE_HEADER_TIME,
        align: "right",
        renderer: (function(event) {
          return this._templates.format_time(event.time);
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

  this._default_types = [
    //TYPE_GENERIC,
    //TYPE_PROCESS,
    TYPE_DOCUMENT_PARSING,
    TYPE_CSS_PARSING,
    TYPE_SCRIPT_COMPILATION,
    TYPE_THREAD_EVALUATION,
    TYPE_REFLOW,
    TYPE_STYLE_RECALCULATION,
    //TYPE_STYLE_SELECTOR_MATCHING,
    TYPE_LAYOUT,
    TYPE_PAINT
  ];

  this._timeline_modes = [
    {id: "_timeline_list", mode: MODE_ALL},
    {id: "_aggregated_list", mode: MODE_REDUCE_UNIQUE_TYPES},
    {id: "_reduced_list", mode: MODE_REDUCE_ALL}
  ];

  this._reset = function()
  {
    this._current_session_id = null;
    this._current_timeline_id = null;
    this._event_id = null;
    this._event_type = null;
    this._timeline_list = null;
    this._aggregated_list = null;
    this._reduced_list = null;
    this._table = null;
    this._details_time = 0;
  };

  this._reset_details = function()
  {
    this._table = null;
    this._details_time = 0;
  };

  this._start_profiler = function()
  {
    this._reset();
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_PROFILING));
    this._profiler.start_profiler(this._handle_start_profiler_bound);
    this._overlay.set_window_id(this._profiler.get_window_id());
  };

  this._handle_start_profiler = function(status, msg)
  {
    if (status === SUCCESS)
    {
      this._old_session_id = this._current_session_id;
      this._current_session_id = msg[SESSION_ID];
    }
    else
    {
      this._show_error_message(msg);
    }
    this._update_record_button_title();
  };

  this._stop_profiler = function()
  {
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_CALCULATING));
    var config = {session_id: this._current_session_id};
    this._profiler.stop_profiler(this._handle_stop_profiler_bound, config);
  };

  this._handle_stop_profiler = function(status, msg)
  {
    if (status === SUCCESS)
    {
      this._current_timeline_id = msg[TIMELINE_LIST][0][TIMELINE_ID];
      this._timeline_modes.forEach(function(timeline_mode) {
        var config = {
          session_id: this._current_session_id,
          timeline_id: this._current_timeline_id,
          mode: timeline_mode.mode,
          event_type_list: this._default_types,
        };
        this._profiler.get_events(this._handle_timeline_list_bound.bind(null, timeline_mode.id), config);
      }, this);
    }
    else
    {
      this._show_error_message(msg);
    }
    this._update_record_button_title();
  };

  this._handle_timeline_list = function(timeline_id, status, msg)
  {
    if (status === SUCCESS)
    {
      // `timeline_id` is one of the IDs in `_timeline_modes`
      this[timeline_id] = new cls.Profiler["1.0"].EventList(msg);
      var got_all_responses = this._timeline_modes.every(function(timeline_mode) {
        return this[timeline_mode.id];
      }, this);
      if (got_all_responses)
        this._update_view();
    }
    else
    {
      this._show_error_message(msg);
    }
  };

  this._show_error_message = function(msg)
  {
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_PROFILING_FAILED));
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + ": \n" + msg)
  };

  this._update_view = function()
  {
    if (!this._container)
      return;
    var template = [];
    if (this._profiler.is_active)
    {
      template.extend(this._templates.empty(ui_strings.S_PROFILER_PROFILING));
    }
    else if (this._timeline_list && this._timeline_list.eventList)
    {
      template.extend(this._timeline_list.eventList[0]
        ? this._templates.main(this._timeline_list,
                               this._aggregated_list,
                               this._table,
                               this._details_time,
                               this._event_id,
                               this._container.clientWidth - AGGREGATED_EVENTS_WIDTH,
                               this._get_zero_point())
        : this._templates.empty(ui_strings.S_PROFILER_NO_DATA)
      );
    }
    else
    {
      template.extend(this._templates.empty(ui_strings.S_PROFILER_START_MESSAGE));
    }
    this._container.clearAndRender(template);
    this._details_list = this._container.querySelector(".profiler-details-list");
    this._status = this._container.querySelector(".profiler-status");
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

  this.ondestroy = function()
  {
    this._container = null;
  };

  this.focus = function() {};

  this.blur = function() {};

  this.onclick = function() {};

  this.onresize = function()
  {
    if (this._container)
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

  this._get_event_details = function(event, target)
  {
    this._event_id = Number(target.getAttribute("data-event-id")) || null;
    this._event_type = Number(target.getAttribute("data-event-type"));
    this._show_details_list();
  };

  this._show_details_list = function()
  {
    var child_type = this._children[this._event_type];
    if (child_type)
    {
      this._details_list.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_CALCULATING));
      var config = {
        session_id: this._current_session_id,
        timeline_id: this._current_timeline_id,
        mode: MODE_REDUCE_UNIQUE_EVENTS,
        event_id: this._event_id,
        event_type_list: [child_type]
      };
      this._profiler.get_events(this._handle_details_list_bound.bind(null, child_type), config);
    }
    else
    {
      this._reset_details();
      this._details_list.clearAndRender(this._templates.no_events());
      this._details_list.addClass("profiler-no-status");
      this._status.addClass("profiler-no-status");
    }
  };

  this._handle_details_list = function(child_type, status, msg)
  {
    var table_def = this._tabledefs[child_type];
    this._table = new SortableTable(table_def,
                                    null,
                                    table_def.column_order,
                                    "time",
                                    null,
                                    true,
                                    "profiler");
    var parsed_msg = new cls.Profiler["1.0"].EventList(msg);
    var data = parsed_msg && parsed_msg.eventList;
    if (data.length)
    {
      this._table.set_data(data);
      this._details_time = data.reduce(function(prev, curr) {
        return prev + curr.time;
      }, 0);
      this._details_list.clearAndRender(this._templates.details(this._table));
      this._status.clearAndRender(this._templates.status(this._details_time));
      this._details_list.removeClass("profiler-no-status");
      this._status.removeClass("profiler-no-status");
    }
    else
    {
      this._details_list.clearAndRender(this._templates.no_events());
    }
  };

  this._reload_window = function(event, target)
  {
    if (this._current_session_id)
      this._profiler.release_session(null, {session_id: this._old_session_id});
    this._reset();
    window.services.scope.enable_profile(window.app.profiles.PROFILER);
  };

  this._update_record_button_title = function()
  {
    window.toolbars[this.id].set_button_title("profiler-start-stop", this._profiler.is_active ?
                                                                     ui_strings.S_BUTTON_STOP_PROFILER :
                                                                     ui_strings.S_BUTTON_START_PROFILER);
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

  this._on_profile_enabled = function(msg)
  {
    if (msg.profile === window.app.profiles.PROFILER)
    {
      this._has_overlay_service = window.services["overlay"] && window.services["overlay"].is_enabled;
      window.runtimes.reloadWindow();
    }
    else
    {
      if (this._current_session_id)
        this._profiler.release_session(null, {session_id: this._old_session_id});
      this._reset();
    }
  };

  this._on_settings_changed = function(msg)
  {
    if (msg.id === this.id && msg.key === "zero-at-first-event")
      this._has_zero_at_first_event = msg.value;
  };

  this._on_settings_initialized = function(msg)
  {
    if (msg.view_id === this.id)
      this._has_zero_at_first_event = msg.setting.get("zero-at-first-event");
  };

  this._ontooltip = function(event, target)
  {
    var id = Number(target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._timeline_list.get_event_by_id(id);
    if (timeline_event)
    {
      this._tooltip.show(this._templates.get_title_all(timeline_event));
    }
  };

  this._show_event_details = function(event, target)
  {
    if (!this._has_overlay_service)
      return;
    var id = Number(target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._timeline_list.get_event_by_id(id);
    if (timeline_event)
    {
      if (timeline_event.type === TYPE_PAINT)
      {
        var area = timeline_event.paint.area;
        var config = {x: area.x, y: area.y, w: area.w, h:area.h};
        this._overlay.create_overlay(null, config);
      }
    }
  };

  this._hide_event_details = function(event, target)
  {
    if (!this._has_overlay_service)
      return;
    var id = Number(target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._timeline_list.get_event_by_id(id);
    if (timeline_event)
    {
      if (timeline_event.type === TYPE_PAINT)
        this._overlay.remove_overlay();
    }
  };

  this._init = function(id, name, container_class, html, default_handler)
  {
    View.prototype.init.call(this, id, name, container_class, html, default_handler);
    this.required_services = ["profiler"];
    this._profiler = new ProfilerService();
    this._overlay = new OverlayService();
    this._templates = new ProfilerTemplates();
    this._has_overlay_service = false;
    this._has_zero_at_first_event = false;
    this._old_session_id = null;
    this._reset();

    Tooltips.register("profiler-tooltip-url", true, false);
    this._tooltip = Tooltips.register("profiler-event", true, false);
    this._tooltip.ontooltip = this._ontooltip.bind(this);

    this._handle_start_profiler_bound = this._handle_start_profiler.bind(this);
    this._handle_stop_profiler_bound = this._handle_stop_profiler.bind(this);
    this._handle_timeline_list_bound = this._handle_timeline_list.bind(this);
    this._handle_details_list_bound = this._handle_details_list.bind(this);

    window.messages.addListener("profile-enabled", this._on_profile_enabled.bind(this));
    window.messages.addListener("setting-changed", this._on_settings_changed.bind(this));
    window.messages.addListener("settings-initialized", this._on_settings_initialized.bind(this));

    window.event_handlers.click["profiler-start-stop"] = this._start_stop_profiler.bind(this);
    window.event_handlers.click["profiler-reload-window"] = this._reload_window.bind(this);
    window.event_handlers.mousedown["profiler-event"] = this._get_event_details.bind(this);
    window.event_handlers.mouseover["profiler-event"] = this._show_event_details.bind(this);
    window.event_handlers.mouseout["profiler-event"] = this._hide_event_details.bind(this);
  };

  this._init(id, name, container_class, html, default_handler);
};

ProfilerView.prototype = ViewBase;

ProfilerView.create_ui_widgets = function()
{
  new ToolbarConfig({
    view: "profiler_all",
    groups: [
      {
        type: UI.TYPE_BUTTONS,
        items: [
          {
            handler: "profiler-start-stop",
            title: ui_strings.S_BUTTON_START_PROFILER
          }
        ]
      },
      {
        type: UI.TYPE_SWITCH,
        items: [
          {
            key: "profiler_all.zero-at-first-event"
          }
        ]
      }
    ]
  });

  new Settings(
    "profiler_all",
    {
      "zero-at-first-event": true
    },
    {
      "zero-at-first-event": ui_strings.S_SWITCH_CHANGE_START_TO_FIRST_EVENT
    }
  );
};

/**
 * Get an event based on its ID. If no event has the ID, returns null.
 *
 * @param {Number} id The id of the event to return
 * @return {Event|null} An event in case one was found with ID `id`,
 *         otherwise `null`.
 */
cls.Profiler["1.0"].EventList.prototype.get_event_by_id = function(id)
{
  var events = this.eventList;
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

// These getters will be called when the table is created
cls.Profiler["1.0"].Event.prototype =
{
  set selector() {},
  get selector()
  {
    return this.cssSelectorMatching ? this.cssSelectorMatching.selector : null;
  }
};

