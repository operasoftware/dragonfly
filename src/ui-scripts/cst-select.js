var CstSelectBase = new function()
{

  /** interface **/
	//
  /**
    * get the text string of the selected option 
    */
  this.getSelectedOptionText = function(){};
  /**
    * get the text value of the selected option 
    */
  this.getSelectedOptionValue = function(){};

  /**
    * the template for the option list.
    * there is default style for a <cst-option> element 
    * this template will be displayed in a <'cst-select-option-list> element, 
    * absolute positioned 
    */
  this.templateOptionList = function(select_obj){};
  /**
    * the call to check if a new selected option has actually changed 
    */
  this.checkChange = function(target_ele){};




  var modal_box = null;
  var select_obj = null;

  var modal_click_handler = function(event)
  {

    var 
    ele = event.target,
    target = event.target, 
    index = 0;

    event.stopPropagation();
    event.preventDefault();
    document.removeEventListener('click', modal_click_handler, true);
    while( ele != modal_box && ( ele = ele.parentElement ) );
    if( ele )
    {
      if( select_obj.checkChange(target)  )
      {
        var select = select_obj.updateElement();
        if( select )
        {
          select.releaseEvent('change');
        }
      }
    }
    modal_box.parentElement.removeChild(modal_box);
    modal_box = null;
    select_obj = null;
  }

  var click_handler = function(event)
  {
    if( /cst-drop-dow/.test(event.target.nodeName) )
    {
      var select = event.target.parentElement;
      document.addEventListener('click', modal_click_handler, true);
      select_obj = window['cst-selects'][select.getAttribute("cst-id")];
      modal_box = document.documentElement.render(templates['cst-select-option-list'](select_obj, select));
      // modal_box = select.offsetParent.appendChild(option_list);
    }
  }

   

  this.getTemplate = function()
  {
    var select = this;
    return function()
    {
      return window.templates['cst-select'](select);
    }
  }

  this.getId = function()
  {
    return this._id;
  }

  this.updateElement = function()
  {
    var 
    selects = document.getElementsByTagName('cst-select'),
    select = null, 
    id = this.getId(),
    i = 0,
    ret = null;

    for( ; select = selects[i]; i++)
    {
      if( select.getAttribute('cst-id') == id )
      {
        select.value = this.getSelectedOptionValue();
        select.firstChild.textContent = this.getSelectedOptionText();
        ret = select;
      }
    }
    return ret;
  }

  this.init = function(id, class_name)
  {
    ( window['cst-selects'] || ( window['cst-selects'] = {} ) )[id] = this;
    this._option_list = [];
    this._selected_option_index = 0;
    this._id = id;
    this.class_name = class_name || '';
  }

  /* default interface implemetation */
  this.getSelectedOptionText = function()
  {
    var selected_option = this._option_list[this._selected_option_index];
    return selected_option && selected_option.text || "";
  }

  /* default interface implemetation */
  this.getSelectedOptionValue = function()
  {
    var selected_option = this._option_list[this._selected_option_index];
    return selected_option && selected_option.value || selected_option.text || '';
  }

  /* default interface implemetation */
  this.templateOptionList = function(select_obj)
  {
    var 
    ret = [],
    opt_list = select_obj._option_list,
    opt = null, 
    i = 0;

    for( ; opt = opt_list[i]; i++)
    {
      ret[i] = 
      [
        "cst-option",
        opt.text,
        "opt-index", i,
        "title", opt.title,
        "unselectable", "on"
      ]
    }
    return ret;
  }

  /* default interface implemetation */
  this.checkChange = function(target_ele)
  {
    var index = event.target['opt-index'];
    
    if( this._selected_option_index != index )
    {
      this._selected_option_index = index;
      return true;
    }
    return false;
  }

  document.addEventListener('click', click_handler, false);
}



var CstSelect = function(id, class_name)
{
  this.init(id, class_name);
}

CstSelect.prototype = CstSelectBase;

window.templates || ( window.templates = {} );


templates['cst-select'] = function(select)
{
  return \
  [
    "cst-select",
      ["cst-value", select.getSelectedOptionText(), "unselectable", "on"],
      ["cst-drop-down"],
    "cst-id", select.getId(),
    "unselectable", "on"
  ]
}


templates['cst-select-option-list'] = function(select_obj, select_ele)
{
  // TODO check for the best position to dispaly the option list
  var 
  box = select_ele.getBoundingClientRect(),
  left = box.left,
  bottom = box.bottom,
  max_width = innerWidth - left - 30,
  max_height = innerHeight - bottom - 30;

  return \
  [
    'cst-select-option-list', 
    select_obj.templateOptionList(select_obj),
    "style",
    "top: " + box.bottom + "px;" +
    "left: " + ( box.left ) + "px;" +
    "min-width:" + select_ele.offsetWidth + "px;" +
    "max-width: " + max_width + "px;" +
    "max-height: " + max_height + "px"
  ].concat( select_obj.class_name ? ['class', select_obj.class_name] : [] );
}
