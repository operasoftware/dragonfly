
var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */


cls.CSSLayoutView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    if( !container.getElementsByTagName('layout-container')[0] )
    {
      container.innerHTML = "<div class='padding'>\
          <h2>" + ui_strings.M_VIEW_SUB_LABEL_METRICS + "</h2>\
          <layout-container></layout-container>\
          <offsets-container></offsets-container>\
          </div>";

      var layout = container.getElementsByTagName('layout-container')[0];
      if(layout)
      {
        hostspotlighter.clearMouseHandlerTarget();
        layout.addEventListener('mouseover', hostspotlighter.metricsMouseoverHandler, false);
        layout.addEventListener('mouseout', hostspotlighter.metricsMouseoutHandler, false);
      }
    }
    this.updateLayout({});
    this.updateOffsets({});
  }

  this.updateLayout = function(ev)
  {
    var containers = self.getAllContainers(), c = null , i = 0;
    // TODO not good logic
    for( ; c = containers[i]; i++)
    {
      c = c.getElementsByTagName('layout-container')[0];
      if(elementLayout.getLayoutValues(arguments))
      {
        c.clearAndRender(elementLayout.metricsTemplate());
      }
    }
  }
  
  this.updateOffsets = function(ev)
  {
    var containers = self.getAllContainers(), c = null , i = 0, data = '';
    // TODO not good logic
    for( ; c = containers[i]; i++)
    {
      c = c.getElementsByTagName('offsets-container')[0];
      if( elementLayout.getOffsetsValues(arguments) )
      {
        c.innerHTML = elementLayout.prettyprintOffsetValues();
      }
    }
  }
  
  this.init(id, name, container_class);

  var onSettingChange = function(msg)
  {
    if( msg.id == "dom" 
        && ( msg.key == "show-siblings-in-breadcrumb" || msg.key == "show-id_and_classes-in-breadcrumb" ) )
    {
      self.updateOffsets({});
    }
  }

  messages.addListener("setting-changed", onSettingChange);
}

cls.CSSLayoutView.prototype = ViewBase;
new cls.CSSLayoutView('css-layout', ui_strings.M_VIEW_LABEL_LAYOUT, 'scroll css-layout');

/*
new Settings
(
  // id
  'css-layout', 
  // key-value map
  {
  }, 
  // key-label map
  {

  },
  // settings map
  {
    checkboxes:
    [
    ]
  }
);

new ToolbarConfig
(
  'css-layout',
  // buttons
  null,
  // filters
  [
  ]
)

new Switches
(
  'css-layout',
  [
  ]
)
*/


