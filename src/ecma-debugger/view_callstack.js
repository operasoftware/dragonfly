window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.CallstackView = function(id, name, container_class)
{
  this._clear_view = function()
  {
    var container = document.getElementById(this._container_id);
    if (container)
    {
      container.innerHTML = this._not_stopped_content;
      this._clear_timeout = 0;
    }
  };

  this.createView = function(container)
  {
    var list = container.getElementsByTagName('ul')[0];
    if (!list)
    {
      container.innerHTML = "<div id='backtrace-container'><ul id='backtrace'></ul></div>";
      list = container.getElementsByTagName('ul')[0];
    }

    if (this._clear_timeout)
    {
      clearTimeout(this._clear_timeout);
      this._clear_timeout = 0;
    }

    var _frames = stop_at.getFrames();
    list.innerHTML = _frames.length ? "" : this._not_stopped_content;
    for (var i = 0, frame; frame = _frames[i]; i++)
    {
      list.render(templates.frame(frame, i == this._selected_frame));
    }
  };

  this.clearView = function()
  {
    this._clear_timeout = setTimeout(this._clear_view_bound, 150);
  };

  this._onframeselected = function(msg)
  {
    this._selected_frame = msg.frame_index;
  };

  this._init = function(id, name, container_class)
  {
    this.required_services = ["ecmascript-debugger"];
    this._container_id = "backtrace";
    this._clear_timeout = 0;
    this._not_stopped_content = "<li class='not-stopped'>" +
                                   ui_strings.M_VIEW_LABEL_NOT_STOPPED +
                                "</li>";
    this._selected_frame = 0;
    this._clear_view_bound = this._clear_view.bind(this);
    window.messages.addListener('frame-selected', this._onframeselected.bind(this));
    this.init(id, name, container_class);
  };

  this._init(id, name, container_class);
};
