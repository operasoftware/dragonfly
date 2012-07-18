window.cls || (window.cls = {});

cls.PoTestView = function(id, name, container_class)
{
  this._podata = null;
  this._file = null;


  this.createView = function(container)
  {
    container.clearAndRender(templates.po_main(this._podata));
  }

  this._on_selected_po_bound = function(evt, target)
  {
    this._file = target.files[0];
    this._load_current_file();
  }.bind(this);

  this._load_current_file = function()
  {
    var reader = new FileReader();
    reader.onload = this._on_loaded_po_bound;
    reader.onerror = function() { opera.postError("Error reloading current file") };
    reader.readAsText(this._file);
  }

  this._on_loaded_po_bound = function(evt)
  {
    data = potools.parse(evt.target.result, "dragonfly");
    this._podata = data;
    this._update_uistrings();
  }.bind(this);

  this._on_clicked_reload_po_bound = function()
  {
    this._load_current_file();
  }.bind(this);

  this._on_clicked_select_po_bound = function()
  {
    this._podata = null;
    this._file = null;
    this.update();
  }.bind(this);

  this._update_uistrings = function()
  {
    var unhandled = [];
    for (var n=0, entry; entry=this._podata[n]; n++)
    {
      if (entry.msgctxt in window.ui_strings)
      {
        window.ui_strings[entry.msgctxt] = entry.msgstr;
      }
      else
      {
        unhandled.push(entry);
      }
    }
    client.setup();
  }

  var eh = window.eventHandlers;
  eh.change["po-file-selected"] = this._on_selected_po_bound;
  eh.click["reload-po-data"] = this._on_clicked_reload_po_bound;
  eh.click["select-other-po"] = this._on_clicked_select_po_bound;

  this.init(id, name, container_class);
}
cls.PoTestView.prototype = ViewBase;

window.templates = window.templates || {};

window.templates.po_main = function(podata)
{
  if (podata)
  {
    var bad_markers = potools.malformed_interpolation_markers(podata);
    var missing_markers = potools.missing_interpolation_markers(podata);
    var errortpls = [];

    if (bad_markers.length) {
      errortpls.push(
        ["p", "Some translated strings contain bad interpolation markers! Missing s at the end: " +
              bad_markers.map(function(e) { return e.msgctxt }).join(", ")]
      )
    }

    if (missing_markers.length) {
      errortpls.push(
        ["p", "Some translated strings interpolation markers do not match the English version: " +
              missing_markers.map(function(e) { return e.msgctxt }).join(", ")]
      )
    }


   return ["div", [
            ["p", "Loaded a PO file with " + podata.length + " entries."],
            ["button", "Reload PO file", "handler", "reload-po-data"],
            ["button", "Load another PO file", "handler", "select-other-po"],
            errortpls,
          "class", "padding"]
          ];
  }
  else
  {
    return [
      "div", [
        ["label", "Select a po file to load: "],
        ["input", "Paste the contents of a po file", "type", "file", "handler", "po-file-selected"],
      "class", "padding"]
    ]
  }
}
