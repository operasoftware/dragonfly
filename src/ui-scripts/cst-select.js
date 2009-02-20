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
    return \
    target_ele.nodeName != 'cst-option'  && 2
    || select_obj.checkChange(target) && 1 
    || 0;
  };

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
          var select = select_obj.updateElement();
          if( select )
          {
            select.releaseEvent('change');
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
    if( /^cst-/.test(ele.nodeName) )
    {
      var select = /^cst-select/.test(ele.nodeName) && ele || ele.parentElement;
      if(select.hasAttribute("disabled"))
      {
        return;
      }
      document.addEventListener('click', modal_click_handler, true);
      select_obj = window['cst-selects'][select.getAttribute("cst-id")];
      modal_box = document.documentElement.render(templates['cst-select-option-list'](select_obj, select));

      var box = select.getBoundingClientRect(),
      left = box.left,
      bottom = box.bottom,
      right = box.right,
      top = box.top,
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
        style += "top: " + bottom + "px; max-height: " + max_height + "px;";
      };
      if( modal_box_width > max_width && modal_box_width < max_width_2 )
      {
        style += "left: " + ( right - modal_box_width ) + "px;";
      }
      else
      {
        style += "left: " + left + "px; max-width: " + max_width + "px;";
      };
      style += "min-width:" + select.offsetWidth + "px;";
      modal_box.style.cssText = style;
      EventHandler.__modal_mode= true;
    }
  }

  this.getTemplate = function()
  {
    var select = this;
    return function(disabled)
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
    select_ele.firstChild.textContent = this.getSelectedOptionText();
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
        this.setNewValues(select);
        ret = select;
      }
    }
    return ret;
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

var CstSelectColorBase = function(id, rgba_arr, handler)
{

  this.getSelectedOptionValue = function()
  {
    if( this._selected_value && this._selected_value.length == 4 )
    {
      colors.setRGB(this._selected_value);
      var l = parseFloat(colors.getLuminosity());
      colors.setLuminosity(l + (100 - l) * (1 - this._selected_value[3]/255));
      return "#" + colors.getHex();
    }
    return "";
  }
  // returns a rgba array
  this.getSelectedValue = function(rgba_arr)
  {
    return this._selected_value;
  }
  // to set the initial value
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

  this.setNewValues = function(select_ele)
  {
    select_ele.value = 
    select_ele.firstElementChild.style.backgroundColor = 
    this.getSelectedOptionValue();
  }

  this._selected_value = [];
  this._selected_option_index = 0;
  this._option_list =
  [
    [255, 0, 0, 255],   // red
    [255, 127, 0, 255],
    [255, 255, 0, 255], // yellow
    [127, 255, 0, 255],
    [0, 255, 0, 255],   // green
    [0, 255, 127, 255],
    [0, 255, 255, 255], // cyan
    [0, 127, 255, 255],
    [0, 0, 255, 255],   // blue
    [127, 0, 255, 255], 
    [255, 0, 255, 255], // magenta
    [255, 0, 127, 255],
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
          "cst-color"
          "unselectable", "on",
          "style", "background-color:" + rgba_to_hex(opt) + ";" +
                  "opacity: " + extract_alpha(opt) + ";"
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
      this.templateInputRange("Hue", colors.getHue(), "0", "360", "number", "set-hsla"),
      this.templateInputRange("Saturation", colors.getSaturation(), "0", "100", "number", "set-hsla"),
      this.templateInputRange("Luminosity", colors.getLuminosity(), "0", "100", "number", "set-hsla"),
      this.templateInputRange("Opacity", extract_alpha(select_obj._selected_value) * 100 >> 0, "0", "100", "digit-3", "set-hsla"),
      this.templateInputText("# ", colors.getHex(), "text", "set-hex"),
      'onchange', update_new_value
    ];
    ret[ret.length] = 
    [
      "div",
      this.templateInputButton("Ok", null, "1"),
      this.templateInputButton("Cancel", null, "0"),
      "class", "ok-cancel"
    ];
    return ['cst-option-list-background', ret];
  }

  this.handleClick = function(target, modal_box, select_obj)
  {
    // return 0 cancel, 1 submit, 2 keep modal state
    var ret = 2, rgba = null, inputs = null;
    switch (target.nodeName)
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

  this.templateInputRange = function(label, value, min, max, cn, change_handler_id)
  {
    return \
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
    ];
  }

  this.templateInputText = function(label, value, cn, change_handler_id)
  {
    return \
    [
      "label",
      label,
      [
        "input",
        "type", "text",
        "ref-type", change_handler_id,
        "value", value
      ]
      "class", cn,
    ];
  }

  this.templateInputButton = function(value, cn, ref_value )
  {
    return \
    [
      "input",
      "type", "button",
      "ref-value", ref_value,
      "class", cn || "",
      "value", value
    ];

  }

  // this is only valid during modal state
  var new_value = [];

  var colors = new Colors();

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
        selected.style.opacity = parseInt(inputs[3].value)/100;
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
  this.init = function(id, rgba_arr, handler)
  {
    this.__init_base(id, 'color', 'color', handler);
    this.setSelectedValue(rgba_arr || [255, 0, 0 ,255]);
  }
}

CstSelectColorBase.prototype = CstSelect.prototype = CstSelectBase;

CstSelectColor = function(id, rgba_arr, handler)
{
  this.init(id, rgba_arr, handler);
};

CstSelectColor.prototype = new CstSelectColorBase();

( window.templates || ( window.templates = {} ) )['cst-select'] = function(select, disabled)
{
  return \
  [
    "cst-select",
      ["cst-value", select.getSelectedOptionText(), "unselectable", "on"].
        concat( select.type ? ['style', 'background-color:' + select.getSelectedOptionValue() ] : [] ),
      ["cst-drop-down"],
    "cst-id", select.getId(),
    "unselectable", "on"
  ].
    concat( select.type ? ['class', select.type] : [] ).
    concat( disabled ? ['disabled', 'disabled'] : [] ).
    concat( select.handler? ['handler', select.handler] : [] )    ; 
}

templates['cst-select-option-list'] = function(select_obj, select_ele)
{
  return \
  [
    'cst-select-option-list', 
    select_obj.templateOptionList(select_obj),
    "style", "top: -1000px; left: -1000px;" 
  ].concat( select_obj.class_name ? ['class', select_obj.class_name] : [] );
}
