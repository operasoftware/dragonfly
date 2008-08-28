const
TEST_DIR ="./test-doc/",
TEST_URL_LIST = TEST_DIR + "url-list.xml",
PADDING = 12;

var
FADE_OUT_COLOR = 'rgba(0,0,0, 0.4)',
DEFAULT_HIGHLIGHT_COLOR = 'rgba(0,0,0, 0)',
HIGHLIGHT_COLOR = 'rgba(0,0,255, .4)',
GRID_COLOR = 'rgba(0,255,255, 1)';




var
test_win = null,
test_doc = null,
dom_nodes = [],
ref_index = 0,
highlighter = null,
selected_node = null,
current_target_metrics = null,
test_doc_target = null,


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
    close = false;

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
        markup += 
          children.length > 1
          ? "<node-container style='padding-left:" + padding * PADDING +"px;'>" + child.nodeValue + "</node-container>"
          : child.nodeValue;  
      }
    }
  },
  markup = "";

  dom_nodes = [];
  ref_index = 0;
  traverseNode(test_doc, 0);
  document.getElementById('dom').innerHTML = markup;
  
  
  
},
Highlighter = function(doc)
{
  const
  LEFT = 0,
  TOP = 1,
  RIGHT = 2,
  BOTTOM = 3;

  var
  canvas = null,
  ctx = null,
  doc_width = 0,
  doc_height = 0,
  doc_view_width = 0,
  doc_view_height = 0,
  init = function()
  {

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

  this.highlightNode = function(node, mode)
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
    white_box = null,
    hover_box = null;

    mode || ( mode = "default");
    
    switch(mode)
    {
      case "default":
      {
        white_box =
        [
          left,
          top,
          right,
          bottom
        ]
        break;
      }
      case "dimension":
      {
        hover_box =
        [
          left + border_left + padding_left,
          top + border_top + padding_top,
          right - border_right - padding_right,
          bottom - border_bottom - padding_bottom
        ]
        break;
      }
      case "padding":
      {
        white_box =
        [
          left + border_left + padding_left,
          top + border_top + padding_top,
          right - border_right - padding_right,
          bottom - border_bottom - padding_bottom
        ]
        hover_box =
        [
          left + border_left,
          top + border_top,
          right - border_right,
          bottom - border_bottom
        ]
        break;
      }
      case "border":
      {
        white_box =
        [
          left + border_left,
          top + border_top,
          right - border_right,
          bottom - border_bottom
        ]
        hover_box =
        [
          left,
          top,
          right,
          bottom
        ]
        break;
      }
      case "margin":
      {
        white_box =
        [
          left,
          top,
          right,
          bottom
        ]
        hover_box =
        [
          left - margin_left,
          top - margin_top,
          right + margin_right,
          bottom + margin_bottom
        ]
        break;
      }
    }

    // white box

    // hover boxes

    // grid

    ctx.clearRect(0, 0, doc_width, doc_height);
    ctx.fillStyle = FADE_OUT_COLOR;
    ctx.fillRect (0, 0, doc_width, doc_height);


    if( hover_box )
    {
      if( white_box )
      {
        draw_white_box(white_box);
        draw_hover_box(hover_box, white_box);
      }
      else
      {
        draw_default_hover_box(hover_box);
      }
      
    }
    else if( white_box )
    {
      draw_white_box(white_box);
    }
    else
    {
      ctx.clearRect(0, 0, doc_width, doc_height);

    }



    if( bottom > scrollBottom )
    {
      container.scrollTop += 80 + bottom - scrollBottom;
    }
    else if( top < scrollTop )
    {
      container.scrollTop += top - scrollTop - 80;
    }

    

    if( right > scrollRight )
    {
      container.scrollLeft += 80 + right - scrollRight;
    }
    else if( left < scrollLeft )
    {
      container.scrollLeft += left - scrollLeft - 80;
    }


  }

  var draw_white_box = function(box)
  {
    draw_box
    (
      box[LEFT], 
      box[TOP], 
      box[RIGHT] - box[LEFT], 
      box[BOTTOM] - box[TOP], 
      DEFAULT_HIGHLIGHT_COLOR
    );
  }

  var draw_default_hover_box = function(box)
  {
    draw_box
    (
      box[LEFT], 
      box[TOP], 
      box[RIGHT] - box[LEFT], 
      box[BOTTOM] - box[TOP], 
      HIGHLIGHT_COLOR
    );
    draw_horizontal_line(box[TOP]);
    draw_horizontal_line(box[BOTTOM] - 1);
    draw_vertical_line(box[LEFT]);
    draw_vertical_line(box[RIGHT] - 1);
  }

  var draw_hover_box = function(outer_box, inner_box)
  {
    draw_path
    (
      [
        inner_box[LEFT], inner_box[TOP], 
        outer_box[LEFT], outer_box[TOP], 
        outer_box[RIGHT], outer_box[TOP], 
        inner_box[RIGHT], inner_box[TOP]
      ],
      HIGHLIGHT_COLOR
    );
    draw_path
    (
      [
        inner_box[RIGHT], inner_box[TOP], 
        outer_box[RIGHT], outer_box[TOP], 
        outer_box[RIGHT], outer_box[BOTTOM], 
        inner_box[RIGHT], inner_box[BOTTOM]
      ],
      HIGHLIGHT_COLOR
    );
    draw_path
    (
      [
        inner_box[LEFT], inner_box[BOTTOM], 
        outer_box[LEFT], outer_box[BOTTOM], 
        outer_box[RIGHT], outer_box[BOTTOM], 
        inner_box[RIGHT], inner_box[BOTTOM]
      ],
      HIGHLIGHT_COLOR
    );
    draw_path
    (
      [
        inner_box[LEFT], inner_box[TOP], 
        outer_box[LEFT], outer_box[TOP], 
        outer_box[LEFT], outer_box[BOTTOM], 
        inner_box[LEFT], inner_box[BOTTOM]
      ],
      HIGHLIGHT_COLOR
    );
    
    draw_horizontal_line(outer_box[TOP]);
    draw_horizontal_line(outer_box[BOTTOM] - 1);
    draw_vertical_line(outer_box[LEFT]);
    draw_vertical_line(outer_box[RIGHT] - 1);
  }

  var draw_box = function(left, top, width, height, color)
  {
    ctx.save();
    ctx.fillStyle = color;
    ctx.clearRect(left, top, width, height);
    ctx.fillRect (left, top, width, height);
    ctx.restore();
  }

  var draw_path = function(path, color)
  {
    var
    x = 0,
    y = 0,
    i = 2;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(path[0], path[1]);
    for( ; i < path.length; i += 2 )
    {
      ctx.lineTo(path[i], path[i+1]);
    }
    ctx.fillStyle = "rgb(0,0,0,1)";
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = "source-over";
    ctx.fill();
    ctx.restore();
  }
  var draw_horizontal_line = function(top)
  {
    ctx.save();
    ctx.fillStyle = GRID_COLOR;
    ctx.clearRect(0, top, doc_width, 1);
    ctx.fillRect (0, top, doc_width, 1);
    ctx.restore();
  }

  var draw_vertical_line = function(left)
  {
    ctx.save();
    ctx.fillStyle = GRID_COLOR;
    ctx.clearRect(left, 0, 1, doc_height);
    ctx.fillRect (left, 0, 1, doc_height);
    ctx.restore();
  }




  
  init();
  
},

