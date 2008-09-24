const
TEST_DIR ="./test-doc/",
TEST_URL_LIST = TEST_DIR + "url-list.xml",
PADDING = 12;

ACTION_POINT = "point";
ACTION_CLEAR = "clear";
ACTION_SHOW_DIMENSION = "dimension";
ACTION_SHOW_PADDING = "padding";
ACTION_SHOW_BORDER = "border";
ACTION_SHOW_MARGIN = "margin";
ACTION_LOCK = "lock"


var
FADE_OUT_COLOR = 'rgba(0,0,0, .3)',
DEFAULT_HIGHLIGHT_COLOR = 'rgba(0,0,0, 0)',
HIGHLIGHT_COLOR = 'rgba(0,255,0, .7)',
GRID_COLOR = 'rgba(0,50,255, 1)',
NONE = 'rgba(0,0,0, 0)',
BORDER_COLOR = 'rgba(255, 0, 0, 1)';


var
test_win = null,
test_doc = null,
dom_nodes = [],
ref_index = 0,
highlighter = null,
selected_node = null,
current_target_metrics = null,
current_target_metrics_inner = null,
test_doc_target = null,
spotlight_locked = false,
locked_borders = [];

/* create the DOM view*/
getDOM = function() {
	var traverseElementNodeHead = function(node, padding, close) {
		var
		attrs = node.attributes,
		attr = null,
		i = 0,
		ret =
		"<node-container " +
		"ref-index='" + ref_index + "'" +
		"style='padding-left:" + padding * PADDING +"px;'>" +
		"<node>&lt;" + node.nodeName;

		for( ; attr = attrs[i]; i++) {
			ret += " <key>" +attr.name + "</key>=<value>&quot;" + attr.value + "&quot;</value>";
		}

		ret += "&gt;</node>" + ( close ? "</node-container>" : "" );
		return ret;
	};
	
	var traverseElementNodeFoot = function(node, padding, close) {
		var
		ret =
		( close ? ( "<node-container style='padding-left:" + padding * PADDING +"px;'>" ) : "" ) +
		"<node>&lt;/" + node.nodeName + "&gt;</node>" +
		"</node-container>";
		return ret;

	}
	
	var traverseNode = function(node, padding) {
		var
		children = node.childNodes,
		child = null,
		i = 0,
		length = 0,
		close = false;

		for( ; child = children[i]; i++) {
			if( child.nodeType == 1 ) {
				dom_nodes[ref_index = dom_nodes.length] = child;
				length = child.childNodes.length;
				close =  !( length == 0 || ( length == 1 && child.firstChild.nodeType != 1 ) );
				markup += traverseElementNodeHead(child, padding, close);
				traverseNode(child, padding + 1);
				markup += traverseElementNodeFoot(child, padding, close);
			}
			else {
				markup += 
				children.length > 1
				? "<node-container style='padding-left:" + padding * PADDING +"px;'>" + child.nodeValue + "</node-container>"
				: child.nodeValue;  
			}
		}
	};
	var markup = "";

	dom_nodes = [];
	ref_index = 0;
	traverseNode(test_doc, 0);
	document.getElementById('dom').innerHTML = markup;
},

