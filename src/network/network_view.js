window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.NetworkLoggerService(this);
  this._loading = false;
  this._contentscroll = 0;
  this._selected = null;
  this._rendertime = 0;
  this._rendertimer = null;
  this._everrendered = false;

  this.createView = function(container)
  {
    var ctx = this._service.get_request_context();
    this._container = container;

    if (ctx && ctx.get_resources().length)
    {
      this._render_tabbed_view(container);
      if (this._selected)
      {
        this._render_details_view(container, this._selected);
      }
    }
    else if (this._loading)
    {
      this._render_loading_view(container);
    }
    else if (this._everrendered)
    {
      // todo: render template "No data to show." This is also for when service is paused and no resources are there now.
      container.innerHTML = "";
    }
    else
    {
      this._render_click_to_fetch_view(container);
    }

    var pause_button = document.querySelector(".toggle-paused-network-view");
    if (pause_button)
    {
      if (this._service.is_paused())
        pause_button.addClass("is-active");
      else
        pause_button.removeClass("is-active");
    }
  };
  this._update_bound = this.update.bind(this);

  this.onresize = this.createView;

  this.ondestroy = function()
  {
    this._contentscroll = this._container ? this._container.scrollTop : 0;
    this._everrendered = false;
  };

  this._render_details_view = function(container)
  {
    var ctx = this._service.get_request_context();
    var content = container.render(templates.network_log_details(ctx, this._selected));
    if (content && this._contentscroll)
      content.scrollTop = this._contentscroll;
  };

  this._render_click_to_fetch_view = function(container) // todo: templates
  {
    container.clearAndRender(
      ['div',
        ['span',
          'class', 'container-button ui-button',
          'handler', 'reload-window',
          'tabindex', '1'],
        ['p', ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
          'class', 'info-box'
      ]
    );
  };

  this._render_loading_view = function(container) // todo: templates
  {
    container.clearAndRender(
      ['div',
        ['p', "Loading page..."],
         'class', 'info-box'
      ]
    );
  };

  this._render_tabbed_view = function(container)
  {
    this._everrendered = true;
    var min_render_delay = 600;
    var timedelta = new Date().getTime() - this._rendertime;

    if (this._rendertimer)
      this._rendertimer = window.clearTimeout(this._rendertimer);

    if (timedelta < min_render_delay)
    {
      this._rendertimer = window.setTimeout(this._update_bound, min_render_delay);
      return;
    }
    this._rendertime = new Date().getTime();

    /*
      hand-calculate network-url-list's width, so it only takes one rendering
      #network-url-list
      {
        width: 40%;
        min-width: 175px; 
      }
    */
    var url_list_width = Math.ceil(Math.max(175, parseInt(container.style.width) * 0.4));
    var detail_width = parseInt(container.style.width) - url_list_width;

    var ctx = this._service.get_request_context();
    var selected_viewmode = settings.network_logger.get("selected_viewmode");
    container.clearAndRender(templates.network_log_main(ctx, this._selected, selected_viewmode, detail_width));
  };

  this._on_clicked_close_bound = function(evt, target)
  {
    this._selected = null;
    this.update();
  }.bind(this);

  this._on_clicked_request_bound = function(evt, target)
  {
    var rid = target.getAttribute("data-resource-id");
    rid = parseInt(rid);
    if (this._selected == rid)
    {
      this._selected = null;
    }
    else
    {
      this._selected = rid;
    }
    this.update();
  }.bind(this);

  this._on_hover_request_bound = function(evt, target)
  {
    var rid = target.getAttribute("data-resource-id");
    var oldhovered = this._container.querySelectorAll(".hovered");
    var newhovered = this._container.querySelectorAll("li[data-resource-id='" + rid + "'], div[data-resource-id='" + rid + "']");
    for (var n=0, e; e=oldhovered[n]; n++) { e.removeClass("hovered"); }
    for (var n=0, e; e=newhovered[n]; n++) { e.addClass("hovered"); }
  }.bind(this);

  this._on_clicked_get_body = function(evt, target)
  {
    var rid = target.getAttribute("data-resource-id");
    rid = parseInt(rid);
    this._service.request_body(rid, this.update.bind(this));
  }.bind(this);

  this._on_abouttoloaddocument_bound = function()
  {
    if (!this._service.is_paused())
    {
      this._loading = true;
      this.update();
    }
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    if (!this._service.is_paused())
    {
      this._loading = false;
      this.update();
    }
  }.bind(this);

  this._on_urlfinished_bound = function()
  {
    if (!this._service.is_paused() && !this._loading)
    {
      this.update();
    }
  }.bind(this);

  this._on_clear_log_bound = function(evt, target)
  {
    if (this._service.is_paused())
      this._service.unpause();
    this._service.clear_resources();
    this.update();
  }.bind(this);

  this._on_toggle_paused_bound = function(evt, target)
  {
    if (this._service.is_paused())
      this._service.unpause();
    else
      this._service.pause();

    this.update();
  }.bind(this);
  
  this._on_select_network_viewmode_bound = function(evt, target)
  {
    settings.network_logger.set("selected_viewmode", target.getAttribute("data-select-viewmode"));
    this.update();
  }.bind(this);

  var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
  //  eh.click["resources-all-open"] = this._handle_open_resource_bound;

  eh.click["select-network-request"] = this._on_clicked_request_bound;
  eh.mouseover["select-network-request"] = this._on_hover_request_bound;

  eh.click["close-request-detail"] = this._on_clicked_close_bound;
  eh.click["get-response-body"] = this._on_clicked_get_body;

  eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
  eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;


  // todo: is it really just these few events that trigger update?
  // should be triggered whenever the data modell is updated, right?

  var doc_service = window.services['document-manager'];
  var res_service = window.services['resource-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);
  res_service.addListener("urlfinished", this._on_urlfinished_bound);

  eh.click["clear-log-network-view"] = this._on_clear_log_bound;
  eh.click["toggle-paused-network-view"] = this._on_toggle_paused_bound;

  eh.click["select-network-viewmode"] = this._on_select_network_viewmode_bound;

  new ToolbarConfig
  (
    'network_logger',
    [
      {
        handler: 'clear-log-network-view',
        title: ui_strings.S_CLEAR_NETWORK_LOG
      },
      {
        handler: 'toggle-paused-network-view',
        title: ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW
      }
    ],
    null,
    null,
    null,
    true
  );

  new Settings
  (
    // id
    "network_logger",
    // key-value map
    {
      "selected_viewmode": "graph"
    },
    // key-label map
    {
      "selected_viewmode": ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW // todo: fix string? does this ever show up?
    },
    // settings map
    {
      customSettings: ["selected_viewmode"]
    },
    null,
    null
  );

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;
