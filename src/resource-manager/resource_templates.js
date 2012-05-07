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
			templates.resource_tree_frame( context, null ),
			'style','background:white;overflow:auto;height:100%;'
	);
	return tpl;
};

templates.resource_tree_frame = function(context, parentFrameID)
{
	var tpl = [];
	for (var frameID in context.frames)
	{
		var frame = context.frames[frameID];
		if( frame.parentFrameID != parentFrameID ){ continue; }
		
		var r = context.get_resource( frame.resourceID );
		var className = 'expand-collapse'+(frame.closed?' close':'');
//		console.log( JSON.stringify(frame) );
		var tmp = 
		{
			'time':frame.time||0,
			'tpl':
			[
				'div',
				[	// heading expand-collapse
					['input','type','button','handler','resources-expand-collapse','class','button-'+className],
					['span', 'class', 'resource-icon resource-type-storage'],
					['span',' '+((r?r.url.filename||r.human_url:'')||'resource information not fully available yet'),[],
					'data-tooltip',(r&&'js-script-select'),
					'data-tooltip-text',(r&&'frame: '+r.human_url)
					]
//					'class','resource-fraem'// expand-collapse-open',
				],
				[	// resources groups & frames
					'ul',
					[].concat
					(
						templates.resource_groups( context, frameID ),
						templates.resource_tree_frame( context, frameID )
					).map(function(v){ return['li',[v]]; })
				],
				'data-frame-id',frameID,
				'class',className
			]
		};
		tpl.push( tmp );
	}
	return tpl.sort(function(a,b){ return a.time-b.time; }).map(function(v){ return v.tpl; });
};

templates.resource_groups = function(context, frameID, depth)
{
//	return [['div','groups of the frame '+frameID]];
	var tpl = [];
	var frame = context.frames[frameID];
	var groups = frame.groups;
	for (var groupName in groups)
	{
		var group = groups[groupName];
		var count = group.ids.length;
		if( !count ){ continue; }

		var className = 'expand-collapse'+(group.closed?' close':'');
		tpl.push
		([
			'div',
			[
				['input','type','button','handler','resources-expand-collapse','class','button-'+className],
				templates.resource_icon({type:groupName}),
				['span',' '+ group.name +' ('+ count +')',[],
				//'style',indent+'white-space:nowrap;background:rgba(0,255,0,.1);',
				'class','resource-group']
			],
			[	// resources 
				'ul',
				templates.resource_group(context, frameID, groupName),
				'class','resources'
			],
			'data-frame-id',frameID,
			'data-resource-group',groupName,
			'class',className
		]);
	}
	return tpl;
};

templates.resource_group = function(context, frameID, groupName)
{
//	return ['div','groups of the frame '+frameID];

	var frame = context.frames[frameID];
	var group = frame.groups[groupName];

	
	return group.ids.map
	(
		function(v)
		{
			var r=context.get_resource(v);
			var tmp =
			[
				'li',
				[
					'span',
					(r.url.filename||r.human_url||'resource information not fully available yet'),
					[],
					'handler','resource-detail',
					'data-tooltip',(r&&'js-script-select'),
					'data-tooltip-text',(r&&groupName+': '+r.human_url)
				],
					'data-resource-id',(''+r.id)
				
			];

			return tmp;
		}
	);
};