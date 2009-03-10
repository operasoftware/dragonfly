window.switches || ( window.switches = {} );
window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */

cls.HelloWorldView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    container.render(['div', ['h1', 'Hello World'], 'class', 'padding']);
  }
  this.init(id, name, container_class);
}

cls.HelloWorldView.prototype = ViewBase;
new cls.HelloWorldView('hello-world', "Hello World", 'scroll');

var composite_view_convert_table = 
{
  // opera.attached.toString()
  "true": {},
  "false": {}
}


/**
  * @constructor 
  */
// test

var client = new function()
{
  var self = this;

  this.setup = function()
  {
    document.removeEventListener('load', arguments.callee, false);

    settings.general.set('show-views-menu', ini.debug)
    

    window[defaults.viewport] = document.getElementsByTagName(defaults.viewport_main_container)[0];

    if( viewport )
    {
      setupMarkup();
    }
    else
    {
      opera.postError('missing viewport');
    }

    messages.post('application-setup');
    
  }

  var setupMarkup = function()
  {
    UIBase.copyCSS(resolve_map);

    // TODO clean up

    var container = viewport.appendChild(document.createElement('div'));
    container.style.cssText = 'position:absolute;top:0;left:-1000px;';
    container.innerHTML = resolve_map_2.markup;

    var set = null, i = 0;

    for( ; set = resolve_map_2[i]; i++ )
    {
      defaults[set.target] = set.getValue();
    }

    viewport.removeChild(container);
    
    new CompositeView('hello-world-composite', "Hello World", hello_world_rough_layout);

    // new CompositeView('settings_new', ui_strings.S_BUTTON_LABEL_SETTINGS, settings_rough_layout);

    setTimeout( function(){

      self.setupTopCell();

      if( window.opera.attached )
      {
        topCell.tab.changeStyleProperty("padding-right", 275);
      }
      else
      {
        topCell.toolbar.changeStyleProperty("padding-right", 30);
      }

      document.documentElement.render(templates.window_controls(window.opera.attached))

      // event handlers to resize the views
      new SlideViews(document);
      
      messages.post('setting-changed', {id: 'general', key: 'show-views-menu'});


    }, 0);

  }

  this.setupTopCell = function()
  {
    viewport.innerHTML = '';
    new TopCell
    (
      main_layout,
      function()
      {
        this.top = 0;
        this.left = 0;
        this.width = innerWidth;
        this.height = innerHeight;
      },
      function()
      {
        this.setStartDimesions();
        this.update();
        this.setup();
      }
    );
    var view_id = global_state && global_state.ui_framework.last_selected_tab;
    if(  view_id && views[view_id] && !views[view_id].isvisible())
    {
      window.topCell.showView(view_id);
    } 

  }
  
  document.addEventListener('load', this.setup, false);

}

/* TODO take that out from the global scope */
/* this is a quick hack to get the create all runtimes button in the toptab bar */

var main_layout =
{
  id: 'main-view', 
  tabs: ['hello-world-composite']
}

var hello_world_rough_layout =
{
  dir: 'h', width: 700, height: 700,
  children: 
  [
    { 
      width: 250, tabs: ['hello-world'] 
    }
  ]
}


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






