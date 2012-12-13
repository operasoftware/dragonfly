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
  var profiler_event_decl = document.styleSheets.getDeclaration(".profiler-event");
  var AGGREGATED_EVENTS_WIDTH = profiler_timeline_decl ? parseInt(profiler_timeline_decl.left) : 0;
  var EVENT_MIN_WIDTH = profiler_event_decl ? parseInt(profiler_event_decl.minWidth) : 1;

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
    //TYPE_CSS_SELECTOR_MATCHING,
    TYPE_LAYOUT,
    TYPE_PAINT
  ];

  this._timeline_modes = [
    {id: "_timeline_list", mode: MODE_ALL}
  ];

  this._reset = function()
  {
    this._current_session_id = null;
    this._current_timeline_id = null;
    this._event_id = null;
    this._event_type = null;
    this._timeline_list = null;
    this._aggregated_list = null;
    this._timeline_width = 0;
  };

  this._start_profiler = function()
  {
    this._reset();
    this._zoomer.reset();
    this._set_zoomer = true;
    this._container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_PROFILING));
    this._profiler.start_profiler(this._handle_start_profiler_bound);
    this._overlay_service.set_window_id(this._profiler.get_window_id());
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
      this[timeline_id] = new cls.Profiler["1.1"].Events(msg);
      var got_all_responses = this._timeline_modes.every(function(timeline_mode) {
        return this[timeline_mode.id];
      }, this);
      if (got_all_responses)
      {
        if (this._timeline_list && this._timeline_list.interval)
        {
          // TODO: should really be set according to the visible events
          this._x0 = this._timeline_list.interval.start;
          this._x1 = this._timeline_list.interval.end;
        }
        this._update_view();
      }
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
    var container = this._container;
    if (!container)
      return;

    if (!(this._timeline_list && this._timeline_list.eventList.length))
    {
      container.clearAndRender(this._templates.empty(ui_strings.S_PROFILER_NO_DATA));
      return;
    }

    var timeline_list = this._timeline_list;
    var interval = timeline_list.interval;
    var event_list = timeline_list.eventList.filter(function(event) {
      return event.time > this._min_event_time;
    }, this);
    var aggregated_event_list = this._get_aggregated_event_list(event_list);
    var width = this._container.clientWidth - AGGREGATED_EVENTS_WIDTH;

    var frag = document.createDocumentFragment();
    frag.appendChild(this._legend_ele);
    frag.appendChild(this._zoomer_times_ele);
    frag.appendChild(this._zoomer_ele);
    frag.appendChild(this._timeline_times_ele);
    frag.appendChild(this._timeline_ele);

    this._legend_ele.clearAndRender(this._templates.legend(aggregated_event_list));
    this._zoomer_times_ele.clearAndRender(this._templates.timeline_markers(0, interval.end, width));
    this._zoomer_ele.clearAndRender(this._templates.event_list_full(event_list, interval.end, width));
    this._timeline_times_ele.clearAndRender(this._templates.timeline_markers(0, interval.end, width));
    this._timeline_ele.clearAndRender(this._templates.event_list_all(event_list, 0, interval.end, width));

    container.innerHTML = "";
    container.appendChild(frag);

    this._timeline_width = width;
    this._zoomer.set_zoomer_element(this._zoomer_ele);
    if (this._set_zoomer)
      this._zoomer.set_current_area();
  };

  this.createView = function(container)
  {
    this._container = container;
    this._legend_ele = document.createElement("div");
    this._legend_ele.className = "profiler-legend";
    this._zoomer_ele = document.createElement("div");
    this._zoomer_ele.className = "profiler-full-timeline";
    this._zoomer_times_ele = document.createElement("div");
    this._zoomer_times_ele.className = "profiler-full-timeline-times";
    this._timeline_ele = document.createElement("div");
    this._timeline_ele.className = "profiler-timeline";
    this._timeline_ele.setAttribute("handler", "profiler-event");
    this._timeline_times_ele = document.createElement("div");
    this._timeline_times_ele.className = "profiler-timeline-background";

    if (this._timeline_list && this._timeline_list.eventList && this._timeline_list.eventList.length)
    {
      this._update_view();
    }
    else
    {
      var message = this._profiler.is_active
                  ? ui_strings.S_PROFILER_PROFILING
                  : ui_strings.S_PROFILER_START_MESSAGE;
      container.clearAndRender(this._templates.empty(message));
    }
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(this._templates.disabled_view());
  };

  this.ondestroy = function()
  {
    this._container = null;
    this._legend_ele = null;
    this._zoomer_ele = null;
    this._timeline_ele = null;
  };

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
    this._event_id = Number(event.target.get_ancestor_attr("data-event-id")) || null;
    this._event_type = Number(event.target.get_ancestor_attr("data-event-type"));
    this._show_details_list();
  };

  this._show_details_list = function()
  {
    var child_type = this._children[this._event_type];
    if (child_type)
    {
      var config = {
        session_id: this._current_session_id,
        timeline_id: this._current_timeline_id,
        mode: MODE_REDUCE_UNIQUE_EVENTS,
        event_id: this._event_id,
        event_type_list: [child_type],
        interval: [this._x0, this._x1]
      };
      this._profiler.get_events(this._handle_details_list_bound.bind(null, child_type), config);
    }
    else
    {
      this._overlay.hide();
    }
  };

  this._handle_details_list = function(child_type, status, msg)
  {
    var event_list = new cls.Profiler["1.1"].Events(msg);
    var data = event_list && event_list.eventList;
    if (data.length)
    {
      this._tooltip.hide();
      this._overlay.show_data(data, child_type);
    }
    else
    {
      this._overlay.hide();
    }
  };

  this._close_details_overlay = function(event, target)
  {
    this._overlay.hide();
  };

  this._get_aggregated_event_list = function(event_list)
  {
    var list = this._default_types.map(function(type) {
      return {
        type: type,
        time: 0
      };
    });
    event_list.forEach(function(event) {
      var type = event.type;
      for (var i = 0, item; item = list[i]; i++)
      {
        if (item.type == type)
          item.time += event.time;
      }
    });
    return list;
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
    var button_title = this._profiler.is_active
                     ? ui_strings.S_BUTTON_STOP_PROFILER
                     : ui_strings.S_BUTTON_START_PROFILER;
    window.toolbars[this.id].set_button_title("profiler-start-stop", button_title);
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
      this._zoomer.reset();
    }
  };

  this._on_single_select_changed = function(msg)
  {
    if (msg.name == "min-event-time")
    {
      window.settings["profiler_all"].set("min-event-time", msg.values[0])
      this._min_event_time = Number(msg.values[0]);
      if (this._timeline_list)
        this._update_view();
    }
  };

  this._ontooltip = function(event, target)
  {
    var id = Number(event.target.get_ancestor_attr("data-event-id"));
    var timeline_event = this._timeline_list.get_event_by_id(id);
    if (timeline_event)
      this._tooltip.show(this._templates.get_title_all(timeline_event, this._x0));
  };

  this._show_event_details = function(event, target)
  {
    if (!this._has_overlay_service)
      return;
    var id = Number(event.target.get_ancestor_attr("data-event-id"));
    var timeline_event = this._timeline_list.get_event_by_id(id);
    if (timeline_event)
    {
      if (timeline_event.type === TYPE_PAINT)
      {
        var area = timeline_event.paint.area;
        var config = {
          x: area.x,
          y: area.y,
          w: area.w,
          h: area.h,
          grid_color: [255, 0, 0, 255]
        };

        if (window.services["profiler"].satisfies_version(1, 1))
        {
          config.x += area.ox;
          config.y += area.oy;
        }

        this._overlay_service.create_overlay(null, config);
      }
    }
  };

  this._hide_event_details = function(event, target)
  {
    if (!this._has_overlay_service)
      return;
    var id = Number(event.target.get_attr("parent-node-chain", "data-event-id"));
    var timeline_event = this._timeline_list.get_event_by_id(id);
    if (timeline_event)
    {
      if (timeline_event.type === TYPE_PAINT)
        this._overlay_service.remove_overlay();
    }
  };

  this._reset_timeline_area = function()
  {
    if (!this._timeline_list)
      return;

    var timeline_list = this._timeline_list;
    var interval = timeline_list.interval;
    var event_list = timeline_list.eventList.filter(function(event) {
      return event.time > this._min_event_time;
    }, this);
    var aggregated_event_list = this._get_aggregated_event_list(event_list);
    var width = this._timeline_width;

    this._x0 = 0;
    this._x1 = interval.end;
    this._set_zoomer = false;
    this._timeline_ele.clearAndRender(this._templates.event_list_all(event_list, 0, interval.end, width));
    this._timeline_times_ele.clearAndRender(this._templates.timeline_markers(0, interval.end, width));
    this._legend_ele.clearAndRender(this._templates.legend(aggregated_event_list));
  };

  this._set_timeline_area = function(x0, x1)
  {
    if (!this._timeline_list)
      return;

    var timeline_list = this._timeline_list;
    var interval = timeline_list.interval;
    var visible_event_list = timeline_list.eventList.filter(function(event) {
      var start = event.interval.start;
      var end = event.interval.end;
      return ((start <= x0 && end >= x0) ||
              (start >= x0 && start <= x1)) &&
             event.time > this._min_event_time;
    }, this);
    var aggregated_event_list = this._get_aggregated_event_list(visible_event_list);
    var width = this._timeline_width;

    var duration = Math.max(x1 - x0, ProfilerView.MIN_DURATION);
    var ms_unit = (width - EVENT_MIN_WIDTH) / duration;
    var new_event_list = [];
    for (var i = 0, event; event = timeline_list.eventList[i]; i++)
    {
      var ele = document.getElementById("profiler-event-" + event.eventID);
      if (visible_event_list.contains(event))
      {
        if (ele)
        {
          ele.style.width = Math.round((event.interval.end - event.interval.start) * ms_unit) + "px";
          ele.style.left = Math.round((event.interval.start - x0) * ms_unit) + "px";
        }
        else
          new_event_list.push(event);
      }
      else if (ele)
        ele.remove();
    }

    this._x0 = x0;
    this._x1 = x1;
    this._set_zoomer = true;
    this._timeline_ele.render(this._templates.event_list_all(new_event_list, x0, x1, width));
    this._timeline_times_ele.clearAndRender(this._templates.timeline_markers(x0, x1, width));
    this._legend_ele.clearAndRender(this._templates.legend(aggregated_event_list));
  };

  this._get_timeline_area = function()
  {
    return {
      x0: this._x0,
      x1: this._x1
    };
  };

  this._get_timeline_duration = function()
  {
    return this._timeline_list.interval.end;
  };

  this._get_timeline_ele_width = function()
  {
    return this._timeline_width;
  };

  this._init = function(id, name, container_class, html, default_handler)
  {
    View.prototype.init.call(this, id, name, container_class, html, default_handler);
    this.required_services = ["profiler"];
    this._profiler = new ProfilerService();
    this._overlay_service = new OverlayService();
    this._templates = new ProfilerTemplates();
    this._has_overlay_service = false;
    this._old_session_id = null;
    this._reset();

    this._x0 = 0;
    this._x1 = 0;
    this._set_zoomer = true;
    this._min_event_time = 0;

    this._legend_ele = null;
    this._zoomer_ele = null;
    this._timeline_ele = null;

    this._zoomer = new Zoomer({
      reset_to_default_area: this._reset_timeline_area.bind(this),
      set_area: this._set_timeline_area.bind(this),
      get_current_area: this._get_timeline_area.bind(this),
      get_duration: this._get_timeline_duration.bind(this),
      get_model_element_width: this._get_timeline_ele_width.bind(this)
    });

    Tooltips.register("profiler-tooltip-url", true, false);
    this._tooltip = Tooltips.register("profiler-event", true, false);
    this._tooltip.ontooltip = this._ontooltip.bind(this);

    var overlay = new ProfilerOverlayView(id + "_overlay", "scroll");
    this.register_overlay(overlay);

    this._handle_start_profiler_bound = this._handle_start_profiler.bind(this);
    this._handle_stop_profiler_bound = this._handle_stop_profiler.bind(this);
    this._handle_timeline_list_bound = this._handle_timeline_list.bind(this);
    this._handle_details_list_bound = this._handle_details_list.bind(this);
    this._close_details_overlay_bound = this._close_details_overlay.bind(this);

    ActionHandlerInterface.apply(this);
    this._handlers = {
      "close-details": this._close_details_overlay_bound
    };
    ActionBroker.get_instance().register_handler(this);

    window.messages.addListener("profile-enabled", this._on_profile_enabled.bind(this));
    window.messages.addListener("single-select-changed", this._on_single_select_changed.bind(this));

    window.event_handlers.click["profiler-start-stop"] = this._start_stop_profiler.bind(this);
    window.event_handlers.click["profiler-reload-window"] = this._reload_window.bind(this);
    window.event_handlers.click["profiler-event"] = this._get_event_details.bind(this);
    window.event_handlers.mouseover["profiler-event"] = this._show_event_details.bind(this);
    window.event_handlers.mouseout["profiler-event"] = this._hide_event_details.bind(this);
  };

  this._init(id, name, container_class, html, default_handler);
};

