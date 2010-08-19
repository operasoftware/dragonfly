var CstSelectBase = new function()
{

  /** interface **/
	
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
  /**
    * a optional call to check if the changes shall be submitted
    * for more complex selects like colors 
    * return 0 submit, 1 cancel, 2 keep modal state
    */
  this.handleClick = function(target_ele, modal_box, select_obj)
  {
    return target_ele.nodeName.toLowerCase() != 'cst-option'  && 2 || 
          ( target_ele.hasAttribute('handler') || 
            select_obj.checkChange(target_ele) ) && 1  || 0;
  };

  var modal_box = null;
  var select_obj = null;

  var modal_click_handler = function(event)
  {
    var 
    ele = event.target,
    target = event.target, 
    index = 0,
    select = null;

    event.stopPropagation();
    event.preventDefault();
    while( ele != modal_box && ( ele = ele.parentElement ) );
    if( ele )
    {
      switch( select_obj.handleClick(target, modal_box, select_obj) )
      {
        // cancel
        case 0: break;
        // submit
        case 1:
        {
          var handler = target.getAttribute('handler');
          if( handler )
          {
            if( eventHandlers.click[handler] )
            {
              eventHandlers.click[handler](event, target);
            }
          }
          else
          {
            select = select_obj.updateElement();
            if(select )
            {
              select.releaseEvent('change');
            }
          }
          break;
        }
        // keep modal state
        case 2: return
      }
    }
    document.removeEventListener('click', modal_click_handler, true);
    modal_box.parentElement.removeChild(modal_box);
    modal_box = null;
    select_obj = null;
    delete EventHandler.__modal_mode;
  }

  var click_handler = function(event)
  {
    var ele = event.target;
    if( /^cst-/i.test(ele.nodeName) )
    {
      var select = /^cst-select/i.test(ele.nodeName) && ele || ele.parentElement;
      var cursor = event.target;
      if(select.hasAttribute("disabled"))
      {
        return;
      }
      while( cursor && !/^container$/i.test(cursor.nodeName) && ( cursor = cursor.parentElement ) );
      document.addEventListener('click', modal_click_handler, true);
      select_obj = window['cst-selects'][select.getAttribute("cst-id")];
      modal_box = (cursor || document.documentElement).render(templates['cst-select-option-list'](select_obj, select));
      
      var box = select.getBoundingClientRect(),
      cursor_top = cursor && cursor.offsetTop - cursor.scrollTop || 0,
      cursor_left = cursor && cursor.offsetLeft - cursor.scrollLeft || 0,
      left = box.left - cursor_left,
      bottom = box.bottom - cursor_top,
      right = box.right - cursor_left,
      top = box.top - cursor_top,
      _innerWidth = innerWidth, 
      _innerHeight = innerHeight,
      max_width = _innerWidth - left - 30,
      max_height = _innerHeight - bottom - 30,
      modal_box_width = modal_box.offsetWidth,
      modal_box_height = modal_box.offsetHeight,
      max_width_2 = right - 30,
      max_height_2 = top - 30,
      style = '';

      

      if( modal_box_height > max_height && modal_box_height < max_height_2 )
      {
        style += "top: " + ( top - modal_box_height ) + "px;";
      }
      else
      {
        style += "top: " + bottom + "px;";
        modal_box.firstElementChild.style.cssText = "max-height: " + max_height + "px;"
      };
      if (modal_box_width > max_width && max_width_2 > max_width)
      {
        style += "left: " + (right - Math.min(modal_box_width, max_width_2)) + "px;" +
          "max-width: " + Math.min(modal_box_width, max_width_2) + "px;";
      }
      else
      {
        style += "left: " + left + "px; max-width: " + max_width + "px;";
      };
      style += "min-width:" + ( select.offsetWidth < max_width ? select.offsetWidth : (  max_width > 0 ? max_width : 0 ) ) + "px;";
      modal_box.style.cssText = style;
      EventHandler.__modal_mode= true;
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
    var index = target_ele['opt-index'];
    
    if( this._selected_option_index != index )
    {
      this._selected_option_index = index;
      return true;
    }
    return false;
  }

  document.addEventListener('click', click_handler, false);
}



var CstSelect = function(id, class_name, type, handler)
{
  this.init(id, class_name, type, handler);
}

var CstSelectColorBase = function(id, rgba_arr, handler, option)
{

  this.getSelectedOptionValue = function()
  {
    if( this._selected_value && this._selected_value.length == 4 )
    {
      colors.setRGB(this._selected_value);
      var l = parseFloat(colors.getLuminosity());
      if( this.has_opacity )
      {
        colors.setLuminosity(l + (100 - l) * (1 - this._selected_value[3]/255));
      }
      return "#" + colors.getHex();
    }
    return "";
  }
  // returns a rgba array
  this.getSelectedValue = function(rgba_arr)
  {
    return this._selected_value;
  }

  this.setSelectedValue = function(rgba_arr)
  {
    if(rgba_arr && rgba_arr.length == 4)
    {
      this._selected_value = rgba_arr;
      var hue = colors.setRGB(rgba_arr).getHue();
      this._selected_option_index = hue / 30 >> 0;
      if( hue % 30 > 15 ) this._selected_option_index++;
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
        'not a rgba value in setSelect3dValue in CstSelectColorBase');
    }
  }

  this.setNewValues = function(select_ele, checkbox_value)
  {
    select_ele.value = 
      select_ele.firstElementChild.style.backgroundColor = 
      this.getSelectedOptionValue();
    if( typeof checkbox_value == "boolean" )
    {
      var checkbox = select_ele.previousElementSibling;
      if( checkbox && checkbox.type == "checkbox" )
      {
        checkbox.checked = checkbox_value;
        if(checkbox_value)
        {
          select_ele.removeAttribute('disabled');
        }
        else
        {
          select_ele.setAttribute('disabled', 'disabled');
        }
      }
    }
  }

  this._selected_value = [];
  this._selected_option_index = 0;
  this._option_list =
  [
    [255, 0, 0, 127],   // red
    [255, 127, 0, 127],
    [255, 255, 0, 127], // yellow
    [127, 255, 0, 127],
    [0, 255, 0, 127],   // green
    [0, 255, 127, 127],
    [0, 255, 255, 127], // cyan
    [0, 127, 255, 127],
    [0, 0, 255, 127],   // blue
    [127, 0, 255, 127], 
    [255, 0, 255, 127], // magenta
    [255, 0, 127, 127],
  ]

  this.templateOptionList = function(select_obj)
  {
    var 
    ret = ['div'],
    opt_list = select_obj._option_list,
    selected_index = select_obj._selected_option_index,
    opt = null, 
    i = 0;

    new_value = select_obj.getSelectedValue();
    colors.setRGB(new_value);
    for( ; opt = opt_list[i]; i++)
    {
      if(i == selected_index)
      {
        opt = new_value;
      }
      ret[ret.length] = 
      [
        "cst-option",
        [
          "cst-color",
          "unselectable", "on",
          "style", "background-color:" + rgba_to_hex(opt) + ";" +
                  ( select_obj.has_opacity && ( "opacity: " + extract_alpha(opt) + ";" ) || "")
        ],
        "opt-index", i,
        "unselectable", "on"
      ]; 
      if( i == selected_index )
      {
        ret[ret.length] = ["cst-selected-border"];
      }
    }
    ret[ret.length] = 
    [
      "div", 
      this.templateInputRange(ui_strings.S_LABEL_COLOR_HUE, colors.getHue(), "0", "360", "number", "set-hsla"),
      this.templateInputRange(ui_strings.S_LABEL_COLOR_SATURATION, colors.getSaturation(), "0", "100", "number", "set-hsla"),
      this.templateInputRange(ui_strings.S_LABEL_COLOR_LUMINOSITY, colors.getLuminosity(), "0", "100", "number", "set-hsla"),
      this.templateInputRange(ui_strings.S_LABEL_COLOR_OPACITY, extract_alpha(select_obj._selected_value) * 100 >> 0, "0", 
        "100", "digit-3", "set-hsla", !select_obj.has_opacity),
      this.templateInputText("# ", colors.getHex(), "text", "set-hex"),
      'onchange', update_new_value
    ];
    ret[ret.length] = 
    [
      "div",
      this.templateInputButton(ui_strings.S_BUTTON_OK, null, "1"),
      this.templateInputButton(ui_strings.S_BUTTON_CANCEL, null, "0"),
      "class", "ok-cancel"
    ];
    return ['cst-option-list-background', ret];
  }

  this.handleClick = function(target, modal_box, select_obj)
  {
    // return 0 cancel, 1 submit, 2 keep modal state
    var ret = 2, rgba = null, inputs = null;
    switch (target.nodeName.toLowerCase())
    {
      case 'cst-color':
      {
        if(target.parentElement.nextElementSibling)
        {
          target.parentElement.parentElement.insertBefore
          (
            modal_box.getElementsByTagName('cst-selected-border')[0], 
            target.parentElement.nextElementSibling
          );
        }
        else
        {
          target.parentElement.parentElement.appendChild
          (
            modal_box.getElementsByTagName('cst-selected-border')[0]
          );
        } 
        if( rgba = extract_rgba(target) )
        {
          new_value = rgba;
          colors.setRGB(rgba);
          inputs = modal_box.getElementsByTagName('input');
          inputs[0].value = colors.getHue();
          inputs[1].value = colors.getSaturation();
          inputs[2].value = colors.getLuminosity();
          inputs[3].value = extract_alpha(rgba) * 100 >> 0;
          inputs[4].value = colors.getHex();
        }
        break;
      }
      case 'input':
      {
        if(/button/i.test(target.type))
        { 
          ret = 0;
          if(target.getAttribute('ref-value') == '1' && new_value != select_obj._selected_value)
          {
            select_obj.setSelectedValue(new_value);
            ret = 1;
          }
        }
        break;
      }
    }
    return ret;
  }

  this.templateInputRange = function(label, value, min, max, cn, change_handler_id, display_none)
  {
    return (
    [
      "label",
      label,
      [
        "input",
        "type", "number",
        "min", min,
        "max", max,
        "ref-type", change_handler_id,
        "value", value
      ],
      "class", cn,
    ].concat( display_none ? ['style', 'display:none'] : []) );
  }

  this.templateInputText = function(label, value, cn, change_handler_id)
  {
    return (
    [
      "label",
      label,
      [
        "input",
        "type", "text",
        "ref-type", change_handler_id,
        "value", value
      ],
      "class", cn,
    ] );
  }

  this.templateInputButton = function(value, cn, ref_value )
  {
    return (
    [
      "input",
      "type", "button",
      "ref-value", ref_value,
      "class", cn || "",
      "value", value
    ] );
  }

  // this is only valid during modal state
  var new_value = [];

  var colors = new Color();

  var extract_rgba = function(ele)
  {
    var color = /#(..)(..)(..)/.exec(ele.style.getPropertyValue('background-color'));
    return color &&
    [
      parseInt(color[1], 16), 
      parseInt(color[2], 16), 
      parseInt(color[3], 16),
      parseFloat(ele.style.getPropertyValue('opacity')) * 255 >> 0
    ];
  }

  var int_to_hex = function(int)
  {
    var hex = int.toString(16);
    return hex.length == 1 && "0" + hex || hex;
  }

  var rgba_to_hex = function(rgba)
  {
    return "#" + rgba.slice(0,3).map(int_to_hex).join('');
  }

  var extract_alpha = function(rgba)
  {
    return rgba[3] / 255;
  }

  // change event handler
  var update_new_value = function(event)
  {
    var 
    target = event.target,
    targets_container = target.parentNode.parentNode,
    inputs = targets_container.getElementsByTagName('input'),
    selected = targets_container.parentNode.
      getElementsByTagName('cst-selected-border')[0].previousElementSibling.firstElementChild;

    switch(event.target.getAttribute('ref-type'))
    {
      case "set-hsla":
      {
        colors.
          setHue(inputs[0].value).
          setSaturation(inputs[1].value).
          setLuminosity(inputs[2].value);
        selected.style.backgroundColor = "#" + ( inputs[4].value = colors.getHex() );
        if( inputs[3].parentElement.style.display != "none" )
        {
          selected.style.opacity = parseInt(inputs[3].value)/100;
        }
        new_value = colors.getRGB().concat([parseInt(inputs[3].value)/100*255]);
        break;
      }
      case "set-hex":
      {
        colors.setHex(inputs[4].value);
        inputs[0].value = colors.getHue();
        inputs[1].value = colors.getSaturation();
        inputs[2].value = colors.getLuminosity();
        selected.style.backgroundColor = "#" + colors.getHex();
        new_value = colors.getRGB().concat([parseInt(inputs[3].value)/100*255]);
        break;
      }
    }
  }

  this.__init_base = this.init;
  this.init = function(id, rgba_arr, handler, option)
  {
    this.__init_base(id, 'color', 'color', handler);
    this.setSelectedValue(rgba_arr || [255, 0, 0 ,255]);
    this.has_opacity = !(option == "no-opacity");
  }
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
      "title", action.title,
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
CstSelectColorBase.prototype = 
CstSelect.prototype = 
CstSelectBase;

CstSelectColor = function(id, rgba_arr, handler, option)
{
  this.init(id, rgba_arr, handler, option);
};

CstSelectColor.prototype = new CstSelectColorBase();

CstSelectWithAction = function(id, class_name, type)
{
  this.init(id, class_name, type);
};

CstSelectWithAction.prototype = new CstSelectWithActionBase();

( window.templates || ( window.templates = {} ) )['cst-select'] = function(select, disabled)
{
  return (
  [
    "cst-select",
      ["cst-value", select.getSelectedOptionText(), "unselectable", "on"].
        concat( select.type ? ['style', 'background-color:' + select.getSelectedOptionValue() ] : [] ),
      ["cst-drop-down"],
    "cst-id", select.getId(),
    "handler", select.getId(),
    "unselectable", "on"
  ].
  concat( select.type ? ['class', select.type] : [] ).
  concat( disabled ? ['disabled', 'disabled'] : [] ).
  concat( select.handler? ['handler', select.handler] : [] ) ); 
}

templates['cst-select-option-list'] = function(select_obj, select_ele)
{
  return (
  ['cst-select-option-list-container',
    ['cst-select-option-list', select_obj.templateOptionList(select_obj)],
    'style', 'top: -1000px; left: -1000px;'
  ].concat( select_obj.class_name ? ['class', select_obj.class_name] : [] ) );
}
