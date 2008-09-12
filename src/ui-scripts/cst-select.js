var CstSelectBase = new function()
{
  var modal_box = null;
  var select_obj = null;

  var modal_click_handler = function(event)
  {
    var 
    ele = event.target,
    index = 0;

    event.stopPropagation();
    event.preventDefault();
    document.removeEventListener('click', modal_click_handler, true);
    while( ele != modal_box && ( ele = ele.parentElement ) );
    if( ele )
    {
      index = event.target['opt-index'];
      if( select_obj.getSelectedIndex() != index )
      {
        select_obj.update(index);
      }
    }
    modal_box.parentElement.removeChild(modal_box);
    modal_box = null;
    select_obj = null;
  }

  this.setOptionList = function(list)
  {
    this._option_list = list;
  }

  this.getOptionList = function()
  {
    return this._option_list;
  }

  this.setSelected = function(index)
  {
    this._selected_option_index = index;
  }

  this.getSelectedIndex = function(index)
  {
    return this._selected_option_index;
  }

  this.getSelectedOptionText = function()
  {
    var selected_option = this._option_list[this._selected_option_index];
    return selected_option && selected_option.text || "";
  }

  this.getId = function()
  {
    return this._id;
  }

  this.update = function(index)
  {
    var 
    selects = document.getElementsByTagName('cst-select'),
    select = null,
    selected_opt = this._option_list[ this._selected_option_index = index ],
    i = 0;

    if( selected_opt )
    {
      for( ; select = selects[i]; i++)
      {
        if( select.getAttribute('cst-id') == this._id )
        {
          select.value = selected_opt.value
          select.firstChild.textContent = selected_opt.text;
          select.releaseEvent('change');
        }
      }
    }
    else
    {
      throw "select index out of range in CstSelectBase";
    }
  }



  var click_handler = function(event)
  {
    if( /cst-drop-dow/.test(event.target.nodeName) )
    {
      var select = event.target.parentElement;
      document.addEventListener('click', modal_click_handler, true);
      select_obj = window['cst-selects'][select.getAttribute("cst-id")];
      modal_box = select.offsetParent.render(templates['cst-select-option-list'](select_obj, select));
    }
  }

  this.init = function(id)
  {
    ( window['cst-selects'] || ( window['cst-selects'] = {} ) )[id] = this;
    this._option_list = [];
    this._selected_option_index = 0;
    this._id = id;
  }

  document.addEventListener('click', click_handler, false);
}



var CstSelect = function(id)
{
  this.init(id);
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
    "unselectable", "on",
    "style", "width: 200px"
  ]
}

templates['cst-select-option-list'] = function(select, select_ele)
{
  var 
  ret = ['cst-select-option-list'],
  opt_list = select.getOptionList(),
  opt = null,
  i = 0;

  for( ; opt = opt_list[i]; i++)
  {
    ret[ret.length] = 
    [
      "cst-option",
      opt.text,
      "opt-index", i,
      "title", opt.title,
      "unselectable", "on"
    ]
  }

  ret = ret.concat
  ([
    "style",
    "top:" + ( select_ele.offsetTop + select_ele.offsetHeight ) + "px;" +
    "left:" + select_ele.offsetLeft + "px;" +
    "min-width:" + select_ele.offsetWidth + "px;"
  ])

  return ret;
}

