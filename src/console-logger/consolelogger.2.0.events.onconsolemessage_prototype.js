cls.ConsoleLogger["2.0"].ConsoleMessage.prototype = new function()
{
  this.__defineGetter__("title", function()
  {
    if (this._cached_title)
    {
      return this._cached_title;
    }
    var matcher = /^.*[\r\n]*/;
    var linematch = matcher.exec(this.description);
    return this._cached_title = linematch ? linematch[0] : " ";
  });

  this.__defineGetter__("location_string", function()
  {
    if (this._cached_location_string)
    {
      return this._cached_location_string;
    }
    var location_string = (this.uri ? helpers.basename(this.uri) : this.context);
    if (this.line)
    {
      location_string += ":" + this.line;
    }
    return this._cached_location_string = location_string;
  });

  this.__defineGetter__("line", function()
  {
    if (this._cached_line)
    {
      return this._cached_line;
    }
    var matcher = /[lL]ine (\d+)[:,]/;
    var linematch = matcher.exec(this.description);
    return this._cached_line = (linematch ? linematch[1] : null);
  });

  this.__defineGetter__("line_str", function()
  {
    if (this._cached_line_str)
    {
      return this._cached_line_str;
    }
    var matcher = /[lL]ine \d+[:,][\r\n]/;
    var linematch = matcher.exec(this.description);
    return this._cached_line_str = (linematch ? linematch[0] : null);
  });

  this.__defineGetter__("details", function()
  {
    if (this._cached_details)
    {
      return this._cached_details;
    }
    var details = this.description.replace(this.title, "").replace(this.line_str, "");
    return this._cached_details = details;
  });
};

