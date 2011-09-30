window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.NetworkLoggerService(this);
  this._loading = false;
  this._hscroll = 0;
  this._vscroll = 0;
  this._contentscroll = 0;
  this._selected = null;
  this._hscrollcontainer = null;
  this._vscrollcontainer = null;
  this._rendertime = 0;
  this._rendertimer = null;
  this._everrendered = false;
  this._url_list_width = 250;

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this.onresize = this.createView;

  this.ondestroy = function()
  {
    this._vscroll = this._vscrollcontainer ? this._vscrollcontainer.scrollTop : 0;
    this._hscroll = this._hscrollcontainer ? this._hscrollcontainer.scrollLeft : 0;
    var content = this._container ? this._container.querySelector(".network-details-request") : null;
    this._contentscroll = content ? content.scrollTop : 0;
    this._everrendered = false;
  };

  this._update_bound = this.update.bind(this);

  this._render_main_view = function(container)
  {
    var ctx = this._service.get_request_context();
    var paused = settings.network_logger.get('paused-update');
    this._container = container;
    if (ctx && ctx.resources.length && this._selected)
    {
      this._render_details_view(container);
    }
    else if (ctx && ctx.resources.length) {
      var paused = settings.network_logger.get('paused-update');
      if (paused && this._everrendered) { return }
      this._render_graph_view(container);
    }
    else if (this._loading)
    {
      this._render_loading_view(container);
    }
    else if (this._everrendered)
    {
      container.innerHTML = "";
    }
    else
    {
      this._render_click_to_fetch_view(container);
    }
  };

  this._render_details_view = function(container)
  {
    var ctx = this._service.get_request_context();
    var url_list_width = this._url_list_width + window.defaults["scrollbar-width"];
    this.ondestroy(); // saves scroll pos
    container.clearAndRender(templates.network_log_details(ctx, this._selected, url_list_width));
    this._vscrollcontainer = container.querySelector(".network-details-url-list");
    this._vscrollcontainer.scrollTop = this._vscroll;
    var content = container.querySelector(".network-details-request");
    content.scrollTop = this._contentscroll;
  };

  this._render_click_to_fetch_view = function(container)
  {
    container.clearAndRender(
      ['div',
        ['button',
          'class', 'container-button',
          'handler', 'reload-window'],
        ['p', ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
          'class', 'info-box'
      ]
    );
  };

  this._render_loading_view = function(container)
  {
    container.clearAndRender(
      ['div',
        ['p', "Loading page..."],
         'class', 'info-box'
      ]
    );
  };

  this._render_graph_view = function(container)
  {
    var fit_to_width = settings.network_logger.get('fit-to-width');
    var url_list_width = 250;
    var ctx = this._service.get_request_context();

    this._everrendered = true;
    var min_render_delay = 1200;
    var timedelta = new Date().getTime() - this._rendertime;
    if (timedelta < min_render_delay)
    {
      if (!this._rendertimer)
      {
        this._rendertimer = window.setTimeout(this._update_bound, min_render_delay/2);
      }
      return;
    }
    else
    {
      this._rendertimer = null;
      this._rendertime = new Date().getTime();
    }

    this._contentscroll = 0;
    container.className = "";

    var graphwidth = container.getBoundingClientRect().width - url_list_width - window.defaults["scrollbar-width"];
    var has_scrollbar = false;
    var duration = ctx.get_duration();

    if (!fit_to_width && duration > 3000)
    {
      graphwidth = Math.round(Math.min((duration * 0.35), 10000)); // cap graphwidth at 10000px
      has_scrollbar = true;
    }

    container.clearAndRender(templates.network_log_main(ctx, graphwidth));
    var conheight = (container.getBoundingClientRect().height - (has_scrollbar ? window.defaults["scrollbar-width"] : 0));
    this._vscrollcontainer = container.querySelector("#main-scroll-container");
    this._vscrollcontainer.style.height = "" + conheight + "px";
    this._vscrollcontainer.scrollTop = this._vscroll;

    this._hscrollcontainer = container.querySelector("#scrollbar-container");
    this._hscrollcontainer.scrollLeft = this._hscroll;
    container.querySelector("#left-side-content").style.minHeight = "" + conheight + "px";

    this._hscrollfun_bound({target:this._hscrollcontainer});
    this._vscrollcontainer.addEventListener("scroll", this._vscrollfun_bound, false);
    this._hscrollcontainer.addEventListener("scroll", this._hscrollfun_bound, false);
  };

  this._vscrollfun_bound = function()
  {
    this._vscroll = this._vscrollcontainer ? this._vscrollcontainer.scrollTop : 0;
  }.bind(this);

  this._hscrollfun_bound = function(evt)
  {
    var e = document.getElementById("right-side-container");
    var pct = evt.target.scrollLeft / (evt.target.scrollWidth - evt.target.offsetWidth);
    e.scrollLeft = Math.round((e.scrollWidth - e.offsetWidth) * pct);
    this._hscroll = e.scrollLeft;
  }.bind(this);


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

  this._on_setting_change_bound = function(msg)
  {
    if (msg.id == "network_logger")
    {
      if (this._rendertimer)
      {
        window.clearTimeout(this._rendertimer);
      }
      this._rendertime = 0;
      this._rendertimer = null;
      this.ondestroy(); // saves scroll pos
      this.update();
    }
  }.bind(this);

  this._on_scroll_bound = function(evt)
  {
    this._container.querySelector(".resourcelist").scrollTop = evt.target.scrollTop;
  }.bind(this);

  this._on_abouttoloaddocument_bound = function()
  {
    this._loading = true;
    this._table = null;
    this._selected = null;
    this.update();
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    this._loading = false;
    this.update();
  }.bind(this);

  this._on_urlfinished_bound = function()
  {
    if (!this._loading)
    {
      this.update();
    }
  }.bind(this);

  this._on_clear_log_bound = function(evt, target)
  {
    this._service.clear_resources();
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

  messages.addListener("setting-changed", this._on_setting_change_bound);


  var doc_service = window.services['document-manager'];
  var res_service = window.services['resource-manager'];

  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);
  res_service.addListener("urlfinished", this._on_urlfinished_bound);

  eh.click["clear-log-network-view"] = this._on_clear_log_bound;
  eh.click["toggle-paused-network-view"] = this._on_toggle_paused_bound;
  eh.click["toggle-fit-graph-to-network-view"] = this._on_toggle_fit_graph_to_width;

  new ToolbarConfig
  (
    'network_logger',
    [
      {
        handler: 'clear-log-network-view',
        title: ui_strings.S_CLEAR_NETWORK_LOG
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
      "paused-update": false,
      "fit-to-width": false
    },
    // key-label map
    {
      "paused-update": ui_strings.S_TOGGLE_PAUSED_UPDATING_NETWORK_VIEW,
      "fit-to-width": ui_strings.S_TOGGLE_FIT_NETWORK_GRAPH_TO_VIEW
    },
    // settings map
    {
      checkboxes: ["paused-update", "fit-to-width"]
    },
    null,
    null
  );

  new Switches
  (
    'network_logger',
    [
      'paused-update',
      'fit-to-width'
    ]
  );

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;
