window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkOptionsView = function(id, name, container_class, html, default_handler) {
  this._clearing_cache = false;
  this._service = window.services["resource-manager"];

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    var headers = [{name:"foo", value:"bar"}];
    container.clearAndRender(templates.network_options_main(this._clearing_cache, headers));
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
    const ORIGINAL = 1, FULL = 2;
    var disabled = target.checked;
    this._service.requestSetReloadPolicy(null, [disabled ? FULL : ORIGINAL]);
  }.bind(this);

  var eh = window.eventHandlers;
  eh.click["network-options-clear-cache"] = this._handle_clear_cache_bound;
  eh.click["network-options-toggle-caching"] = this._handle_toggle_caching_bound;

  this.init(id, name, container_class, html, default_handler);
};
cls.NetworkOptionsView.prototype = ViewBase;
