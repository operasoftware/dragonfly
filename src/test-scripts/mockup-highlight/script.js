const
TEST_DIR ="./test-doc/",
TEST_URL_LIST = TEST_DIR + "url-list.xml",
PADDING = 12,

ACTION_CLEAR = 0,
ACTION_SHOW_BORDER = 1,
ACTION_SHOW_GRID_DIMENSION = 2,
ACTION_SHOW_GRID_PADDING = 3,
ACTION_SHOW_GRID_BORDER = 4,
ACTION_SHOW_GRID_MARGIN = 5;

var
HIGHLIGHT_COLOR = 'rgba(0,255,0, .7)',
GRID_COLOR = 'rgba(0,50,255, 1)',
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
locked_borders = [],

/* create the DOM view */
getDOM = function() 
{
	var 
  traverseElementNodeHead = function(node, padding, close) 
  {
		var
		attrs = node.attributes,
		attr = null,
		i = 0,
		ret =
		"<node-container " +
		"ref-index='" + ref_index + "'" +
		"style='padding-left:" + padding * PADDING +"px;'>" +
		"<node>&lt;" + node.nodeName;

		for( ; attr = attrs[i]; i++) 
    {
			ret += " <key>" +attr.name + "</key>=<value>&quot;" + attr.value + "&quot;</value>";
		}
		ret += "&gt;</node>" + ( close ? "</node-container>" : "" );
		return ret;
	},
	
	traverseElementNodeFoot = function(node, padding, close) 
  {
		var
		ret =
		( close ? ( "<node-container style='padding-left:" + padding * PADDING +"px;'>" ) : "" ) +
		"<node>&lt;/" + node.nodeName + "&gt;</node>" +
		"</node-container>";
		return ret;

	},
	
	traverseNode = function(node, padding) 
  {
		var
		children = node.childNodes,
		child = null,
		i = 0,
		length = 0,
		close = false,
    value = '';

		for( ; child = children[i]; i++) 
    {
			if( child.nodeType == 1 )
      {
				dom_nodes[ref_index = dom_nodes.length] = child;
				length = child.childNodes.length;
				close =  !( length == 0 || ( length == 1 && child.firstChild.nodeType != 1 ) );
				markup += traverseElementNodeHead(child, padding, close);
				traverseNode(child, padding + 1);
				markup += traverseElementNodeFoot(child, padding, close);
			}
			else
      {
        try
        {
          value = child.nodeValue;
          if( value.length > 500 )
          {
            value = value.slice(0, 500) + ' ... ';
          }
          markup += 
          children.length > 1
          ? "<node-container style='padding-left:" + padding * PADDING +"px;'>" + child.nodeValue.replace(/</g, '&lt;') + "</node-container>"
          : value.replace(/</g, '&lt;');  
          
        }
        catch (e)
        {
          opera.postError(child);
        }

			}
		}
	},

	markup = "";
	dom_nodes = [];
	ref_index = 0;
	traverseNode(test_doc, 0);
	document.getElementById('dom').innerHTML = markup;
},

