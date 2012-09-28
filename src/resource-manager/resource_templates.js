window.templates = window.templates || {};

templates.resource_icon = function(resource)
{
  return ["span", "class", "resource-icon resource-type-" + resource.type];
};

templates.resource_tree =
{
	_groupOrder:
	[
		ui_strings.S_HTTP_LABEL_FILTER_MARKUP,
		ui_strings.S_HTTP_LABEL_FILTER_STYLESHEETS,
		ui_strings.S_HTTP_LABEL_FILTER_SCRIPTS,
		ui_strings.S_HTTP_LABEL_FILTER_IMAGES,
		ui_strings.S_HTTP_LABEL_FILTER_FONTS,
		ui_strings.S_HTTP_LABEL_FILTER_OTHER
	],

	_expandCollapseExtras:function(context, pivotID, depth)
	{
		var hash = context.collapsed;
		if (!hash.hasOwnProperty(pivotID))
			hash[pivotID] = depth>1;

		var collapsed = hash[pivotID];

		return ({
			collapsed:false&&collapsed,
			tpl:
			{
				li:
				[
					'data-expand-collapse-id', pivotID,
					'class', 'resource-tree-expand-collapse'+(collapsed?' close':'')
				],
				h2:
				[
					'handler','resources-expand-collapse'
				],
				button:
				[
					'input',
					'type','button',
					'class','button-expand-collapse',
					'style', 'margin-left:'+ depth*18 +'px;'
				]
			}
		});
	},

	update:function(context)
	{
		return this.windows(context);
	},

	windows:function(context)
	{
		var tpl =
			['div','',
				['ul',
					context.windowList.map(this.window.bind(this, context)),
					'class','resource-tree-windows'
				],
				'class','resource-tree'
			];

		return tpl;
	},

	window:function(context, w)
	{
		var windowInfo = window.window_manager_data.get_window(w.id);
		if (!windowInfo)
			return [];

		var extras = this._expandCollapseExtras( context, String(w.id) );

		var tpl =
			['li',
				['h2',
					extras.tpl.button,
					['span',
						windowInfo.title,
						'class','resource-tree-window-label'
					],
					'class','resource-tree-window'
				].concat( extras.tpl.h2 ),
				extras.collapsed?[]:this.documents(context, w.id)
			].concat( extras.tpl.li );

		return tpl;
	},

	documents:function(context, wid, pid)
	{
		var documents = context.documentList.
		filter(function(d){
			return d.documentID != null && d.windowID == wid && d.parentDocumentID == pid;
		});

		var tpl = documents.length?
			['ul',
				documents.map( this.document.bind(this, context) ),
				'class','resource-tree-documents'
			]:[];

		return tpl;
	},

	document:function(context, d)
	{
		var documentResources = context.documentResources[d.documentID]||[];
		var resources = context.resourceList
		.filter(function(r){
			return documentResources.contains(r.id);
		});

		var depth = d.depth;
		var extras = this._expandCollapseExtras( context, d.pivotID, depth );

		var tpl =
			['li',
				['h2',
					extras.tpl.button,
					['span',
						(d.url.filename || d.url.short_distinguisher),
						'class','resource-tree-document-label'
					],
					' ',
					['span',
						'('+resources.length+')',
						'class','resource-tree-count'
					],
					'class','resource-tree-document'+(d.sameOrigin?'':' resource-different-origin')
				].concat( extras.tpl.h2 ),
				( resources.length == 0 || extras.collapsed )?[]:
				[
					this.resource_groups(context, resources, d),
					this.documents(context, d.windowID, d.documentID)
				]
			].concat( extras.tpl.li );

		return tpl;

	},

	resource_groups:function(context, resources, d)
	{
		var tpl = this._groupOrder
		.map( this.resource_group.bind(this, context, resources, d) )
		.filter(function(v){
			return v!=null;
		});

		return tpl.length?
			['ul',
				tpl,
				'class','resource-tree-groups'
			]:[];
	},

	resource_group:function(context, resources_unfiltered, d, g)
	{
		var resources = resources_unfiltered
		.filter( function(r){
			return r.group == g;
		})
		.sort( function(a, b){
			return a.id-b.id;
		});

		if (!resources.length)
			return [];

		var extras = this._expandCollapseExtras( context, d.pivotID+'_'+g, d.depth+1);

		var tpl =
			['li',
				['h2',
					extras.tpl.button,
					['span',
						g,
						'class','resource-tree-group-label'
					],
					' ',
					['span',
						'('+resources.length+')',
						'class','resource-tree-count'
					],
					'class','resource-tree-group resource-tree-group-'+g.toLowerCase()
				].concat( extras.tpl.h2 ),
				extras.collapsed?[]:this.resources(context, resources, d.depth+2)
			].concat( extras.tpl.li );

		return tpl;
	},

	resources:function(context, resources,depth)
	{
		var tpl =
			['ul',
				resources.map(this.resource.bind(this, context, depth)),
				'class','resource-tree-resources'
			];

		return tpl;
	},

	resource:function(context, depth, r)
	{
		var tpl =
			['li',
				['h2',
					['span',
						(r.filename || r.short_distinguisher || r.url || 'NO URL'),
						'class','resource-tree-resource-label',
						'style', 'margin-left:'+ depth*18 +'px;'
					],
					'handler','resource-detail',
					'data-resource-id',String(r.id),
					'class','resource-tree-resource'
						+(r.sameOrigin?'':' resource-different-origin')
						+(context.selectedResourceID==r.id?' resource-highlight':'')
				]
			];

		return tpl;
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
      ui_strings.S_RESOURCE_NO_RESOURCE_SELECTED,
      'class','resource-detail-container-empty'
    ]);
	},

	no_data_available:function(resource)
	{
		return(
		['div',
      ui_strings.S_RESOURCE_NO_DATA_AVAILABLE,
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
			ui_strings.S_RESOURCE_FORMATTING_RESOURCE,
			'class','resource-detail-container-empty'
    ]);
	},

	overview:function(resource)
	{
		var info =
		{
			'humanUrl':resource.short_distinguisher,
			'responseCode':resource.responsecode+' '+cls.ResourceUtil.http_status_codes[resource.responsecode],
			'type':resource.type,
			'mimeType':resource.data.mimeType,
			'size':resource.size||resource.data.contentLength||resource.data.content.length,
			'characterEncoding':resource.encoding||resource.data.characterEncoding
		};

		var isError = resource.responsecode && ![200,304].contains(resource.responsecode);

		return (
		['div',
			['span',
				[
					'a',
					info.humanUrl,
					'href',resource.url,
					'target','_blank',
					'class','external'
				],
				'class','resource-detail-overview-url'
			],
			['span',
				(isError?info.responseCode+' - ':'')+
				ui_strings.S_RESOURCE_SENT_AND_GUESSED_TYPE
				.replace('%(SENT)',info.mimeType)
				.replace('%(GUESSED)',info.type)
				+(resource.data.meta?' ('+resource.data.meta+')':''),
				'class','resource-detail-overview-type'+(isError?' resource-detail-error':'')
			],
			['span',
				cls.ResourceUtil.bytes_to_human_readable(info.size)
				+(info.characterEncoding&&ui_strings.S_RESOURCE_ENCODING.replace('%s',info.characterEncoding)),
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
		['pre',resource.data.content.stringData
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
