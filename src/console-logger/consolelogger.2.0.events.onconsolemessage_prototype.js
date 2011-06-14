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
      var matcher = /[lL]ine (\d*):/;
      var linematch = matcher.exec(this.description);
      return linematch ? linematch[1] : null;
    }).bind(this)();
    
    this.line_str = (function() // todo: mostly same as line
    {
      var matcher = /[lL]ine (\d*):/;
      var linematch = matcher.exec(this.description);
      return linematch ? linematch[0] : null;
    }).bind(this)();
    
    this.main = (function()
    {
      var main = this.description;
      if(main && this.line_str)
      {
        main = main.replace(this.line_str, "").replace(this.title, "")
        while (main.startswith("\n"))
        {
          main = main.replace("\n", "");
        }
      }
      return main;
    }).bind(this)();
  }
};

