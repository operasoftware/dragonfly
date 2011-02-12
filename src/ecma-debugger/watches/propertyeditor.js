window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends BaseEditor
  */

window.cls.JSPropertyEditor = function(watches)
{
  this.base_init(this);
  this._watches = watches;
  this.textarea_container_name = "textarea-container-inline";
  // specific context 
  this.context_enter = {};
  this.context_cur = {};

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
    this.max_width = parseInt(getComputedStyle(ele.parentNode, null).getPropertyValue('width'));
    this.set_textarea_dimensions();
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
  }

  this.oninput = function(event)
  {
    if (this.textarea_container.parentElement)
    {
      this.set_textarea_dimensions();
      this.context_cur.key = this.textarea.value;
    }
  }

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
  }

  this.cancel = function()
  {
    // return a valid navigation target or null
    var nav_target = this.textarea_container.parentElement;
    if (nav_target)
    {
      nav_target.textContent = this.context_enter.key;
    }
    return nav_target;
  }

  this.nav_previous = function(event, action_id)
  {

  }

  this.nav_next = function(event, action_id)
  {

  }

  // helpers
  this.set_textarea_dimensions = function()
  {
    // TODO force new lines if needed
    var 
    max_content_length = 
      Math.max.apply(null, this.textarea.value.split('\r\n').map(function(item){return item.length})),
    width = this.char_width * max_content_length;
    this.textarea.style.height = '0px';
    this.textarea.style.width = ( width < this.max_width ? (width || 1) : this.max_width )+ "px";
    this.textarea.style.height = this.textarea.scrollHeight + 'px';
  }

  this.create_new_edit = function(ref_node)
  {
    var 
    name = ref_node.nodeName.toLowerCase(),
    parent = ref_node.parentNode,
    cur = parent.insertBefore
    (
      document.createTextNode( name == 'key' && '=' || ' ' ), ref_node.nextSibling
    );
    return parent.insertBefore
    (
      document.createElement( name == 'key' && 'value' || 'key' ), cur.nextSibling
    );
  }
  
  // could be the default method?
  this.onclick = function(event)
  {
    if(!this.textarea_container.contains(event.target))
    {
      this.submit();
      return true;
    }
    return false;
  }

}

cls.JSPropertyEditor.prototype = BaseEditor;
