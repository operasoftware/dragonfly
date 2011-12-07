window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSLayoutView = function(id, name, container_class)
{
  var self = this;
  this._container = null;

  this.createView = function(container)
  {
    this._container = container;
    if (window.elementLayout.has_selected_element())
    {
      if (!container.getElementsByTagName('layout-container')[0])
      {
        container.clearAndRender([
          'div',
            ['layout-container',
              'handler', 'spotlight-box'],
            ['offsets-container'],
          'class', 'padding']);
      }
      this.update_layout({});
      window.elementLayout.get_offset_values(this.update_offsets.bind(this));
    }
    else
    {
      container.innerHTML = "";
    }
  };

  this.update_layout = function(ev)
  {
    var containers = self.getAllContainers();
    // TODO not good logic
    for (var i = 0, c; c = containers[i]; i++)
    {
      c = c.getElementsByTagName('layout-container')[0];
      if (window.elementLayout.get_layout_values(arguments))
        c.clearAndRender(window.elementLayout.get_metrics_template());
    }
  };

  this.update_offsets = function(offset_values)
  {
    var offsets = this._container.getElementsByTagName('offsets-container')[0];
    if (offsets)
    {
      if (offset_values)
        offsets.clearAndRender(window.templates.offset_values(offset_values));
      else
        offsets.innerHTML = '';
    }
  };

  this._on_setting_change = function(msg)
  {
    if (msg.id == "dom" && msg.key == "show-id_and_classes-in-breadcrumb")
    {
      window.elementLayout.get_offset_values(this.update_offsets.bind(this));
    }
  };

  this.init(id, name, container_class);

  messages.addListener("setting-changed", this._on_setting_change.bind(this));
};

