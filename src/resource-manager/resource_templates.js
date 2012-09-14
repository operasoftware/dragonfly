window.templates = window.templates || {};

templates.resource_icon = function(resource)
{
  return ["span", "class", "resource-icon resource-type-" + resource.type];
};

templates.resource_tree =
{
	_groupOrder:['markup','stylesheets','scripts','images','fonts','others'],

	_init:function()
	{
		if (this._initialized)
			return;

		// wrap the nesting templating for _depth iteration according styling
		['document', 'resource_group', 'resource'].forEach(function(f)
		{
			var original = this[f];
			this[f] = function()
			{
				this._depth++;

				var tpl = original.apply(this, arguments);
				if(tpl && tpl[1] && tpl[1][0] == 'h2')
					tpl[1].push( 'style', 'padding-left:'+ this._depth*18 +'px;' );

				this._depth--;

				return tpl;
			};
		}, this);

		this._initialized = true;
	},

	expandCollapseToggle:function(context, pivotID, tpl)
	{
		var button = ['input',
			'type','button',
			'class','button-expand-collapse'
		];

		var hash = context.collapsed;
		if (!hash.hasOwnProperty(pivotID))
			hash[pivotID] = this._depth>1;

	 	var collapsed = hash[pivotID];

		tpl.push
		(
			'data-expand-collapse-id', pivotID,
			'class', 'resource-tree-expand-collapse'+(collapsed?' close':'')
		);

		tpl[1].push( 'handler','resources-expand-collapse' );
		tpl[1].splice(1, 0, button);

		return tpl;
	},

	update:function(context)
	{
		if (!this._initialized)
			this._init();
		this._depth = 0;
		return this.windows(context);
	},

	windows:function(context)
	{
		//if (context.windowList.length)
			return (
			['ul',
				context.windowList.map(this.window.bind(this, context)),
				'class','resource-tree-windows'
			]);
	},

	window:function(context, w)
	{
		return this.expandCollapseToggle
		(
			context,
			'w'+w.id,
			['li',
				['h2',
					['span',
						'windowID '+w.id,
						'class','resource-tree-window-label'
					],
					'class','resource-tree-window'
				],
				this.documents(context, w.id),
				'data-expand-collapse-id','w'+w.id
			]
		);
	},

	documents:function(context, wid, pid)
	{
		var documents = context.documentList.
		filter(function(d){
			return d.documentID != null && d.windowID == wid && d.parentDocumentID == pid;
		});

		if (documents.length)
			return (
			['ul',
				documents.map(this.document.bind(this, context)).
				filter(function(v){
					return v != null;
				}),
				'class','resource-tree-documents'
			]);
	},

	document:function(context, d)
	{
		var documentResources = context.documentResources[d.documentID]||[];
		var resources = context.resourceList.
		filter(function(r){
			return documentResources.contains(r.id);
		});

		if (resources.length)
			return this.expandCollapseToggle
			(
				context,
				'd'+d.documentID,
				['li',
					['h2',
						['span',
							(d.url.filename || d.url.short_distinguisher),
							'class','resource-tree-document-label'
						],
						' ',
						['span',
							'('+resources.length+')',
							'class','resource-tree-count'
						],
						'class','resource-tree-document'+(d.sameOrigin?'':' resource-different-origin'),
						'title',JSON.stringify(d)
					],
					[
						this.resource_groups(context, resources),
						this.documents(context, d.windowID, d.documentID)
					]
				]
			);
	},

	resource_groups:function(context, resources)
	{
		var tpl = this._groupOrder.
		map(this.resource_group.bind(this, context, resources)).
		filter(function(v){
			return v!=null;
		});

		if (tpl.length)
			return (
			['ul',
				tpl,
				'class','resource-tree-groups'
			]);
	},

	resource_group:function(context, resources_unfiltered, g)
	{
		var resources = resources_unfiltered.
		filter(function(r){
			return r.group == g;
		});

		if (resources.length)
			return this.expandCollapseToggle
			(
				context,
				'd'+resources[0].document_id+'-'+g,
				['li',
					['h2',
						['span',
							g,
							'class','resource-tree-group-label'
						],
						' ',
						['span',
							'('+resources.length+')',
							'class','resource-tree-count'
						],
						'class','resource-tree-group resource-tree-group-'+g
					],
					this.resources(context, resources)
				]
			);
	},

	resources:function(context, resources)
	{
		return (
		['ul',
			resources.map(this.resource.bind(this, context)),
			'class','resource-tree-resources'
		]);
	},

	resource:function(context, r)
	{
		return (
		['li',
			['h2',
				['span',
					(r.filename || r.short_distinguisher || r.url || 'NO URL'),
					'class','resource-tree-resource-label'
				],
				'handler','resource-detail',
				'data-resource-id',''+r.id,
				'data-tooltip',!r.url&&'js-script-select',
				'data-tooltip-text',!r.url&&JSON.stringify(r),
				'class','resource-tree-resource'
					+(r.sameOrigin?'':' resource-different-origin')
					+(context.selectedResourceID==r.id?' resource-highlight':'')
					+(!r.url?' wat':'')
			]
		]);
	}

};

