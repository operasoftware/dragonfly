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
			if (this.resourceId==id){ this.resource = resource; }
		}
		this.update();
	}.bind(this);

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

	this.open_resource_tab = function(resource, data)
	{
		this.resource = resource;
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