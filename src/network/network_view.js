window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkLogView = function(id, name, container_class, html, default_handler) {
  this._service = new cls.NetworkLoggerService()
  this._loading = false;
  this._scroll = 0;
  this._selected = null;

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this.ondestroy = function()
  {
    if (this._scrollcontainer)
    {
      this._scroll= this._scrollcontainer.scrollTop;
    }
  }

  this._render_main_view = function(container)
  {
    var ctx = this._service.get_request_context();
    if (ctx && ctx.resources.length)
    {
      this._container = container;

      if (this._scrollcontainer)
      {
        this._scroll = this._scrollcontainer.scrollTop;
      }

      if (this._selected !== null)
      {
        var w = container.getBoundingClientRect().width - 250;
        var h = container.getBoundingClientRect().height;
        container.clearAndRender(templates.network_log_details(ctx, this._selected));
        this._scrollcontainer = container.querySelector(".network-details-url-list");
        this._scrollcontainer.scrollTop = this._scroll;

        var content = container.querySelector(".network-details-request");
         content.style.width = "" + w + "px";
      }
      else
      {
        var contheight = container.getBoundingClientRect().height - 2;
        var availwidth = container.getBoundingClientRect().width - 250;
        var duration = ctx.get_duration();
        var graphwidth = availwidth;

        if (duration > 3000)
        {
          graphwidth = Math.ceil(duration);
        }

        // fixme: round up to nearest second when rendering grid

        container.clearAndRender(templates.network_log_main(ctx, graphwidth));
        this._scrollcontainer = container.querySelector("#main-scroll-container");
        this._scrollcontainer.style.height = "" + (contheight-30) + "px";
        this._scrollcontainer.scrollTop = this._scroll;
        container.className = "";

        var scrollable = container.querySelector("#main-scroll-container");
        var scrollercont = container.querySelector("#scrollbar-container");
        var scroller = container.querySelector("#scrollbar");
        scroller.style.width = "" + graphwidth + "px";

        container.querySelector("#right-side-content").style.width = "" + graphwidth + "px";
        var scrollfun = function(evt) {
          var e = document.getElementById("right-side-container");
          e.scrollLeft = evt.target.scrollLeft;
        }
        scrollercont.addEventListener("scroll", scrollfun, false)
      }
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

  this._on_clicked_get_body = function(evt, target)
  {
    var rid = target.getAttribute("data-resource-id");
    rid = parseInt(rid);
    this._service.request_body(rid, this.update.bind(this));
  }.bind(this);

  this._on_clicked_toggle_response_bound = function()
  {
    var mode = settings.network_logger.get("response-view-mode") == "raw" ? "cooked" : "raw";
    settings.network_logger.set("response-view-mode", mode);
    this.update();
  }.bind(this);

  this._on_clicked_toggle_request_bound = function()
  {
    var mode = settings.network_logger.get("request-view-mode") == "raw" ? "cooked" : "raw";
    settings.network_logger.set("request-view-mode", mode);
    this.update();
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

  var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
  //  eh.click["resources-all-open"] = this._handle_open_resource_bound;

  eh.click["select-network-request"] = this._on_clicked_request_bound;
  eh.click["close-request-detail"] = this._on_clicked_close_bound;
  eh.click["get-response-body"] = this._on_clicked_get_body;

  eh.click["toggle-raw-cooked-response"] = this._on_clicked_toggle_response_bound;
  eh.click["toggle-raw-cooked-request"] = this._on_clicked_toggle_request_bound;

  var doc_service = window.services['document-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  new Settings
  (
    // id
    "network_logger",
    // key-value map
    {
      "request-view-mode": "cooked",
      "response-view-mode": "cooked"
    },
    // key-label map
    {

    },
    // settings map
    {
      checkboxes: []
    },
    null,
    null
  );

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkLogView.prototype = ViewBase;
