/**
 * @constructor
 * @extends UIBase
 */
var HorizontalNavigation = function(cell)
{
  this.type = 'horizontal-navigation';

  var lastDir = null;

  this.setContent = function(template_list, focus_end)
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
    var breadcrumbsDim = this.breadcrumbs.getBoundingClientRect();
    var element = this.currentBreadcrumbEl;

    if (lastDir != dir) element = null;
    lastDir = dir;

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
        var leftEdge = element.getBoundingClientRect().left;
        left = this.nav_back.getBoundingClientRect().right - leftEdge;
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
        var rightEdge = element.getBoundingClientRect().right - breadcrumbsDim.left; //element.offsetLeft + element.offsetWidth;
        left = breadcrumbsDim.width - rightEdge;
        element = element.nextElementSibling;
      }
    }

    var pos = parseInt(getComputedStyle(this.breadcrumbs, null).getPropertyValue("left"));
    this.breadcrumbs.style.OTransitionDuration = Math.min(Math.abs(left) / 200, .2) + "s";
    this.breadcrumbs.style.left = pos + left + "px";
  };

  this.check_width = function()
  {
    this.currentBreadcrumbEl = null;
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
    this.currentBreadcrumbEl = null;
  };

  this.init(cell);
};

HorizontalNavigation.prototype = UIBase;

