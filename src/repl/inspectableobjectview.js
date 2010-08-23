


window.cls.InspectableObjectView = function(rt_id, obj_id, name, root)
{
  this.model = new cls.InspectableJSObject(rt_id, obj_id, name);
  this.show_root = root == undefined ? true : false;
  this.expanded = false;
};


window.cls.InspectableObjectView.prototype =
{
  render: function()
  {
    var tpl = window.templates.inspected_js_object(this.model, this.show_root);
    if (!tpl)
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + " Inspectable object template yielded no data");
    }
    return tpl;
  },

  expand: function(cb)
  {
    this.model.expand(function(){this.expanded = true; cb();}.bind(this));
  }
};


window.cls.InspectableDomNodeView = function(rt_id, obj_id, name, root)
{
  this.obj_id = obj_id;
  this.model = new cls.InspectableDOMNode(rt_id, obj_id);
  this.show_root = root == undefined ? true : false;
  this.expanded = false;
};

window.cls.InspectableDomNodeView.prototype =
{

  render: function()
  {
    var tpl = window.templates.inspected_dom_node(this.model, this.show_root);
    return tpl;
  },

  expand: function(cb)
  {
    var obj_id = this.obj_id;
    this.model.expand(function(){this.expanded = true; cb();}.bind(this), obj_id, "subtree");
  }
};
