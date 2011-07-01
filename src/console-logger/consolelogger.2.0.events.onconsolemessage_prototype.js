cls.ConsoleLogger["2.0"].ConsoleMessage.prototype = new function()
{
  this.__defineGetter__("title", function()
  {
    var parts = this.description.split("\n");
    if (parts.length)
    {
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

  this.__defineGetter__("expanding_part", function()
  {
    return this.desc_without_linenumber_line.replace(this.title, "");
  });
};

