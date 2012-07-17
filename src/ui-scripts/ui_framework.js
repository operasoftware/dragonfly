

var ui_framework = new function()
{

  this.beforeSetup = function(){};
  this.afterSetup = function(){};
  // namespace to register layouts
  this.layouts = {};
  this.setup_top_cell = function(){};

  var self = this;

  var resolve_map_properties =
  [
    {s_name: 'border-top-width'},
    {s_name: 'border-right-width'},
    {s_name: 'border-bottom-width'},
    {s_name: 'border-left-width'},
    {s_name: 'padding-top'},
    {s_name: 'padding-right'},
    {s_name: 'padding-bottom'},
    {s_name: 'padding-left'},
    {s_name: 'width'},
    {s_name: 'height'}
  ]

  var resolve_map =
  [
    {
      source: 'toolbar',
      target: Toolbar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'modebar',
      target: Modebar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'searchbar',
      target: Searchbar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'searchbar',
      source_attrs: {'class': 'advanced-searchbar'},
      target: AdvancedSearchbar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'tabs',
      target: Tabs.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'container',
      target: Container.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'top-tabs',
      target: TopTabs.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'top-container',
      target: TopContainer.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'top-toolbar',
      target: TopToolbar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'window-toolbar',
      target: WindowToolbar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'window-header',
      target: defaults,
      properties:
      [
        {
          t_name: 'window_header_offsetHeight',
          setProp: function(source, decalaration)
          {
            return source.offsetHeight;
          }
        }
      ]
    },
    {
      source: 'window-container',
      target: WindowContainer.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'window-statusbar',
      target: WindowStatusbar.prototype,
      properties: resolve_map_properties
    },
    {
      source: 'window-statusbar',
      target: defaults,
      properties:
      [
        {
          t_name: 'window_statusbar_offsetHeight',
          setProp: function(source, decalaration)
          {
            return source.offsetHeight;
          }
        }
      ]
    },
  ];


  var resolve_map_2 =
  [
    {
      id: 'test-line-height',
      property: 'line-height',
      target: 'js-source-line-height',
      getValue: function()
      {
        return parseInt(window.getComputedStyle(document.getElementById(this.id), null).getPropertyValue(this.property));
      }
    },
    {
      id: 'test-char-width',
      target: 'js-source-char-width',
      getValue: function()
      {
        var line = document.getElementById('test-line-height');
        var chars = line && line.firstElementChild;
        return chars && chars.getBoundingClientRect().width / 10 || 0;
      }
    },
    {
      id: 'test-text-left-offset',
      target: 'js-default-text-offset',
      getValue: function()
      {
        var container = document.getElementById('js-source-scroll-content');
        var text = document.getElementById(this.id);
        return container && text
             ? text.getBoundingClientRect().left -
               container.getBoundingClientRect().left
             : 0;
      }
    },
    {
      id: 'test-scrollbar-width',
      target: 'scrollbar-width',
      getValue: function(){return ( 100 - document.getElementById(this.id).offsetWidth )}
    },
    {
      id: 'test-cst-select-width',
      target: 'cst-select-margin-border-padding',
      getValue: function()
      {
        var
        props = ['margin-left', 'border-left-width', 'padding-left',
         'margin-right', 'border-right-width', 'padding-right'],
        prop = '',
        i = 0,
        val = 0,
        style = getComputedStyle(document.getElementById(this.id), null);

        for( ; prop = props[i]; i++)
        {
          val += parseInt(style.getPropertyValue(prop));
        }
        return val;
      }
    },
    {
      id: 'test-font-faces',
      target: 'monospace-fonts',
      getValue: function()
      {
        var spans = document.getElementById(this.id).getElementsByTagName('span');
        return Array.prototype.map.call(spans, function(span)
        {
          var font = getComputedStyle(span, null).getPropertyValue('font-family');
          if (font.toLowerCase().indexOf(span.title.toLowerCase()) != -1)
          {
            return span.title;
          }
          return null;
        }).filter(Boolean);
      }
    }
  ];

  resolve_map_2.markup = "" +
  "<div> " +
    "<div class='js-source mono'> " +
      "<div id='test-line-height' class='mono'><span>1234567890</span></div> " +
      "<div id='js-source-scroll-content'> " +
        "<div class='js-source-content'> " +
          "<div style='position:absolute;width:100px;height:100px;overflow:auto'> " +
            "<div id='test-scrollbar-width' style='height:300px'></div> " +
          "</div> " +
          "<div><span id='test-text-left-offset'>&amp;nbsp;</span></div>" +
        "</div> " +
      "</div> " +
    "</div> " +
    "<toolbar style='top:50px;left:50px;height:26px;width:678px;display:block'> " +
      "<cst-select id='test-cst-select-width' cst-id='js-script-select' unselectable='on' style='width: 302px' class='ui-control'> " +
        "<cst-value unselectable='on' /> " +
        "<cst-drop-down/> " +
      "</cst-select> " +
    "</toolbar> " +
    "<div id='test-font-faces'>" +
    [
      "Menlo",
      "Andale Mono",
      "Arial Monospaced",
      "Bitstream Vera Sans Mono",
      "Consolas",
      "Courier",
      "Courier New",
      "DejaVu Sans Mono",
      "Droid Sans Mono",
      "Everson Mono",
      "Fedra Mono",
      "Fixed",
      "Fixedsys",
      "Fixedsys Excelsior",
      "Inconsolata",
      "HyperFont",
      "Letter Gothic",
      "Liberation Mono",
      "Lucida Console",
      "Lucida Sans Typewriter",
      "Lucida Typewriter",
      "Miriam Fixed",
      "Monaco",
      "Monofur",
      "Monospace",
      "MS Gothic",
      "MS Mincho",
      "Nimbus Mono L",
      "OCR-A",
      "OCR-B",
      "Orator",
      "Ormaxx",
      "Prestige Elite",
      "ProFont",
      "PT Mono",
      "Sydnie",
      "Terminal",
      "Terminus",
      "Tex Gyre Cursor",
      "UM Typewriter",
      "William Monospace",
    ].map(function(font)
    {
      return "<span title='" + font + "' style='font-family:" + font + "'>test</span>";
    }).join('') +
  "</div></div>";

  this.set_default_properties = function(tests)
  {
    var container = viewport.appendChild(document.createElement('div'));
    container.style.cssText = 'position:absolute;top:0;left:-1000px;';
    container.innerHTML = resolve_map_2.markup;
    for (var set = null, i = 0; set = resolve_map_2[i]; i++)
    {
      if (!tests || tests.contains(set.id))
      {
        defaults[set.target] = set.getValue();
      }
    }
    viewport.removeChild(container);
  };

  this.setup = function()
  {
    window[defaults.viewport] = document.getElementsByTagName(defaults.viewport_main_container)[0];
    if( viewport )
    {
      UIBase.copyCSS(resolve_map);
      this.set_default_properties();
      // event handlers to resize the views
      new SlideViews(document);
    }
    else
    {
      opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + 'missing viewport');
    }
  }

  window.toolbars || ( window.toolbars = {} );
  window.switches || ( window.switches = {} );
  window.cls || ( window.cls = {} );

};



