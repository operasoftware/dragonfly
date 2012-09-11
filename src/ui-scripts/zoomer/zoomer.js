"use strict";

// TODO: possibly change the cursor for the whole viewport
// TODO: when width is 1px and mousewheeling, don't move
// TODO: prevent context menu
// TODO: reset on doubleclick

/**
 * @constructor
 */
var Zoomer = function(model, zoomer_ele)
{
  this._init = function()
  {
    this._model = model;
    this._model_ele_width = 0;
    this._model_duration = 0;
    /**
     * Pixels from the left edge of the overlay to the left
     * edge of the model element.
     */
    this._overlay_left = 0;
    /**
     * Pixels from the right edge of the overlay to the right
     * edge of the model element.
     */
    this._overlay_right = 0;
    /**
     * Pixels from the left edge of the overlay to the left
     * edge of the model element when starting a drag or resize.
     */
    this._overlay_start_left = 0;
    /**
     * Pixels from the right edge of the overlay to the right
     * edge of the model element when starting a drag or resize.
     */
    this._overlay_start_right = 0;
    /**
     * x position of the mouse when starting a drag of resize of
     * the overlay.
     */
    this._mouse_drag_start_x = 0;
    /**
     * Current resize handler element.
     */
    this._handler_ele = null;
    /**
     * A timeout ID.
     */
    this._update_timeout = 0;
    /**
     * Time of last update.
     */
    this._last_update = 0;

    if (zoomer_ele)
      this.set_zoomer_ele(zoomer_ele);
  };

  this._init();
};

