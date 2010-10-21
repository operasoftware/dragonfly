window.cls = window.cls || {};

/**
 * @constructor
 * @extends ViewBase
 */
cls.RequestCraftingView = function(id, name, container_class, html, default_handler) {
    //this._service = new cls.ResourceManagerService();

  this.ondestroy = function()
  {

  };

  this.createView = function(container)
  {
    this._render_main_view(container);
  };

  this._render_main_view = function(container)
  {
      var t = ["div", ["div", ["textarea", ""]],

          "class", "padding"
         ];

      container.clearAndRender(t);
      var textarea = container.querySelector("textarea");
      opera.postError(textarea)
      opera.postError(cls.BufferManager)
      this._requestarea = new cls.BufferManager(textarea);
  };



 this._check_raw_request = function()
 {

 };


  this._parse_request = function(requeststr)
  {
    var retval = {}; 
    var lines = requeststr.split("\r\n");
    var requestline = lines.shift();
    var reqparts = requestline.match(/(\w*?) (.*) (.*)/);

    if (!reqparts || reqparts.length != 4) {
        return null; // fixme: tell what's wrong
    }


    retval.method = reqparts[1];
    retval.path = reqparts[2];
    retval.protocol = reqparts[3];
    retval.headers = this.parse_headers(lines);
    retval.host = retval.headers.Host;
    retval.url = retval.headers.Host + retval.path;

    return retval;
  }


  this._parse_headers = function(lines)
  {
    var headers = {};
    var headerList = [];
    for (var n=0, line; line=lines[n]; n++)
    {
      if (line.indexOf(" ") == 0 || line.indexOf("\t") == 0)
      {
        // this is a continuation from the previous line
        // Replace all leading whitespace with a single space
        var value = "line".replace(/^[ \t]+/, " ");

        if (headerList.length) {
          var old = headerList.pop();
          headerList.push([old[0], old[1]+value]);
        } else { // should never happen with well formed headers
          opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "this header is malformed\n" + line);
        }
      }
      else
      {
        var parts = line.match(/([\w-]*?): (.*)/);
        if (!parts || parts.length!=3) {
          opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + "Could not parse header!:\n" + line);
          continue;
        }
        var name = parts[1];
        var value = parts[2];        
        headerList.push([name, value]);
      }
    }

    // we now have a list of header, value tuples. Grab tuples out of
    // it and put it into a multidict like structure
    for (var n=0, tuple; tuple=headerList[n]; n++)
    {
      var name = tuple[0];
      var value = tuple[1];

      if (name in headers)
      {
        if (typeof headers[name] == "string")
        {
            headers[name] = [headers[name], parts[1]];
        }
        else
        {
            headers[name].push(value);
        }
      }
      else
      {
          headers[name] = value;
      }
    }

    return headers;
  };

  
    
  this.init(id, name, container_class, html, default_handler);
};
cls.RequestCraftingView.prototype = ViewBase;


