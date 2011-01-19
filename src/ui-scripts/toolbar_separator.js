/**
 * @constructor
 */
var ToolbarSeparator = function()
{
  this.type = "toolbar-separator";

  this.get_template = function()
  {
    return window.templates[this.type]();
  };
};

window.templates["toolbar-separator"] = function()
{
  return ["toolbar-separator"];
};

