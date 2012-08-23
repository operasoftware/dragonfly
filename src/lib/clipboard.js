var Clipboard = function() {};

(function()
{
  var _content_editable_ele = null;
  // static methods

  this.set_string = function(string)
  {
    if (!_content_editable_ele)
      _content_editable_ele = document.querySelector("#contenteditable");
    _content_editable_ele.contentEditable = true;
    var listener = _set_string.bind(null, string);
    document.addEventListener("copy", listener, false);
    document.execCommand("copy");
    setTimeout(function()
    {
      document.removeEventListener("copy", listener, false);
      _content_editable_ele.contentEditable = false;
    }, 0);
  };

  this.populate_menu = function(event, all_items)
  {
    var copy_string = event.target.get_ancestor_attr("data-copy");
    if (copy_string)
    {
      var label = event.target.get_ancestor_attr("data-copy-label") || ui_strings.M_CONTEXTMENU_COPY;
      if (all_items.length)
        all_items.push(ContextMenu.separator);
      all_items.push({label: label,
                      handler: this.set_string.bind(this, copy_string),
                      id: "copy-clipboard"});
    }
  };

  var _set_string = function(string, event)
  {
    event.clipboardData.setData("text/plain", string);
    event.preventDefault();
  };

}).apply(Clipboard);

