window.eventHandlers.click['examine-object'] = function examine_objects(event, target)
{
  /*
  <EXAMINE-OBJECTS rt-id="1" data-id="inspection-id-1" obj-id="1">
    <DIV class="prototype" data-proto-index="0">
      <ITEM obj-id="112">
        <INPUT type="button" handler="examine-object" class="folder-key"/>
        <KEY>ApplicationCache</KEY>
        <VALUE class="object" >ApplicationCache</VALUE>
      </ITEM>
  */
  const PATH_OBJ_ID = 1;
  
  var
  parent = target.parentNode,
  cur = parent,
  cur_proto = null,
  cur_examine = cur.parentNode.parentNode,
  obj_id = parseInt(cur_examine.getAttribute('obj-id')),
  data_model = window.inspections[cur_examine.getAttribute('data-id')],  
  examine_object = parent.getElementsByTagName('examine-objects')[0],
  path = [];

  if (data_model)
  {
    while (cur && 
      (cur_proto = cur.parentNode) && 
      (cur_examine = cur_proto.parentNode) &&
      cur_examine.nodeName.toLowerCase() == 'examine-objects')
    {
      path.push([
        cur.getElementsByTagName('key')[0].textContent,
        parseInt(cur.getAttribute('obj-id')),
        parseInt(cur_proto.getAttribute('data-proto-index'))
      ]);
      cur = cur_examine.parentNode;
    }
    if (obj_id !== path[path.length - 1][PATH_OBJ_ID])
    {
      path.push([
        data_model.get_identifier(),
        obj_id,
        0
      ]);
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
      data_model.inspect(cb, path);
    }
  }
};

window.eventHandlers.click['examine-object'].callback = function(target, container, data_model, path)
{
  container.render(window.templates.inspected_js_object(data_model, null, path));
  target.style.backgroundPosition = "0px -11px";
};
