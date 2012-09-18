var Clipboard = function() {};

(function()
{
  var _content_editable_ele = null;
  var _is_supported = false;
  var _is_copy_action = false;

  /* static methods */

  this.set_string = function(string)
  {
    _is_copy_action = true;
    var listener = _set_string.bind(null, string);
    document.addEventListener("copy", listener, false);
    document.execCommand("copy");
    setTimeout(_remove_listener.bind(null, listener), 0);
  };

  this.populate_menu = function(event, all_items)
  {
    if (!_is_supported)
      return;
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

  this.add_listener = function(type, listener, is_capturing)
  {
    var wrapped = function(event)
    {
      if (!_is_copy_action)
        listener(event);
    };
    document.addEventListener(type, wrapped, Boolean(is_capturing));
  };

  var _set_string = function(string, event)
  {
    event.clipboardData.setData("text/plain", string);
    event.preventDefault();
  };

  var _remove_listener = function(listener)
  {
    document.removeEventListener("copy", listener, false);
    _is_copy_action = false;
  };

  var _test_support = function()
  {
    var listener = function(event) { _is_supported = true; };
    document.addEventListener("copy", listener, false);
    setTimeout(_remove_listener.bind(null, listener), 0);
    try { document.execCommand("copy"); } catch(e) {};
  };

  this.__defineGetter__("is_supported", function() { return _is_supported; });
  this.__defineSetter__("is_supported", function() { });

  window.addEventListener("load", _test_support, false);

}).apply(Clipboard);
