

cls.ReplService = function(view)
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

  this._on_eval_done = function(status, msg)
  {
    opera.postError("Got eval log " + status + " " + msg);
    this._view.render_string(msg[2]);
  }.bind(this);


  this.handle_input = function(input)
  {
    this._evaluate_input(input);
  }.bind(this);



  this._evaluate_input = function(input)
  {
    var cooked = this._transformer.transform(input);
    opera.postError(cooked);
    var rt_id = runtimes.getSelectedRuntimeId();
    var tag = this._tagman.set_callback(this, this._on_eval_done);
    this._service.requestEval(tag, [rt_id, 0, 0, cooked]);

  };

  this.init = function(view) {
    this._view = view;
    opera.postError("THE VIEW IS " + view)
    this._transformer = new HostCommandTransformer();
    this._tagman = window.tagManager; //TagManager.getInstance(); <- fixme: use singleton
    this._service = window.services['ecmascript-debugger'];
    this._service.addListener("consolelog", this._onConsoleLog);
  };

  this.init(view);
};