/* takes care of all the highlighting */
Highlighter = function(doc) 
{
	const 
  LEFT = 0, 
  TOP = 1, 
  RIGHT = 2, 
  BOTTOM = 3,
  DIMENSION = 0, 
  PADDING = 1, 
  BORDER = 2, 
  MARGIN = 3;

	var
	canvas = null,
	ctx = null,
	doc_width = 0,
	doc_height = 0,
	doc_view_width = 0,
	doc_view_height = 0,
  is_lock = false, 
  lock_eles = [],
  lock_boxes = [],
  last_selected = null,

	init = function() 
  {

		canvas = doc.documentElement.appendChild(doc.createElement('canvas'));

		doc_width = canvas.width = ( doc.documentElement ).scrollWidth;
		doc_height = canvas.height = ( doc.body || doc.documentElement ).scrollHeight;

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

	},

  clear = function()
  {
    ctx.clearRect(0, 0, doc_width, doc_height);
  },

  draw_box = function(box) 
  {
    // margin auto is not a number
    try
    {
      ctx.fillRect (box[LEFT], box[TOP], box[RIGHT] - box[LEFT], box[BOTTOM] - box[TOP]);
    }
    catch (event){};
  },

  draw_horizontal_line = function(top) 
  {
    // margin auto is not a number
    try
    {
      ctx.fillRect (0, top, doc_width, 1);
    }
    catch (event){};
    
  },

  draw_vertical_line = function(left) 
  {
    // margin auto is not a number
    try
    {
      ctx.fillRect (left, 0, 1, doc_height);
    }
    catch (event){};
  },

  draw_highlight = function(outer_box, inner_box)
  {
    var 
    and_box = null,
    or_box = null,
    max = Math.max,
    min = Math.min;
    
    ctx.save();
    // draw xor inner and outer box with alpha values
    if (inner_box)
    {
      and_box = 
      [
        max(outer_box[LEFT], inner_box[LEFT]), 
        max(outer_box[TOP], inner_box[TOP]),
        min(outer_box[RIGHT], inner_box[RIGHT]), 
        min(outer_box[BOTTOM], inner_box[BOTTOM])
      ];
      or_box = 
      [
        min(outer_box[LEFT], inner_box[LEFT]), 
        min(outer_box[TOP], inner_box[TOP]),
        max(outer_box[RIGHT], inner_box[RIGHT]), 
        max(outer_box[BOTTOM], inner_box[BOTTOM])
      ];
      if(and_box[LEFT] < and_box[RIGHT] && and_box[TOP] < and_box[BOTTOM])
      {
        ctx.beginPath();
        ctx.moveTo(and_box[LEFT], and_box[TOP]);
        ctx.lineTo(and_box[RIGHT], and_box[TOP]);
        ctx.lineTo(and_box[RIGHT], and_box[BOTTOM]);
        ctx.lineTo(and_box[LEFT], and_box[BOTTOM]);
        ctx.lineTo(and_box[LEFT], and_box[TOP]);
        ctx.lineTo(or_box[LEFT], or_box[TOP]);
        ctx.lineTo(or_box[LEFT], or_box[BOTTOM]);
        ctx.lineTo(or_box[RIGHT], or_box[BOTTOM]);
        ctx.lineTo(or_box[RIGHT], or_box[TOP]);
        ctx.lineTo(or_box[LEFT], or_box[TOP]);
        ctx.clip();
      };
      draw_box(inner_box);
    }
    if(outer_box)
    {
      draw_box(outer_box);
    }
    ctx.restore();
  },

  draw_border = function(box)
  {
    if(box)
    {
      var
      left = box[LEFT],
      top = box[TOP],
      width = box[RIGHT] - box[LEFT],
      height = box[BOTTOM] - box[TOP];

      try
      {
        ctx.fillRect (left, top, width, 1);
        ctx.fillRect (left, top, 1, height);
        ctx.fillRect (left + width - 1, top, 1, height);
        ctx.fillRect (left, top + height - 1 , width, 1);
      }
      catch (e){};
    }
  },

  draw_grid = function(box)
  {
    if(box)
    {
      draw_horizontal_line(box[TOP])
      draw_horizontal_line(box[BOTTOM] - 1)
      draw_vertical_line(box[LEFT]);
      draw_vertical_line(box[RIGHT] - 1);
    }
  },

	/*
	calculate all boxes from a given node
	returns an array: [dimension_box, padding_box, border_box, margin_box]
	*/
  getBoxes = function(node) 
  {
    var 
    container = test_doc.documentElement,
    scrollLeft = container.scrollLeft,
    scrollRight = scrollLeft + doc_view_width,
    scrollTop = container.scrollTop,
    scrollBottom = scrollTop + doc_view_height,
    bounding_rect = node.getBoundingClientRect(),
    top = bounding_rect.top + scrollTop,
    right = bounding_rect.right + scrollLeft,
    bottom = bounding_rect.bottom + scrollTop, 
    left = bounding_rect.left + scrollLeft,
    style = test_win.contentWindow.getComputedStyle(node, null),
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
    margin_left = parseInt(style.getPropertyValue('margin-left')),
    dimension_box = [left + border_left + padding_left, top + border_top + padding_top, right - border_right - padding_right, bottom - border_bottom - padding_bottom];
    padding_box = [left + border_left, top + border_top, right - border_right, bottom - border_bottom];
    border_box = [left, top, right, bottom];
    margin_box = [left - margin_left, top - margin_top, right + margin_right, bottom + margin_bottom];

    return [dimension_box, padding_box, border_box, margin_box];
  },
  
  scrollIntoView = function(box) 
  {
    var container = test_doc.documentElement,
    scrollLeft = container.scrollLeft,
    scrollRight = scrollLeft + doc_view_width,
    scrollTop = container.scrollTop,
    scrollBottom = scrollTop + doc_view_height
    top = box[TOP] ,
    right = box[RIGHT],
    bottom = box[BOTTOM], 
    left = box[LEFT];

    // scroll into view vertically
    if ( ( bottom - top ) < doc_view_height && bottom > scrollBottom )
    {
      container.scrollTop += 80 + bottom - scrollBottom;
    }
    else if ( top < scrollTop)
    {
      container.scrollTop += top - scrollTop - 80;
    }
    // scroll into view horizontally
    if ( ( right - left ) < doc_view_width && right > scrollRight )
    {
      container.scrollLeft += 80 + right - scrollRight;
    }
    else if (left < scrollLeft)
    {
      container.scrollLeft += left - scrollLeft - 80;
    }
  };

  this.setLock = function(bool)
  {
    is_lock = bool;
  }

  this.clearLock = function()
  {
    lock_eles = [];
    lock_boxes = [];
    this.highlightNode();
  }

	this.highlightNode = function(node, mode, check_lock) 
  {
		var 
    inner_box = null, 
    outer_box = null,
    grid_box = null,
    frame_box = null,
    cursor_box = null,
    i = 0,
    boxes = node && getBoxes(node) || null;

		switch (mode) 
    {
			case ACTION_SHOW_BORDER:
      {
        frame_box = outer_box = boxes[BORDER];
        scrollIntoView(frame_box);
				break;
      }
			case ACTION_SHOW_GRID_DIMENSION:
      {
				grid_box = outer_box = boxes[DIMENSION];
				break;
      }
			case ACTION_SHOW_GRID_PADDING:
      {
				grid_box = outer_box = boxes[PADDING];
        frame_box = inner_box = boxes[DIMENSION];
				break;
      }
			case ACTION_SHOW_GRID_BORDER:
      {
				grid_box = outer_box = boxes[BORDER];
        frame_box = inner_box = boxes[PADDING];
				break;
      }
			case ACTION_SHOW_GRID_MARGIN:
      {
				grid_box = outer_box = boxes[MARGIN];
        frame_box = inner_box = boxes[BORDER];
				break;
      }
		}

    clear();
    ctx.fillStyle = BORDER_COLOR;
    for( ; cursor_box = lock_boxes[i]; i++)
    {
      draw_border(cursor_box);
    }
    // not sure if that is good
    if( !outer_box && last_selected )
    {
      frame_box = last_selected[1][BORDER];
    }
    ctx.fillStyle = HIGHLIGHT_COLOR;
    draw_highlight(outer_box, inner_box);
    ctx.fillStyle = GRID_COLOR;
    draw_grid(grid_box);
    ctx.fillStyle = BORDER_COLOR;
    draw_border(frame_box);
    last_selected = [node, boxes];
    if(check_lock && is_lock && ( grid_box || frame_box ) )
    {
      var index = lock_eles.indexOf(node);
      if( index == -1 )
      {
        index = lock_eles.length;
      }
      lock_eles[index] = node;
      lock_boxes[index] = grid_box || frame_box;
    }
	}


		
  init();
},

