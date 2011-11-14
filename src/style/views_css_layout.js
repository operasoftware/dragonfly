window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */


cls.CSSLayoutView = function(id, name, container_class)
{
  var self = this;

  this.createView = function(container)
  {
    if (elementLayout.has_selected_element())
    {
      if (!container.getElementsByTagName('layout-container')[0])
      {
        container.clearAndRender(['div',
                                  ['layout-container', 
                                    'handler', 'spotlight-box'],
                                  ['offsets-container'],
                                  'class', 'padding']);
      }
      this.updateLayout({});
      window.elementLayout.get_offset_values(this.updateOffsets.bind(this, container));
    }
    else
      container.innerHTML = "";

  }

  this.updateLayout = function(ev)
  {
    var containers = self.getAllContainers(), c = null , i = 0;
    // TODO not good logic
    for( ; c = containers[i]; i++)
    {
      c = c.getElementsByTagName('layout-container')[0];
      if(elementLayout.get_layout_values(arguments))
      {
        c.clearAndRender(elementLayout.get_metrics_template());
      }
    }
  }
  
  this.updateOffsets = function(container, offset_values)
  {
    var offsets = container.getElementsByTagName('offsets-container')[0];
    if (offsets)
    {
      if (offset_values)
        offsets.clearAndRender(window.templates.offset_values(offset_values));
      else
        offsets.innerHTML = '';
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
