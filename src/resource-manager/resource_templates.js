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

	this._expander_extras = function(context, pivot_id, depth)
	{
		var collapsed = context.collapsed[pivot_id];

		var tpl = {};

		tpl.h2 = ["handler", "resources-expand-collapse"];
		tpl.li = ["data-expand-collapse-id", pivot_id];
		tpl.button =
		[
			"input",
			"type", "button",
			"class", "button-expand-collapse" + (collapsed ? "-close" : "")
		];

		if (depth)
			tpl.button.push("style", "margin-left:" + depth * DEPTH_IDENTATION + "px;");

		return {collapsed: collapsed, tpl: tpl};
	};

	this.update = function(context)
	{
		this.flat_list = [];

		// expand all the pivots if there is a search_term
		if (context.search_term != "")
			Object.keys(context.collapsed).forEach(function(v) { context.collapsed[v] = false; });

		// filter the list of resources, set their is_visible flag and push the ones matching
		context.resources = [];
		context.resource_list.forEach(function(r) {
			var matches = (context.search_term == "" || r.url.contains(context.search_term));
			r.is_visible = matches && !context.collapsed[r.pivot_id]

			if (matches)
				context.resources.push(r);
		});

		this.windows(context);
		var tpl = ["div", ["ul", this.flat_list], "class", "resource-tree"];
		delete this.flat_list;
		return tpl;
	};

	this.windows = function(context)
	{
		context.window_list.forEach(this.window.bind(this, context));
	};

	this.window = function(context, w)
	{
		var window_info = window.window_manager_data.get_window(w.id);
		if (!window_info)
			return [];

		var extras = this._expander_extras(context, String(w.id));

		this.flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						window_info.title,
						"class", "resource-tree-window-label"
					]
				].concat(extras.tpl.h2),
			].concat(extras.tpl.li)
		);

		if (!extras.collapsed)
			this.documents(context, w.id);
	};

	this.documents = function(context, wid, pid)
	{
		context.document_list.forEach(function(d) {
			if (d.windowID == wid && d.parentDocumentID == pid)
				this.document(context, d);
		}, this);
	};

	this.document = function(context, d)
	{
		var document_resources = context.document_resources[d.documentID] || [];
		var resources = context.resources.filter(function(r) {
			return document_resources.contains(r.uid);
		});

		if (resources.length > 0)
		{
			var depth = d.depth;
			var extras = this._expander_extras(context, d.pivot_id, depth);

			this.flat_list.push(
				["li",
					["h2",
						extras.tpl.button,
						["span",
							this._get_short_distinguisher(d.url),
							"class", "resource-tree-document-label",
							"data-tooltip", " js-script-select",
							"data-tooltip-text", d.original_url
						],
						" ",
						d.same_origin ? [] : ["span", d.url.host, "class", "resource-domain"],
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
		}
	};

	this.resource_groups = function(context, resources, d)
	{
		context.group_order.forEach(this.resource_group.bind(this, context, resources, d));
	};

	this.resource_group = function(context, resources, d, g)
	{
		var resources = resources.filter(function(r) {
			return r.group == g;
		});

		if (!resources.length)
			return;

		var depth = d.depth + 1;
		var extras = this._expander_extras(context, d.pivot_id + "_" + g, depth);

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
			this.resources(context, resources, depth + 1);
	};

	this.resources = function(context, resources, depth)
	{
		resources.forEach(this.resource.bind(this, context, depth));
	};

	this.resource = function(context, depth, r)
	{
		var search = context.search_term;
		var partial_url_match = "";
		if (search != "")
		{
			var pos_first = r.url.indexOf(search) - URL_MATCH_CONTEXT_SIZE;
			var pos_last = r.url.lastIndexOf(search) + URL_MATCH_CONTEXT_SIZE + search.length;
			var preffix = pos_first > 0 ? "…" : "";
			var suffix = pos_last < r.url.length ? "…" : "";

			partial_url_match = preffix + r.url.substring(pos_first, pos_last) + suffix;
		}

		this.flat_list.push(
			["li",
				["h2",
					["span",
						partial_url_match || this._get_short_distinguisher(r),
						"class", "resource-tree-resource-label",
						"style", "margin-left:" + (1 + depth) * DEPTH_IDENTATION + "px;",
						"data-tooltip", "js-script-select",
						"data-tooltip-text", r.url
					],
					" ",
					r.same_origin ? [] : ["span", r.host, "class", "resource-domain"],
					"class", "resource-tree-resource"
				],
				"class", (context.selected_resource_uid == r.uid ? "resource-highlight" : ""),
				"handler", "resource-detail",
				"data-resource-uid", String(r.uid)
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

		var specific_template = this[resource.type] ? resource.type : "text";

		return(
		["div",
			this.overview(resource),
			["div",
				this[specific_template](resource, resource.data),
				"class", "resource-detail-" + specific_template + "-container"
			],
			"class", "resource-detail-container"
		]);
	};

	this.no_resource_selected = function()
	{
		return(
		["div",
      ui_strings.S_RESOURCE_NO_RESOURCE_SELECTED,
      "class", "resource-detail-container-empty"
    ]);
	};

	this.no_data_available = function(resource)
	{
		return(
		["div",
      ui_strings.S_RESOURCE_NO_DATA_AVAILABLE,
      "class", "resource-detail-container-empty"
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
			"class", "resource-detail-container-empty"
    ]);
	};

	this.overview = function(resource)
	{
		var info =
		{
			"response_code": resource.responsecode + " " + cls.ResourceUtil.http_status_codes[resource.responsecode],
			"size": resource.size || resource.data.contentLength || resource.data.content.length,
			"character_encoding": resource.encoding || resource.data.characterEncoding
		};

		var is_error = resource.responsecode && ![200, 304].contains(resource.responsecode);

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
				(is_error ? info.response_code + " - " : "") +
				ui_strings.S_RESOURCE_SENT_AND_GUESSED_TYPE
					.replace("%(SENT)s", resource.data.mimeType)
					.replace("%(GUESSED)s", resource.type) +
				(info.character_encoding && " " + ui_strings.S_RESOURCE_ENCODING.replace("%s", info.character_encoding)),
				"class", "resource-detail-overview-type" + (is_error ? " resource-detail-error" : "")
			],
			["span",
				cls.ResourceUtil.bytes_to_human_readable(info.size) +
				(resource.data.meta ? " (" + resource.data.meta + ")" : ""),
				"data-tooltip", "js-script-select",
				"data-tooltip-text", info.size + " " + ui_strings.S_BYTES_UNIT,
				"class", "resource-detail-overview-size"
			],
			"class", "resource-detail-overview"
		]);
	};

	this.text = function(resource)
	{
		var data = resource.data.content.stringData;
		var pos = data.indexOf(",");
		var is_base64 = data.lastIndexOf(";base64", pos) != -1;

		return ["pre", is_base64 ? atob(data.slice(pos + 1)) : data.slice(pos + 1)];
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
		var font_family_name = "font" + resource.uid;
		var style_sheet = "@font-face { font-family: \"" + font_family_name  + "\";" +
										  "src: url(\"" + resource.data.content.stringData + "\"); }";
		var inline_style = "font-size: 64px; font-family: " + font_family_name + ";" +
											 "white-space: pre; word-break: break-all; " +
											 "word-wrap: break-word; overflow-wrap: break-word;";
		var sample_string = "The quick brown fox jumps over the lazy dog 0123456789";

		return(
		["object",
			["div",
				sample_string,
				["style", style_sheet],
				"style", inline_style,
			],
			"data", "data:text/html;base64," +
						  btoa("<!doctype html><style>" + style_sheet + "</style>" +
						  "<div contenteditable=\"true\" style=\"" + inline_style + "\">" + sample_string),
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
			"type", resource.mimeType,
			"data", resource.data.content.stringData,
			"class", "resource-detail-flash"
		]);
	};

	this.image = function(resource)
	{
		return (
		["img",
			"src", resource.data.content.stringData,
			"class", "resource-detail-image"
		]);
	};
});
