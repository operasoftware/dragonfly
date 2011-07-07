cls.ConsoleLogger["2.0"].ConsoleMessage.prototype = new function()
{
  this.__defineGetter__("title", function()
  {
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
      return parts[0] == "Error:" ? parts[1].substr(6) : parts[0];
    }
    return "";
  });

  this.__defineGetter__("line", function()
  {
    var matcher = /[lL]ine (\d+)[:,]/;
    var linematch = matcher.exec(this.description);
    return linematch ? linematch[1] : null;
  });

  this.__defineGetter__("line_str", function()
  {
    var matcher = /[lL]ine (\d+)[:,][\r\n]/;
    var linematch = matcher.exec(this.description);
    return linematch ? linematch[0] : null;
  });

  this.__defineGetter__("desc_without_linenumber_line", function()
  {
    var main = this.description;
    if (main)
    {
      if (this.line_str)
      {
        main = main.replace(this.line_str, "");
      }
      while (main.startswith("\n"))
      {
        main = main.replace("\n", "");
      }
    }
    return main;
  });

  this.__defineGetter__("details", function()
  {
    var details = this.desc_without_linenumber_line.replace(this.title, "");
    if (details.startswith("\r\n"))
    {
      details = details.replace("\r\n", "");
    }
    else
    if (details.startswith("\n"))
    {
      details = details.replace("\n", "");
    }
    return details;
  });
};

