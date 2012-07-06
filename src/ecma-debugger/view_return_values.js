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
    var return_values = stop_at.get_return_values();
    if (return_values.length)
    {
      return_values.forEach(function(retval)
      {
        var object = retval.value[3/*OBJECT*/];
        if (object)
        {
          var name = object[4/*CLASS_NAME*/] === "Function" && !object[5]
                   ? ui_strings.S_ANONYMOUS_FUNCTION_NAME
                   : object[5];
          retval.model = new cls.InspectableJSObject(retval.rt_id,
                                                     object[0/*OBJECT_ID*/],
                                                     name,
                                                     object[4/*CLASS_NAME*/]);
        }
      });
      this._create_view_bound = this._create_view.bind(this, container, return_values);
      this._create_view_bound();
    }
    else
    {
      this._create_view_bound = null;
      container.clearAndRender(this._return_values_no_content());
    }
  };

  this._create_view = function(container, return_values)
  {
    container.clearAndRender(templates.return_values(return_values, this._search_term));
  };

  this._return_values_no_content = function()
  {
    return (
      ["div",
         "No return values",
       "class", "not-content inspection"
      ]
    );
  };

  this.onbeforesearch = function(msg)
  {
    if (this._create_view_bound && this.isvisible())
    {
      this._search_term = msg.search_term;
      this._create_view_bound();
    }
  }.bind(this);

  // TODO: CLEAN UP!!!

  this._init = function(id, name, container_class)
  {
    View.prototype.init.call(this, id, name, container_class);
    this.required_services = ["ecmascript-debugger"];
    this._container = null;
    this._models = [];
    this._search_term = "";
  }

  this._init(id, name, container_class);
};

cls.ReturnValuesView.create_ui_widgets = function()
{
  new ToolbarConfig
  (
    "return-values",
    null,
    [
      {
        handler: "return-values-text-search",
        shortcuts: "return-values-text-search",
        title: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        type: "filter"
      }
    ]
  );
  var text_search = new TextSearch(1);
  text_search.add_listener("onbeforesearch",
                           window.views["return-values"].onbeforesearch);

  var onViewCreated = function(msg)
  {
    if (msg.id == "return-values")
    {
      text_search.setContainer(msg.container);
      text_search.setFormInput(views.inspection.getToolbarControl(msg.container, "return-values-text-search"));
    }
  };

  var onViewDestroyed = function(msg)
  {
    if (msg.id == "return-values")
    {
      text_search.cleanup();
    }
  };

  messages.addListener("view-created", onViewCreated);
  messages.addListener("view-destroyed", onViewDestroyed);

  eventHandlers.input["return-values-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };

  ActionBroker.get_instance().get_global_handler().
  register_shortcut_listener("return-values-text-search",
                             cls.Helpers.shortcut_search_cb.bind(text_search));

  var broker = ActionBroker.get_instance();
};

