

var ui_framework = new function()
{
  
  this.beforeSetup = function(){};
  this.afterSetup = function(){};
  // namespace to register layouts
  this.layouts = {};
  this.setupTopCell = function(){};

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
      source: 'top-statusbar',
      target: TopStatusbar.prototype,
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
      source: 'window-satusbar',
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
      property: 'lineHeight',
      target: 'js-source-line-height',
      getValue: function(){return parseInt(document.getElementById(this.id).currentStyle[this.property])}
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
        val += 5;
        return val;
      }
    }
  ];

  resolve_map_2.markup = "\
  <div> \
    <div class='js-source'> \
      <div id='js-source-scroll-content'> \
        <div id='js-source-content'> \
          <div id='test-line-height'>test</div> \
          <div style='position:absolute;width:100px;height:100px;overflow:auto'> \
            <div id='test-scrollbar-width' style='height:300px'></div> \
          </div> \
        </div> \
      </div> \
    </div> \
    <toolbar style='top:50px;left:50px;height:26px;width:678px;display:block'> \
      <cst-select id='test-cst-select-width' cst-id='js-script-select' unselectable='on' style='width: 302px' > \
        <cst-value unselectable='on' /> \
        <cst-drop-down/> \
      </cst-select> \
    </toolbar> \
  </div>\
  ";

  var setup = function()
  {
    document.removeEventListener('load', arguments.callee, false);
    self.beforeSetup();
    window[defaults.viewport] = document.getElementsByTagName(defaults.viewport_main_container)[0];

    if( viewport )
    {
      UIBase.copyCSS(resolve_map);
      var container = viewport.appendChild(document.createElement('div'));
      container.style.cssText = 'position:absolute;top:0;left:-1000px;';
      container.innerHTML = resolve_map_2.markup;
      for( var set = null, i = 0; set = resolve_map_2[i]; i++ )
      {
        defaults[set.target] = set.getValue();
      }
      viewport.removeChild(container);
      // event handlers to resize the views
      new SlideViews(document);
      setTimeout(function(){
        self.afterSetup();
        messages.post('application-setup');
      }, 0);
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'missing viewport');
    }
  }

  window.toolbars || ( window.toolbars = {} );
  window.switches || ( window.switches = {} );
  window.cls || ( window.cls = {} );
  document.addEventListener('load', setup, false);
}



