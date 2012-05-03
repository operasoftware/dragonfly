window.templates = window.templates || {};

templates.resource_icon = function(resource)
{
  return ["span", "class", "resource-icon resource-type-" + resource.type];
};

templates.resource_tree = function(context)
{
	var tpl = [];
	tpl.push
	(
		'div',
			templates.resource_tree_frame( context, null, 1 ),
			'style','background:white;overflow:auto;height:100%;'
	);
	return tpl;
};

templates.resource_tree_frame = function(context, parentFrameID, depth)
{
	var indent = cls.ResourceTestView.instance._getIndentStyle(depth);
	depth++;

	var tpl = [];
	for (var frameID in context.frames)
	{
		var frame = context.frames[frameID];
		if( frame.parentFrameID != parentFrameID ){ continue; }
		
		var r = context.get_resource( frame.resourceID );
		var closed = frame.closed;
//		console.log( JSON.stringify(frame) );
		var tmp = 
		{
			'time':frame.time||0,
			'tpl':
			[
				'div',
				[	// heading expand-collapse
					['input','type','button','handler','resources-expand-collapse','class',(closed?'close':'')],
					['span','frameID='+frameID+' -- '+(r?r.id+' ':'')+((r?r.url.filename||r.human_url:'')||'resource information not fully available yet'),[],
					'data-tooltip',r&&'js-script-select',
					'data-tooltip-text',r&&'frame: '+r.human_url]
//					'class','resource-frame'// expand-collapse-open',
				],
				[	// resources groups & frames
					'ul',
					[].concat
					(
						templates.resource_groups( context, frameID, depth ),
						templates.resource_tree_frame( context, frameID, depth )
					).map(function(v){ return['li',[v]]; })
				],
				'data-frame-id',frameID,
				'class','expand-collapse'+(closed?' close':'')
//				'style',indent
			]
		};
		tpl.push( tmp );
	}
	return tpl.sort(function(a,b){ return a.time-b.time; }).map(function(v){ return v.tpl; });
};

templates.resource_groups = function(context, frameID, depth)
{
//	return [['div','groups of the frame '+frameID]];
	var indent = cls.ResourceTestView.instance._getIndentStyle(depth);
	depth++;

	var tpl = [];
	var groups = context.frames[frameID].groups;
	for (var group in groups)
	{
		var count = Object.keys(groups[group].ids).length;
		if( !count ){ continue; }
		var closed = groups[group].closed;
		tpl.push
		([
			'div',
			[
				['input','type','button','handler','resources-expand-collapse','class',(closed?'close':'')],
				['span',group +' ('+ count +')',[],
				//'style',indent+'white-space:nowrap;background:rgba(0,255,0,.1);',
				'class','resource-group']
			],
			[	// resources 
				'ul',
				templates.resource_group(context, frameID, group, depth)
			],
			'data-frame-id',frameID,
			'data-resource-group',group,
			'class','expand-collapse'+(closed?' close':'')
//			'style',indent
		]);
	}
	return tpl;
};

templates.resource_group = function(context, frameID, group, depth)
{
//	return ['div','groups of the frame '+frameID];
	var indent = cls.ResourceTestView.instance._getIndentStyle(depth);
	depth++;

	return Object.keys(context.frames[frameID].groups[group].ids).map
	(
		function(v,i)
		{
			var r=context.get_resource(v);
			var tmp =
			[
				'li',
				[
					templates.resource_icon(r),
					[
						'span',
						'resourceID='+r.id+' -- '+(r.url.filename||r.human_url||'resource information not fully available yet'),
						[],
						'data-tooltip',r&&'js-script-select',
						'data-tooltip-text',r&&group+': '+r.human_url
					]
				],
//				'white-space:nowrap;background-color:rgba(0,0,0,'+(i&1?.1:.2)+');',
				'data-resource-id',r.id
			];

			return tmp;
		}
	);
};