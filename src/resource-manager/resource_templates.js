"use strict";

window.templates = window.templates || {};

window.templates.resource_tree || (window.templates.resource_tree = new function()
{
	var URL_MATCH_CONTEXT_SIZE = 10;
	var DEPTH_IDENTATION = 18;
	var DISTINGUISHER_MAX_LENGTH = 64;

	this._get_short_distinguisher = function(url)
	{
		var name = url.filename || url.short_distinguisher || url;

		if (name.length > this.DISTINGUISHER_MAX_LENGTH)
			name = name.slice(0, this.DISTINGUISHER_MAX_LENGTH) + "…";

		return name;
	};

	this._expander_extras = function(context, pivotID, depth)
	{
		var hash = context.collapsed;

		//	expand all pivots when searching
		if (context.searchTerm != "")
			hash[pivotID] = false;

		var collapsed = hash[pivotID];

		var tpl = {};

		tpl.h2 = ["handler", "resources-expand-collapse"];
		tpl.li =
		[
			"data-expand-collapse-id", pivotID
		];
		tpl.button =
		[
			"input",
			"type","button",
			"class","button-expand-collapse"+(collapsed ? "-close" : "")
		];

		if (depth)
			tpl.button.push("style", "margin-left:" + depth * DEPTH_IDENTATION + "px;");

		return {collapsed:collapsed, tpl:tpl};
	};

	this.update = function(context)
	{
		this.flat_list = [];
		context.visibleResources = [];
		this.windows(context);
		var tpl = ["div", ["ul", this.flat_list], "class", "resource-tree"];
		delete this.flat_list;
		return tpl;
	};

	this.windows = function(context)
	{
		context.windowList.forEach(this.window.bind(this, context));
	};

	this.window = function(context, w)
	{
		var windowInfo = window.window_manager_data.get_window(w.id);
		if (!windowInfo)
			return [];

		var extras = this._expander_extras(context, String(w.id));

		this.flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						windowInfo.title,
						"class","resource-tree-window-label"
					]
				].concat(extras.tpl.h2),
			].concat(extras.tpl.li)
		);

		if (!extras.collapsed)
			this.documents(context, w.id);
	};

	this.documents = function(context, wid, pid)
	{
		context.documentList.filter(function(d) {
				return d.documentID != null && d.windowID == wid && d.parentDocumentID == pid;
			}).forEach(
				this.document.bind(this, context)
			);
	};

	this.document = function(context, d)
	{
		var documentResources = context.documentResources[d.documentID] || [];
		var resources = context.resourceList.filter(function(r) {
				if (context.searchTerm != "" && !r.url.contains(context.searchTerm))
					return false;

				return documentResources.contains(r.uid);
			});

		var depth = d.depth;
		var extras = this._expander_extras(context, d.pivotID, depth);

		this.flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						this._get_short_distinguisher(d.url),
						"class", "resource-tree-document-label",
						"data-tooltip"," js-script-select",
						"data-tooltip-text", d.original_url
					],
					" ",
					d.sameOrigin ? [] : ["span", d.url.host, "class", "resource-domain"],
					" ",
					["span",
						String(resources.length),
						"class", "resource-tree-count"
					]
				].concat(extras.tpl.h2),
			].concat(extras.tpl.li)
		);

		if (!extras.collapsed )
		{
			if (resources.length)
				this.resource_groups(context, resources, d);

			this.documents(context, d.windowID, d.documentID);
		}
	};

	this.resource_groups = function(context, resources, d)
	{
		context.group_order.forEach(this.resource_group.bind(this, context, resources, d));
	};

	this.resource_group = function(context, resources_unfiltered, d, g)
	{
		var resources = resources_unfiltered.filter(function(r) {
			return r.group == g;
		});

		if (!resources.length)
			return;

		var depth = d.depth + 1;
		var extras = this._expander_extras(context, d.pivotID + "_" + g, depth);

		this.flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						g,
						"class", "resource-tree-group-" + g.toLowerCase() + "-label"
					],
					" ",
					["span",
						String(resources.length),
						"class", "resource-tree-count"
					],
					"class", "resource-tree-group resource-tree-group-" + g.toLowerCase()
				].concat(extras.tpl.h2),
			].concat(extras.tpl.li)
		);

		if (!extras.collapsed)
			this.resources(context, resources, depth+1);
	};

	this.resources = function(context, resources,depth)
	{
		resources.forEach(this.resource.bind(this, context, depth));
	};

	this.resource = function(context, depth, r)
	{
		var search = context.searchTerm;
		var partial_URL_match = "";
		if (search != "")
		{
			var pos_first = r.url.indexOf(search) - this.URL_MATCH_CONTEXT_SIZE;
			var pos_last = r.url.lastIndexOf(search) + this.URL_MATCH_CONTEXT_SIZE + search.length;

			partial_URL_match = (pos_first > 0 ? "…" : "") + r.url.substring(pos_first, pos_last) + (pos_last < r.url.length ? "…" : "");
		}

		context.visibleResources.push(r.uid);

		this.flat_list.push(
			["li",
				["h2",
					["span",
						partial_URL_match || this._get_short_distinguisher(r),
						"class", "resource-tree-resource-label",
						"style", "margin-left:" + (1 + depth) * DEPTH_IDENTATION + "px;",
						"data-tooltip", "js-script-select",
						"data-tooltip-text", r.url
					],
					" ",
					r.sameOrigin ? [] : ["span", r.host, "class", "resource-domain"],

					"handler", "resource-detail",
					"data-resource-uid", String(r.uid),
					"class", "resource-tree-resource" + (context.selectedResourceUID == r.uid ?" resource-highlight" : "")
				]
			]
		);
	};
});



