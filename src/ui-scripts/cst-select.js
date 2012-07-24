var CstSelectBase = new function()
{

  /** interface **/

  /**
    * get the text string of the selected option
    */
  this.getSelectedOptionText = function(){};
  /**
    * get the text string for the tooltip of the selected option
    */
  this.getSelectedOptionTooltipText = function(){};
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
  /**
    * a optional call to check if the changes shall be submitted
    * for more complex selects like colors
    * return 0 submit, 1 cancel, 2 keep modal state
    */
  this.handleClick = function(target_ele, modal_box, _select_obj)
  {
    if ((!_select_obj.ignore_option_handlers && target_ele.hasAttribute('handler')) ||
        _select_obj.checkChange(target_ele))
      return 1;

    if (target_ele.nodeName.toLowerCase() != 'cst-option')
      return 2;

    return 0;
  };

  this.onshowoptionlist = function(container) {};
  this.onhideoptionlist = function(container) {};
  this.ignore_option_handlers = false;

  var _modal_box = null;
  var _select_obj = null;
  var self = this;

  var modal_mousedown_handler = function(event)
  {
    var ele = event.target;

    if (window.Tooltips && Tooltips.is_in_target_chain(event))
      return;

    while (ele != _modal_box && (ele = ele.parentElement));

    if (!ele || !(event.target.nodeName.toLowerCase() == "input" &&
                  event.target.type == "text"))
    {
      event.stopPropagation();
      event.preventDefault();
    }

    if (!ele)
      self.remove_select();
  }

  var modal_mouseup_handler = function(event)
  {
    var
    ele = event.target,
    target = event.target,
    select = null;

    if ((window.Tooltips && Tooltips.is_in_target_chain(event)) ||
        (event.target.nodeName.toLowerCase() == "input" &&
         event.target.type == "text"))
      return;

    event.stopPropagation();
    event.preventDefault();
    while (ele != _modal_box && (ele = ele.parentElement));
    if (ele)
    {
      switch (_select_obj.handleClick(target, _modal_box, _select_obj))
      {
        // cancel
        case 0: break;
        // submit
        case 1:
        {
          var handler = target.getAttribute('handler');
          if (handler)
          {
            if (eventHandlers.click[handler])
            {
              eventHandlers.click[handler](event, target);
            }
          }
          else
          {
            select = _select_obj.updateElement();
            if (select)
            {
              select.releaseEvent('change');
            }
          }
          break;
        }
        // keep modal state
        case 2: return
      }

      self.remove_select();
      if (window.Tooltips)
        window.Tooltips.hide_tooltip();
    }
  }

  this.remove_select = function()
  {
    if (_modal_box)
    {
      document.removeEventListener('mousedown', modal_mousedown_handler, true);
      document.removeEventListener('mouseup', modal_mouseup_handler, true);
      _modal_box.parentElement.removeChild(_modal_box);
      if (_select_obj.onhideoptionlist)
        _select_obj.onhideoptionlist();

      _modal_box = null;
      _select_obj = null;
      EventHandler.__modal_mode = false;
      return true;
    }
    return false;
  }

  this.is_modal_box_visible = function()
  {
    return Boolean(_modal_box);
  };

  var mouse_handler = function(event)
  {
    if (_modal_box)
      return;

    var select = event.target;
    var count = 2;

    while (count && select)
    {
      if (/^cst-select/i.test(select.nodeName))
        break;

      select = count && select.parentNode;
    }

    if (select)
    {
      var cursor = event.target;
      if (select.hasAttribute("disabled"))
      {
        return;
      }

      if (event.stopPropagation)
      {
        event.stopPropagation();
        event.preventDefault();
      }

      if (window.Tooltips)
        window.Tooltips.hide_tooltip();

      while (cursor && !/^container$/i.test(cursor.nodeName) && (cursor = cursor.parentElement));
      document.addEventListener('mousedown', modal_mousedown_handler, true);
      document.addEventListener('mouseup', modal_mouseup_handler, true);
      _select_obj = window['cst-selects'][select.getAttribute("cst-id")];
      var tmpl = templates['cst-select-option-list'](_select_obj, select);
      _modal_box = (cursor || document.documentElement).render(tmpl);
      var box = select.getBoundingClientRect(),
      has_search_bar = Boolean(_modal_box.querySelector("input[type=\"text\"]")),
      cursor_top = cursor && cursor.offsetTop - cursor.scrollTop || 0,
      cursor_left = cursor && cursor.offsetLeft - cursor.scrollLeft || 0,
      left = box.left - cursor_left,
      bottom = box.bottom - cursor_top,
      right = box.right - cursor_left,
      top = box.top - cursor_top,
      _innerWidth = innerWidth,
      _innerHeight = innerHeight,
      max_width = _innerWidth - left - 30,
      max_height = _innerHeight - bottom - (30 + (has_search_bar ? 25 : 0)),
      modal_box_width = _modal_box.offsetWidth,
      modal_box_height = _modal_box.offsetHeight,
      max_width_2 = right - 30,
      max_height_2 = top - 30,
      style = '';

      if (modal_box_height > max_height && modal_box_height < max_height_2)
      {
        style += "top: " + (top - modal_box_height) + "px;";
      }
      else
      {
        style += "top: " + (bottom - 1) + "px;";
        _modal_box.firstElementChild.style.cssText = "max-height: " + max_height + "px;"
      }
      if (modal_box_width > max_width && max_width_2 > max_width)
      {
        style += "left: " + (right - Math.min(modal_box_width, max_width_2)) + "px;" +
          "max-width: " + Math.min(modal_box_width, max_width_2) + "px;";
      }
      else
      {
        style += "left: " + left + "px; max-width: " + max_width + "px;";
      }
      style += "min-width:" + (select.offsetWidth < max_width ? select.offsetWidth : (max_width > 0 ? max_width : 0)) + "px;";
      _modal_box.style.cssText = style;
      var selected_option = _modal_box.querySelector("cst-option.selected");
      if (selected_option)
      {
        var offset_top = selected_option.offsetTop;
        var offset_height = selected_option.offsetHeight;
        var box_height = _modal_box.offsetHeight;
        if (offset_top + offset_height > box_height)
        {
          _modal_box.firstElementChild.scrollTop = offset_top + (offset_height / 2) - (box_height / 2);
        }
      }
      EventHandler.__modal_mode = true;
      if (_select_obj.onshowoptionlist)
      {
        var option_list = _modal_box.querySelector("cst-select-option-list");
        if (option_list)
          _select_obj.onshowoptionlist(option_list);
      }
    }
  }

  this.getTemplate = function()
  {
    var select = this;
    return function(view, disabled)
    {
      return window.templates['cst-select'](select, disabled);
    }
  }

  this.getId = function()
  {
    return this._id;
  }

  this.setNewValues = function(select_ele)
  {
    select_ele.value = this.getSelectedOptionValue();
    var firstElementChild = select_ele.firstElementChild;
    if(firstElementChild && firstElementChild.nodeName.toLowerCase() == "cst-value" )
    {
      var tooltip_text = this.getSelectedOptionTooltipText();
      if (tooltip_text)
      {
        var tmpl = ["span", this.getSelectedOptionText(),
                            "data-tooltip", "js-script-select",
                            "data-tooltip-text", tooltip_text];
        firstElementChild.clearAndRender(tmpl);
      }
      else
        firstElementChild.textContent = this.getSelectedOptionText();
    }
  }

  this.updateElement = function(checkbox_value)
  {
    var
    selects = document.getElementsByTagName('cst-select'),
    select = null,
    id = this.getId(),
    i = 0,
    ret_val = 0;

    for( ; select = selects[i]; i++)
    {

      if( select.getAttribute('cst-id') == id )
      {
        this.setNewValues(select, checkbox_value);
        ret_val = i;
      }
    }

    return selects[ret_val];
  }

  this.init = function(id, class_name, type, handler)
  {
    ( window['cst-selects'] || ( window['cst-selects'] = {} ) )[id] = this;
    this._selected_option_index = 0;
    this._option_list = this._option_list || [];
    this._id = id;
    this.class_name = class_name || '';
    this.type = type || '';
    this.handler = handler || '';
    this.template = this.getTemplate();
  }

  this.show_dropdown = function(id)
  {
    if (window["cst-selects"][id])
    {
      var select = document.querySelector("cst-select[cst-id=\"" + id + "\"]");
      if (select)
        mouse_handler({target: select});
    }
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
        "title", opt.title || "",
        "unselectable", "on"
      ]
    }
    return ret;
  }

  /* default interface implementation */
  this.checkChange = function(target_ele)
  {
    var index = target_ele['opt-index'];

    if (this._selected_option_index != index)
    {
      this._selected_option_index = index;
      return true;
    }
    return false;
  }

  document.addEventListener('mousedown', mouse_handler, false);
}

