window.cls || (window.cls = {});

cls.JSSidePanelView = function(id, name, view_list, default_unfolded_list)
{
  this.required_services = ["ecmascript-debugger"];
  this.init(id, name, view_list, default_unfolded_list);
};

cls.JSSidePanelView.prototype = SidePanelView.prototype;