/* takes care of all the highlighting */
Highlighter = function(doc) {
	const LEFT = 0, TOP = 1, RIGHT = 2, BOTTOM = 3;
	const DIMENSION = 0, PADDING = 1, BORDER = 2, MARGIN = 3;

	var
	canvas = null,
	ctx = null,
	doc_width = 0,
	doc_height = 0,
	doc_view_width = 0,
	doc_view_height = 0,
	init = function() {

		canvas = doc.documentElement.appendChild(doc.createElement('canvas'));

		doc_width = canvas.width = doc.documentElement.scrollWidth;
		doc_height = canvas.height = doc.documentElement.scrollHeight;
		doc_view_width = test_win.contentWindow.innerWidth;
		doc_view_height = test_win.contentWindow.innerHeight;

		canvas.style.cssText =
		"width:" + doc_width + "px;" +
		"height:" + doc_height + "px;" +
		"display: block;" +
		"position:absolute;" +
		"top: 0;" +
		"left:0;" +
		"z-index: 10000;";

		ctx = canvas.getContext('2d');

	};


	/*
	Highlights a node.
	Modes: ACTION_POINT, ACTION_CLEAR, ACTION_SHOW_DIMENSION, ACTION_SHOW_PADDING, ACTION_SHOW_BORDER, ACTION_SHOW_MARGIN
	*/
	this.highlightNode = function(node, mode) {

		/*initialise variables*/
		var white_box = null, hover_box = null;
		var boxes = initBoxes(node);

		// set default mode
		mode || ( mode = ACTION_POINT);

		switch (mode) {
			case ACTION_POINT:
				// handle spotlight
				draw_lowlight();
				clear_box(boxes[BORDER][LEFT], boxes[BORDER][TOP], boxes[BORDER][RIGHT]-boxes[BORDER][LEFT], boxes[BORDER][BOTTOM]-boxes[BORDER][TOP]);
				draw_locked_borders();
				scrollIntoView(node);
				break;
			case ACTION_CLEAR:
				// remove spotlight
				clear_box(0, 0, doc_width, doc_height);
				draw_locked_borders();
				break;			
			case ACTION_LOCK:
				// lock spotlight
				var index = locked_borders.indexOf(node);
				if (index >= 0) { // is currently locked
					locked_borders.splice(index, 1);
					draw_frame(boxes[BORDER][LEFT], boxes[BORDER][TOP], boxes[BORDER][RIGHT]-boxes[BORDER][LEFT], boxes[BORDER][BOTTOM]-boxes[BORDER][TOP], FADE_OUT_COLOR);
				} else { //element is not locked
					scrollIntoView(node);
					locked_borders.push(node);
					draw_locked_borders();
				}
				break;
			default:
				this.highlightMetrics(mode);
				scrollIntoView(node);
		}

		return;

		// draw lowlight
		draw_lowlight();

		// highlight a frame
		if (hover_box) {
			if (white_box)  // highlight padding, border, margin
				draw_hover_box(hover_box, white_box);
			else  // highlight dimensions
			draw_default_hover_box(hover_box);
		}
		else if (white_box) // highlight element
			draw_default_hover_box(white_box);
		else  // clear highlight
			ctx.clearRect(0, 0, doc_width, doc_height);

		// scroll node into view
		scrollIntoView(node);
	}

	//highlight the element metrics on the page
	this.highlightMetrics = function(mode) {

		// init with last selected element 
		node = locked_borders[locked_borders.length-1];
		var highlight_box, _clear_box;
		var boxes = initBoxes(node);
		// set default mode
		mode || ( mode = ACTION_SHOW_BORDER);

		// set highlight borders
		switch (mode) {
			case ACTION_SHOW_DIMENSION:
				highlight_box = boxes[DIMENSION];
				break;
			case ACTION_SHOW_PADDING:
				_clear_box = boxes[DIMENSION];
				highlight_box = boxes[PADDING];
				break;
			case ACTION_SHOW_BORDER:
				_clear_box = boxes[PADDING];
				highlight_box = boxes[BORDER];
				break;
			case ACTION_SHOW_MARGIN:
				_clear_box = boxes[BORDER];
				highlight_box = boxes[MARGIN];
				break;
			default:
			    return;
		}

		clear_box(0, 0, doc_width, doc_height);
		draw_hover_box(highlight_box, _clear_box);

	}

	/*
	calculate all boxes from a given node
	returns an array: [dimension_box, padding_box, border_box, margin_box]
	*/
	var initBoxes = function(node) {
			
			var container = test_doc.documentElement;

			var
			scrollLeft = container.scrollLeft,
			scrollRight = scrollLeft + doc_view_width,
			scrollTop = container.scrollTop,
			scrollBottom = scrollTop + doc_view_height;

			var
			bounding_rect = node.getBoundingClientRect(),
			top = bounding_rect.top + scrollTop,
			right = bounding_rect.right + scrollLeft,
			bottom = bounding_rect.bottom + scrollTop, 
			left = bounding_rect.left + scrollLeft;

			var
			style = test_win.contentWindow.getComputedStyle(node, null);

			var
			padding_top = parseInt(style.getPropertyValue('padding-top')),
			padding_right = parseInt(style.getPropertyValue('padding-right')),
			padding_bottom = parseInt(style.getPropertyValue('padding-bottom')),
			padding_left = parseInt(style.getPropertyValue('padding-left')),

			border_top = parseInt(style.getPropertyValue('border-top-width')),
			border_right = parseInt(style.getPropertyValue('border-right-width')),
			border_bottom = parseInt(style.getPropertyValue('border-bottom-width')),
			border_left = parseInt(style.getPropertyValue('border-left-width')),

			margin_top = parseInt(style.getPropertyValue('margin-top')),
			margin_right = parseInt(style.getPropertyValue('margin-right')),
			margin_bottom = parseInt(style.getPropertyValue('margin-bottom')),
			margin_left = parseInt(style.getPropertyValue('margin-left'));

			var
			dimension_box = [left + border_left + padding_left, top + border_top + padding_top, right - border_right - padding_right, bottom - border_bottom - padding_bottom];
			padding_box = [left + border_left, top + border_top, right - border_right, bottom - border_bottom];
			border_box = [left, top, right, bottom];
			margin_box = [left - margin_left, top - margin_top, right + margin_right, bottom + margin_bottom];

			var boxes = [dimension_box, padding_box, border_box, margin_box];
			return boxes;
		}			
		
	//scroll a certain node into the view
	var scrollIntoView = function(node) {
		
			// initialise variables
			var container = test_doc.documentElement;

			var scrollLeft = container.scrollLeft,
			scrollRight = scrollLeft + doc_view_width,
			scrollTop = container.scrollTop,
			scrollBottom = scrollTop + doc_view_height;

			var bounding_rect = node.getBoundingClientRect(),
			top = bounding_rect.top + scrollTop,
			right = bounding_rect.right + scrollLeft,
			bottom = bounding_rect.bottom + scrollTop, 
			left = bounding_rect.left + scrollLeft;

			// scroll into view vertically
			if (bottom > scrollBottom)
				container.scrollTop += 80 + bottom - scrollBottom;
			else if (top < scrollTop)
				container.scrollTop += top - scrollTop - 80;

			// scroll into view horizontally
			if (right > scrollRight)
				container.scrollLeft += 80 + right - scrollRight;
			else if (left < scrollLeft)
				container.scrollLeft += left - scrollLeft - 80;
				
			return;
		}
		
	// draws a simple highlight box without frame
	var draw_default_hover_box = function(box) {
		return draw_hover_box(box);
		/*    draw_box (box[LEFT], box[TOP], box[RIGHT] - box[LEFT], box[BOTTOM] - box[TOP], HIGHLIGHT_COLOR);
		draw_horizontal_grid(box[TOP]);
		draw_horizontal_grid(box[BOTTOM] - 1);
		draw_vertical_grid(box[LEFT]);
		draw_vertical_grid(box[RIGHT] - 1);*/
	}
	// draws a highlight frame on a box with an inner box
	var draw_hover_box = function(outer_box, inner_box) {
		var min = Math.min, max = Math.max;

		// clear boxes
		if (inner_box)
		clear_box(inner_box[LEFT], inner_box[TOP], inner_box[RIGHT] - inner_box[LEFT], inner_box[BOTTOM] - inner_box[TOP], HIGHLIGHT_COLOR);
		clear_box(outer_box[LEFT], outer_box[TOP], outer_box[RIGHT] - outer_box[LEFT], outer_box[BOTTOM] - outer_box[TOP], HIGHLIGHT_COLOR);

			// draw boxes
			if (inner_box)
				draw_box(inner_box[LEFT], inner_box[TOP], inner_box[RIGHT] - inner_box[LEFT], inner_box[BOTTOM] - inner_box[TOP], HIGHLIGHT_COLOR);
			draw_box(outer_box[LEFT], outer_box[TOP], outer_box[RIGHT] - outer_box[LEFT], outer_box[BOTTOM] - outer_box[TOP], HIGHLIGHT_COLOR);

			// clear inner rectangle
			if (inner_box) {
				try {
					clear_box(max(outer_box[LEFT], inner_box[LEFT]), max(outer_box[TOP], inner_box[TOP]), min(outer_box[RIGHT], inner_box[RIGHT]) - max(outer_box[LEFT], inner_box[LEFT]), min(outer_box[BOTTOM], inner_box[BOTTOM]) - max(outer_box[TOP], inner_box[TOP]));
 				} catch (event) {};
			}

			// draw grid
			draw_horizontal_grid(outer_box[TOP]);
			draw_horizontal_grid(outer_box[BOTTOM] - 1);
			draw_vertical_grid(outer_box[LEFT]);
			draw_vertical_grid(outer_box[RIGHT] - 1);

			// draw inner frame
			if (inner_box)
			draw_frame(inner_box[LEFT], inner_box[TOP], inner_box[RIGHT] - inner_box[LEFT], inner_box[BOTTOM] - inner_box[TOP], BORDER_COLOR);
			return;
		}

		// clears a given rectangle
		var clear_box = function(left, top, width, height) {
			ctx.save();
			ctx.clearRect(left, top, width, height);
			ctx.restore();
		}
				
		// draws a box over the given rectangle with the given colour and a one pixel border if specified
		var draw_box = function(left, top, width, height, color, border) {
			ctx.save();
			ctx.fillStyle = color;
			ctx.clearRect(left, top, width, height);
			ctx.fillRect (left, top, width, height);
			ctx.restore();
			if (border) //border shall be shown
				draw_frame(left, top, width, height, border);
		}
		// draws a one pixel frame inside the box
		var draw_frame = function(left, top, width, height, color) {
			ctx.save();
			ctx.fillStyle = color;
			ctx.clearRect(left, top, width, 1);
			ctx.fillRect (left, top, width, 1);
			ctx.clearRect(left, top, 1, height);
			ctx.fillRect (left, top, 1, height);
			ctx.clearRect(left + width - 1, top, 1, height);
			ctx.fillRect (left + width - 1, top, 1, height);
			ctx.clearRect(left, top + height - 1 , width, 1);
			ctx.fillRect (left, top + height - 1 , width, 1);
			ctx.restore();
		}

		// draw the lowlight
		var draw_lowlight = function() {
			ctx.save();
			ctx.clearRect(0, 0, doc_width, doc_height);
			ctx.fillStyle = FADE_OUT_COLOR;
			ctx.fillRect (0, 0, doc_width, doc_height);
			ctx.restore();	
			draw_locked_borders();
		}
		// draw all locked borders
		var draw_locked_borders = function() {
			var boxes = null;
			if (locked_borders.length < 1)
				return;
			for (var i = 0; i < locked_borders.length; i++) {
				boxes = initBoxes(locked_borders[i]);
				draw_frame(boxes[BORDER][LEFT], boxes[BORDER][TOP], boxes[BORDER][RIGHT]-boxes[BORDER][LEFT], boxes[BORDER][BOTTOM]-boxes[BORDER][TOP], BORDER_COLOR);
			}
			return;
		}

		// draw a horizontal grid line
		var draw_horizontal_grid = function(top) {
			return draw_horizontal_line(top, GRID_COLOR);
		}
		// draw a horizontal line
		var draw_horizontal_line = function(top, color) {
			ctx.save();
			ctx.fillStyle = color;
			ctx.clearRect(0, top, doc_width, 1);
			ctx.fillRect (0, top, doc_width, 1);
			ctx.restore();
		}
		// draw a vertical grid line
		var draw_vertical_grid = function(left) {
			return draw_vertical_line(left, GRID_COLOR);
		}
		// draw a vertical line
		var draw_vertical_line = function(left, color) {
			ctx.save();
			ctx.fillStyle = color;
			ctx.clearRect(left, 0, 1, doc_height);
			ctx.fillRect (left, 0, 1, doc_height);
			ctx.restore();
		}

		init();

	},

	/* handle click in DOM view: toggle select of element */
	click_handler_dom = function(event) {
		var 
		target = event.target,
		ref_index = "",
		metrics = null;

		while( target && !/node-container/i.test(target.nodeName) && ( target = target.parentElement ) );
		if(target && (ref_index = target.getAttribute('ref-index'))) {
			if (selected_node)
				selected_node.className = "";
			selected_node = target;
			selected_node.className = "selected";
			test_doc_target = dom_nodes[ref_index];
			metrics = document.getElementById("metrics");
			metrics.innerHTML = "";
			metrics.render(templates.metrics(frames[0].getComputedStyle(test_doc_target, null)))
			highlighter.highlightNode(test_doc_target, ACTION_LOCK);
		}
	}

	/* handle mouse hovering in DOM view: point to element */
	mouseover_dom = function(event) {
		var 
		target = event.target,
		ref_index = "",
		metrics = null;

		// get parent until one is reached with the name 'container'
		while (target && !/node-container/i.test(target.nodeName) && (target = target.parentElement));
		if (target && (ref_index = target.getAttribute('ref-index'))) {
			if (selected_node)
				selected_node.className = "";
			selected_node = target;
			selected_node.className = "selected";
			test_doc_target = dom_nodes[ref_index];
			metrics = document.getElementById("metrics");
			metrics.innerHTML = "";
			metrics.render(templates.metrics(frames[0].getComputedStyle(test_doc_target, null)))
			highlighter.highlightNode(test_doc_target, ACTION_POINT);
		}

	},

	/* handle mouse out in DOM view: trigger end of highlight */
	mouseout_dom = function(event) {
		var 
		target = event.target,
		ref_index = "",
		metrics = null;

		while (target && !/node-container/i.test(target.nodeName) && (target = target.parentElement));
		if (target && (ref_index = target.getAttribute('ref-index'))) {
			if (selected_node)
				selected_node.className = "";
			selected_node = target;
			selected_node.className = "selected";
			test_doc_target = dom_nodes[ref_index];
			metrics = document.getElementById("metrics");
			metrics.innerHTML = "";
			metrics.render(templates.metrics(frames[0].getComputedStyle(test_doc_target, null)))
			highlighter.highlightNode(test_doc_target, ACTION_CLEAR);
		}
	};

	/* handle clicks on metrics view */
	click_handler_controls = function(event) {
		var handler = event.target && event.target.getAttribute('handler');
		if (test_doc_target && handler)
			highlighter.highlightNode(test_doc_target, handler);
	};

	/* handle hovering in metrics view */
	mouseover_controls = function(event) {

		var 
		target = event.target,
		cls = ['margin', 'border', 'padding', 'dimension'],
		cls_index = 0;

		/*remove highlights in metrics view*/
		var clearOldControlMetrics = function() {
			if (current_target_metrics) {
				current_target_metrics.style.removeProperty("background-color");
				current_target_metrics.style.removeProperty("color");
			}
			if (current_target_metrics_inner)
				current_target_metrics_inner.style.removeProperty("border-color");
			return;
		};

		/*set new highlights in metrics view*/
		var showControlMetrics = function(target) {
			if (current_target_metrics) {
				target.style.backgroundColor = HIGHLIGHT_COLOR.replace(/rgba\( *(\d+) *, *(\d+) *, *(\d+).*/, "rgb($1,$2,$3)") ;
				current_target_metrics.style.color = "#fff";
				var inner_index = cls.indexOf(target.className) + 1;
				if (inner_index > 0 && inner_index < 4) {
					current_target_metrics_inner = current_target_metrics.getElementsByClassName(cls[inner_index])[0];
					current_target_metrics_inner.style.borderColor = BORDER_COLOR.replace(/rgba\( *(\d+) *, *(\d+) *, *(\d+).*/, "rgb($1,$2,$3)");
				}
			}
		};

		// get target elements until the established frame is reached
		while (target && !(cls.indexOf(target.className) > -1) && (target = target.parentElement));

		// if it is the same as the currently highlighted one, abort
		if (target == current_target_metrics)
		return;

		// clear old highlight
		clearOldControlMetrics();
		// set new highlight target
		current_target_metrics = target || null;
		// show new highlight
		showControlMetrics(target);  

		if (test_doc_target)
			highlighter.highlightNode(test_doc_target, current_target_metrics && current_target_metrics.className || ACTION_CLEAR);

		return;
	},

	getTestUrls = function()
	{
		var xhr = new XMLHttpRequest();
		xhr.onload = function()
		{
			var 
			h2 = document.getElementsByTagName('h2')[0],
			markup = " <select onchange='loadurl(this.value)'>";
			urls = this.responseXML.getElementsByTagName('url'),
			url = '', 
			i = 0;

			for( ; url = urls[i]; i++)
			{
				markup += "<option>" + url.textContent + "</options>";
			}

			markup += "</select>";
			h2.innerHTML = h2.textContent + markup;
			loadurl(urls[0].textContent)

		}
		xhr.open("GET", TEST_URL_LIST);
		xhr.send(null);
	},

	loadurl = function(url)
	{
		test_win = document.getElementsByTagName('iframe')[0];
		test_win.onload = function()
		{
			document.getElementById("metrics").innerHTML = "";
			getDOM(test_doc = this.contentDocument);
			highlighter = new Highlighter(test_doc);
		}
		test_win.location = TEST_DIR + url;
	},

	init = function()
	{

		document.getElementById('dom-container').addEventListener('click', click_handler_dom, false);
		document.getElementById('dom-container').addEventListener('mouseover', mouseover_dom, false);
		document.getElementById('dom-container').addEventListener('mouseout', mouseout_dom, false);
		document.getElementById('controls-container').addEventListener('click', click_handler_controls, false);
		getTestUrls();


	};

	window.templates || ( window.templates = {} );

	const
	PADDING_TOP = "padding-top",
	PADDING_RIGHT = "padding-right",
	PADDING_BOTTOM = "padding-bottom",
	PADDING_LEFT = "padding-left",
	BORDER_TOP_WIDTH = "border-top-width",
	BORDER_RIGHT_WIDTH = "border-right-width",
	BORDER_BOTTOM_WIDTH = "border-bottom-width",
	BORDER_LEFT_WIDTH = "border-left-width",
	MARGIN_TOP = "margin-top",
	MARGIN_RIGHT = "margin-right",
	MARGIN_BOTTOM = "margin-bottom",
	MARGIN_LEFT = "margin-left",
	WIDTH = "width",
	HEIGHT = "height";

	templates.metrics = function(style_dec)
	{
		return \
			['ul', 
				['li',
					['ul', 
						['li',['p','\u00a0',['span', 'margin']]],
						['li', style_dec.getPropertyValue(MARGIN_TOP)],
						['li']
					],
					['ul', 
						['li', style_dec.getPropertyValue(MARGIN_LEFT)], 
						['li', 
							['ul', 
								['li',['p','\u00a0',['span', 'border']]], 
								['li', style_dec.getPropertyValue(BORDER_TOP_WIDTH)],
								['li']
							],
							['ul', 
								['li', style_dec.getPropertyValue(BORDER_LEFT_WIDTH)], 
								['li',
									['ul', 
										['li',['p','\u00a0',['span', 'padding']]], 
										['li', style_dec.getPropertyValue(PADDING_TOP)], 
										['li']
									],
									['ul', 
										['li', style_dec.getPropertyValue(PADDING_LEFT)], 
										['li', 
											['ul', ['li', style_dec.getPropertyValue(WIDTH), 'class', 'elementWidth']],
											['ul', ['li', style_dec.getPropertyValue(HEIGHT),'class', 'elementHeight']],
											['ul', ['li', '\u00a0']],
										'class', 'dimension'], 
										['li', style_dec.getPropertyValue(PADDING_RIGHT)]
									],
									['ul', ['li', style_dec.getPropertyValue(PADDING_BOTTOM), 'colspan', '3']],
								'class', 'padding'],
							['li', style_dec.getPropertyValue(BORDER_RIGHT_WIDTH)]],
							['ul', ['li', style_dec.getPropertyValue(BORDER_BOTTOM_WIDTH), 'colspan', '3']],
						'class', 'border'], 
						['li', style_dec.getPropertyValue(MARGIN_RIGHT)]
					],
					['ul', ['li', style_dec.getPropertyValue(MARGIN_BOTTOM), 'colspan', '3']],
				'class', 'margin'], 
			'class', 'metrics', 'onmouseover', mouseover_controls];
	}



	onload = init;