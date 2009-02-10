/**
  * @constructor 
  * @extends UIBase
  */

var StatusbarBase = function()
{
  this.type = 'statusbar';
  this.height = 0;
  this.width = 200;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;
  this.info = '';
  this.DEFAULT_MODE = "default";
  this.TOOLTIP_MODE = "tooltip";
  this.mode = this.DEFAULT_MODE; 
  this.selector_cap_width = 0;
  this.available_width_delta = 0;
  this.info_container_scroll_height = 0;
  this.global_state_store = global_state.ui_framework;

  this.setup = function(view_id)
  {
    var statusbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    statusbar.render(templates[this.type](this));
    if( !this.selector_cap_width )
    {
      var info_container = statusbar.getElementsByTagName('info')[0];
      info_container.innerHTML = "<breadcrumb><span>t</span>&lt;<span>t</span></breadcrumb>";
      var spans = info_container.getElementsByTagName('span');
      var style = window.getComputedStyle(info_container, null);
      this.selector_cap_width = spans[1].offsetLeft - ( spans[0].offsetLeft + spans[0].offsetWidth );
      this.info_container_scroll_height = info_container.scrollHeight;
      this.available_width_delta = 
        info_container.offsetLeft 
        + parseInt(style.getPropertyValue('padding-left'))
        + parseInt(style.getPropertyValue('padding-right'));
    }
    if(this.mode == this.TOOLTIP_MODE)
    {
      statusbar.addClass('type-tooltip');
    }
    this.updateInfo(' ');
  } 
  
  this.updateInfo = function(info)
  {
    var 
    statusbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update(),
    info_container = statusbar.getElementsByTagName('info')[0],
    breadcrumb = null,
    avaible_width = 0,
    cursor = null,
    consumed_width = 0,
    delta = 0,
    range = null;

    this.info = info;
    if( typeof info == "string" )
    {
      info_container.textContent = info;
    }
    else if(typeof info == "object")
    {
      info_container.innerHTML = "";
      breadcrumb = info_container.render(info);
      if( this.mode == this.DEFAULT_MODE && info_container.scrollHeight > this.info_container_scroll_height )
      {
        avaible_width = parseInt(info_container.parentElement.style.width) - this.available_width_delta;
        cursor = breadcrumb.lastElementChild;
        consumed_width = 4 * this.selector_cap_width;
        delta = 0;
        range = document.createRange();
        while(cursor)
        {
          delta = this.selector_cap_width + cursor.offsetWidth;
          if( delta + consumed_width >= avaible_width )
          {
            break;
          }
          consumed_width += delta;
          cursor = cursor.previousElementSibling;
        }        
        if(cursor)
        {
          range.setStartBefore(breadcrumb.firstChild);
          range.setEndAfter(cursor);
          range.deleteContents();
          breadcrumb.firstChild.nodeValue = '...';
        }
      }
    }
    else
    {
      info_container.textContent = '';
    }
  }

  this.changeMode = function()
  {
    this.global_state_store[this.type + "_mode"] = this.mode = this.mode == this.DEFAULT_MODE && this.TOOLTIP_MODE || this.DEFAULT_MODE;
    this.updateInfo(this.info);
    return this.mode;
  }

  this.setDimensions = function(force_redraw)
  {
    var dim = '', i = 0;

    if(!this.default_height)
    {
      this.setCSSProperties()
    }

    dim = this.cell.top + this.cell.height - this.offsetHeight;

    if( dim != this.top)
    {
      this.is_dirty = true;
      this.top = dim;
    }

    dim = this.cell.left;
    if( dim != this.left)
    {
      this.is_dirty = true;
      this.left = dim;
    }

    dim = this.cell.width - this.vertical_border_padding;
    if( dim != this.width)
    {
      this.is_dirty = true;
      this.width = dim;
    }

    this.update(force_redraw);
    
  }

  this.init = function(cell)
  {
    this.cell = cell;
    this.initBase();
    if( this.global_state_store[this.type + "_mode"] )
    {
      this.mode = this.global_state_store[this.type + "_mode"];
    }
  }

}

/**
  * @constructor 
  * @extends StatusbarBase
  */

var Statusbar = function(cell)
{
  this.init(cell);
}

/**
  * @constructor 
  * @extends StatusbarBase
  */

var WindowStatusbar = function(cell)
{
  this.type = 'window-statusbar';
  this.parent_container_id = cell.id;
  this.getCssText = function()
  {
    return '';
  }
  this.init(cell);
}

/**
  * @constructor 
  * @extends StatusbarBase
  */

var TopStatusbar = function(cell)
{
  this.type = 'top-statusbar';
  var self = this;
  var handleHostState = function(msg)
  {
    self.global_state_store.spin_state = msg.state;
    switch (msg.state)
    {
      case 'inactive':
      {
        self.spin_animator.setInitial();
        break;
      }
      case 'ready':
      {
        self.spin_animator.setFinal();
        break;
      }
      case 'waiting':
      {
        self.spin_animator.setActive();
        break;
      }      
    }
  }
  messages.addListener('host-state', handleHostState);
  var spin_animator = 
  {
    id: 'spin-button',
    delta: -16,
    iterations: 8,
    ready: -16,
    active: -32,
    time_delta: 60
  };
  this.spin_animator = new Animator(spin_animator);
  this.init(cell);
}

StatusbarBase.prototype = UIBase;
Statusbar.prototype = new StatusbarBase();

WindowStatusbar.prototype = new StatusbarBase();
TopStatusbar.prototype = new StatusbarBase();







