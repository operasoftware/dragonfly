var SelectionController = function(css_query_selectable, if_check)
{
  /* interface */

  this.is_selectable = function(target){};

  /* private */

  var selectable = null;
  var start_node = null;
  var start_offset = 0;

  const RE_TEXT_INPUTS = GlobalActionHandler.RE_TEXT_INPUTS;

  var mousedown = function(event)
  {
    var target = event.target;
    if (target.nodeName.toLowerCase() == "textarea" ||
        (target.nodeName.toLowerCase() == "input" && 
         RE_TEXT_INPUTS.test(target.type)))
      return;

    if (selectable = is_selectable(event.target))
    {
      this.addEventListener('mousemove', mousemove, false);
      this.addEventListener('mouseup', mouseup, false);
    }
    else
      event.preventDefault();

    start_node = null;
  };

  var mousemove = function()
  {
    var sel = getSelection();
    if (sel && !sel.isCollapsed)
    {
      if (!start_node)
      {
        start_node = sel.anchorNode;
        start_offset = sel.anchorOffset;
      }

      var range = sel.getRangeAt(0);
      if (range && !selectable.contains(range.commonAncestorContainer))
      {
        if (sel.anchorNode == range.startContainer)
        {
          var last = selectable.lastChild;
          range.setEnd(last, last.nodeType == 3 ?
                             last.nodeValue.length :
                             last.childNodes.length);
        }
        else
        {
          range.setStart(selectable.firstChild, 0);
          range.setEnd(start_node, start_offset);
        }
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  var mouseup = function()
  {
    this.removeEventListener('mousemove', mousemove, false);
    this.removeEventListener('mouseup', mouseup, false);
    setTimeout(mousemove, 0);
  };

  var is_selectable = function(target)
  {
    var cur = target.get_ancestor(css_query_selectable);
    return cur && (if_check && if_check(cur)) && cur || null;
  };

  this.is_selectable = function(target)
  {
    return is_selectable(target);
  };

  document.addEventListener('mousedown', mousedown, true);

};
