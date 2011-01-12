window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler) {

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    if (1)
    {
      container.clearAndRender(["h1", "network view v 2"]);

    }
    else if (this._loading)
    {
      container.clearAndRender(
        ['div',
         ['p', "Loading page..."],
         'class', 'info-box'
        ]
      );
    }
    else
    {
      container.clearAndRender(
        ['div',
         ['button',
          'class', 'ui-button',
          'handler', 'reload-window'],
         ['p', "Click the reload button above to reload the debugged window and fetch its resources"],
         'class', 'info-box'
        ]
      );
    }
  };


  this._on_abouttoloaddocument_bound = function()
  {
    this._loading = true;
    this._table = null;
    this.update();
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    this._loading = false;
    this.update();
  }.bind(this);

  var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
  //  eh.click["resources-all-open"] = this._handle_open_resource_bound;
  //  eh.click["open-resource-tab"] = this._handle_open_resource_tab_bound;

  var doc_service = window.services['document-manager'];
  //doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  //doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;
