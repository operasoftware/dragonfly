"use strict";

window.templates = window.templates || {};

window.templates.resource_tree || (window.templates.resource_tree = new function()
{
	var URL_MATCH_CONTEXT_SIZE = 10;
	var DEPTH_IDENTATION = 18;
	var DISTINGUISHER_MAX_LENGTH = 64;
	var flat_list;

	this._get_short_distinguisher = function(url)
	{
		var name = url.short_distinguisher || url;

		if (name.length > DISTINGUISHER_MAX_LENGTH)
			name = name.slice(0, DISTINGUISHER_MAX_LENGTH) + "…";

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
		// expand all the pivots if there is a search_term
		if (context.search_term != "")
			Object.keys(context.collapsed).forEach(function(v) { context.collapsed[v] = false; });

		// filter the list of resources, set their is_hidden flag and push the ones matching
		context.resource_list.forEach(function(r) {
			r.is_hidden = context.collapsed[r.pivot_id] == true;

			if (context.search_term == "")
			{
				r.is_selectable = !r.is_hidden;
			}
			else
			{
				if (!r.lowercase_url)
					r.lowercase_url = r.url.toLowerCase();
				r.is_selectable = r.lowercase_url.contains(context.search_term);
			}
		});

		flat_list = [];
		this.windows(context);
		var tpl = ["div", ["ul", flat_list], "class", "resource-tree"];
		flat_list = [];

		return tpl;
	};

	/*
	 * The following template methods push their result to the private variable
	 * `flat_list` in order to create a lightweight flat list of windows, documents,
	 * groups, resources, ... This approach is also much easier than flattening a
	 * big nested template.
	 *
	 */
	this.windows = function(context)
	{
		context.window_list.forEach(this.window.bind(this, context));
	};

	this.window = function(context, w)
	{
		var window_info = window.window_manager_data.get_window(w.id);
		if (!window_info)
			return;

		var extras = this._expander_extras(context, w.pivot_id);

		flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						this._get_short_distinguisher(window_info.title),
						"class", "resource-tree-window-label",
						"data-tooltip", "js-script-select",
						"data-tooltip-text", window_info.title
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
		var resources = context.resource_list.filter(function(r) {
			return r.document_id == d.documentID;
		});

		var resource_count = resources.length;
		if (context.search_term != "")
		{
			resources.forEach(function(r) {
				if (!r.is_selectable)
					resource_count--;
			});
		}

		var extras = this._expander_extras(context, d.pivot_id, d.depth);

		flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						this._get_short_distinguisher(d.url),
						"class", "resource-tree-document-label",
						"data-tooltip", "js-script-select",
						"data-tooltip-text", d.original_url
					],
					" ",
					d.same_origin ? [] : ["span", d.url.host || d.url.protocol, "class", "resource-different-origin"],
					" ",
					["span",
						String(resource_count),
						"class", "resource-tree-count"
					]
				].concat(extras.tpl.h2),
			].concat(extras.tpl.li)
		);

		if (!extras.collapsed)
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

	this.resource_group = function(context, resources, d, g)
	{
		var resources = resources.filter(function(r) {
			return r.group == g.type;
		});

		var resource_count = resources.length;
		if (context.search_term != "")
		{
			resources.forEach(function(r) {
				if (!r.is_selectable)
					resource_count--;
			});
		}

		if (resource_count == 0)
			return;

		var depth = d.depth + 1;
		var extras = this._expander_extras(context, d.pivot_id + "_" + g.type, depth);

		flat_list.push(
			["li",
				["h2",
					extras.tpl.button,
					["span",
						g.ui_string,
						"class", "resource-tree-group-" + g.type.toLowerCase() + "-label"
					],
					" ",
					["span",
						String(resource_count),
						"class", "resource-tree-count"
					],
					"class", "resource-tree-group resource-tree-group-" + g.type.toLowerCase()
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
		if (!r.is_selectable)
			return;

		var search = context.search_term;
		var partial_url_match = "";
		if (search != "")
		{
			var pos_first = r.lowercase_url.indexOf(search) - URL_MATCH_CONTEXT_SIZE;
			var pos_last = r.lowercase_url.lastIndexOf(search) + URL_MATCH_CONTEXT_SIZE + search.length;
			var prefix = pos_first > 0 ? "…" : "";
			var suffix = pos_last < r.url.length ? "…" : "";

			partial_url_match = prefix + r.url.substring(pos_first, pos_last) + suffix;
		}

		flat_list.push(
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
					r.same_origin ? [] : ["span", r.host || r.protocol, "class", "resource-different-origin"],
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

		var type = this[resource.type] ? resource.type : "fallback";

		return(
		["div",
			this.overview(resource),
			["div",
				this[type](resource),
				"class", "resource-detail-" + type + "-container scroll"
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
		var info = {
			"response_code": resource.responsecode + " " + cls.ResourceUtil.http_status_codes[resource.responsecode],
			"size": resource.size || resource.data.contentLength || resource.data.content.length,
			"character_encoding": resource.encoding || resource.data.characterEncoding || ""
		};

		var is_error = resource.error_in_current_response;

		return (
		["div",
			["span",
				[
					"a",
					resource.url,
					"href", resource.url,
					"target", "_blank",
					"class", "resource-detail-link"
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
				(resource.metadata ? " (" + resource.metadata + ")" : ""),
				"data-tooltip", "js-script-select",
				"data-tooltip-text", info.size + " " + ui_strings.S_BYTES_UNIT,
				"class", "resource-detail-overview-size"
			],
			"class", "resource-detail-overview"
		]);
	};

	this.text = function(resource)
	{
		var text = resource.data.content.stringData;

		if (text.startswith("data:"))
		{
			var pos = text.indexOf(",");
			var is_base64 = text.lastIndexOf(";base64", pos) != -1;
			text = is_base64 ? atob(text.slice(pos + 1)) : text.slice(pos + 1);
		}

		return ["pre", text];
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
		var sample_string = window.settings.resource_detail_view.get("sample_string");

		return(
		[
			["style", "@font-face { font-family: \"the font\"; src: url(\"" + resource.data.content.stringData + "\"); }"],
			["textarea", sample_string, "class", "resource-detail-font", "handler", "resource-detail-font"]
		]);
	};

	this.fallback = function(resource)
	{
		return(
		[
			"a",
			ui_strings.M_CONTEXTMENU_SHOW_RESOURCE,
			"href", resource.url,
			"target", "_blank",
			"class", "resource-detail-link"
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
