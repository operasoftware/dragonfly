cls.ConsoleLogger["2.0"].ConsoleMessage.prototype = new function()
{
  this.__defineGetter__("title", function()
  {
    if (this._cached_title)
    {
      return this._cached_title;
    }
    var parts = this.description.split("\n");
    if (parts.length)
    {
              // todo: remove
              if (parts[0] == "Error:")
              {
                // todo: can probably remove the special "Error:" treatment? haven't seen that anywhere?
                window.___MESSAGE_THAT_STARTS_WITH_ERROR = this;
                console.log("Info: Logged error message that starts with an \"Error:\" line. Stored as ___MESSAGE_THAT_STARTS_WITH_ERROR");
              }
      return this._cached_title = (parts[0] == "Error:" ? parts[1].substr(6) : parts[0]);
    }
    return this._cached_title = "";
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
    var details = this.description;
    // remove title
    if (this.title)
    {
      details = details.replace(this.title, "");
    }
    // remove line_str
    if (this.line_str)
    {
      details = details.replace(this.line_str, "");
    }
    // collapse dubble newlines into one.
    // todo: if line_str included the linebreak, this probably wouldn't be needed.
    details = details.replace(/(\n\n|\r\n\r\n|\r\r)/, "\n");
    return this._cached_details = details;
  });
};