window.templates.resource_detail || (window.templates.resource_detail = new function()
{
	this.update = function(resource)
	{
		if (!resource)
			return this.no_resource_selected();

		if (!resource.data)
			return this.no_data_available(resource);

		var specificTemplate = this[resource.type]?resource.type:"text";

		return(
		["div",
			this.overview(resource),	// overview
			["div",	// specific template
				this[specificTemplate](resource, resource.data),
				"class","resource-detail-"+ specificTemplate +"-container"
			],
			"class","resource-detail-container"
		]);
	};

	this.no_resource_selected = function()
	{
		return(
		["div",
      ui_strings.S_RESOURCE_NO_RESOURCE_SELECTED,
      "class","resource-detail-container-empty"
    ]);
	};

	this.no_data_available = function(resource)
	{
		return(
		["div",
      ui_strings.S_RESOURCE_NO_DATA_AVAILABLE,
      "class","resource-detail-container-empty"
    ]);
	};

	this.formatting_data = function(resource)
	{
		if (!resource)
			return this.no_resource_selected();

		if (!resource.data)
			return this.no_data_available(resource);

		return(
		["div",
			ui_strings.S_RESOURCE_FORMATTING_RESOURCE,
			"class","resource-detail-container-empty"
    ]);
	};

	this.overview = function(resource)
	{
		var info =
		{
			"responseCode": resource.responsecode + " " + cls.ResourceUtil.http_status_codes[resource.responsecode],
			"size": resource.size || resource.data.contentLength || resource.data.content.length,
			"characterEncoding": resource.encoding || resource.data.characterEncoding
		};

		var isError = resource.responsecode && ![200, 304].contains(resource.responsecode);

		return (
		["div",
			["span",
				[
					"a",
					resource.url,
					"href", resource.url,
					"target", "_blank",
					"class", "external"
				],
				"class", "resource-detail-overview-url"
			],
			["span",
				(isError ? info.responseCode + " - " : "")+
				ui_strings.S_RESOURCE_SENT_AND_GUESSED_TYPE
				.replace("%(SENT)s", resource.data.mimeType)
				.replace("%(GUESSED)s", resource.type)
				+(info.characterEncoding && " " + ui_strings.S_RESOURCE_ENCODING.replace("%s", info.characterEncoding)),
				"class", "resource-detail-overview-type" + (isError ? " resource-detail-error" : "")
			],
			["span",
				cls.ResourceUtil.bytes_to_human_readable(info.size)
				+(resource.data.meta ? " (" + resource.data.meta + ")" : ""),
				"data-tooltip", "js-script-select",
				"data-tooltip-text", info.size + " bytes",
				"class", "resource-detail-overview-size"
			],
			"class", "resource-detail-overview"
		]);
	};

	this.text = function(resource)
	{
		var data = resource.data.content.stringData;
		var pos = data.indexOf(",");
		var base64 = data.lastIndexOf(";base64", pos) != -1;

		return ["pre", base64?atob(data.slice(pos + 1)) : data.slice(pos + 1)];
	};

	this.markup = function(resource)
	{
		var line_count = 0;
		var lines = [++line_count];
		var source = templates.highlight_markup(resource.data.content.stringData, function() { lines.push(++line_count); });

		return (
		["div",
			source,
			["div", lines.join("\n"), "class", "resource-line-numbers", "unselectable", "on"],
			"class", "resource-detail-markup mono line-numbered-resource"
		]);
	};

	this.script = function(resource)
	{
		var line_count = 0;
		var lines = [++line_count];
		var source = templates.highlight_js_source(resource.data.content.stringData, function() { lines.push(++line_count); });

		return (
		["div",
			source,
			["div", lines.join("\n"), "class", "resource-line-numbers", "unselectable", "on"],
			"class", "resource-detail-script mono line-numbered-resource"
		]);
	};

	this.css = function(resource)
	{
		var line_count = 0;
		var lines = [++line_count];
		var source = templates.highlight_css(resource.data.content.stringData, function() { lines.push(++line_count); });

		return (
		["div",
			source,
			["div", lines.join("\n"), "class", "resource-line-numbers", "unselectable", "on"],
			"class", "resource-detail-css mono line-numbered-resource"
		]);
	};

	this.font = function(resource)
	{
		var styleRule = "@font-face{font-family:\"resource-" + resource.id + "\";src:url(\"" + resource.data.content.stringData + "\");}";

		return(
		["object",
			["div",
				"The quick brown fox jumps over the lazy dog 0123456789",
				["style", styleRule],
				"style", "font-family:resource-" + resource.id
			],
			"data", "data:text/html;base64," + btoa("<!doctype html><style>" + styleRule + "</style><div contenteditable=\"true\" style=\"font-size:64px;margin:0;font-family:resource-" + resource.id + ";\">The quick brown fox jumps over the lazy dog 0123456789"),
			"class", "resource-detail-font"
		]);
	};

	this.flash = function(resource)
	{
		return(
		["object",
			["div",
				"Type not supported"
			],
			"type", "resource.mimeType",
			"data", resource.data.content.stringData,
			"class", "resource-detail-flash"
		]);
	};

	this.image = function(resource)
	{
		return (
		["img",
			"src", resource.data.content.stringData,
			"class","resource-detail-image"
		]);
	};
});