click_handler_dom = function(event)
{
  var 
  target = event.target,
  ref_index = "",
  metrics = null;
  
  while( target && !/node-container/i.test(target.nodeName) && ( target = target.parentElement ) );
  if(target && ( ref_index = target.getAttribute('ref-index') ) )
  {
    if( selected_node  )
    {
      selected_node.className = "";
    }
    selected_node = target;
    selected_node.className = "selected";
    test_doc_target = dom_nodes[ref_index];
    metrics = document.getElementById("metrics");
    metrics.innerHTML = "";
    metrics.render(templates.metrics(frames[0].getComputedStyle(test_doc_target, null)))
    highlighter.highlightNode(test_doc_target);
    setTimeout(function(){
      highlighter.highlightNode(test_doc_target, "clear");
    }, 800);
  }
  
},

click_handler_controls = function(event)
{
  var 
  handler = event.target && event.target.getAttribute('handler');
  

  if( test_doc_target && handler )
  {
    highlighter.highlightNode(test_doc_target, handler);
  }
  
},

mouseover = function(event)
{
  var 
  target = event.target,
  cls = {margin:1, border:1, padding:1, dimension:1};

  while(target && !(target.className in cls) && ( target = target.parentElement ) );
  if( target == current_target_metrics )
  {
    return;
  }
  if( current_target_metrics )
  {
    current_target_metrics.style.removeProperty("background-color");
    current_target_metrics.style.removeProperty("color");
  }
  current_target_metrics = target || null;
  if( current_target_metrics )
  {
    target.style.backgroundColor = 
      HIGHLIGHT_COLOR.replace(/rgba\( *(\d+) *, *(\d+) *, *(\d+).*/, "rgb($1,$2,$3)") ;
    current_target_metrics.style.color = "#fff";
  }

  if( test_doc_target )
  {
    highlighter.highlightNode
    (
      test_doc_target, current_target_metrics && current_target_metrics.className || "clear" 
    );
  }
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
          'class', 'padding'], ['li', style_dec.getPropertyValue(BORDER_RIGHT_WIDTH)]],
          ['ul', ['li', style_dec.getPropertyValue(BORDER_BOTTOM_WIDTH), 'colspan', '3']],
        'class', 'border'], 
        ['li', style_dec.getPropertyValue(MARGIN_RIGHT)]
      ],
      ['ul', ['li', style_dec.getPropertyValue(MARGIN_BOTTOM), 'colspan', '3']],
    'class', 'margin'], 
  'class', 'metrics', 'onmouseover', mouseover];
}



onload = init;