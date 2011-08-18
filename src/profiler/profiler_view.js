window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */

cls.ProfilerView = function(id, name, container_class, html, default_handler) {
  this._profiler = new cls.ProfilerService();
  this._current_profile_id = null;
  this._current_timeline_id = null;

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

  // Parent-children relationships
  this._children = {};
  this._children[STYLE_RECALCULATION] = [CSS_SELECTOR_MATCHING];

  this._child_mode_map = {};
  this._child_mode_map[STYLE_RECALCULATION] = {mode: MODE_ALL,
                                               template: window.templates.event_list_unique_events};

  this._super_init = this.init;
  this._init = function(id, name, container_class, html, default_handler)
  {
    this._super_init(id, name, container_class, html, default_handler);
  };

  this._start_profiler = function(container)
  {
    this._container.innerHTML = "Profiling";
    this._profiler.start_profiler();
  };

  this._stop_profiler = function(container)
  {
    this._container.innerHTML = "Stopped profiling. Calculating...";
    this._profiler.stop_profiler(this._handle_stop_profiler.bind(this));
  };

  this._handle_stop_profiler = function(status, msg)
  {
    const PROFILE_ID = 0;
    const TIMELINE_LIST = 2;
    const TIMELINE_ID = 0;

    var default_types = [GENERIC, PROCESS, DOCUMENT_PARSING, CSS_PARSING, SCRIPT_COMPILATION,
                         THREAD_EVALUATION, REFLOW, STYLE_RECALCULATION, LAYOUT, PAINT];

    if (status == 0)
    {
      this._current_profile_id = msg[PROFILE_ID];
      this._current_timeline_id = msg[TIMELINE_LIST][0][TIMELINE_ID];
      this._profiler.get_events(this._current_profile_id,
                                this._current_timeline_id,
                                MODE_ALL,
                                null,
                                null,
                                default_types,
                                null,
                                this._update_view.bind(this, window.templates.event_list_all));
    }
  };

  this._update_view = function(template)
  {
    var event_list = new cls.Profiler["1.0"].EventList(this._profiler.data.get_event_list());
    this._container.clearAndRender(template(event_list, this._container.clientWidth));
  };

  this.createView = function(container)
  {
    this._container = container;
    this._update_view(window.templates.event_list_all);
  };

  this.ondestroy = function()
  {
  };

  this.onresize = function()
  {
    this._update_view();
  }

  this.focus = function()
  {
  };

  this.blur = function()
  {
  };

  this.onclick = function()
  {
  };

  this._start_stop_profiler = function(event, target)
  {
    !this._profiler.is_active ? this._start_profiler()
                              : this._stop_profiler();
  };

  this._expand_collapse_event = function(event, target)
  {
    var event_id = parseInt(target.getAttribute("data-event-id"));
    var event_type = target.getAttribute("data-event-type");
    var children = this._children[event_type];
    if (event_id && children)
    {
      // TODO: some default here?
      var child_mode = this._child_mode_map[event_type];
      this._profiler.get_events(this._current_profile_id,
                                this._current_timeline_id,
                                child_mode.mode,
                                event_id,
                                null,
                                children,
                                null,
                                this._update_view.bind(this, child_mode.template));
    }
  };

  window.eventHandlers.click["start-stop-profiler"] = this._start_stop_profiler.bind(this);
  window.eventHandlers.click["expand-collapse-event"] = this._expand_collapse_event.bind(this);

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
        handler: "start-stop-profiler",
        title: "Start profiler" // FIXME: ui string
      }
    ],
    null,
    null,
    null,
    true
  );
};

