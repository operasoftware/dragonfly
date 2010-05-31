

cls.ReplService = function()
{
  if (cls.ReplService.instance)
  {
    return cls.ReplService.instance;
  }
  cls.ReplService.instance = this;

  this._on_consoleLog = function(msg)
  {
    opera.postError("Got console log " + msg);
  }.bind(this);


  this.init = function() {
    this._service = window.services['ecmascript-debugger'];
    this._service.addListener("consolelog", this._onConsoleLog);
  };

  this.init();

};