/* handle click in DOM view: toggle select of element */
click_handler_dom = function(event) 
{
  var 
  target = event.target,
  ref_index = "",
  metrics = null;

  while( target && !/node-container/i.test(target.nodeName) && ( target = target.parentElement ) );
  if(target && (ref_index = target.getAttribute('ref-index'))) 
  {
    if (selected_node)
    {
      selected_node.className = "";
      selected_node.removeEventListener('mouseover', mouseover_dom_2, false);
      selected_node.removeEventListener('mouseout', mouseout_dom_2, false);
    }
    selected_node = target;
    selected_node.className = "selected";
    selected_node.addEventListener('mouseover', mouseover_dom_2, false);
    selected_node.addEventListener('mouseout', mouseout_dom_2, false);
    test_doc_target = dom_nodes[ref_index];
    metrics = document.getElementById("metrics");
    metrics.innerHTML = "";
    metrics.render(templates.metrics(frames[0].getComputedStyle(test_doc_target, null)));
    highlighter.highlightNode(test_doc_target, ACTION_SHOW_BORDER, true);
    if(event.syntetic)
    {
      event.target.scrollIntoView();
    }
  }
},

mouseover_dom_2 = function(event) 
{
  highlighter.highlightNode(test_doc_target, ACTION_SHOW_BORDER );
},

mouseout_dom_2 = function(event) 
{
  highlighter.highlightNode(test_doc_target, ACTION_CLEAR );
},

/* handle mouse hovering in DOM view: point to element */
mouseover_dom = function(event) 
{
  /*
  var 
  target = event.target;

  // get parent until one is reached with the name 'container'
  while (target && !/node-container/i.test(target.nodeName) && (target = target.parentElement));
  if (target && test_doc_target) 
  {
    highlighter.highlightNode(test_doc_target, 
      target.hasClass('selected') && ACTION_SHOW_BORDER || ACTION_CLEAR );
  }
  */
},



