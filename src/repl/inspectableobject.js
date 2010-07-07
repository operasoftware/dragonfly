


window.cls.InspectableObjectView = function(rt_id, obj_id, name)
{
  this.model = new cls.InspectableJSObject(rt_id, obj_id, name);
  this.render = function()
  {
    return window.templates.inspected_js_object(this.model);
  };
};



