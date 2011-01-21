window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkOptionsView = function(id, name, container_class, html, default_handler) {
  this._clearing_cache = false;
  this._cache_policy = "default";
  this._tracking_policy = "notrack";
  this._service = window.services["resource-manager"];

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    var headers = [{name:"foo", value:"bar"}];
    container.clearAndRender(templates.network_options_main(this._clearing_cache,
                                                            this._cache_policy,
                                                            this._tracking_policy,
                                                            headers));
    this._input = new cls.BufferManager(container.querySelector("textarea"));
    this._output = container.querySelector("code");
    this._headertable = container.querySelector("table");
  };

  /**
   * Make sure there is always one blank entry for adding stuff
   */
  this._update_header_table = function()
  {
    var rows = this._headertable.querySelectorAll("tr");
    var emptyrows = [];
    for (var n=1, row; row=this._headertable[n]; n++)
    {
        if (!row.childNodes[0].textContent.trim() &&
            !row.childNodes[1].textContent.trim())
          {
            emptyrows.push(row);
          }
    }

    if (emptyrows.length &&
        emptyrows[emptyrows.length-1] == this._headertable.lastChild )
      {

      }

  };

  this._handle_clear_cache_bound = function(evt, target)
  {
    var tagman = new cls.TagManager();
    tag = tagman.set_callback(this, this._on_cleared_cache_bound);
    this._clearing_cache = true;
    this.update();
    this._service.requestClearCache(tag);
  }.bind(this);

  this._on_cleared_cache_bound = function(msg)
  {
    this._clearing_cache = false;
    this.update();
  }.bind(this);

  this._handle_toggle_caching_bound = function(evt, target)
  {
    this._cache_policy = target.value;
    const DEFAULT = 1,  NO_CACHE = 2;
    this._service.requestSetReloadPolicy(null, [ this._cache_policy == "default" ? DEFAULT : NO_CACHE]);
  }.bind(this);

  this._handle_toggle_content_tracking_bound = function(evt, target)
  {
    this._tracking_policy = target.value;

    if (this._tracking_policy == "notrack")
    {
      var arg = [[4]];
    }
    else
    {
      var arg = [[3, 1],
                 [ "text/html", "application/xhtml+xml", "application/mathml+xml",
                   "application/xslt+xml", "text/xsl", "application/xml",
                   "text/css", "text/plain", "application/x-javascript",
                   "application/javascript", "text/javascript"
                 ].map(function(e) { return [e, [1, 1]] })
                ];
    }
    this._service.requestSetResponseMode(null, arg);
  }.bind(this);

  var eh = window.eventHandlers;
  eh.click["network-options-clear-cache"] = this._handle_clear_cache_bound;
  eh.change["network-options-toggle-caching"] = this._handle_toggle_caching_bound;
  eh.change["network-options-toggle-body-tracking"] = this._handle_toggle_content_tracking_bound;

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkOptionsView.prototype = ViewBase;
