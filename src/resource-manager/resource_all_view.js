window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceManagerAllView = function(id, name, container_class, html, default_handler) {
  if (cls.ResourceManagerAllView.instance)
  {
    return cls.ResourceManagerAllView.instance;
  }
  cls.ResourceManagerAllView.instance = this;

  this._service = new cls.ResourceManagerService(this);
  this._sort_by = "name";
  this._reverse = false;
  this._columns = ["icon", "host", "path", "type", "size_h"];
  this._loading = false;
  this._container = null;
  this._scrollpos = 0;
  this._view = null;
  this._open_resource_views = [];

  this.ondestroy = function()
  {
    this._scrollpos = this._container ? this._container.scrollTop : 0;
  }

  this.createView = function(container)
  {
    this._container = container;
    this._render_main_view(container);
  };

  this.show_resource_for_id = function(rid, data)
  {
    var res = this._service.get_resource_for_id(rid);
    if (res)
    {
      this._view = this._open_resource_tab(res, data);
      return true;
    }
    return false;
  };

  this.show_resource_for_url = function(url, data)
  {
    var res = this._service.get_resource_for_url(url);
    if (res)
    {
      this._view = this._open_resource_tab(res, data);
      return true
    }
    return false;
  };

  this._render_main_view = function(container)
  {
    var ctx = this._service.get_resource_context();
    if (ctx && ctx.resources.length)
    {
      if (!this._table)
      {
        this._table = new SortableTable(this._tabledef, null, this._columns)
      }
      this._table.data = ctx.resources.slice(0);
      container.clearAndRender(this._table.render());
      container.scrollTop = this._scrollpos;
    }
    else if (this._loading)
    {
      container.clearAndRender(
        ['div',
         ['p', "Loading page..."],
         'class', 'info-box'
        ]
      );
      this._scrollpos = 0;
    }
    else
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
      this._scrollpos = 0;
    }
  };

  this._setup_single_view = function(resource, resource_manager)
  {

    var searchable_types =
    {
      "script": 1,
      "markup": 1,
      "css": 1,
      "text": 1
    };

    var viewclass =
    {
      image: cls.ImageResourceDetail,
      font: cls.FontResourceDetail,
      script: cls.JSResourceDetail,
      markup: cls.MarkupResourceDetail,
      css: cls.CSSResourceDetail,
      text: cls.TextResourceDetail,
    }[resource.type] || cls.GenericResourceDetail;

    var view = new viewclass(resource, resource_manager);
    ActionHandlerInterface.apply(view);
    if (resource.type in searchable_types)
    {
      const 
      SEARCHFIELD = 0,
      MOVE_HIGHLIGHT_UP = 1,
      MOVE_HIGHLIGHT_DOWN = 2;

      var handler_name = view.id + '-text-search';
      var textSearch = new TextSearch(2);
      textSearch._update_info = new PanelSearch()._update_info;
      textSearch._query_selector = "pre"
      textSearch.controls =
      [
        {
          handler: view.id + '-text-search',
          class: 'panel-search-input-container',
          shortcuts: view.id + '-text-search',
          title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
        },
        {
          handler: view.id + '-move-highlight-up',
          type: "search_control",
          class: "search-move-highlight-up container-button",
          title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_UP
        },
        {
          handler: view.id + '-move-highlight-down',
          type: "search_control",
          class: "search-move-highlight-down container-button",
          title: ui_strings.S_LABEL_MOVE_HIGHLIGHT_DOWN
        },
      ];
      var global_handler = ActionBroker.get_instance().get_global_handler();
      ActionBroker.get_instance().register_handler(view);
      var handler = cls.Helpers.shortcut_search_cb.bind(textSearch);
      view.handle = handler;
      this.shared_shortcuts = "search";
      global_handler.register_shortcut_listener(handler_name, handler);

      eventHandlers.click[textSearch.controls[MOVE_HIGHLIGHT_DOWN].handler] = 
      cls.Helpers.shortcut_search_cb.bind(textSearch, 'highlight-next-match');
      eventHandlers.click[textSearch.controls[MOVE_HIGHLIGHT_UP].handler] = 
      cls.Helpers.shortcut_search_cb.bind(textSearch, 'highlight-previous-match');

      var onviewcreated = function(msg)
      {
        if (msg.id == view.id)
        {
          var search_cell = msg.container.getElementsByClassName('searchcell')[0];
          search_cell.clearAndRender(window.templates.advanced_search_field(textSearch))
          var info_ele = search_cell.getElementsByClassName('search-info-badge')[0];
          var scroll_container = msg.container.getElementsByClassName('resource-detail-container')[0];
          textSearch.set_info_element(info_ele);
          if (scroll_container)
          {
            var query = '[handler="' + textSearch.controls[0].handler + '"]';
            var _input = search_cell.querySelector(query);
            textSearch.setContainer(scroll_container);
            textSearch.setFormInput(_input);
          }
        }
      };
      var onviewdestroyed = function(msg)
      {
        if( msg.id == view.id )
        {
          textSearch.cleanup();
        }
      };
      var oninput = function(event, target)
      {
        textSearch.searchDelayed(target.value);
      };
      messages.addListener('view-created', onviewcreated);
      messages.addListener('view-destroyed', onviewdestroyed);
      eventHandlers.input[handler_name] = oninput;
    }
    return view;
  };

  this._open_resource_tab = function(resource, data)
  {

    var ui = UI.get_instance();

    if (!this._open_resource_views[resource.id])
    {
      var view = this._setup_single_view(resource, this._service);
      this._open_resource_views[resource.id] = view.id;
    }
    window.views[this._open_resource_views[resource.id]].data = data

    ui.get_tabbar("resources").add_tab(this._open_resource_views[resource.id]);
    ui.show_view(this._open_resource_views[resource.id]);
  }

  this.open_resource_tab = this._open_resource_tab;

  this._handle_open_resource_bound = function(evt, target)
  {
    var rid = target.getAttribute("data-object-id");
    var obj = this._service.get_resource_for_id(rid);
    this._open_resource_tab(obj);
  }.bind(this);

  this._tabledef = {
    handler: "resources-all-open",
    column_order: ["icon", "protocol", "host", "path", "mime", "type", "size", "size_h"],
    idgetter: function(res) { return String(res.id) },
    groups: {
      hosts: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_HOST,
        grouper: function(res) { return res.urltype == 4 ? ui_strings.S_RESOURCE_ALL_TABLE_NO_HOST : cls.ResourceUtil.url_host(res.url) }
      },
      types: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_TYPE,
        grouper: function(res) { return res.type || ui_strings.S_RESOURCE_ALL_TABLE_UNKNOWN_GROUP}
      }
    },
    columns: {
      icon: {
        label: "Icon",
        headerlabel: "",
        sorter: "unsortable",
        renderer: function(res) { return templates.resource_icon(res) }
      },
      protocol: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PROTOCOL,
        getter: function(res) { return res.urltypeName },
      },
      host: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_HOST,
        getter: function(res) { return res.urltype == 4 ? res.human_url : cls.ResourceUtil.url_host(res.url) },
      },
      path: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PATH,
        getter: function(res) { return res.urltype == 4 ? res.human_url : cls.ResourceUtil.url_path(res.url) },
      },
      mime: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_MIME,
        getter: function(res) { return res.mime || ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE }
      },
      type: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_TYPE,
        getter: function(res) { return res.type ? (cls.ResourceUtil.type_to_string_map[res.type] || res.type.capitalize())
                                                : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE }
      },
      size: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        renderer: function(res) { return res.size ? String(res.size) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE },
        getter: function(res) { return res.size },
      },
      size_h: {
        label: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_PPSIZE,
        headerlabel: ui_strings.S_RESOURCE_ALL_TABLE_COLUMN_SIZE,
        align: "right",
        getter: function(res) { return res.size },
        renderer: function(res) {
          return String(res.size ?
                        cls.ResourceUtil.bytes_to_human_readable(res.size) :
                        ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE)
        }
      }
    },
  }

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
  eh.click["resources-all-open"] = this._handle_open_resource_bound;
  eh.click['open-resource-tab'] = function(event, target)
  {
    var broker = cls.ResourceDisplayBroker.get_instance();
    broker.show_resource_for_ele(target);
  }

  var doc_service = window.services['document-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  this.init(id, name, container_class, html, default_handler);
};
cls.ResourceManagerAllView.get_instance = function()
{
  return this.instance;
}

cls.ResourceManagerAllView.prototype = ViewBase;


