var StatusbarBase = function()
{
  this.type = 'statusbar';
  this.height = 0;
  this.width = 200;
  this.top = 0;
  this.left = 0;
  this.is_dirty = true;

  this.setup = function(view_id)
  {
    var statusbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    statusbar.render(templates[this.type](this))
    this.updateInfo('test');
  } 
  
  this.updateInfo = function(string)
  {
    var statusbar = document.getElementById(this.type + '-to-' + this.cell.id) || this.update();
    statusbar.getElementsByTagName('info')[0].textContent =string;
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
  }

}

var Statusbar = function(cell)
{
  this.init(cell);
}

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


var TopStatusbar = function(cell)
{
  this.type = 'top-statusbar';
  var self = this; 
  var handleHostState = function(msg)
  {
    switch (msg.state)
    {
      case 'inactive':
      {
        self.spin_animator.is_inactive();
        break;
      }
      case 'ready':
      {
        self.spin_animator.is_ready();
        break;
      }
      case 'waiting':
      {
        self.spin_animator.is_busy();
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
    busy: -32,
    time_delta: 60
  };
  this.spin_animator = new Animator(spin_animator);
  this.init(cell);
}

StatusbarBase.prototype = UIBase;
Statusbar.prototype = new StatusbarBase();

WindowStatusbar.prototype = new StatusbarBase();
TopStatusbar.prototype = new StatusbarBase();







