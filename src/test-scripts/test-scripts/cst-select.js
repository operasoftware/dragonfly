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
      if( target.nodeName != 'cst-option' )
      {
        return;
      }
      if( select_obj.checkChange(target)  )
      {
        var select = select_obj.updateElement();
        if( select )
        {
          select.releaseEvent('change');
        }
      }
    }
    document.removeEventListener('click', modal_click_handler, true);
    modal_box.parentElement.removeChild(modal_box);
    modal_box = null;
    select_obj = null;
    delete document.__modal_mode;
  }

  var click_handler = function(event)
  {
    var ele = event.target;
    if( /^cst-/.test(ele.nodeName) )
    {
      var select = /^cst-select/.test(ele.nodeName) && ele || ele.parentElement;
      document.addEventListener('click', modal_click_handler, true);
      select_obj = window['cst-selects'][select.getAttribute("cst-id")];
      modal_box = document.documentElement.render(templates['cst-select-option-list'](select_obj, select)),
      box = select.getBoundingClientRect(),
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
      document.__modal_mode= true;
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

  this.init = function(id, class_name, type)
  {
    ( window['cst-selects'] || ( window['cst-selects'] = {} ) )[id] = this;
    this._option_list = this._option_list || [];
    this._id = id;
    this.class_name = class_name || '';
    this.type = type || '';
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



var CstSelect = function(id, class_name, type)
{
  this.init(id, class_name, type);
}

var CstSelectColorBase = function(id, index)
{

  this.setNewValues = function(select_ele)
  {
    select_ele.value = select_ele.style.backgroundColor = this.getSelectedOptionValue();
  }

  this.getSelectedOptionValue = function()
  {
    var selected_option = this._option_list[this._selected_option_index];
    return selected_option && selected_option['color-value'] || 'none';
  }

  this.getSelectedOptionAlpha = function()
  {
    var selected_option = this._option_list[this._selected_option_index];
    return selected_option && selected_option['alpha-value'] || 1;
  }

  this.checkChange = function(target_ele)
  {
    var 
    index = target_ele['opt-index'],
    selected_option = this._option_list[index],
    alpha = target_ele.parentNode.parentNode.getElementsByTagName('input')[0];

    alpha = parseFloat(alpha.value) || 1;
    if( this._selected_option_index != index || selected_option['alpha-value'] != alpha )
    {
      this._selected_option_index = index;
      selected_option['alpha-value'] = alpha;
      delete selected_option['rgba'];
      return true;
    }
    return false;
  }

  this.setAlpha = function(value)
  {
    var 
    cursor = this._option_list[this._selected_option_index],
    modal_box = document.getElementsByTagName('cst-select-option-list')[0];

    if( cursor )
    {
      cursor['alpha-value'] = value / 100;
      delete cursor['rgba'];
    }
    if( modal_box )
    {
      modal_box.getElementsByTagName('input')[0].value = value / 100;
      cursor = modal_box.getElementsByTagName('cst-option')[this._selected_option_index];
      if( cursor )
      {
        cursor.style.opacity = value / 100;
      }
    }
  }

  this.templateOptionList = function(select_obj)
  {
    var 
    ret = ['div'],
    opt_list = select_obj._option_list,
    selected_index = select_obj._selected_option_index,
    opt = null, 
    i = 0;

    for( ; opt = opt_list[i]; i++)
    {
      ret[ret.length] = 
      [
        "cst-option",
        "opt-index", i,
        "unselectable", "on",
        "style", 
          "background-color:" + opt["color-value"] + ";" +
          "opacity: " + opt["alpha-value"] + ";",
      ]; 
      if( i == selected_index )
      {
        ret[ret.length] = ["cst-selected-border"];
      }
    }
    ret = [ret];
    ret[ret.length] = 
    [
      "label",
      "alpha: ",
      [
        "input",
        "type", "text",
        "value", select_obj.getSelectedOptionAlpha()
      ]
    ];
    ret[ret.length] =
    [
      "input",
      "type", "range",
      "value", select_obj.getSelectedOptionAlpha() * 100,
      "onchange", function()
      {
        select_obj.setAlpha(this.value);
      }
    ];
    return ret;
  }

  this._option_list = 
  [
    {
      "color-value": "#00ff00", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#4dff00", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#99ff00", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#e6ff00", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ffcc00", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ff7f00", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ff3300", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ff001a", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ff0066", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ff00b3", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#ff00ff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#b200ff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#6600ff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#1900ff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#0033ff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#0080ff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#00ccff", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#00ffe5", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#00ff99", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
    {
      "color-value": "#00ff4c", 
      "alpha-value": .7, 
      "ref-id": "color-1", 
    },
  ];

  this.getSelectedRGBA = function()
  {
    var
    selected_option = this._option_list[this._selected_option_index],
    hexs = null;
    
    if( selected_option )
    {
      if( !selected_option['rgba'] )
      {
        hexs = selected_option['color-value'].split(/([0-9-a-fA-F]{2})/);
        selected_option['rgba'] = "rgba(" + 
          parseInt(hexs[1], 16) + ", " +  
          parseInt(hexs[3], 16) + ", " +  
          parseInt(hexs[5], 16) + ", " +  
          selected_option['alpha-value'] + ")";
      }
      return selected_option['rgba'];
    }
    return "rgba(0, 0, 0, 0.5)";
  }

  this.__init_base = this.init;
  this.init = function(id, index)
  {
    this.__init_base(id, 'color', 'color');
    this._selected_option_index = index || 0;
    ( window.colors || ( window.colors = {} ) ).__defineGetter__
    (
      id, 
      (function(obj)
      { 
        return function(){return obj.getSelectedRGBA()};
      })(this)
    );
  }
}

CstSelectColorBase.prototype = CstSelect.prototype = CstSelectBase;

CstSelectColor = function(id, index)
{
  this.init(id, index);
};

CstSelectColor.prototype = new CstSelectColorBase();

( window.templates || ( window.templates = {} ) )['cst-select'] = function(select)
{
  return \
  [
    "cst-select",
      ["cst-value", select.getSelectedOptionText(), "unselectable", "on"],
      ["cst-drop-down"],
    "cst-id", select.getId(),
    "unselectable", "on"
  ].concat( select.type ? ['class', select.type, 'style', 'background-color:' + select.getSelectedOptionValue() ] : [] ); 
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
