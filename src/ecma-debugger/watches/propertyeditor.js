window.cls || (window.cls = {});

/**
  * @constructor
  * @extends BaseEditor
  */

window.cls.JSPropertyEditor = function(watches)
{

  this._init = function()
  {
    SimpleBaseEditor.prototype._init.call(this);
    this._watches = watches;
  };

  /* interface implementation */

  this.set_enter_context = function(ele)
  {
    return {uid: parseInt(ele.getAttribute('data-prop-uid')),
            value: ele.textContent};
  };

  this.onsubmit = function(context)
  {
    this._watches.add_watch(context.value, context.uid);
  }

  this._init();

};

cls.JSPropertyEditor.prototype = new SimpleBaseEditor();
