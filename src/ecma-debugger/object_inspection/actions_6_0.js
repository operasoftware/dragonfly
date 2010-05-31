window.eventHandlers.click['examine-object'] = function(event, target)
{
  var
  parent = target.parentNode,
  parent_parent = parent.parentNode,
  obj_id = parseInt(parent.getAttribute('obj-id')),
  rt_id = parseInt(parent_parent.getAttribute('rt-id')),
  data_id = parent_parent.getAttribute('data-id'),
  data = null,
  examine_object = parent.getElementsByTagName('examine-objects')[0],
  cur = parent,
  path = [];

  while (cur && cur.parentNode && cur.parentNode.nodeName.toLowerCase() == 'examine-objects')
  {
    path.push(parseInt(cur.getAttribute('obj-id')));
    cur = cur.parentNode.parentNode;
  }
  path.push(parseInt(parent_parent.getAttribute('obj-id')));
  path.reverse();

  if (window[data_id])
  {
    if (examine_object) // is unfolded
    {
      if (!target.disabled)
      {
        window[data_id].clearData(rt_id, obj_id, path);
        parent.removeChild(examine_object);
        target.style.removeProperty("background-position");
      }
    }
    else
    {
      if (data = window[data_id].get_data(path, arguments))
      {
        if (data.length)
        {
          parent.render(window.templates.inspect_object(window[data_id], path));
          target.style.backgroundPosition = "0px -11px";
        }
        else
        {
          target.disabled = true;
        }
      }
    }
  }
};