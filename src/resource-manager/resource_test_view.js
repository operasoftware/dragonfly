window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceTestView = function(id, name, container_class, html, default_handler) {
  if (cls.ResourceTestView.instance)
  {
    return cls.ResourceTestView.instance;
  }
  cls.ResourceTestView.instance = this;

  //	const
  var updateThrottleTime  = 500;

  // "private"
  this._service = new cls.ResourceManagerService(this);
  this._loading = false;

  this._updateTime = 0;
  this._updateThrottled = false;

  // public

  this.createView = function(container)
  {
  	// throttle
		var timeSinceLastRender = Date.now()-this._updateTime;
		if( timeSinceLastRender<updateThrottleTime )
		{
			if (!this._updateThrottled)
			{
				this._updateThrottled = true;
				setTimeout( this.update.bind(this), updateThrottleTime-timeSinceLastRender );
			}
			return;
		}
		else
		{
			this._updateThrottled = false;
			this._updateTime = Date.now();
		}

		// createView
		var service = this._service;
		var ctx = this._service.get_resource_context();

		if (ctx && Object.keys(ctx.resourcesDict).length)
		{
      container.clearAndRender( templates.resource_tree.update(ctx) );
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
         ['span',
          'class', 'container-button ui-button',
          'handler', 'reload-window',
          'tabindex', '1'],
         ['p', ui_strings.S_RESOURCE_CLICK_BUTTON_TO_FETCH_RESOURCES],
         'class', 'info-box'
        ]
      );
    }
	};


  this._on_abouttoloaddocument_bound = function()
  {
    this._loading = true;
    this.update();
  }.bind(this);

  this._on_documentloaded_bound = function()
  {
    this._loading = false;
    this.update();
  }.bind(this);


  
	//	WIP: this comes straight from the old resource_all_view
  this._type_class_map = 
  {
    image: cls.ImageResourceDetail,
    font: cls.FontResourceDetail,
    script: cls.JSResourceDetail,
    markup: cls.MarkupResourceDetail,
    css: cls.CSSResourceDetail,
    text: cls.TextResourceDetail,
  };
	this._open_resource_views = {};
  
  this._open_resource_tab = function(resource, data)
  {
    var ui = UI.get_instance();

    if (!this._open_resource_views[resource.id])
    {
      var viewclass = this._type_class_map[resource.type]||cls.GenericResourceDetail;
      var view = new viewclass( resource, this._service );
      this._open_resource_views[resource.id] = view.id;
    }
    window.views[this._open_resource_views[resource.id]].data = data

    ui.get_tabbar("resources").add_tab(this._open_resource_views[resource.id]);
    ui.show_view(this._open_resource_views[resource.id]);
  }


	var eh = window.eventHandlers;
  // fixme: this is in the wrong place! Doesn't belong in UI and even if it
  // did, the event handler doesn't get added until the view is created
  // which means you can't open tabs from elsewhere if you haven't opened
  // the resources view first
/*
  eh.click["resources-all-open"] = this._handle_open_resource_bound;
  eh.click['open-resource-tab'] = function(event, target)
  {
    var broker = cls.ResourceDisplayBroker.get_instance();
    broker.show_resource_for_ele(target);
  }
*/
  var doc_service = window.services['document-manager'];
  doc_service.addListener("abouttoloaddocument", this._on_abouttoloaddocument_bound);
  doc_service.addListener("documentloaded", this._on_documentloaded_bound);

  this.init(id, name, container_class, html, default_handler);
};

cls.ResourceTestView.prototype = ViewBase;