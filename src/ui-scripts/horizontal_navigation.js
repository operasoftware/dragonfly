/**
 * @constructor
 * @extends UIBase
 */
var HorizontalNavigation = function(cell)
{
  this.type = 'horizontal-navigation';

  var last_dir = null;
  var current_breadcrumb_el = null;

  this.set_content = function(template_list, focus_end)
  {
    this.breadcrumbs.clearAndRender(template_list);
    this.check_width();
    if (focus_end)
    {
      //this.breadcrumbs.style.left = -(this.breadcrumbs.scrollWidth - this.breadcrumbs.offsetWidth - this.nav_forward.offsetWidth) + "px";
    }
    else
    {
      this.breadcrumbs.style.removeProperty("left");
    }
  };

  this.nav = function(dir)
  {
    var left = 0;
    var breadcrumbs_dim = this.breadcrumbs.getBoundingClientRect();
    var element = (last_dir == dir) ? current_breadcrumb_el : null;
    last_dir = dir;

    if (dir == "back")
    {
      if (!element)
      {
        element = this.breadcrumbs.querySelectorAll("breadcrumb")[0];
        while (element && element.getBoundingClientRect().right < this.nav_back.offsetWidth)
        {
            element = element.nextElementSibling;
        }
      }

      if (element)
      {
        var left_edge = element.getBoundingClientRect().left;
        left = this.nav_back.getBoundingClientRect().right - left_edge;
        element = element.previousElementSibling;
      }
    }
    else
    {
      if (!element)
      {
        element = this.breadcrumbs.querySelectorAll("breadcrumb")[0];
        while (element && element.getBoundingClientRect().right - 1 <= this.nav_forward.offsetLeft)
        {
            element = element.nextElementSibling;
        }
      }

      if (element)
      {
        var right_edge = element.getBoundingClientRect().right - breadcrumbs_dim.left; //element.offsetLeft + element.offsetWidth;
        left = breadcrumbs_dim.width - right_edge;
        element = element.nextElementSibling;
      }
    }

    var pos = parseInt(getComputedStyle(this.breadcrumbs, null).left);
    this.breadcrumbs.style.OTransitionDuration = Math.min(Math.abs(left) / 200, .2) + "s";
    this.breadcrumbs.style.left = pos + left + "px";
  };

  this.check_width = function()
  {
    current_breadcrumb_el = null;
    if (this.breadcrumbs.scrollWidth > this.breadcrumbs.offsetWidth)
    {
      this.element.addClass("navs");
    }
    else
    {
      this.element.removeClass("navs");
      this.breadcrumbs.style.removeProperty("left");
    }

    this.check_position();
  };

  this.check_position = function()
  {
    var left = parseInt(this.breadcrumbs.style.left);
    if (left == this.nav_back.offsetWidth || isNaN(left))
    {
      this.nav_back.addClass("disabled");
    }
    else
    {
      this.nav_back.removeClass("disabled");
    }

    if (this.breadcrumbs.offsetWidth == this.breadcrumbs.scrollWidth)
    {
      this.nav_forward.addClass("disabled");
    }
    else
    {
      this.nav_forward.removeClass("disabled");
    }
  };

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();

    this.element = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    this.element.render(window.templates.horizontal_navigation_content());
    this.breadcrumbs = this.element.querySelector("breadcrumbs");
    this.breadcrumbs.addEventListener("OTransitionEnd", this.check_position.bind(this), false);
    this.nav_back = this.element.querySelector("nav[dir='back']");
    this.nav_forward = this.element.querySelector("nav[dir='forward']");
  };

  this.init(cell);
};

HorizontalNavigation.prototype = UIBase;

