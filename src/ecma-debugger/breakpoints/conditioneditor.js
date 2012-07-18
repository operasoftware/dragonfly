window.cls || (window.cls = {});

/**
  * @constructor
  * @extends BaseEditor
  */

window.cls.ConditionEditor = function(breakpoints)
{

  this._init = function()
  {
    SimpleBaseEditor.prototype._init.call(this);
    this._breakpoints = breakpoints;
  };

  /* interface implementation */

  this.set_enter_context = function(ele)
  {
    return {uid: parseInt(ele.get_attr('parent-node-chain',
                                       'data-breakpoint-id')),
		        value: ele.textContent};
  };

  this.onsubmit = function(context)
  {
    this._breakpoints.add_condition(context.value, context.uid);
  }

  this._init();

};

cls.ConditionEditor.prototype = new SimpleBaseEditor();