/**
 * Returns true if there is an open dropdown
 */
CstSelectBase.close_opened_select = function()
{
  return this.remove_select();
}

var CstSelect = function(id, class_name, type, handler)
{
  this.init(id, class_name, type, handler);
}

CstSelect.__defineGetter__("is_active", function()
{
  return CstSelectBase.is_modal_box_visible();
});

CstSelect.__defineSetter__("is_active", function() {});

CstSelect.show_dropdown = function(id)
{
  CstSelectBase.show_dropdown(id);
}

var CstSelectWithActionBase = function(id, class_name, type)
{
  /*
  this is a quick hack to have menu actions in a select
  */
  this._action_entries = [];

  this._action_entry = function(action)
  {
    return       [
      "cst-option",
      action.text,
      "handler", action.handler,
      "title", action.title || "",
      "unselectable", "on"
    ]
  }

  this.templateOptionList = function(select_obj)
  {
    var
    ret = select_obj._action_entries.map(this._action_entry),
    opt_list = select_obj._option_list,
    opt = null,
    i = 0;

    if(ret.length)
    {
      ret[ret.length] = ["hr"];
    }
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
    return ret;
  }
}

CstSelectWithActionBase.prototype =
CstSelect.prototype =
CstSelectBase;

CstSelectWithAction = function(id, class_name, type)
{
  this.init(id, class_name, type);
};

CstSelectWithAction.prototype = new CstSelectWithActionBase();

( window.templates || ( window.templates = {} ) )['cst-select'] = function(select, disabled)
{
  var tooltip_text = select.getSelectedOptionTooltipText();
  return ["cst-select",
           ["cst-value",
             ["span", select.getSelectedOptionText(),
                      "data-tooltip", tooltip_text && "js-script-select",
                      "data-tooltip-text", tooltip_text],
             "unselectable", "on"],
           ["cst-drop-down"],
           "cst-id", select.getId(),
           "handler", select.getId(),
           "unselectable", "on",
           "class", "ui-control",
           "disabled", disabled && "disabled",
           "handler", select.handler];
}

templates['cst-select-option-list'] = function(_select_obj, select_ele)
{
  var cln = "menu" + (_select_obj.class_name ? " " + _select_obj.class_name : "");
  return ["cst-select-option-list-container",
           ["cst-select-option-list",
              _select_obj.templateOptionList(_select_obj)],
              "style", "top: -1000px; left: -1000px;",
              "class", cln];
}
