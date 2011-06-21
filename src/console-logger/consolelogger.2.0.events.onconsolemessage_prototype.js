cls.ConsoleLogger["2.0"].ConsoleMessage.prototype = new function()
{
  this._init = function()
  {
    this.title = (function()
    {
      // console.log(this,  this.description);
      var parts = this.description.split("\n");
      if (parts.length)
      {
        return parts[0] == "Error:" ? parts[1].substr(6) : parts[0];
      }
      return "";
    }).bind(this)();
    
    this.line = (function()
    {
      var matcher = /[lL]ine (\d*)[:,]/;
      var linematch = matcher.exec(this.description);
      return linematch ? linematch[1] : null;
    }).bind(this)();
    
    this.line_str = (function() // todo: mostly same as line
    {
      var matcher = /[lL]ine (\d*)[:,]/;
      var linematch = matcher.exec(this.description);
      return linematch ? linematch[0] : null;
    }).bind(this)();
    
    this.main = (function()
    {
      var main = this.description;
      if(main)
      {
        if (this.title)
        {
          main = main.replace(this.title, "");
        }
        if (this.line_str)
        {
          // remove the line_str if it's followed by a line-break. can probably be solved in the regexp. applies mostly to css errors, not js_errors.
          main = main.replace(this.line_str + "\n", "");
        }
        while (main.startswith("\n"))
        {
          main = main.replace("\n", "");
        }
      }
      return main;
    }).bind(this)();
  }
};

