window.cls || (window.cls = {});

cls.MonospaceFontView = function(id, name, container_class)
{
  this.is_hidden = true;
  this.createView = function(container){};
  this.set_font_style = function(){};
  this.set_default_font_style = function(){};

  const STYLE_ELE_ID = 'font-style';

  var FONT_PROPS =
  [
    "test-line-height",
    "test-char-width",
  ];

  this._onfontselection = function(event, target)
  {
    var selects = target.getElementsByTagName('select');
    var setting = window.settings.monospacefont;
    Array.prototype.forEach.call(selects, function(select)
    {
      setting.set(select.name, select.value);
    });
    setting.set('monospace-is-set', true);
    this.set_font_style();
    window.ui_framework.set_default_properties(FONT_PROPS);
    window.messages.post('monospace-font-changed');
  };

  this.set_font_style = function()
  {
    var setting = window.settings.monospacefont;
    if (setting.get('monospace-is-set'))
    {
      var style_ele = document.getElementById(STYLE_ELE_ID) ||
                      document.documentElement.render(['style',
                                                       'id', STYLE_ELE_ID]);
      style_ele.textContent = "";
      var font_face = setting.get('monospace-font-face');
      var font_size = setting.get('monospace-font-size');
      var line_height = setting.get('monospace-line-height');
      var style = '';
      var defaults = window.ini.monospacefont;
      if (font_face != defaults.font_face)
      {
        style += "font-family: \"" + font_face + "\";";
      }
      if (font_size != defaults.font_size)
      {
        style += "font-size: " + font_size + ";";
      }
      if (line_height == "auto")
      {
        var font_size_int = parseInt(font_size || defaults.font_size);
        line_height = Math.round(font_size_int * 4 / 3) + "px";
      }
      if (line_height != defaults.line_height)
      {
        style += "line-height: " + line_height + ";";
      }
      if (style)
      {
        style_ele.textContent = ".mono{" + style + "}";
      }
    }
  };

  this.set_default_font_style = function(event, target)
  {
    var style_ele = document.getElementById(STYLE_ELE_ID);
    if (style_ele)
    {
      style_ele.parentNode.removeChild(style_ele);
    }
    var setting = window.settings.monospacefont;
    for (key in cls.MonospaceFontView.preset_font)
    {
      setting.set(key, cls.MonospaceFontView.preset_font[key]);
    }
    while (target && target.nodeName.toLowerCase() != "setting-composite")
    {
      target = target.parentNode;
    }
    if (target)
    {
      target.re_render(window.templates.monospace_font_selection(setting));
    }
    window.ui_framework.set_default_properties(FONT_PROPS);
    window.messages.post('monospace-font-changed');
  };

  this._init = function()
  {
    this.init(id, name, container_class);
    window.eventHandlers.change['font-selection'] =
      this._onfontselection.bind(this);
    window.eventHandlers.click['font-defualt-selection'] =
      this.set_default_font_style.bind(this);
  };

  this._init();

};

cls.MonospaceFontView.preset_font =
{
  'monospace-font-face': '',
  'monospace-font-size': '11px',
  'monospace-line-height': 'auto',
  'monospace-is-set': false,
};

cls.MonospaceFontView.create_ui_widgets = function()
{
  new Settings
  (
    // id
    'monospacefont',
    // key-value map
    window.helpers.copy_object(cls.MonospaceFontView.preset_font),
    // key-label map
    {

    },
    // settings map
    {
      checkboxes:
      [

      ],
      customSettings:
      [
        'font',
      ]
    },
    // custom templates
    {
      'font':
      function(setting)
      {
        return window.templates.monospace_font_selection(setting);
      }
    },
    "general"
  );

};
