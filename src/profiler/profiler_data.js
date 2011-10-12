var ProfilerData = function()
{
  this._event_list = {};

  this.set_event_list = function(event_list)
  {
    this._event_list = event_list;
  };

  this.get_event_list = function()
  {
    return this._event_list;
  };

  this.clear_event_list = function()
  {
    this._event_list = {};
  };
};

