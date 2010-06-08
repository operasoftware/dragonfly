window.cls = window.cls || (window.cls = {});

cls.ReplData = function()
{
  this._repllog = [];

  this._add_entry = function(type, data)
  {
    var entry = {
      time: (new Date()).getTime(),
      type: type,
      data: data
    };

    this._repllog.push(entry);
  };

  this.add_message = function(msg)
  {
    this._add_entry("consolelog", msg);
  };

  this.add_input = function(str)
  {
    this._add_entry("input", str);
  };

  this.add_output = function(str) {
    this._add_entry("output", str);
  };

  this.get_log = function (after) {
    after = after || 0;
    var filterfun = function(e) { return e.time > after; };
    return this.repllog.filter(filterfun);
  };


};
