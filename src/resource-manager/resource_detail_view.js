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
		if (this.resource )
		{
			if (this.resource.data)
			{
				container.innerHTML = 'Data available for the resource '+this.resource.id+' '+Date.now();	// to get a visual that something is happening in case the resource is heavy to render
				var toto=Date.now();
				container.clearAndRender( templates.resource_detail.update(this.resource, this.resource.data) );
				container.title = (Date.now()-toto)+'ms';
				this.go_to_line(container,this.data);
			}
			else
			{
				container.innerHTML = 'No data available for the resource '+this.resource.id+' '+Date.now()+'<p>'+JSON.stringify(this.resource)+'</p>';
			}
		}
		else
		{
			container.innerHTML = 'No resource selected'+Date.now();
		}
		this.data = null;
	}

	this.on_resource_data_bound = function(type, data)
	{
		//if(this.resource && this.resource.id==data[0])
		var id = data[0];
		var resource = this._service.get_resource(id);
		if(resource)
		{
/*			
			resource.data =
			{
				mimeType:data[2],
				characterEncoding:data[3],
				contentLength:data[4],
				length:data[5][0],
				content:data[5][2]||data[5][3]
			};
*/
			resource.data = new cls.ResourceManager["1.0"].ResourceData( data );
			if(resource.type=='image')
			{
				var i=new Image();
				i.src=resource.data.content.stringData;
				resource.data.meta = i.naturalWidth+'x'+i.naturalHeight;
			}
			if (this.resourceId==id){ this.resource = resource; }
		}
		this.update();
	}.bind(this);
/*
	this.__open_resource = function(resource)
	{
		var id = resource.id;
		this.resourceId = id;
		if (!resource.data)
		{
			var responseType = cls.ResourceUtil.type_to_content_mode(resource.type);
			this._service.fetch_resource_data( this.on_resource_data_bound, id, responseType );
		}
		else
		{
			this.update();
		}
	}
	*/


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

	this.open_resource_tab = function(resource, data)
	{
		this.resource = resource;
		this.data = data;
		this.update();
	}



	this.open_resource = function(id)
	{
		this.resourceId = id;
		var resource = this.resource = this._service.get_resource(id);
		this.update();
		if (resource && !resource.data)
		{
			var responseType = cls.ResourceUtil.type_to_content_mode(resource.type);
			this._service.fetch_resource_data( this.on_resource_data_bound, id, responseType );
		}
	}

	this.open_resource_group = function(group)
	{
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

cls.ResourceDetailView.prototype = ViewBase;