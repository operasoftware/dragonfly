window.templates = window.templates || {};

templates.resource_icon = function(resource)
{
  return ["span", "class", "resource-icon resource-type-" + resource.type];
};

templates.resource_tree =
{
	update:function(context)
	{
		return (
		['ul',
			this.frame( context, null ),
			'style','overflow:auto;height:100%;'
		]);
	},

	frame:function(context, parentFrameID)
	{
		var tpl = [];

		for (var frameID in context.frames)
		{
			var frame = context.frames[frameID];
			if( frame.parentFrameID != parentFrameID ){ continue; }
			
			var r = context.get_resource( frame.resourceID );
			var className = '-expand-collapse';
			var tmp = 
			{
				'time':frame.time||0,
				'tpl':
				[
					'li',
					[	// heading expand-collapse
						'div',
						['input','type','button','class','button'+className],
						['span', 'class', 'resource-icon resource-type-storage'],
						' ',
						[
							'span',
							((r?r.url.filename||r.human_url:'')||'resource information not fully available yet'),
							[],
							'data-tooltip',(r&&'js-script-select'),
							'data-tooltip-text',(r&&'frame: '+r.human_url)
						],
						'handler','resources-expand-collapse',
						'class','header'+className
					],
					[	// resources groups & frames
						'ul',
						this.groups( context, frameID ),
						this.frame( context, frameID ),
						'class','children'+className
					],
					'data-frame-id',frameID,
					'class','item'+className+(frame.closed?' collapsed':'')
				]
			};
			tpl.push( tmp );
		}
		return tpl.sort(function(a,b){ return a.time-b.time; }).map(function(v){ return v.tpl; });
	},

	groups:function(context, frameID)
	{
		var tpl = [];
		var frame = context.frames[frameID];
		var groups = frame.groups;

		var triggers =
		{
			'image':
			[
				'span',
				'**gallery**',
				[],
				'title','Gallery',
				'handler','resource-group',
				'class','resource-group-trigger resource-group-images-trigger'
			]
		}

		for (var groupName in groups)
		{
			var group = groups[groupName];
			var count = group.ids.length;
			if( !count ){ continue; }

			var className = '-expand-collapse';
			tpl.push
			([
				'li',
				[	// heading expand-collapse
					'div',
					['input','type','button','class','button'+className],
					templates.resource_icon({type:groupName}),
					' ',
					[
						'span',
						group.name +' ('+ count +')',[],'class','resource-group'
					],
					(triggers[groupName]?triggers[groupName]:[]),
					'handler','resources-expand-collapse',
					'class','header'+className
				],
				[	// resources 
					'ul',
					this.group_resources(context, frameID, groupName),
					'class','children'+className
				],
				'data-frame-id',frameID,
				'data-resource-group',groupName,
				'class','item'+className+(group.closed?' collapsed':'')
			]);
		}
		return tpl;
	},

	group_resources:function(context, frameID, groupName)
	{
		var frame = context.frames[frameID];
		var group = frame.groups[groupName];
		var className = '-expand-collapse';
		
		return group.ids.map
		(
			function(v)
			{
				var r=context.get_resource(v);
				return (
				['li',
					[
						'span',
						(r.url.filename||r.human_url||'resource information not fully available yet'),
						[],
						'data-tooltip',(r&&'js-script-select'),
						'data-tooltip-text',(r&&groupName+': '+r.human_url)
					],
					'class','header'+className,
					'handler','resource-detail',
					'data-resource-id',(''+r.id)
				]);
			}
		);
	}
};

templates.resource_detail =
{
	update:function(resource, resourceData)
	{
		var specificTemplate = this[resource.type]?resource.type:'text';

		return(
		['div',
			this.overview(resource, resourceData),	// overview
			['div',	// specific template
				this[specificTemplate](resource, resource.data),		
				'title',specificTemplate,
				'class','resource-detail-'+ specificTemplate +'-container'
			],
			'class','resource-detail-container',
			'style','height:100%;overflow:auto;'
		]);
	},

	overview:function(resource, resourceData)
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
				info.human_url,
				'class','resource-detail-overview-url'
			],
			['span',
				info.mimeType+' treated as '+info.type,
				'class','resource-detail-overview-type'
			],
			['span',
				info.size+' bytes'+(info.characterEncoding&&(' in '+info.characterEncoding)),
				'class','resource-detail-overview-size'
			],
			'class','resource-detail-overview'
		]);
	},

	text:function(resource, resourceData)
	{
		this.name = 'text';
		return (
		[
			['pre',resource.data.content.stringData],
			['p',new Option(JSON.stringify(resource)).innerHTML],
			['p',new Option(JSON.stringify(resource.data)).innerHTML]
		]);
	},

	markup:function(resource, resourceData)
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

	script:function(resource, resourceData)
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

	css:function(resource, resourceData)
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

	font:function(resource, resourceData)
	{
		this.name = 'font';

		var styleRule = '@font-face{font-family:"resource-'+resource.id+'";src:url("'+resource.data.content.stringData+'");}';

		return(
		['object',
			['div',
				'The quick brown fox jumps over the lazy dog 0123456789',
				['style',styleRule],
				'style','font-family:resource-'+resource.id
			],
			'data','data:text/html;base64,'+btoa('<!doctype html><style>'+ styleRule +'</style><div contenteditable="true" style="font-size:3em;margin:0;font-family:resource-'+resource.id+';">The quick brown fox jumps over the lazy dog 0123456789'),
			'class','resource-detail-font'
		]);
	},

	image:function(resource, resourceData)
	{
		this.name = 'image';
		return (
		['img',
			'src',resource.data.content.stringData,
			'class','resource-detail-image'
		]);
	}
}
