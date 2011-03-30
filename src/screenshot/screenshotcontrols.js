window.cls || (window.cls = {});

window.cls.ScreenShotControlsView = function(id, name, container_class)
{

  /* interface inherited from ViewBase */

  /* private */

  this._onscalechange = function(msg)
  {
    if (this._scale_control)
    {
      this._scale_control.value = msg.scale;
    }
  };

  this._onsamplecolor = function(msg)
  {
    var tmpl = this._sample_color_template(this._sample_color.setRGB(msg.color));
    this._sample_color_container.clearAndRender(tmpl);
  };



  this._init = function(id, name, container_class)
  {
    this.init(id, name, container_class);
    this._screenshot = null;
    this._sample_color = new Color();
    this._sample_color_container = null;
    this._sample_color_template = window.templates.sample_color;
    this._settings = new Settings('screenshot-controls', { 'sample-size': 3, 'color-palette': []});
    this._screenshot = new cls.ScreenShotView('screenshot', "Screen Shot", "screenshot");
    window.eventHandlers.click['screenshot-update'] = this._handlers['screenshot-update'];
    window.eventHandlers.click['screenshot-store-color'] = this._handlers['screenshot-store-color'];
    window.eventHandlers.input['screenshot-zoom'] = this._handlers['screenshot-zoom'];
    window.eventHandlers.input['screenshot-sample-size'] = this._handlers['screenshot-sample-size'];
    window.messages.addListener('screenshot-scale', this._onscalechange.bind(this));
    window.messages.addListener('sceenshot-sample-color', this._onsamplecolor.bind(this));
    this._screenshot.set_sample_size(this._settings.get('sample-size'));
  };

  /* action handler interface */

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
    var sample_size = parseInt(event.target.value);
    this._settings.set('sample-size', sample_size);
    this._screenshot.set_sample_size(sample_size);
  }.bind(this);

  this._handlers['screenshot-store-color'] = function(event, target)
  {
    cls.ColorPalette.get_instance().store_color(event.target.getAttribute('data-color'));
  };

  /* implementation */

  this.createView = function(container)
  {
    container.clearAndRender(window.templates.scrennshot_controls());
    this._scale_control = container.getElementsByTagName('input')[0];
    this._sample_size_control = container.getElementsByTagName('input')[1];
    this._sample_size_control.value = this._settings.get('sample-size');
    this._sample_color_container = container.getElementsByClassName('screenshot-sample-container')[0];
  };

  this.ondestroy = function()
  {
    this._scale_control = null;
    this._sample_size_control = null;
    this._sample_color_container = null;
  }

  /* initialisation */

  this._init(id, name, container_class);
};

cls.ScreenShotControlsView.prototype = ViewBase;
