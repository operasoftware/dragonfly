"use strict";

/**
 * @constructor
 */
var Zoomer = function(model, zoomer_ele)
{
  this._init(model, zoomer_ele);
};

var ZoomerPrototype = function()
{
  var MOUSEWHEEL_DIFF = 5;
  var KEYDOWN_DIFF = 1;

  this._init = function(model, zoomer_ele)
  {
    /**
     * The model to zoom.
     */
    this._model = model;
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
     * Current resize handle element.
     */
    this._handle_ele = null;
    /**
     * A timeout ID.
     */
    this._update_timeout = 0;
    /**
     * Time of last update.
     */
    this._last_update = 0;

    this._zoomer_ele_onmousedown_bound = this._zoomer_ele_onmousedown.bind(this);
    this._zoomer_ele_onmousemove_bound = this._zoomer_ele_onmousemove.bind(this);
    this._zoomer_ele_onmouseup_bound = this._zoomer_ele_onmouseup.bind(this);
    this._zoomer_ele_onmousewheel_bound = this._zoomer_ele_onmousewheel.bind(this);
    this._overlay_ele_onmousedown_bound = this._overlay_ele_onmousedown.bind(this);
    this._overlay_ele_onmousemove_bound = this._overlay_ele_onmousemove.bind(this);
    this._overlay_ele_onmouseup_bound = this._overlay_ele_onmouseup.bind(this);
    this._overlay_ele_onmousewheel_bound = this._overlay_ele_onmousewheel.bind(this);
    this._overlay_ele_onkeydown_bound = this._overlay_ele_onkeydown.bind(this);
    this._overlay_ele_ondblclick_bound = this._overlay_ele_ondblclick.bind(this);
    this._handle_ele_onmousedown_bound = this._handle_ele_onmousedown.bind(this);
    this._handle_ele_onmousemove_bound = this._handle_ele_onmousemove.bind(this);
    this._handle_ele_onmouseup_bound = this._handle_ele_onmouseup.bind(this);
    this._handle_ele_onkeydown_bound = this._handle_ele_onkeydown.bind(this);

    this._update_bound = this._update.bind(this);

    if (zoomer_ele)
      this.set_zoomer_element(zoomer_ele);
  };

  this._set_up_zoomer_ele = function()
  {
    var zoomer_ele_style = window.getComputedStyle(this._zoomer_ele);
    this._zoomer_ele_ver_borders = parseInt(zoomer_ele_style.borderTopWidth) +
                                   parseInt(zoomer_ele_style.borderBottomWidth);
    var zoomer_ele_hor_borders = parseInt(zoomer_ele_style.borderLeftWidth) +
                                 parseInt(zoomer_ele_style.borderRightWidth);
    this._zoomer_ele_dims = this._zoomer_ele.getBoundingClientRect();
    this._zoomer_ele_left = this._zoomer_ele_dims.left;
    this._zoomer_ele_width = this._zoomer_ele_dims.width - zoomer_ele_hor_borders;
    this._zoomer_ele.addEventListener("mousedown", this._zoomer_ele_onmousedown_bound);
  };

  this._set_up_overlay_ele = function()
  {
    if (!this._overlay_ele)
    {
      this._overlay_ele = document.createElement("div");
      this._overlay_ele.className = "zoomer-overlay";
      this._handle_left_ele = document.createElement("div");
      this._handle_right_ele = document.createElement("div");
      this._handle_left_ele.className = "zoomer-overlay-handle zoomer-overlay-handle-left";
      this._handle_right_ele.className = "zoomer-overlay-handle zoomer-overlay-handle-right";
      this._overlay_ele.appendChild(this._handle_left_ele);
      this._overlay_ele.appendChild(this._handle_right_ele);
    }
    this._zoomer_ele.appendChild(this._overlay_ele);
    var overlay_ele_style = window.getComputedStyle(this._overlay_ele);
    var overlay_ele_ver_borders = parseInt(overlay_ele_style.borderTopWidth) +
                                  parseInt(overlay_ele_style.borderBottomWidth);
    this._overlay_ele.style.height = this._zoomer_ele_dims.height -
                                     this._zoomer_ele_ver_borders -
                                     overlay_ele_ver_borders + "px";
  };

  //
  // Zoomer element event handlers
  //

  this._zoomer_ele_onmousedown = function(event)
  {
    if (event.which != 1)
      return;
    document.addEventListener("mousemove", this._zoomer_ele_onmousemove_bound);
    document.addEventListener("mouseup", this._zoomer_ele_onmouseup_bound);
    var mouse_x = event.clientX - this._zoomer_ele_left;
    this._overlay_left = mouse_x;
    this._overlay_right = this._to_right_x(mouse_x);
    this._mouse_drag_start_x = mouse_x;
    event.preventDefault();
  };

  this._zoomer_ele_onmousemove = function(event)
  {
    document.documentElement.classList.add("overlay-size-change");
    var mouse_x = event.clientX - this._zoomer_ele_left;
    if (mouse_x < this._mouse_drag_start_x)
    {
      var diff = mouse_x - this._overlay_left;
      this._overlay_right = this._to_right_x(this._mouse_drag_start_x);
      this.change_overlay_size(diff, 0);
    }
    else
    {
      var diff = mouse_x - this._to_right_x(this._overlay_right);
      this._overlay_left = this._mouse_drag_start_x;
      this.change_overlay_size(0, diff);
    }
  };

  this._zoomer_ele_onmousewheel = function(event)
  {
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var diff = (event.wheelDelta < 0) ? -MOUSEWHEEL_DIFF : MOUSEWHEEL_DIFF;
    this.move_overlay(diff);
    event.stopPropagation();
  };

  this._zoomer_ele_onmouseup = function(event)
  {
    document.documentElement.classList.remove("overlay-size-change");
    document.removeEventListener("mousemove", this._zoomer_ele_onmousemove_bound);
    document.removeEventListener("mouseup", this._zoomer_ele_onmouseup_bound);
    var mouse_x = event.clientX - this._zoomer_ele_left;
    if (this._mouse_drag_start_x == mouse_x)
      this.reset();
    else
      this._finalize();
  };

  //
  // Overlay element event handlers
  //

  this._overlay_ele_onmousedown = function(event)
  {
    if (event.which != 1)
      return;
    document.documentElement.classList.add("overlay-drag");
    document.addEventListener("mousemove", this._overlay_ele_onmousemove_bound);
    document.addEventListener("mouseup", this._overlay_ele_onmouseup_bound);
    this._overlay_start_left = this._overlay_left;
    this._mouse_drag_start_x = event.clientX - this._zoomer_ele_left;
    event.stopPropagation();
    event.preventDefault();
  };

  this._overlay_ele_onmousemove = function(event)
  {
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var mouse_to_handle_diff = this._mouse_drag_start_x - this._overlay_start_left;
    var diff = mouse_x - this._overlay_left - mouse_to_handle_diff;
    this.move_overlay(diff);
  };

  this._overlay_ele_onmousewheel = function(event)
  {
    var diff = (event.wheelDelta > 0) ? -MOUSEWHEEL_DIFF : MOUSEWHEEL_DIFF;
    this.change_overlay_size(-diff, diff);
    event.stopPropagation();
  };

  this._overlay_ele_onkeydown = function(event)
  {
    // If this exists, we're currently resizing one of the edges,
    // so don't resize the whole overlay.
    if (this._handle_ele)
      return;

    if (!event.key)
      return;

    var width = this._to_right_x(this._overlay_right) - this._overlay_left;
    var diff = {
      "PageUp": width,
      "PageDown": -width,
      "Left": -KEYDOWN_DIFF,
      "Right": KEYDOWN_DIFF
    }[event.key];
    if (diff)
      this.move_overlay(diff);

    diff = {
      "Up": -KEYDOWN_DIFF,
      "Down": KEYDOWN_DIFF
    }[event.key];
    if (diff)
      this.change_overlay_size(-diff, diff);

    event.stopPropagation();
  };

  this._overlay_ele_ondblclick = function(event)
  {
    this.reset();
  };

  this._overlay_ele_onmouseup = function(event)
  {
    document.documentElement.classList.remove("overlay-drag");
    document.removeEventListener("mousemove", this._overlay_ele_onmousemove_bound);
    document.removeEventListener("mouseup", this._overlay_ele_onmouseup_bound);
  };

  //
  // Overlay handle element event handlers
  //

  this._handle_ele_onmousedown = function(event)
  {
    if (event.which != 1)
      return;
    document.documentElement.classList.add("overlay-size-change");
    document.addEventListener("mousemove", this._handle_ele_onmousemove_bound);
    document.addEventListener("mouseup", this._handle_ele_onmouseup_bound);
    document.addEventListener("keydown", this._handle_ele_onkeydown_bound);
    this._overlay_start_left = this._overlay_left;
    this._overlay_start_right = this._overlay_right;
    this._mouse_drag_start_x = event.clientX - this._zoomer_ele_left;
    this._handle_ele = event.target;
    event.stopPropagation();
    event.preventDefault();
  };

  this._handle_ele_onmousemove = function(event)
  {
    var mouse_x = event.clientX - this._zoomer_ele_left;
    var is_left_handle = this._handle_ele == this._handle_left_ele;
    var mouse_to_handle_diff = is_left_handle
                             ? this._mouse_drag_start_x - this._overlay_start_left
                             : this._overlay_start_right - this._to_right_x(this._mouse_drag_start_x);
    var resize_left = is_left_handle
                    ? mouse_x < this._to_right_x(this._overlay_start_right)
                    : mouse_x > this._overlay_start_left;
    var static_pos = is_left_handle
                   ? this._to_right_x(this._overlay_start_right)
                   : this._overlay_start_left;
    if (resize_left)
    {
      var diff = mouse_x - this._overlay_left - mouse_to_handle_diff;
      this._set_overlay_position(this._overlay_left + diff, static_pos);
    }
    else
    {
      var diff = mouse_x - this._to_right_x(this._overlay_right) - mouse_to_handle_diff;
      this._set_overlay_position(static_pos, this._to_right_x(this._overlay_right) + diff);
    }
    this._request_update();
  };

  this._handle_ele_onkeydown = function(event)
  {
    if (!event.key)
      return;

    var diff = {
      "Left": -KEYDOWN_DIFF,
      "Right": KEYDOWN_DIFF
    }[event.key];

    if (!diff)
      return;
    var is_left_handle = this._handle_ele == this._handle_left_ele;
    if (is_left_handle)
    {
      if (this._overlay_left + diff < this._to_right_x(this._overlay_right))
        this.change_overlay_size(diff, 0);
    }
    else
    {
      if (this._overlay_left - diff < this._to_right_x(this._overlay_right))
        this.change_overlay_size(0, diff);
    }
    event.stopPropagation();
  };

  this._handle_ele_onmouseup = function(event)
  {
    document.documentElement.classList.remove("overlay-size-change");
    document.removeEventListener("mousemove", this._handle_ele_onmousemove_bound);
    document.removeEventListener("mouseup", this._handle_ele_onmouseup_bound);
    document.removeEventListener("keydown", this._handle_ele_onkeydown_bound);
    this._handle_ele = null;
  };

  /**
   * Request update of the overlay position.
   */
  this._request_update = function()
  {
    window.requestAnimationFrame(this._update_bound);
  };

  /**
   * Updates the overlay position and the model area.
   */
  this._update = function()
  {
    this._update_overlay_position();
    this._set_model_area();
  };

  /**
   * Update the left and right position of the overlay element.
   */
  this._update_overlay_position = function()
  {
    if (!this._overlay_ele)
      return;
    this._overlay_ele.style.display = "block";
    this._overlay_ele.style.left = this._overlay_left + "px";
    this._overlay_ele.style.right = this._overlay_right + "px";
  };

  /**
   * Sets the left and right position of the overlay internally. To change
   * the element position, _update() has to be called.
   */
  this._set_overlay_position = function(left, right)
  {
    this._overlay_left = Math.max(0, Math.min(left, right));
    this._overlay_right = Math.max(0, this._to_right_x(Math.max(left, right)));
  };

  /**
   * Sets the model area.
   */
  this._set_model_area = function()
  {
    var ms_unit = this._model.get_duration() / this._model.get_model_element_width();
    var x0 = this._overlay_left * ms_unit;
    var x1 = this._to_right_x(this._overlay_right) * ms_unit;
    this._model.set_area(x0, x1);
  };

  /**
   * Calculate how many pixels from the right `left_x` is.
   */
  this._to_right_x = function(left_x)
  {
    return this._zoomer_ele_width - left_x;
  };

  /**
   * Finalizes the setup by adding all events.
   */
  this._finalize = function()
  {
    this._zoomer_ele.addEventListener("mousewheel", this._zoomer_ele_onmousewheel_bound);
    this._overlay_ele.addEventListener("mousedown", this._overlay_ele_onmousedown_bound);
    this._overlay_ele.addEventListener("mousewheel", this._overlay_ele_onmousewheel_bound);
    this._overlay_ele.addEventListener("dblclick", this._overlay_ele_ondblclick_bound);
    this._handle_left_ele.addEventListener("mousedown", this._handle_ele_onmousedown_bound);
    this._handle_right_ele.addEventListener("mousedown", this._handle_ele_onmousedown_bound);
    document.addEventListener("keydown", this._overlay_ele_onkeydown_bound);
  };

  //
  // Public
  //

  /**
   * Reset the state of the overlay.
   */
  this.reset = function()
  {
    this._overlay_left = 0;
    this._overlay_right = 0;
    this._overlay_start_left = 0;
    this._overlay_start_right = 0;
    this._mouse_drag_start_x = 0;
    this._handle_ele = null;
    this._update_timeout = 0;
    this._last_update = 0;
    this._update_overlay_position();
    this._model.reset_to_default_area();

    if (this._overlay_ele)
    {
      this._overlay_ele.style.display = "none";
      this._overlay_ele.removeEventListener("mousedown", this._overlay_ele_onmousedown_bound);
      this._overlay_ele.removeEventListener("mousewheel", this._overlay_ele_onmousewheel_bound);
      this._overlay_ele.removeEventListener("dblclick", this._overlay_ele_ondblclick_bound);
      this._handle_left_ele.removeEventListener("mousedown", this._handle_ele_onmousedown_bound);
      this._handle_right_ele.removeEventListener("mousedown", this._handle_ele_onmousedown_bound);
      document.removeEventListener("keydown", this._overlay_ele_onkeydown_bound);
    }

    if (this._zoomer_ele)
      this._zoomer_ele.removeEventListener("mousewheel", this._zoomer_ele_onmousewheel_bound);
  };

  /**
   * Set the current state of the zoomer.
   */
  this.set_current_area = function()
  {
    if (!this._zoomer_ele.parentNode)
      this._zoomer_ele.appendChild(this._overlay_ele);
    var ms_unit = this._model.get_model_element_width() / this._model.get_duration();
    var area = this._model.get_current_area();
    this._set_overlay_position(Math.floor(area.x0 * ms_unit), Math.ceil(area.x1 * ms_unit));
    this._update_overlay_position();
    this._model.set_area(area.x0, area.x1);
    this._finalize();
  };

  /**
   * Move the overlay. A negative value moves the overlay to the left,
   * a positive to the right.
   */
  this.move_overlay = function(diff)
  {
    if (!diff)
      return;

    if (diff < 0)
      diff = Math.max(this._overlay_left + diff, 0) - this._overlay_left;
    else
      diff = Math.min(diff, this._overlay_right);

    if (diff != 0)
      this.change_overlay_size(diff, diff);
  };

  /**
   * Change the size of the overlay.
   */
  this.change_overlay_size = function(left_diff, right_diff)
  {
    if (left_diff == null)
      left_diff = 0;

    if (right_diff == null)
      right_diff = 0;

    var left = this._overlay_left + left_diff;
    var right = this._overlay_right - right_diff;
    this._set_overlay_position(left, this._to_right_x(right));
    this._request_update();
  };

  /**
   * Set the position of the overlay.
   */
  this.set_overlay_position = function(left, right)
  {
    if (left == null)
      left = 0;

    if (right == null)
      right = 0;

    this._set_overlay_position(left, right);
    this._request_update();
  };

  /**
   * Set the zoomer element.
   */
  this.set_zoomer_element = function(ele)
  {
    if (!ele)
      throw "The first argument to set_zoom_element has to be an element.";
    this._zoomer_ele = ele;
    this._set_up_zoomer_ele();
    this._set_up_overlay_ele();
  };
};

Zoomer.prototype = new ZoomerPrototype();

