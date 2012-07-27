window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ReturnValuesView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    this._container = container;
    this._text_search.setContainer(this._container);
    this._text_search.setFormInput(window.views[this.id].getToolbarControl(this._container,
                                                                           "return-values-text-search"));
    if (this._create_view_bound)
    {
      this._create_view_bound();
      return;
    }
    var return_values = stop_at.get_return_values();
    var return_value_list = return_values && return_values.return_value_list;
    if (return_value_list && return_value_list.length)
    {
      return_value_list.forEach(function(retval)
      {
        var object = retval.value.object;
        if (object)
        {
          var name = object.className === "Function" && !object.functionName
                   ? ui_strings.S_ANONYMOUS_FUNCTION_NAME
                   : object.functionName;
          retval.value.model = new cls.InspectableJSObject(return_values.rt_id,
                                                           object.objectID,
                                                           name,
                                                           object.className);
        }
      });
      this._create_view_bound = this._create_view.bind(this, return_values);
      this._create_view_bound();
    }
    else
    {
      this._remove_bound_view();
      container.clearAndRender(this._return_values_no_content());
    }
  };

  this._create_view = function(return_values)
  {
    if (this._container)
      this._container.clearAndRender(templates.return_values(return_values, this._search_term));
  };

  this.ondestroy = function()
  {
    this._container = null;
    this._text_search.cleanup();
  };

  this._remove_bound_view = function()
  {
    this._create_view_bound = null;
  };

  this._return_values_no_content = function()
  {
    return (
      ["div",
        ui_strings.M_VIEW_LABEL_NO_RETURN_VALUES,
       "class", "not-content inspection"
      ]
    );
  };

  this._onbeforesearch = function(msg)
  {
    if (this._create_view_bound && this.isvisible())
    {
      this._search_term = msg.search_term;
      this._create_view_bound();
    }
  };

  this._init = function(id, name, container_class)
  {
    View.prototype.init.call(this, id, name, container_class);
    this.required_services = ["ecmascript-debugger"];
    this._container = null;
    this._search_term = "";
    this._tooltip = Tooltips.register("return-value-tooltip", false, false);
    this._text_search = new TextSearch(1);
    this._text_search.add_listener("onbeforesearch", this._onbeforesearch.bind(this));

    window.messages.addListener("thread-continue-event", this._remove_bound_view.bind(this));

    window.event_handlers.input["return-values-text-search"] = function(event, target)
    {
      this._text_search.searchDelayed(target.value);
    }.bind(this);

    ActionBroker.get_instance()
                .get_global_handler()
                .register_shortcut_listener("return-values-text-search",
                                            cls.Helpers.shortcut_search_cb.bind(this._text_search));
  };

  this._init(id, name, container_class);
};

cls.ReturnValuesView.create_ui_widgets = function()
{
  new ToolbarConfig(
    {
      view: "return-values",
      groups: [
        {
          type: UI.TYPE_INPUT,
          items: [
            {
              handler: "return-values-text-search",
              shortcuts: "return-values-text-search",
              title: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
              label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
              type: "filter"
            }
          ]
        }
      ]
    }
  );
};