ProfilerView.prototype = ViewBase;

ProfilerView.MIN_DURATION = 0.1;

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
        type: UI.TYPE_SINGLE_SELECT,
        name: "min-event-time",
        items: [
          {
            text: ui_strings.S_PROFILER_FILTER_ALL,
            title: ui_strings.S_PROFILER_FILTER_ALL_TITLE,
            value: "0"
          },
          {
            text: ui_strings.S_PROFILER_FILTER_1MS,
            title: ui_strings.S_PROFILER_FILTER_1MS_TITLE,
            value: "1"
          },
          {
            text: ui_strings.S_PROFILER_FILTER_15MS,
            title: ui_strings.S_PROFILER_FILTER_15MS_TITLE,
            value: "15"
          }
        ]
      }
    ]
  });

  new Settings(
    "profiler_all",
    {
      "min-event-time": "0"
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
cls.Profiler["1.1"].Events.prototype.get_event_by_id = function(id)
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
cls.Profiler["1.1"].Event.prototype =
{
  set selector(value) {},
  get selector()
  {
    return this.cssSelectorMatching ? this.cssSelectorMatching.selector : null;
  }
};

var ProfilerOverlayView = function(id, container, html, default_handler, service)
{
  this._tabledefs = {};
  this._tabledefs[ProfilerService.EventType.CSS_SELECTOR_MATCHING] = {
    idgetter: function(item) { return item.cssSelectorMatching.selector; },
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

  this.createView = function(container)
  {
    this._container = container;
    this._update_view();
  };

  this._update_view = function(table)
  {
    var template = [];
    if (this._table && this._table.get_data())
      template.extend(this._templates.details(this._table));
    else
      template.extend(this._templates.empty(ui_strings.S_PROFILER_NO_DETAILS));
    this._container.clearAndRender(template);
  }

  this.ondestroy = function()
  {
  };

  this.show_data = function(data, child_type)
  {
    var table_def = this._tabledefs[child_type];
    this._table = new SortableTable(table_def,
                                    null,
                                    table_def.column_order,
                                    "time",
                                    null,
                                    true,
                                    "profiler");
    this._table.set_data(data);
    this._details_time = data.reduce(function(prev, curr) {
      return prev + curr.time;
    }, 0);

    if (this.is_active)
      this._update_view();
    else
      this.show();
  };

  this._init = function(id, container, html, default_handler, service)
  {
    this.init(id, container, html, default_handler, service);
    this._templates = new ProfilerTemplates();
    this.is_active = false; // TODO: should be set in OverlayView
    this._container = null;
    this._details_ele = null;
    this._status_ele = null;
    this._table = null;
  };

  this._init(id, container, html, default_handler, service);
};

ProfilerOverlayView.prototype = new OverlayView();

