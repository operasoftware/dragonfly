window.eventHandlers.click['examine-object'] = function examine_objects(event, target)
{
  var
  parent = target.parentNode,
  obj_id = parseInt(parent.parentNode.getAttribute('obj-id')),
  data_model = window.inspections[parent.parentNode.getAttribute('data-id')],  
  examine_object = parent.getElementsByTagName('examine-objects')[0],
  cur = parent,
  path = [];

  if (data_model)
  {
    while (cur && cur.parentNode && cur.parentNode.nodeName.toLowerCase() == 'examine-objects')
    {
      path.push(parseInt(cur.getAttribute('obj-id')));
      cur = cur.parentNode.parentNode;
    }
    if (obj_id !== path[path.length - 1])
    {
      path.push(obj_id);
    }
    path.reverse();
    if (examine_object) // is unfolded
    {
      if (!target.disabled)
      {
        data_model.clear_data(path);
        parent.removeChild(examine_object);
        target.style.removeProperty("background-position");
      }
    }
    else
    {
      var cb = examine_objects.callback.bind(null, target, parent, data_model, path);
      data_model.inspect(path, cb);
    }
  }
};

window.eventHandlers.click['examine-object'].callback = function(target, container, data_model, path)
{
  container.render(window.templates.inspect_object(data_model, path));
  target.style.backgroundPosition = "0px -11px";
};
