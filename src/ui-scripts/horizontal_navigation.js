/**
 * @constructor
 * @extends UIBase
 */
var HorizontalNavigationBase = function(cell)
{
  const ARROW_IMAGE_WIDTH = 11;

  this._element = null;
  this._breadcrumbs = null;
  this._current_breadcrumb_el = null;
  this._nav_back = null;
  this._nav_forward = null;
  this._last_dir = null;

  /**
   * Updates the list of breadcrumbs.
   *
   * @param {String} id The data model ID
   * @param {Array} template_list A list of breadcrumbs as a template
   * @param {Boolean} focus_end Whether or not to focus the last item
   */
  this.set_content = function(id, template_list, focus_end)
  {
    this._template_list = template_list;
    this._data_model_id = id;
    if (this._breadcrumbs)
    {
      this._breadcrumbs.clearAndRender(template_list);
      this._breadcrumbs.setAttribute("data-model-id", id);
      this._breadcrumbs.style.cssText = "";
      this.check_width();
      if (focus_end)
      {
        this.set_position(-this._breadcrumbs.scrollWidth); // Not exact, but large enough
      }
    }
  };

  /**
   * Navigates in the given direction.
   *
   * @param {String|int} dir One of the following:
   *                         - "back": Navigates one breadcrumb back
   *                         - "forward": Navigates one breadcrumb forward
   *                         - An integer: Navigates this many pixels
   *
   */
  this.nav = function(dir, repeat)
  {
    var left = 0;
    var pos = parseInt(getComputedStyle(this._breadcrumbs, null).left);
    var breadcrumbs_dim = this._breadcrumbs.getBoundingClientRect();
    var element = (this._last_dir == dir) ? this._current_breadcrumb_el : null;
    this._last_dir = dir;

    if (dir == "back")
    {
      if (!element)
      {
        element = this._breadcrumbs.firstElementChild;
        while (element && element.getBoundingClientRect().right < this._nav_back.offsetWidth)
        {
            element = element.nextElementSibling;
        }
      }

      if (element)
      {
        var left_edge = element.getBoundingClientRect().left;
        left = this._nav_back.getBoundingClientRect().right - left_edge;
        element = element.previousElementSibling;
      }
    }
    else if (dir == "forward")
    {
      if (!element)
      {
        element = this._breadcrumbs.firstElementChild;
        while (element && element.getBoundingClientRect().right - 1 <= this._nav_forward.offsetLeft)
        {
            element = element.nextElementSibling;
        }
      }

      if (element)
      {
        var right_edge = element.getBoundingClientRect().right - breadcrumbs_dim.left;
        left = breadcrumbs_dim.width - right_edge - ARROW_IMAGE_WIDTH;
        element = element.nextElementSibling;
      }
    }
    else if (typeof dir == "number")
    {
      left += dir;
    }

    this._current_breadcrumb_el = element;
    this._breadcrumbs.style.OTransitionDuration = Math.min(Math.abs(left) / 200, .2) + "s";
    this.set_position(pos + left);

    if (repeat)
    {
      this._nav_timeout = setTimeout(this.nav, 400, dir, repeat);
    }
  }

  this.clear_nav_timeout = function()
  {
    clearTimeout(this._nav_timeout);
  }

  this.drag_breadcrumb = function(event, target)
  {
    if (this._breadcrumbs)
    {
      var left = getComputedStyle(this._breadcrumbs, null).getPropertyValue("left");
      this._drag_start = parseInt(left) - event.clientX;
      this._breadcrumbs.style.OTransitionDuration = 0;
      if (this._breadcrumbs.previousElementSibling.offsetWidth > 0)
      {
        this._breadcrumbs.addClass("drag")
        document.addEventListener("mousemove", this._drag_breadcrumbs_bound, false);
        document.addEventListener("mouseup", this._drag_end_bound, false);
      }
    }
  }

  this._drag_breadcrumbs = function(e)
  {
    this.set_position(this._drag_start + e.clientX);
  }

  this._drag_end = function()
  {
    this._current_breadcrumb_el = null;
    if (this._breadcrumbs)
    {
      this._breadcrumbs.removeClass("drag");
    }
    document.removeEventListener("mousemove", this._drag_breadcrumbs_bound, false);
    document.removeEventListener("mouseup", this._drag_end_bound, false);
  }

  /**
   * Sets the left position of the breadcrumbs. This method does boundary checking,
   * so the breadcrumbs never overflow on any direction.
   *
   * @param {int} left The left position of the breadcrumbs
   */
  this.set_position = function(left)
  {
    if (this._element.hasClass("navs"))
    {
      this._breadcrumbs.style.left =
        Math.max(
          Math.min(this._nav_back.offsetWidth, left),
          this._nav_forward.offsetLeft - this._breadcrumbs.scrollWidth + 1 /* 1 == right border on last element, which should be covered */
        ) + "px";
      this.check_position();
    }
  };

  /**
   * Checks the width of the breadcrumbs, and if necessary shows the navigation
   * buttons.
   */
  this.check_width = function()
  {
    if (this._breadcrumbs)
    {
      this._current_breadcrumb_el = null;
      if (this._breadcrumbs.scrollWidth > this._breadcrumbs.offsetWidth + this._breadcrumbs.offsetLeft)
      {
        this._element.addClass("navs");
      }
      else
      {
        this._element.removeClass("navs");
        this._breadcrumbs.style.cssText = "";
      }

      this.check_position();
    }
  };

  /**
   * Checks the position of the breadcrumbs, and if necessary, disables a navigation
   * button if it's not possible to go further in that direction.
   */
  this.check_position = function()
  {
    var left = parseInt(window.getComputedStyle(this._breadcrumbs, null).left);
    if (left == this._nav_back.offsetWidth)
    {
      this._nav_back.addClass("disabled");
    }
    else
    {
      this._nav_back.removeClass("disabled");
    }

    if (this._breadcrumbs.offsetWidth == this._breadcrumbs.scrollWidth)
    {
      this._nav_forward.addClass("disabled");
    }
    else
    {
      this._nav_forward.removeClass("disabled");
    }
  };

  this.setup = function()
  {
    this._element = this.update();
    this._element.render(window.templates.horizontal_navigation_content());
    this._breadcrumbs = this._element.querySelector("breadcrumbs");
    this._breadcrumbs.addEventListener("OTransitionEnd", this.check_position.bind(this), false);
    this._nav_back = this._element.querySelector("nav[dir='back']");
    this._nav_forward = this._element.querySelector("nav[dir='forward']");
    if (this._template_list)
    {
      this.set_content(this._data_model_id, this._template_list);
    }
  };

  this._super_set_dimension = this.setDimensions;
  this.setDimensions = function(force_redraw)
  {
    this._super_set_dimension(force_redraw);
    this.check_width();
  }

  this._super_init = this.init;
  this.init = function()
  {
    this._super_init();
    this.nav = this.nav.bind(this);
    this._drag_breadcrumbs_bound = this._drag_breadcrumbs.bind(this);
    this._drag_end_bound = this._drag_end.bind(this);
  }
};

var HorizontalNavigation = function()
{
  this.init();
};

HorizontalNavigation.prototype = new Modebar();
HorizontalNavigationBase.apply(HorizontalNavigation.prototype);