templates.resource_detail =
{
	update:function(resource)
	{
		if (!resource)
			return this.no_resource_selected();

		if (!resource.data)
			return this.no_data_available(resource);

		var specificTemplate = this[resource.type]?resource.type:'text';

		return(
		['div',
			this.overview(resource),	// overview
			['div',	// specific template
				this[specificTemplate](resource, resource.data),
				'class','resource-detail-'+ specificTemplate +'-container'
			],
			'class','resource-detail-container',
			'style','height:100%;overflow:auto;'
		]);
	},

	no_resource_selected:function()
	{
		return(
		['div',
      'No resource selected',
      'class','resource-detail-container-empty'
    ]);
	},

	no_data_available:function(resource)
	{
		return(
		['div',
      'No data available for the resource '+ resource.url,
      'class','resource-detail-container-empty'
    ]);
	},

	formatting_data:function(resource)
	{
		if(!resource)
			return this.no_resource_selected();

		if (!resource.data)
			return this.no_data_available(resource);

		return(
		['div',
			'Formatting the resource '+ resource.url +'...',
			'class','resource-detail-container-empty'
    ]);
	},

	overview:function(resource)
	{
		var info =
		{
			'human_url':resource.human_url,
			'type':resource.type,
			'mimeType':resource.data.mimeType,
			'size':resource.size||resource.data.contentLength||resource.data.content.length,
			'characterEncoding':resource.encoding||resource.data.characterEncoding
		};

		return (
		['div',
			['span',
				[
					'a',
					info.human_url,
					'href',resource.url,
					'target','_blank',
					'class','external'
				],
				'class','resource-detail-overview-url'
			],
			['span',
				info.mimeType+' treated as '+info.type +' '+[resource.data.meta],
				'class','resource-detail-overview-type'
			],
			['span',
				cls.ResourceUtil.bytes_to_human_readable(info.size)+(info.characterEncoding&&(' in '+info.characterEncoding)),
				'data-tooltip','js-script-select',
				'data-tooltip-text',info.size+' bytes',
				'class','resource-detail-overview-size'
			],
			'class','resource-detail-overview'
		]);
	},

	text:function(resource)
	{
		return (
		[
			['pre',resource.data.content.stringData],
			['ptr',new Option(JSON.stringify(resource)).innerHTML]
		]);
	},

	markup:function(resource)
	{
		var line_count = 0;
		var lines = [++line_count];
		var source = templates.highlight_markup(resource.data.content.stringData, function(){ lines.push(++line_count); });

		return (
		['div',
			source,
			['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
			'class', 'resource-detail-markup mono line-numbered-resource'
		]);

	},

	script:function(resource)
	{
		var line_count = 0;
		var lines = [++line_count];
		var source = templates.highlight_js_source(resource.data.content.stringData, function(){ lines.push(++line_count); });

		return (
		['div',
			source,
			['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
			'class', 'resource-detail-script mono line-numbered-resource'
		]);
	},

	css:function(resource)
	{
		var line_count = 0;
		var lines = [++line_count];
		var source = templates.highlight_css(resource.data.content.stringData, function(){ lines.push(++line_count); });

		return (
		['div',
			source,
			['div', lines.join('\n'), 'class', 'resource-line-numbers', 'unselectable', 'on'],
			'class', 'resource-detail-css mono line-numbered-resource'
		]);
	},

	font:function(resource)
	{
		var styleRule = '@font-face{font-family:"resource-'+resource.id+'";src:url("'+resource.data.content.stringData+'");}';

		return(
		['object',
			['div',
				'The quick brown fox jumps over the lazy dog 0123456789',
				['style',styleRule],
				'style','font-family:resource-'+resource.id
			],
			'data','data:text/html;base64,'+btoa('<!doctype html><style>'+ styleRule +'</style><div contenteditable="true" style="font-size:64px;margin:0;font-family:resource-'+resource.id+';">The quick brown fox jumps over the lazy dog 0123456789'),
			'class','resource-detail-font'
		]);
	},

	flash:function(resource)
	{
		return(
		['object',
			['div',
				'Type not supported'
			],
			'type','resource.mimeType',
			'data',resource.data.content.stringData,
			'class','resource-detail-flash'
		]);
	},

	image:function(resource)
	{
		return (
		['img',
			'src',resource.data.content.stringData,
			'class','resource-detail-image'
		]);
	}
}
