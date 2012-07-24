window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */
cls.ResourceDetailView = function(id, name, container_class, html, default_handler) {
  if (cls.ResourceDetailView.instance)
  {
    return cls.ResourceDetailView.instance;
  }
  cls.ResourceDetailView.instance = this;

  this._service = new cls.ResourceManagerService(this);

	this.createView = function(container)
	{
		if (this.resource && this.resource.data)
      container.clearAndRender( templates.resource_detail.formatting_data(this.resource) );

    container.clearAndRender( templates.resource_detail.update(this.resource) );
    if(this.data)
      this.go_to_line(container,this.data);

//    if (this.resource && this.resource.type in {'markup':1,})
    {
      //this.text_search.set_query_selector(".resource-detail-container");
      this.text_search.update_search();
    }

		this.data = null;
	};

  this.create_disabled_view = function(container)
  {
    container.clearAndRender(window.templates.disabled_view());
  };

  const HIGHLIGHTED_LINE_CLASSNAME = 'highlighted-line';
  const RESOURCE_DETAIL_CONTAINER_CLASSNAME = 'resource-detail-container';
  const TEXT = document.TEXT_NODE;
  const ELE  = document.ELEMENT_NODE;
  this._span = document.createElement('span');
  this._span.textContent = ' ';
  this._line_count = 0;
  this._line_found = false;
  this._target_line = 0;
  this._root_ele = null;
  this._tops = [];

  this._highlight_line = function(ele)
  {
    const CR = "\r";
    const LF = "\n";
    var child = ele.firstChild;
    while (child && !this._line_found)
    {
      if (child.nodeType == ELE)
      {
        this._highlight_line(child);
      }
      else if (child.nodeType == TEXT)
      {
        var value = child.nodeValue;
        for (var pos = 0, len = value.length; pos < len; pos++)
        {
          var c = value.charAt(pos);
          // Linefeed recognition will not support Acorn BBC spooled text output 
          if ((c == CR ) || (c == LF))
          {
            this._line_count++;
            if (this._line_count == this._target_line)
            {
              var target_pos = child.splitText(pos);
              child.parentNode.insertBefore(this._span, target_pos);
              this._tops.push(this._span.getBoundingClientRect().top);
              child.parentNode.removeChild(this._span);
              child.parentNode.normalize();
              if (this._tops.length < 2)
              {
                this._target_line+=1;
              }
              else
              {
                var scroll_container = ele;
                var container_top = scroll_container.getBoundingClientRect().top;
                var delta = this._tops[1] - this._tops[0];
                var scroll_top = scroll_container.scrollTop;
                ele.addClass(HIGHLIGHTED_LINE_CLASSNAME);
                ele.style.cssText = 
                  "background-size: 100% " + delta + "px;" +
                  "background-position: 0 " + 
                    (this._tops[0] - container_top + scroll_top) + "px;";
                
                var scroll_position = scroll_top + this._tops[0] - container_top;
                if (scroll_position <= this._root_ele.parentNode.clientHeight)
                {
                  scroll_position-=64;
                }
                this._root_ele.scrollTop = scroll_position;
                this._line_found = true;
                return;
              }
            }
            if ((c == CR) && (value.charAt(pos+1) == LF))
            {
              pos++;
            }
          }
        }
      }
      child = child && child.nextSibling;
    }
  }

  this.clear_line_highlight = function(container)
  {
    // reset all properties
    this._line_count = 0;
    this._line_found = false;
    this._target_line = 0;
    this._tops = [];
    var _ele = container.querySelectorAll('.'+HIGHLIGHTED_LINE_CLASSNAME)[0];
    if (_ele)
    {
      _ele.removeClass(HIGHLIGHTED_LINE_CLASSNAME)
    }
  }

  this.go_to_line = function(container, data)
  {
		if (!data || !(data.lines && data.lines.length)) return;
    this._root_ele = container.getElementsByClassName(RESOURCE_DETAIL_CONTAINER_CLASSNAME)[0];
    if (this._root_ele)
    {
      this.clear_line_highlight(this._root_ele)
      this._target_line = parseInt(data.lines[0]);
      this._highlight_line(this._root_ele);
    }
  }

	this.on_resource_data_bound = function(type, data)
	{
		var id = data[0];
		var resource = this._service.get_resource(id);
		if(resource)
		{
			resource.data = new cls.ResourceManager["1.0"].ResourceData( data );
		}
		return resource;
	}.bind(this);

  this._show_resource_by_instance = function(resource)
  {
      this.resource = resource;
      if (resource && !resource.data)
        resource.fetch_data(cls.ResourceDetailView.instance.update.bind(cls.ResourceDetailView.instance));
  }

  this._show_resource_by_id = function(id)
  {
    var resource = this._service.get_resource(resource);
    this._show_resource_by_instance(resource);
  }

  this._show_resource_url = function(url)
  {
    var resource = this._service.get_resource_for_url(url);
    if (resource)
      this._show_resource_by_instance(resource);
    else
      new cls.ResourceRequest(url, this.show_resource.bind(this), this.data);
  }

  this.show_resource = function(resource, data)
  {
    this.data = data;

    if(resource instanceof cls.Resource)
      this._show_resource_by_instance(resource);
    else if (resource==Number(resource))
      this._show_resource_by_id(resource);
    else if (resource==String(resource))
      this._show_resource_url(resource);

    this.update();
    window.UI.instance.show_view( window.views.resource_detail_view.id );
  }

	
  //  WIP
  this.show_resource_group = function(resourceGroup)
	{
    return;

		this.resources = [];
		for( var i=0; i<group.ids.length; i++)
		{
			var id = group.ids[i];
			var resource = this._service.get_resource(id);
			if (resource)
			{
				this.resources.push( resource );
				if (!resource.data)
				{
					var responseType = cls.ResourceUtil.type_to_content_mode(resource.type);
					this._service.fetch_resource_data( this.on_resource_data_bound, id, responseType );
				}
			}
		}
		this.update();
	}

  this.init(id, name, container_class, html, default_handler);
};

cls.ResourceDetailView.create_ui_widgets = function()
{
  new ToolbarConfig(
  {
    view:'resource_detail_view',
    groups:
    [
      {
        type: UI.TYPE_INPUT,
        items:
        [
          {
            handler: "resource-text-search",
            shortcuts: "resource-text-search",
            title: ui_strings.S_SEARCH_INPUT_TOOLTIP,
            label: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
          }
        ]
      }
    ]
  });

  var text_search = window.views.resource_detail_view.text_search = new TextSearch();

  window.eventHandlers.input["resource-text-search"] = function(event, target)
  {
    text_search.searchDelayed(target.value);
  };

  ActionBroker.
    get_instance().
    get_global_handler().
      register_shortcut_listener("resource-text-search", cls.Helpers.shortcut_search_cb.bind(text_search));

  var on_view_created = function(msg)
  {
    if (msg.id === "resource_detail_view")
    {
      var scroll_container = msg.container.querySelector(".request-details");
      if (!scroll_container)
        scroll_container = msg.container.querySelector(".resource-detail-container");

      if (scroll_container)
      {
        text_search.setContainer(scroll_container);
        text_search.setFormInput(
          views.resource_detail_view.getToolbarControl(msg.container, "resource-text-search")
        );
      }
    }
  }

  var on_view_destroyed = function(msg)
  {
    if (msg.id == "resource_detail_view")
      text_search.cleanup();
  }

  window.messages.addListener("view-created", on_view_created);
  window.messages.addListener("view-destroyed", on_view_destroyed);
}

cls.ResourceDetailView.prototype = ViewBase;

