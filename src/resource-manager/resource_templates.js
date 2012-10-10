window.templates = window.templates || {};

templates.resource_tree =
{
	URL_MATCH_CONTEXT_SIZE: 10,
	DEPTH_IDENTATION: 18,
	DISTINGUISHER_MAX_LENGTH: 64,

	_get_short_distinguisher:function( url )
	{
		var name = url.filename || url.short_distinguisher || url;
		if (name.length>this.DISTINGUISHER_MAX_LENGTH)
			name = name.slice(0, this.DISTINGUISHER_MAX_LENGTH)+'…';
		return name;
	},

	_expander_extras:function(context, pivotID, depth)
	{
		var hash = context.collapsed;

		//	expand all pivots when searching
		if (context.searchTerm != '')
			hash[pivotID] = false;

		var collapsed = hash[pivotID];

		var tpl = {};

		tpl.h2 = ['handler', 'resources-expand-collapse'];
		tpl.li =
		[
			'data-expand-collapse-id', pivotID,
			'class', 'resource-tree-expand-collapse'+(collapsed?' close':'')
		];
		tpl.button =
		[
			'input',
			'type','button',
			'class','button-expand-collapse'
		];

		if(depth)
			tpl.button.push('style', 'margin-left:'+ depth*this.DEPTH_IDENTATION +'px;');


		return { collapsed:collapsed, tpl:tpl };
	},

	update:function(context)
	{
		context.visibleResources = [];
		return this.windows(context);
	},

	windows:function(context)
	{
		var tpl =
			['div',
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

		var extras = this._expander_extras( context, String(w.id) );

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
			if (context.searchTerm != '' && !r.url.contains(context.searchTerm))
				return false;

			return documentResources.contains(r.uid);
		});

		var depth = d.depth;
		var extras = this._expander_extras( context, d.pivotID, depth );

		var tpl =
			['li',
				['h2',
					extras.tpl.button,
					['span',
						this._get_short_distinguisher(d.url),
						'class','resource-tree-document-label',
						'data-tooltip','js-script-select',
						'data-tooltip-text',d.original_url
					],
					' ',
					d.sameOrigin?[]:['span',d.url.host,'class','resource-domain'],
					' ',
					['span',
						String(resources.length),
						'class','resource-tree-count'
					],
					'class','resource-tree-document',
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
		var tpl = context.groupOrder
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

		var depth = d.depth+1;
		var extras = this._expander_extras( context, d.pivotID+'_'+g, depth);

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
						String(resources.length),
						'class','resource-tree-count'
					],
					'class','resource-tree-group resource-tree-group-'+g.toLowerCase()
				].concat( extras.tpl.h2 ),
				extras.collapsed?[]:this.resources(context, resources, depth+1)
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
		var search = context.searchTerm;
		var partial_URL_match = '';
		if (search != '')
		{
			var pos_first = r.url.indexOf(search)-this.URL_MATCH_CONTEXT_SIZE;
			var pos_last = r.url.lastIndexOf(search)+this.URL_MATCH_CONTEXT_SIZE+search.length;

			partial_URL_match = (pos_first>0?'…':'')+r.url.substring( pos_first, pos_last)+(pos_last<r.url.length?'…':'');
		}

		context.visibleResources.push(r.uid);

		var tpl =
			['li',
				['h2',
					['span',
						partial_URL_match||this._get_short_distinguisher(r),
						'class','resource-tree-resource-label',
						'style', 'margin-left:'+ (1+depth)*this.DEPTH_IDENTATION +'px;',
						'data-tooltip','js-script-select',
						'data-tooltip-text',r.url
					],
					' ',
					r.sameOrigin?[]:['span',r.host,'class','resource-domain'],

					'handler','resource-detail',
					'data-resource-uid',String(r.uid),
					'class','resource-tree-resource'
						+(context.selectedResourceUID==r.uid?' resource-highlight':'')
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
			'class','resource-detail-container'
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
					resource.url,
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
				+(info.characterEncoding&&' '+ui_strings.S_RESOURCE_ENCODING.replace('%s',info.characterEncoding)),
				'class','resource-detail-overview-type'+(isError?' resource-detail-error':'')
			],
			['span',
				cls.ResourceUtil.bytes_to_human_readable(info.size)
				+(resource.data.meta?' ('+resource.data.meta+')':''),
				'data-tooltip','js-script-select',
				'data-tooltip-text',info.size+' bytes',
				'class','resource-detail-overview-size'
			],
			'class','resource-detail-overview'
		]);
	},

	text:function(resource)
	{
		var data = resource.data.content.stringData;
		var pos = data.indexOf(',');
		var base64 = data.lastIndexOf(';base64',pos)!=-1;

		return ['pre',base64?atob(data.slice(pos+1)):data.slice(pos+1)];
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
