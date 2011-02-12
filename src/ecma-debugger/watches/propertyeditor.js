window.cls || (window.cls = {});

/**
  * @constructor
  * @extends BaseEditor
  */

window.cls.JSPropertyEditor = function(watches)
{

  /* interface */
  /* inherits from BaseEditor */

  /* private */

  this._init = function()
  {
    this.base_init();
    this._watches = watches;
    this.textarea_container_name = "textarea-container-inline";
    this.context_enter = {};
    this.context_cur = {};
  };

  /* implementation */

  this.edit = function(event, ele)
  {
    ele || (ele = event.target);
    this.context_enter =
    {
      uid: parseInt(ele.getAttribute('data-prop-uid')),
      key: ele.textContent,
    };
    if (!this.base_style['font-size'])
    {
      this.get_base_style(ele);
    }
    // this should never be needed
    if (this.textarea_container.parentElement)
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        "this.textarea_container.parentElement is not null in submit");
    }
    this.textarea.value = ele.textContent;
    ele.textContent = "";
    ele.appendChild(this.textarea_container);
    this.max_width = parseInt(getComputedStyle(ele.parentNode,
                                               null).getPropertyValue('width'));
    this._set_textarea_dimensions();
    for (var prop in this.context_enter)
    {
      this.context_cur[prop] = this.context_enter[prop];
    }
    // only for click events
    if (event)
    {
      this.textarea.focus();
    }
    this.textarea.selectionStart = 0;
    this.textarea.selectionEnd = this.textarea.value.length;
  };

  this.oninput = function(event)
  {
    if (this.textarea_container.parentElement)
    {
      this._set_textarea_dimensions();
      this.context_cur.key = this.textarea.value;
    }
  };

  this.submit = function()
  {
    // return a valid navigation target or null
    var nav_target = this.textarea_container.parentElement;
    if (nav_target)
    {
      nav_target.textContent = this.context_cur.key;
      this._watches.add_watch(this.context_cur.uid, this.context_cur.key);
    }
    return nav_target;
  };

  this.cancel = function()
  {
    // return a valid navigation target or null
    var nav_target = this.textarea_container.parentElement;
    if (nav_target)
    {
      nav_target.textContent = this.context_enter.key;
    }
    return nav_target;
  };

  this.onclick = function(event)
  {
    if(!this.textarea_container.contains(event.target))
    {
      this.submit();
      return true;
    }
    return false;
  };

  this._init();

};

cls.JSPropertyEditor.prototype = BaseEditor;
