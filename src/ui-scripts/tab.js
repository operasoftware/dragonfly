var TabBase = new function()
{
  var self = this;
  var id_count = 1;
  var ids = {};

  var getId = function()
  {
    return 'tab-' + (id_count++).toString();
  }

  this.init = function(ref_id, name, has_close_button)
  {
    this.name = name;
    this.ref_id = ref_id;
    this.has_close_button = has_close_button;
    ids [ this.id = getId() ] = this;
  }

  this.getTabById = function(id)
  {
    return ids[id];
  }

  this._delete = function(id)
  {
    delete ids[id];
  }

}

var Tab = function(ref_id, name, has_close_button)
{
  // at some point all tabs will have a close button
  this.init(ref_id, name, has_close_button)
}

Tab.prototype = TabBase;

