window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.RequestCraftingView = function(id, name, container_class, html, default_handler, request_crafter)
{
  this._request_crafter = request_crafter;
  this._headers_field = null;
  this._urlfield = null;
  this._container = null;
  this._init(id, name, container_class, html, default_handler);
};

cls.RequestCraftingViewPrototype = function()
{
  this.ondestroy = function()
  {
    this._current_url = this._urlfield ? this._urlfield.get_value() : "";
    this._current_request = this._headers_field ? this._headers_field.get_value() : "";
  };

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  this.createView = function(container)
  {
    this._container = container;
    var requests = this._request_crafter.get_requests();
    var selected = this._request_crafter.selected; // is an id
    // render entries..
    var templates = window.templates.network;
    container.clearAndRender(templates.request_crafter_main(requests, selected));
    this._urlfield = new cls.BufferManager(container.querySelector("input"));
    this._headers_field = new cls.BufferManager(container.querySelector("textarea"));
  };

  this.update_request_list = function()
  {
    var list = this._container && this._container.querySelector(".request-crafter-history");
    if (list)
    {
      var requests = this._request_crafter.get_requests();
      var selected = this._request_crafter.selected; // is an id
      var templates = window.templates.network;
      list.clearAndRender(templates.crafter_request_list(requests, selected));
    }
  };

  this._on_clear = function()
  {
    this._request_crafter.clear();
    this.update();
  }

  this._handle_send_request = function()
  {
    this._request_crafter.send_request();
    this.update();
  };

  this._handle_select_request = function(event, target)
  {
    var id = event.target.get_attr("parent-node-chain", "data-id");
    if (id)
    {
      this._request_crafter.selected = id;
      this.update();
    }
  };

  this._handle_request_changed = function()
  {
    this._request_crafter.update_request(
      this._urlfield.get_value(),
      this._headers_field.get_value()
    );
  };

  this._handle_url_change = function(evt, target)
  {
    var urlstr = target.value;
    this._add_url_info_to_request(this._parse_url(urlstr));
  };

  this._add_url_info_to_request = function(urldata)
  {
    if (!urldata) { return; }
    var current = this._headers_field.get_value();
    current = current.replace(/^(\w+? )(.*?)( .*)/, function(s, m1, m2, m3, all) {return m1 + urldata.path + " " + urldata.protocol + "/1.1" ; });
    current = current.replace(/^Host: .*$?/m, "Host: " + urldata.host);
    this._headers_field.set_value(current);
    this._handle_request_changed_bound();
  };

  this._parse_url = function(url)
  {
    // Regex! Woo!
    // this one tries to figure out if url is indeed something like a url.
    // Pulls out proto, if it's http(s), host and path if there is one.
    var match = url.match(/^(?:(http(?:s)?):\/\/)(\S*?)(?:\/|$)(?:(.*))/);
    if (match)
    {
      return {protocol: match[1].toUpperCase(), host: match[2], path: "/" + (match[3] || "")};
    }
    return null;
  };

  this._init = function(id, name, container_class, html, default_handler)
  {
    this._request_crafter.addListener("update", this.update.bind(this));
    this._request_crafter.addListener("update-request-list", this.update_request_list.bind(this));

    // Todo: Maybe I don't need those and can just assign them as handlers.
    this._on_clear_bound = this._on_clear.bind(this);
    this._handle_send_request_bound = this._handle_send_request.bind(this);
    this._handle_select_request_bound = this._handle_select_request.bind(this);
    this._handle_request_changed_bound = this._handle_request_changed.bind(this);
    this._handle_url_change_bound = this._handle_url_change.bind(this);

    var eh = window.eventHandlers;
    eh.click["clear-request-crafter"] = this._on_clear_bound;
    eh.click["request-crafter-send"] = this._handle_send_request_bound;
    eh.click["select-crafter-request"] = this._handle_select_request_bound;
    // eh.change["request-crafter-url-change"] = this._handle_url_change_bound;
    // eh.keyup["request-crafter-url-change"] = this._handle_url_change_bound;
    eh.input["request-crafter-url-change"] = this._handle_url_change_bound;
    eh.input["request-crafter-header-change"] = this._handle_request_changed_bound;

    this.required_services = ["resource-manager", "document-manager"];
    this.init(id, name, container_class, html, default_handler);
  };
};
cls.RequestCraftingViewPrototype.prototype = ViewBase;
cls.RequestCraftingView.prototype = new cls.RequestCraftingViewPrototype();

cls.RequestCraftingView.create_ui_widgets = function()
{
  new ToolbarConfig(
    {
      view: "request_crafter",
      groups: [
        {
          type: UI.TYPE_BUTTONS,
          items: [
            {
              handler: "clear-request-crafter",
              icon: "clear-log-network-view",
              title: ui_strings.S_CLEAR_REQUEST_CRAFTER
            }
          ]
        }
      ]
    }
  );
}
