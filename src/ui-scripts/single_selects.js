var SingleSelectBase = function()
{
  this.init = function(view_id, key, values, default_value)
  {
    this.id = view_id + "." + key;
    this.view_id = view_id;
    this.key = key;
    this.value = default_value;

    if(!window.single_selects)
      window.single_selects = {};
    if(!window.single_selects[view_id])
      window.single_selects[view_id] = {};

    window.single_selects[view_id][key] = this;
  }
}


var SingleSelect = function(viewid, key, values, default_value)
{
  this.init(viewid, key, values, default_value);
}

SingleSelect.prototype = new SingleSelectBase();