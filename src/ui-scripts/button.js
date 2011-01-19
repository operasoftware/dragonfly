/**
 * @constructor
 */
var ButtonBase = function()
{
  this.type = "button";

  this.init = function(id, class_name, title, handler)
  {
    this.id = id;
    this.class_name = class_name || '';
    this.title = title || '';
    this.handler = handler || '';
  };
};

var Button = function(id, class_name, title, handler)
{
  /** interface **/

  /**
   * Set the active state of the button.
   *
   * @param {Boolean} active Whether or not the button is active.
   */
  this.set_active = function(active) {};

  /**
   * Get the button template.
   */
  this.get_template = function() {};


  /** implementation **/

  this.set_active = function(active)
  {
    this._element.setAttribute("is-active", !!active);
  };

  this.get_template = function()
  {
    return window.templates[this.type](this.id, this.class_name, this.title);
  };

  this.init(id, class_name, title, handler);
};

Button.prototype = new ButtonBase();

window.templates["button"] = function(id, class_name, title)
{
  return [
    "button",
    "",
    "id", id,
    "class", "ui-control " + class_name,
    "title", title,
    "handler", id
  ];
};

