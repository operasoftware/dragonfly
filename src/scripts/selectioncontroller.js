var SelectionController = function(css_query_selectable, css_query_not_selectable)
{
  /* interface */

  this.is_selectable = function(target){};

  /* private */

  var _selectable = null;
  var _start_node = null;
  var _start_offset = 0;

  const RE_TEXT_INPUTS = GlobalActionHandler.RE_TEXT_INPUTS;

  var mousedown = function(event)
  {
    var target = event.target;
    if (target.nodeName.toLowerCase() == "textarea" ||
        target.nodeName.toLowerCase() == "select" ||
        (target.nodeName.toLowerCase() == "input" &&
         RE_TEXT_INPUTS.test(target.type)))
      return;

    if (_selectable = is_selectable(event.target))
    {
      this.addEventListener('mousemove', mousemove, false);
      this.addEventListener('mouseup', mouseup, false);
    }
    else
    {
      event.preventDefault();
    }

    _start_node = null;
  };

  var mousemove = function()
  {
    var sel = getSelection();
    if (sel && !sel.isCollapsed)
    {
      if (!_start_node)
      {
        _start_node = sel.anchorNode;
        _start_offset = sel.anchorOffset;
      }

      var range = sel.getRangeAt(0);
      if (range && !_selectable.contains(range.commonAncestorContainer))
      {
        if (sel.anchorNode == range.startContainer)
        {
          var last = _selectable.lastChild;
          if (last)
            range.setEnd(last, last.nodeType == 3 ?
                               last.nodeValue.length :
                               last.childNodes.length);
        }
        else
        {
          if (_selectable.firstChild)
          {
            range.setStart(_selectable.firstChild, 0);
            range.setEnd(_start_node, _start_offset);
          }
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
    if (target.get_ancestor(css_query_not_selectable))
      return null;

    return target.get_ancestor(css_query_selectable);
  };

  this.is_selectable = function(target)
  {
    return is_selectable(target);
  };

  document.addEventListener('mousedown', mousedown, true);

};
