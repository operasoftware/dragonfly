window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.NetworkOptionsView = function(id, name, container_class, html, default_handler) {

  this._service = window.services["resource-manager"];

  this.ondestroy = function()
  {

  };

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
    container.clearAndRender(templates.network_options_main());
    this._input = new cls.BufferManager(container.querySelector("textarea"));
    this._output = container.querySelector("code");
  };

  this._handle_clear_cache_bound = function(evt, target)
  {
    //fixme: this may take time with loaded cache. Add spinner and callback
    this._service.requestClearCache(null);
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