cls = ['margin', 'border', 'padding', 'dimension'],
cls_map = 
{
  'margin': ACTION_SHOW_GRID_MARGIN, 
  'border': ACTION_SHOW_GRID_BORDER,  
  'padding': ACTION_SHOW_GRID_PADDING, 
  'dimension': ACTION_SHOW_GRID_DIMENSION
},

/*remove highlights in metrics view */
clearHighlightControlMetrics = function() 
{
  if (current_target_metrics) 
  {
    current_target_metrics.style.removeProperty("background-color");
    current_target_metrics.style.removeProperty("color");
    current_target_metrics = null;
  }
  if (current_target_metrics_inner)
  {
    current_target_metrics_inner.style.removeProperty("border-color");
    current_target_metrics_inner = null;
  }
},

/*set new highlights in metrics view */
showHighlightControlMetrics = function() 
{
  if (current_target_metrics) 
  {
    current_target_metrics.style.backgroundColor = 
      HIGHLIGHT_COLOR.replace(/rgba\( *(\d+) *, *(\d+) *, *(\d+).*/, "rgb($1,$2,$3)");
    current_target_metrics.style.color = "#fff";
    var inner_index = cls.indexOf(current_target_metrics.className) + 1;
    if (inner_index > 0 && inner_index < 4) 
    {
      current_target_metrics_inner = 
        current_target_metrics.getElementsByClassName(cls[inner_index])[0];
      current_target_metrics_inner.style.borderColor = 
        BORDER_COLOR.replace(/rgba\( *(\d+) *, *(\d+) *, *(\d+).*/, "rgb($1,$2,$3)");
    }
  }
},

/* handle hovering in metrics view */
mouseover_controls = function(event, check_lock) 
{
  var 
  target = event.target,
  cls_index = 0;

  // get target elements until the established frame is reached
  while (target && !(cls.indexOf(target.className) > -1) && (target = target.parentElement));

  // if it is the same as the currently highlighted one, abort
  if (!check_lock && target == current_target_metrics )
  {
    return;
  }
  clearHighlightControlMetrics();

  current_target_metrics = target;
  showHighlightControlMetrics(); 
  if (test_doc_target)
  {
    highlighter.highlightNode(test_doc_target, 
      current_target_metrics && cls_map[current_target_metrics.className] || ACTION_CLEAR,
      check_lock);
  }
  if( !target )
  {
    current_target_metrics_inner = 
      document.getElementById("metrics").getElementsByClassName(cls[1])[0];
    current_target_metrics_inner.style.borderColor = 
      BORDER_COLOR.replace(/rgba\( *(\d+) *, *(\d+) *, *(\d+).*/, "rgb($1,$2,$3)");
  }
},

/* handle clicks on metrics view */
click_handler_controls = function(event) 
{
  mouseover_controls(event, true);
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

getRealTarget = function(event)
{
  var x = event.pageX, y = event.pageY;

  event.target.style.display= 'none';

  var target = this.elementFromPoint(x,y);

  while(target && target.nodeType != 1 && ( target = target.parentNode ) );
  event.target.style.removeProperty('display');

  var 
  index = dom_nodes.indexOf(target),
  s_index = index.toString(),
  nodes = document.getElementById('dom').getElementsByTagName('node-container'),
  node = null,
  i = 0;

  for( ; ( node = nodes[i] ) && !( node.getAttribute('ref-index') == s_index ); i++);
  if( node )
  {
    click_handler_dom({target: node, syntetic: true});
  }
},



loadurl = function(url)
{
  document.getElementById('dom').innerHTML = '';
  document.getElementById("metrics").innerHTML = "";
  test_win = document.getElementsByTagName('iframe')[0];
  
  test_win.onload = function()
  {
    
    document.getElementById("metrics").innerHTML = "";
    
    getDOM(test_doc = this.contentDocument);
    
    this.contentDocument.addEventListener('click', getRealTarget, false);
    
    highlighter = new Highlighter(test_doc);
    
  }
  
  test_win.location = TEST_DIR + url;
},

init = function()
{
  document.getElementById('dom-container').addEventListener('click', click_handler_dom, false);
  document.getElementById('dom-container').addEventListener('mouseover', mouseover_dom, false);
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
    'class', 'metrics', 'onmouseover', mouseover_controls, 'onclick', click_handler_controls];
}

onload = init;

