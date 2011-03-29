window.cls || (window.cls = {});

window.cls.ScreenShotControlsView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    container.clearAndRender(window.templates.scrennshot_controls());
    this._scale_control = container.getElementsByTagName('input')[0];
    this._sample_color_container = container.getElementsByClassName('screenshot-sample-container')[0];
  }

  ActionHandlerInterface.apply(this);

  this._handlers['screenshot-update'] = function(event, target)
  {
    if (!this._screenshot)
    {
      this._screenshot = window.views.screenshot;
    }
    this._screenshot.update_screenshot();
  }.bind(this);

  this._handlers['screenshot-zoom'] = function(event, target)
  {
    if (!this._screenshot)
    {
      this._screenshot = window.views.screenshot;
    }
    this._screenshot.zoom_center(parseInt(event.target.value));
  }.bind(this);

  this._handlers['screenshot-sample-size'] = function(event, target)
  {
    if (!this._screenshot)
    {
      this._screenshot = window.views.screenshot;
    }
    this._screenshot.set_sample_size(parseInt(event.target.value));
  }.bind(this);

  this._onscalechange = function(msg)
  {
    if (this._scale_control)
    {
      this._scale_control.value = msg.scale;
    }

  }

  this._onsamplecolor = function(msg)
  {
    this._sample_color_container.clearAndRender(this._sample_color_template(this._sample_color.setRGB(msg.color)));
  }

  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._screenshot = null;
    this._sample_color = new Color();
    this._sample_color_container = null;
    this._sample_color_template = window.templates.sample_color;
    window.eventHandlers.click['screenshot-update'] = this._handlers['screenshot-update'];
    window.eventHandlers.input['screenshot-zoom'] = this._handlers['screenshot-zoom'];
    window.eventHandlers.input['screenshot-sample-size'] = this._handlers['screenshot-sample-size'];
    window.messages.addListener('screenshot-scale', this._onscalechange.bind(this));
    window.messages.addListener('sceenshot-sample-color', this._onsamplecolor.bind(this));
  }

  this._init(id, name, container_class);

  this.ondestroy = function()
  {
    this._scale_control = null;
  }
};

cls.ScreenShotControlsView.prototype = ViewBase;
