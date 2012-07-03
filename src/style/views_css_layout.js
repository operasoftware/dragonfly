"use strict";

window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.CSSLayoutView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    this._container = container;
    if (window.element_layout.has_selected_element())
    {
      if (!container.querySelector("layout-container"))
      {
        container.clearAndRender([
          "div",
            ["layout-container",
              "handler", "spotlight-box"
            ],
            ["offsets-container"],
          "class", "padding"
        ]);
      }
      window.element_layout.get_layout_values(this._update_layout_bound);
      window.element_layout.get_offset_values(this._update_offsets_bound);
    }
    else
    {
      container.innerHTML = "";
    }
  };

  this.update_layout = function(comp_style)
  {
    var layout_container = this._container.querySelector("layout-container");
    if (layout_container)
    {
      if (comp_style)
        layout_container.clearAndRender(window.element_layout.get_metrics_template(comp_style));
      else
        layout_container.innerHTML = "";
    }
  };

  this.update_offsets = function(offset_values)
  {
    var offsets_container = this._container.querySelector("offsets-container");
    if (offsets_container)
    {
      if (offset_values)
        offsets_container.clearAndRender(window.templates.offset_values(offset_values));
      else
        offsets_container.innerHTML = "";
    }
  };

  this._on_setting_change = function(msg)
  {
    if (msg.id == "dom" && msg.key == "show-id_and_classes-in-breadcrumb")
    {
      window.element_layout.get_offset_values(this.update_offsets.bind(this));
    }
  };

  this._init = function()
  {
    this.required_services = ["ecmascript-debugger"];
    this.init(id, name, container_class);
    this._container = null;
    this._update_layout_bound = this.update_layout.bind(this);
    this._update_offsets_bound = this.update_offsets.bind(this)
    window.messages.addListener("setting-changed", this._on_setting_change.bind(this));
  };

  this._init();
};

