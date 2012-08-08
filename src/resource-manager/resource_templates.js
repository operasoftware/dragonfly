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

			r=frame.resource;
			if(!r)
				continue;

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
							(r.filename||r.human_url),
							[],
							'class',(frame.sameOrigin!==false?'':'resource-different-origin'),
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
			//	WIP: soon there will be some triggers to display a whole group of resource, e.g. gallery of images, videos, fonts, audios, ...
//			'image':
//			[
//				'span',
//				'gallery',
//				[],
//				'title','Gallery',
//				'handler','resource-group',
//				'class','resource-group-trigger resource-group-images-trigger'
//			]
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
						(r.filename||r.human_url),
						[],
						'class',(r.sameOrigin!==false?'':'resource-different-origin'),
						'data-tooltip',(r&&'js-script-select'),
						'data-tooltip-text',(r&&groupName+': '+r.human_url)
					],
					'id',(r.selected==true?'target-element':''),
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
