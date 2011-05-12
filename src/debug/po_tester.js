window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.PoTest = function(id, name, container_class)
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
    reader.onerror = function() { opera.postError("arrar!") } // fixme
    reader.readAsText(this._file);
  }

  this._on_loaded_po_bound = function(evt)
  {
    data = window.poparser.parseString(evt.target.result, "dragonfly");
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

  this._find_missing_interpolation_markers = function(entries)
  {
    var re = /%\(\w+\)(?:[^s]|$)/g;
    return entries.filter(function(e) { return e.msgstr.match(re) })
  }

  this._find_bad_interpolation_markers = function(entries)
  {
    var re = /%\((\w+\))s/g
    return entries.filter(function(e) {
      return (e.msgstr.match(re) || []).sort().join("") == (e.msgid.match(re) || []).sort().join("") ? null : e;
    });
  }

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
    //opera.postError("unhandled " + JSON.stringify(unhandled, null, "    "))
    this.update();
    client.setup();
  }

  this._on

  var eh = window.eventHandlers;
  eh.change["po-file-selected"] = this._on_selected_po_bound;
  eh.click["reload-po-data"] = this._on_clicked_reload_po_bound;
  eh.click["select-other-po"] = this._on_clicked_select_po_bound;

  this.init(id, name, container_class);
}
cls.debug.PoTest.prototype = ViewBase;


window.templates = window.templates || {};

window.templates.po_main = function(podata)
{
  if (podata)
  {
   return ["div", [
            ["p", "Loaded a PO file with " + podata.length + " entries."],
            ["button", "Reload PO file", "handler", "reload-po-data"],
            ["button", "Load another PO file", "handler", "select-other-po"],
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