"use strict";

/**
 * @constructor
 *
 * The overlay service can overlay painted areas over a Window.
 */
var OverlayService = function(default_config)
{
  var DEFAULT_COLOR = [255, 0, 0, 128];

  /**
   * @param {Object} default_config Default colors used when not explicitly passing
   * to create_overlay(). Takes three arrays, 'color', 'border_color' and 'grid_color',
   * all specified as an array with four values: 'r', 'g', 'b' and 'alpha'. All of
   * these are in the range 0 to 255.
   */
  this._init = function(default_config)
  {
    this._overlay = window.services["overlay"];
    this._tag_manager = window.tag_manager;
    this._window_id = 0;
    this._default_config = default_config || {color: DEFAULT_COLOR};
  };

  this._init(default_config);
};

var OverlayServicePrototype = function()
{
  /**
   * Create an overlay.
   *
   * @param {Object} config Configures the overlay. At least 'x', 'y', 'w' and 'h'
   * have to be specified.
   */
  this.create_overlay = function(callback, config)
  {
    config = config || {};

    if (config.x == null || config.y == null || config.w == null || config.h == null)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
                      "Too few arguments to OverlayService#create_overlay.");
    }

    var window_id = config.window_id || this._window_id;
    var overlay_type = config.overlay_type || OverlayService.OverlayType.AREA;
    var insertion = [
      config.insertion_method || OverlayService.InsertionMethod.FRONT,
      config.overlay_id || null
    ];
    var area_overlay = [
      [config.x, config.y, config.w, config.h],
      config.color || this._default_config.color || null,
      config.border_color || this._default_config.border_color || null,
      config.grid_color || this._default_config.grid_color || null
    ];
    var tag = this._tag_manager.set_callback(this, this._callback_handler, [callback]);
    var msg = [
      window_id,
      overlay_type,
      insertion,
      area_overlay
    ];
    this._overlay.requestCreateOverlay(tag, msg);
  };

  /**
   * Remove an overlay. If no overlay ID is specified in the config object,
   * all overlays are removed.
   *
   * @param {Object} config An overlay ID can be specified with 'overlay_id'.
   */
  this.remove_overlay = function(callback, config)
  {
    config = config || {};
    var window_id = config.window_id || this._window_id;
    var overlay_id = typeof config.overlay_id == "number" ? config.overlay_id : null;
    var tag = this._tag_manager.set_callback(this, this._callback_handler, [callback]);
    var msg = [
      window_id,
      overlay_id
    ];
    this._overlay.requestRemoveOverlay(tag, msg);
  };

  /**
   * Set the Window ID.
   *
   * @param {Number} window_id The ID of the Window.
   */
  this.set_window_id = function(window_id)
  {
    this._window_id = window_id;
  };

  this._callback_handler = function(status, msg, callback)
  {
    if (callback)
      callback(status, msg);
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

