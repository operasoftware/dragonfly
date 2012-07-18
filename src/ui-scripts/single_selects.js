var SingleSelectBase = function()
{
  this.init = function(view_id, name, values, default_value, allow_multiple_select)
  {
    this.id = view_id + "." + name;
    this.view_id = view_id;
    this.name = name;
    this.values = [default_value];
    this.allow_multiple_select = allow_multiple_select;

    if(!window.single_selects)
      window.single_selects = {};

    if(!window.single_selects[view_id])
      window.single_selects[view_id] = {};

    window.single_selects[view_id][name] = this;
  }
}


var SingleSelect = function(viewid, name, values, default_value, allow_multiple_select)
{
  this.init(viewid, name, values, default_value, allow_multiple_select);
}

SingleSelect.prototype = new SingleSelectBase();