var ZoomerPrototype = function()
{
  var UPDATE_THRESHOLD = 50;

  this._set_up_zoomer_ele = function()
  {
    this._zoomer_ele.classList.add("zoomer-element");
    var zoomer_ele_style = window.getComputedStyle(this._zoomer_ele);
    this._zoomer_ele_ver_borders = parseInt(zoomer_ele_style.borderTopWidth) +
                                   parseInt(zoomer_ele_style.borderBottomWidth);
    var zoomer_ele_hor_borders = parseInt(zoomer_ele_style.borderLeftWidth) +
                                 parseInt(zoomer_ele_style.borderRightWidth);
    this._zoomer_ele_dims = this._zoomer_ele.getBoundingClientRect();
    this._zoomer_ele_left = this._zoomer_ele_dims.left;
    this._zoomer_ele_width = this._zoomer_ele_dims.width - zoomer_ele_hor_borders;

    this._zoomer_ele_onmousemove_bound = this.zoomer_ele_onmousemove.bind(this);
    this._zoomer_ele_onmouseup_bound = this.zoomer_ele_onmouseup.bind(this);
    this._zoomer_ele_onmousewheel_bound = this.zoomer_ele_onmousewheel.bind(this);
    this._zoomer_ele.addEventListener("mousedown",
      this.zoomer_ele_onmousedown.bind(this));
  };

  this._set_up_overlay_ele = function()
  {
    this._overlay_ele = document.createElement("div");
    this._overlay_ele.className = "zoomer-overlay";
    this._overlay_handle_left_ele = document.createElement("div");
    this._overlay_handle_right_ele = document.createElement("div");
    this._overlay_handle_left_ele.className = "zoomer-overlay-handle zoomer-overlay-handle-left";
    this._overlay_handle_right_ele.className = "zoomer-overlay-handle zoomer-overlay-handle-right";
    this._overlay_ele.appendChild(this._overlay_handle_left_ele);
    this._overlay_ele.appendChild(this._overlay_handle_right_ele);
    this._zoomer_ele.appendChild(this._overlay_ele);
    var overlay_ele_style = window.getComputedStyle(this._overlay_ele);
    var overlay_ele_ver_borders = parseInt(overlay_ele_style.borderTopWidth) +
                                  parseInt(overlay_ele_style.borderBottomWidth);
    this._overlay_ele.style.height = this._zoomer_ele_dims.height -
                                     this._zoomer_ele_ver_borders -
                                     overlay_ele_ver_borders + "px";

    this._overlay_ele_onmousedown_bound = this.overlay_ele_onmousedown.bind(this);
    this._overlay_ele_onmousemove_bound = this.overlay_ele_onmousemove.bind(this);
    this._overlay_ele_onmouseup_bound = this.overlay_ele_onmouseup.bind(this);
    this._overlay_ele_onmousewheel_bound = this.overlay_ele_onmousewheel.bind(this);
    this._overlay_ele_onkeydown_bound = this.overlay_ele_onkeydown.bind(this);
    this._overlay_handle_ele_onmousedown_bound = this.overlay_handle_ele_onmousedown.bind(this);
    this._overlay_handle_ele_onmousemove_bound = this.overlay_handle_ele_onmousemove.bind(this);
    this._overlay_handle_ele_onmouseup_bound = this.overlay_handle_ele_onmouseup.bind(this);
    this._overlay_handle_ele_onkeydown_bound = this.overlay_handle_ele_onkeydown.bind(this);
  };

  //
  // Zoomer element event handlers
  ///

  this.zoomer_ele_onmousedown = function(event)
  {
    if (event.which != 1)
      return;
    document.addEventListener("mousemove",
      this._zoomer_ele_onmousemove_bound);
    document.addEventListener("mouseup",
      this._zoomer_ele_onmouseup_bound);
    var mouse_x = event.clientX - this._zoomer_ele_left;
    this._overlay_left = this._overlay_start_left = mouse_x;
    this._overlay_right = this._overlay_start_right = this._to_right_x(mouse_x);
    event.preventDefault();
  };

  this.zoomer_ele_onmousemove = function(event)
  {
    document.documentElement.classList.add("overlay-size-change");
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var diff = mouse_x - this._overlay_start_left;
    if (diff < 0)
    {
      this._overlay_left = Math.max(this._overlay_start_left + diff, 0);
      this._overlay_right = this._overlay_start_right;
    }
    else
    {
      this._overlay_left = this._overlay_start_left;
      this._overlay_right = Math.max(this._overlay_start_right - diff, 0);
    }
    this._set_overlay_position();
    this._set_model_area();
    this._overlay_ele.style.display = "block";
  };

  this.zoomer_ele_onmousewheel = function(event)
  {
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var diff = (mouse_x < this._overlay_left) ? 5 : -5;
    diff *= (event.wheelDelta > 0) ? 1 : -1;
    this._overlay_left = Math.max(this._overlay_left - diff, 0);
    this._overlay_right = Math.max(this._overlay_right + diff, 0);
    this._set_overlay_position();
    this._set_model_area();
    event.stopPropagation();
  };

  this.zoomer_ele_onmouseup = function(event)
  {
    document.documentElement.classList.remove("overlay-size-change");
    document.removeEventListener("mousemove",
      this._zoomer_ele_onmousemove_bound);
    document.removeEventListener("mouseup",
      this._zoomer_ele_onmouseup_bound);
    this._zoomer_ele.addEventListener("mousewheel",
      this._zoomer_ele_onmousewheel_bound);

    // If these are the same, the overlay hasn't moved.
    // We treat that as a reset.
    if (this._overlay_left == this._overlay_start_left &&
        this._overlay_right == this._overlay_start_right)
    {
      this.reset();
      this._zoomer_ele.removeEventListener("mousewheel",
        this._zoomer_ele_onmousewheel_bound);

      // Remove events for the overlay
      this._overlay_ele.removeEventListener("mousedown",
        this._overlay_ele_onmousedown_bound);
      this._overlay_ele.removeEventListener("mousewheel",
        this._overlay_ele_onmousewheel_bound);
      this._overlay_handle_left_ele.removeEventListener("mousedown",
        this._overlay_handle_ele_onmousedown_bound);
      this._overlay_handle_right_ele.removeEventListener("mousedown",
        this._overlay_handle_ele_onmousedown_bound);
    }
    else
    {
      // Add events for the overlay
      this._overlay_ele.addEventListener("mousedown",
        this._overlay_ele_onmousedown_bound);
      this._overlay_ele.addEventListener("mousewheel",
        this._overlay_ele_onmousewheel_bound);
      this._overlay_handle_left_ele.addEventListener("mousedown",
        this._overlay_handle_ele_onmousedown_bound);
      this._overlay_handle_right_ele.addEventListener("mousedown",
        this._overlay_handle_ele_onmousedown_bound);
    }
  };

  //
  // Overlay element event handlers
  ///

  this.overlay_ele_onmousedown = function(event)
  {
    if (event.which != 1)
      return;
    document.documentElement.classList.add("overlay-drag");
    document.addEventListener("mousemove",
      this._overlay_ele_onmousemove_bound);
    document.addEventListener("mouseup",
      this._overlay_ele_onmouseup_bound);
    document.addEventListener("keydown",
      this._overlay_ele_onkeydown_bound);
    this._overlay_start_left = this._overlay_left;
    this._overlay_start_right = this._overlay_right;
    this._mouse_drag_start_x = event.clientX - this._zoomer_ele_left;
    event.stopPropagation();
    event.preventDefault();
  };

  this.overlay_ele_onmousemove = function(event)
  {
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var mouse_to_edge_diff = this._mouse_drag_start_x - this._overlay_start_left;
    var diff = mouse_x - this._overlay_left - mouse_to_edge_diff;
    if (diff < 0)
      diff = Math.max(this._overlay_left + diff, 0) - this._overlay_left;
    else
      diff = Math.min(diff, this._overlay_right);
    this._overlay_left += diff;
    this._overlay_right -= diff;
    this._set_overlay_position();
    this._set_model_area();
  };

  this.overlay_ele_onmousewheel = function(event)
  {
    var diff = (event.wheelDelta < 0) ? 5 : -5;
    this._overlay_left = Math.max(this._overlay_left + diff, 0);
    this._overlay_right = Math.max(this._overlay_right + diff, 0);
    this._set_overlay_position();
    this._set_model_area();
    event.stopPropagation();
  };

  this.overlay_ele_onkeydown = function(event)
  {
    var diff = {
      37: 1, // Arrow left
      39: -1 // Arrow right
    }[event.which];
    if (!diff)
      return;
    this._overlay_left = Math.max(this._overlay_left - diff, 0);
    this._overlay_right = Math.max(this._overlay_right + diff, 0);
    this._set_overlay_position();
    this._set_model_area();
    event.stopPropagation();
  };

  this.overlay_ele_onmouseup = function(event)
  {
    document.documentElement.classList.remove("overlay-drag");
    document.removeEventListener("mousemove",
      this._overlay_ele_onmousemove_bound);
    document.removeEventListener("mouseup",
      this._overlay_ele_onmouseup_bound);
    document.removeEventListener("keydown",
      this._overlay_ele_onkeydown_bound);
  };

  //
  // Overlay handler element event handlers
  //

  this.overlay_handle_ele_onmousedown = function(event)
  {
    if (event.which != 1)
      return;
    document.documentElement.classList.add("overlay-size-change");
    document.addEventListener("mousemove",
      this._overlay_handle_ele_onmousemove_bound);
    document.addEventListener("mouseup",
      this._overlay_handle_ele_onmouseup_bound);
    document.addEventListener("keydown",
      this._overlay_handle_ele_onkeydown_bound);
    this._overlay_start_left = this._overlay_left;
    this._overlay_start_right = this._overlay_right;
    this._mouse_drag_start_x = event.clientX - this._zoomer_ele_left;
    this._handler_ele = event.target;
    event.stopPropagation();
    event.preventDefault();
  };

  this.overlay_handle_ele_onmousemove = function(event)
  {
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var is_left_handle = this._handler_ele == this._overlay_handle_left_ele;
    if (is_left_handle)
    {
      var mouse_to_edge_diff = this._mouse_drag_start_x - this._overlay_start_left;
      var diff = mouse_x - this._overlay_left - mouse_to_edge_diff;
      var new_pos = Math.max(this._overlay_left + diff, 0);
      var right_edge_from_left = this._to_right_x(this._overlay_start_right);
      if (new_pos <= right_edge_from_left)
      {
        this._overlay_left = new_pos;
        this._overlay_right = this._overlay_start_right;
      }
      else
      {
        this._overlay_left = right_edge_from_left;
        this._overlay_right = Math.max(this._overlay_start_right - diff, 0);
      }
    }
    else
    {
      var mouse_to_edge_diff = this._overlay_start_right -
                               this._to_right_x(this._mouse_drag_start_x);
      var diff = this._to_right_x(mouse_x) -
                 this._overlay_right - mouse_to_edge_diff;
      var new_pos = Math.max(this._overlay_right + diff, 0);
      var right_edge_from_left = this._to_right_x(new_pos);
      if (this._overlay_start_left <= right_edge_from_left)
      {
        this._overlay_left = this._overlay_start_left;
        this._overlay_right = new_pos;
      }
      else
      {
        this._overlay_left = Math.max(right_edge_from_left, 0);
        this._overlay_right = this._to_right_x(this._overlay_start_left);
      }
    }
    this._set_overlay_position();
    this._set_model_area();
  };

  this.overlay_handle_ele_onkeydown = function(event)
  {
    var diff = {
      37: 1, // Arrow left
      39: -1 // Arrow right
    }[event.which];
    if (!diff)
      return;
    var is_left_handle = this._handler_ele == this._overlay_handle_left_ele;
    if (is_left_handle)
      this._overlay_left = Math.max(this._overlay_left - diff, 0);
    else
      this._overlay_right = Math.max(this._overlay_right + diff, 0);
    this._set_overlay_position();
    this._set_model_area();
    event.stopPropagation();
  };

  this.overlay_handle_ele_onmouseup = function(event)
  {
    document.documentElement.classList.remove("overlay-size-change");
    document.removeEventListener("mousemove",
      this._overlay_handle_ele_onmousemove_bound);
    document.removeEventListener("mouseup",
      this._overlay_handle_ele_onmouseup_bound);
    document.removeEventListener("keydown",
      this._overlay_handle_ele_onkeydown_bound);
    this._handler_ele = null;
  };

  // TODO: very temporary
  this.fast_throttle = true;
  this._set_model_area = function()
  {
    // TODO: very temporary
    if (this.fast_throttle)
    {
      window.clearTimeout(this._update_timeout);
      var now = Date.now();
      var time_since_last_update = now - this._last_update;
      if (time_since_last_update > UPDATE_THRESHOLD)
      {
        var ms_unit = this._model.get_duration() / this._model.get_model_element_width();
        var x0 = this._overlay_left * ms_unit;
        var x1 = this._to_right_x(this._overlay_right) * ms_unit;
        this._model.set_area(x0, x1);
        this._last_update = now;
      }

      // Set a timeout to set the area. This makes sure that the last update
      // always happens, even if it was within the UPDATE_THRESHOLD.
      this._update_timeout = window.setTimeout(function() {
        var ms_unit = this._model.get_duration() / this._model.get_model_element_width();
        var x0 = this._overlay_left * ms_unit;
        var x1 = this._to_right_x(this._overlay_right) * ms_unit;
        this._model.set_area(x0, x1);
      }.bind(this), UPDATE_THRESHOLD);
    }
    else
    {
      window.clearTimeout(this._update_timeout);
      // Set a timeout to set the area. This makes sure that the last update
      // always happens, even if it was within the UPDATE_THRESHOLD.
      this._update_timeout = window.setTimeout(function() {
        var ms_unit = this._model.get_duration() / this._model.get_model_element_width();
        var x0 = this._overlay_left * ms_unit;
        var x1 = this._to_right_x(this._overlay_right) * ms_unit;
        this._model.set_area(x0, x1);
      }.bind(this), UPDATE_THRESHOLD);
    }
  };

  this._set_overlay_position = function()
  {
    this.set_overlay_left(this._overlay_left);
    this.set_overlay_right(this._overlay_right);
  };

  /**
   * Calculate how many pixels from the right `left_x` is.
   */
  this._to_right_x = function(left_x)
  {
    return this._zoomer_ele_width - left_x;
  };

  /**
   * Sets the current state of the zoomer. Useful e.g when switching to another
   * view and back.
   */
  this.set_current_area = function()
  {
    var ms_unit = this._model.get_model_element_width() / this._model.get_duration();
    var area = this._model.get_current_area();
    this._overlay_left = Math.floor(area.x0 * ms_unit);
    this._overlay_right = this._to_right_x(Math.floor(area.x1 * ms_unit));
    this._zoomer_ele_onmouseup_bound();
    this._set_overlay_position();
    this._overlay_ele.style.display = "block";
    this._model.set_area(area.x0, area.x1);
  };

  // TODO: should init() call this instead?
  this.reset = function()
  {
    if (this._overlay_ele)
      this._overlay_ele.style.display = "none";
    this._last_update = 0;
    this._overlay_left = 0;
    this._overlay_right = 0;
    this._set_overlay_position();
    this._model.reset_to_default_area();
  };

  /**
   * Set the left position of the overlay.
   */
  this.set_overlay_left = function(left_pos)
  {
    if (this._overlay_ele)
      this._overlay_ele.style.left = left_pos + "px";
  };

  /**
   * Set the right position of the overlay.
   */
  this.set_overlay_right = function(right_pos)
  {
    if (this._overlay_ele)
      this._overlay_ele.style.right = right_pos + "px";
  };

  /**
   * Sets the zoomer element.
   */
  this.set_zoomer_element = function(ele)
  {
    this._zoomer_ele = ele;
    this._set_up_zoomer_ele();
    this._set_up_overlay_ele();
  };

  /**
   * Re-adds the overlay element in case it has been overwritten by other
   * content in the zoomer element.
   */
  this.attach_overlay_element = function()
  {
    this._zoomer_ele.appendChild(this._overlay_ele);
  };
};

Zoomer.prototype = new ZoomerPrototype();

