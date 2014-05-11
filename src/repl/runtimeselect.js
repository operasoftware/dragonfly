cls.CommandLineRuntimeSelect = function(id, class_name)
{

  this.getSelectedOptionText = function()
  {
    var rt = window.runtimes.getRuntime(this._selected_runtime_id);
    return rt ? rt.title || rt.short_distinguisher : "";
  };

  this.getSelectedOptionValue = function() {};

  this.templateOptionList = function(select_obj)
  {
    return templates.runtime_dropdown(runtimes.get_dom_runtimes());
  };

  this.checkChange = function(target_ele)
  {
    var rt_id = parseInt(target_ele.getAttribute('rt-id'));
    if (rt_id && rt_id != this._selected_runtime_id)
      this.set_id(rt_id);
    return true;
  };

  this._onruntimeselected = function(msg)
  {
    this.set_id(msg.id);
  };

  this.set_id = function(id)
  {
    this._selected_runtime_id = id;
    this.updateElement();
  };

  this.get_id = function(id)
  {
    return this._selected_runtime_id;
  };

  this.init = function(id, class_name)
  {
    this._selected_runtime = null;
    CstSelect.prototype.init.call(this, id, class_name);
    window.messages.add_listener("runtime-selected", this._onruntimeselected.bind(this));
  };

  this.init(id, class_name);
};

cls.CommandLineRuntimeSelect.prototype = new CstSelect();
