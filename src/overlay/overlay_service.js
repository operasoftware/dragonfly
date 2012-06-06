"use strict";

/**
 * @constructor
 */
var OverlayService = function(default_color)
{
  this._init = function(default_color)
  {
    this._overlay = window.services["overlay"];
    this._tag_manager = window.tag_manager;
    this._window_id = 0;

    this.set_default_color(default_color);

    this._on_debug_context_selected_bound = this._on_debug_context_selected.bind(this);
    window.messages.addListener("debug-context-selected", this._on_debug_context_selected_bound);
  };

  this._init(default_color);
};

var OverlayServicePrototype = function()
{
  var DEFAULT_COLOR = [255, 0, 0, 128];

  this.create_overlay = function(callback, config)
  {
    if (config == null)
      config = {};

    if (config.x == null || config.y == null || config.w == null || config.h == null)
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "Too few arguments to OverlayService#create_overlay.");

    var window_id = config.window_id || this._window_id;
    var overlay_type = config.overlay_type || OverlayService.OverlayType.AREA;
    var insertion = [
      config.insertion_method || OverlayService.InsertionMethod.FRONT,
      config.overlay_id || null
    ];
    var area_overlay = [
      [config.x, config.y, config.w, config.h],
      config.color || this._default_color,
      config.border_color || null,
      config.grid_color || null
    ];
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      if (callback)
        callback(status, msg);
    });
    var msg = [window_id, overlay_type, insertion, area_overlay];
    this._overlay.requestCreateOverlay(tag, msg);
  };

  this.remove_overlay = function(callback, config)
  {
    if (config == null)
      config = {};

    var window_id = config.window_id || this._window_id;
    var overlay_id = config.overlay_id || null;
    var tag = this._tag_manager.set_callback(this, function(status, msg) {
      if (callback)
        callback(status, msg);
    });
    var msg = [window_id, overlay_id];
    this._overlay.requestRemoveOverlay(null, msg);
  };

  this.set_default_color = function(color)
  {
    this._default_color = color || DEFAULT_COLOR;
  };

  this._on_debug_context_selected = function(msg)
  {
    this._window_id = msg.window_id;
  };
};

OverlayService.prototype = new OverlayServicePrototype();

OverlayService.OverlayType = {
  AREA: 1
};

OverlayService.InsertionMethod = {
  FRONT: 1,
  BACK: 2,
  ABOVE_TARGET: 3,
  BELOW_TARGET: 4
};

