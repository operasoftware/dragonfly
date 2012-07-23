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
      this._ruler.scale = msg.scale;
    }
    this._scale = msg.scale;
  };

  this._onsamplecolor = function(msg)
  {
    if (this._sample_color_container)
    {
      this._sample_colors = msg.colors;
      var tmpl = this._sample_color_template(this._sample_color.setRGB(msg.color));
      this._sample_color_container.clearAndRender(tmpl);
      this._update_sample_colors();
    }
  };

  this._onviewcreated = function(msg)
  {
    if (msg.id == "screenshot")
    {
      this._ruler.set_container(msg.container);
    }
  };

  this._onrulerdimesions = function(ruler)
  {
    if (this._ruler_dimensions)
    {
      this._ruler_dimensions.textContent =
        "width: " + ruler.w +"px\n" +
        "height: " + ruler.h +"px";
    }
  };

  this._onrulerclose = function(ruler)
  {
    if (this._ruler_dimensions)
    {
      this._ruler_dimensions.textContent = "";
    }
  };

  this._update_sample_colors = function()
  {
    if (this._sample_colors && this._sample_color_container)
    {
      var canvas = this._sample_color_container.getElementsByTagName('canvas')[0];
      if (canvas)
      {
        canvas.height = canvas.width = 65;
        var ctx = canvas.getContext('2d');
        var sample_size = 65 / this._settings.get('sample-size') >> 0;
        var x0 = 1;
        var y0 = 1;
        var width = 63;
        if (sample_size % 13 == 0)
        {
          x0 = 0;
          y0 = 0;
          width = 65;
        }
        for (var i = 0, x, y; i < this._sample_colors.length; i++)
        {
          ctx.fillStyle = "rgb(" + this._sample_colors[i].join(',') + ")";
          x = i * sample_size % width;
          y = (i * sample_size - x) / width * sample_size;
          ctx.fillRect(x0 + x, y0 + y, sample_size, sample_size);
        }
      }
    }
  };

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger", "exec"];
    this.init(id, name, container_class);
    this._screenshot = null;
    this._sample_color = new Color();
    this._sample_color.setRGB([255, 255, 255]);
    this._sample_color_container = null;
    this._sample_colors = null;
    this._sample_color_template = window.templates.sample_color;
    this._scale = 1;
    this._ruler = new cls.Ruler();
    this._ruler.callback = this._onrulerdimesions.bind(this);
    this._ruler.onclose = this._onrulerclose.bind(this);
    var setting_map =
    {
      'sample-size': 3,
      'color-palette': [],
      'auto-screenshot': false
    };
    var label_map =
    {
      'auto-screenshot': ui_strings.S_SWITCH_TAKE_SCREENSHOT_AUTOMATICALLY
    };
    var settings_map =
    {
      checkboxes: ['auto-screenshot']
    };
    this._settings = new Settings('screenshot-controls', setting_map, label_map,
                                  settings_map, null, 'general');
    this._screenshot = new cls.ScreenShotView('screenshot', "Screen Shot", "screenshot");
    window.eventHandlers.click['screenshot-update'] = this._handlers['screenshot-update'];
    window.eventHandlers.click['screenshot-store-color'] = this._handlers['screenshot-store-color'];
    window.eventHandlers.click['screenshot-show-ruler'] = this._handlers['screenshot-show-ruler'];
    window.eventHandlers.input['screenshot-zoom'] = this._handlers['screenshot-zoom'];
    window.eventHandlers.input['screenshot-sample-size'] = this._handlers['screenshot-sample-size'];
    window.messages.addListener('screenshot-scale', this._onscalechange.bind(this));
    window.messages.addListener('sceenshot-sample-color', this._onsamplecolor.bind(this));
    window.messages.addListener('view-created', this._onviewcreated.bind(this));
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
    this._screenshot._take_screenshot = true;
    this._screenshot.update_screenshot(event.shiftKey);
  }.bind(this);

  this._handlers['screenshot-zoom'] = function(event, target)
  {
    if (!this._screenshot)
    {
      this._screenshot = window.views.screenshot;
    }
    this._scale = parseInt(event.target.value);
    this._screenshot.zoom_center(this._scale);
    this._ruler.scale = this._scale;
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

  this._handlers['screenshot-show-ruler'] = function(event, target)
  {
    this._ruler.show_ruler(window.views.screenshot.get_container());
  }.bind(this);

  /* implementation */

  this.createView = function(container)
  {
    var tmpl = window.templates.screenshot_controls(this._sample_color);
    container.clearAndRender(tmpl);
    this._scale_control = container.getElementsByTagName('input')[0];
    this._scale_control.value = this._scale;
    this._sample_size_control = container.getElementsByTagName('input')[1];
    this._sample_size_control.value = this._settings.get('sample-size');
    this._sample_color_container =
      container.getElementsByClassName('screenshot-sample-container')[0];
    this._ruler_dimensions =
      container.getElementsByClassName('screenshot-ruler-dimensions')[0];
    this._update_sample_colors();
  };

  this.ondestroy = function()
  {
    this._scale_control = null;
    this._sample_size_control = null;
    this._sample_color_container = null;
    this._ruler_dimensions = null;
    UIWindowBase.closeWindow('color-selector');
  }

  /* initialisation */

  this._init(id, name, container_class);
};

cls.ScreenShotControlsView.prototype = ViewBase;
