/**
  * @constructor
  */

var BaseEditor = new function()
{
  // an editable element must have monospace font

  /* interface */
  this.edit =
  this.oninput =
  // must return a valid navigation target or null
  this.submit =
  // must return a valid navigation target or null
  this.cancel =
  // to handle click events while editing
  // could be perhaps a base method
  this.onclick =
  // must return a valid navigation target or null
  this.nav_next =
  // must return a valid navigation target or null
  this.nav_previous = function(){return null};

  this.textarea_container_name = "textarea-container";
  this.get_base_style = function(ele)
  {
    // stores style properties in base_style
    // and creates the markup for the textarea
    var
    style = getComputedStyle(ele, null),
    props = ['font-family', 'line-height', 'font-size'],
    prop = null,
    i = 0,
    span = document.createElement('test-element'),
    cssText = 'display:block;position:absolute;left:-100px;top:0;white-space:pre;';

    for( ; prop = props[i]; i++)
    {
      this.base_style[prop] = style.getPropertyValue(prop);
      cssText += prop +':' + this.base_style[prop] + ';';
    }
    span.textContent = '1234567890';
    document.documentElement.appendChild(span);
    span.style.cssText = cssText;
    this.char_width = span.offsetWidth / 10;
    this.base_style['line-height'] = ( this.line_height = span.offsetHeight ) + 'px';
    document.documentElement.removeChild(span);
    // host element style
    this.host_element_border_padding_left =
      parseInt(style.getPropertyValue('padding-left')) +
      parseInt(style.getPropertyValue('border-left-width'));
    this.host_element_border_padding_top =
      parseInt(style.getPropertyValue('padding-top')) +
      parseInt(style.getPropertyValue('border-top-width'));
    cssText = '';
    for( prop in this.base_style )
    {
      cssText += prop +':' + this.base_style[prop] + ';';
    }
    this.textarea_container = document.createElement(this.textarea_container_name);
    this.textarea = this.textarea_container.
      appendChild(document.createElement('textarea'));
    this.textarea.style.cssText = cssText;
    this.textarea.oninput = this.getInputHandler();
  }
  this.__is_active = function(){return false};
  this.__defineGetter__("is_active", function(){return this.__is_active()});
  this.getInputHandler = function()
  {
    return this.oninput.bind(this);
  };
  this._set_textarea_dimensions = function()
  {
    // TODO force new lines if needed
    var
    max_content_length =
      Math.max.apply(null, this.textarea.value.split(/\r?\n/).map(function(item){
        return item.length
      })),
    width = this.char_width * max_content_length;
    this.textarea.style.height = '0px';
    this.textarea.style.width = (width < this.max_width ?
                                 (width || 1) :
                                 this.max_width) + "px";
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  };
  this.base_init = function(instance)
  {
    this.context_enter = null;
    this.context_cur = null;
    this.base_style =
    {
      'font-family': '',
      'line-height': 0,
      'font-size': 0
    }
    this.char_width = 0;
    this.line_height = 0;
    this.cssText = '';
    this.textarea_container = null;
    this.textarea = null;
    this.host_element_border_padding_left = 0;
    this.host_element_border_padding_top = 0;
  }
};

SimpleBaseEditor = function(){};

SimpleBaseEditorPrototype = function()
{

  /* interface */
  /* inherits from BaseEditor */

  /* private */

  this._init = function()
  {
    this.base_init();
    this.textarea_container_name = "textarea-container-inline";
    this.context_enter = {};
    this.context_cur = {};
  };

  /**
    * The enter state for the edited elemnt. The updated state gets
    * passed to onsubmit.
    * @param {Element} ele. The element to be edited
    * @return {Object}. The returned object must have a property "value".
    *  "value" gets update on input.
    */

  this.set_enter_context = function(ele)
  {
    return {value: ""};
  }

  this.onsubmit = function(context)
  {

  }

  /* implementation */

  this.edit = function(event, ele)
  {
    ele || (ele = event.target);
    this.context_enter = this.set_enter_context(ele);
    if (!this.base_style['font-size'])
    {
      this.get_base_style(ele);
    }
    // this should never be needed
    if (this.textarea_container.parentElement)
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
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
      this.context_cur.value = this.textarea.value;
    }
  };

  this.submit = function()
  {
    // return a valid navigation target or null
    var nav_target = this.textarea_container.parentElement;
    if (nav_target)
    {
      nav_target.textContent = this.context_cur.value;
      this.onsubmit(this.context_cur);
    }
    return nav_target;
  };

  this.cancel = function()
  {
    // return a valid navigation target or null
    var nav_target = this.textarea_container.parentElement;
    if (nav_target)
    {
      nav_target.textContent = this.context_enter.value;
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

SimpleBaseEditorPrototype.prototype = BaseEditor;
SimpleBaseEditor.prototype = new SimpleBaseEditorPrototype();
