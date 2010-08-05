(function()
{
  var get_path = function(ele)
  {
    var path = [], proto = null;
    while (ele && (proto = ele.parentNode) && 
        proto.parentNode.nodeName.toLowerCase() == 'examine-objects')
    {
      path.push([
        ele.getElementsByTagName('key')[0].textContent,
        parseInt(ele.getAttribute('obj-id')),
        parseInt(proto.getAttribute('data-proto-index'))
      ]);
      ele = proto.parentNode.parentNode;
    }
    return path.reverse();
  };

  var examine_object_cb = function(target, container, data_model, path)
  {
    container.render(window.templates.inspected_js_object(data_model, null, path));
    // update the icon
    target.style.backgroundPosition = "0px -11px";
  };

  window.eventHandlers.click['expand-prototype'] = function(event, target)
  {
    const PATH_PROTO_INDEX = 2;

    var
    parent = target.parentNode,
    data_model = window.inspections[parent.get_attr('parent-node-chain', 'data-id')],  
    is_unfolded = target.hasAttribute('is-unfolded'),
    path = get_path(parent);

    if (is_unfolded)
      data_model.collapse_prototype(path);
    else
      data_model.expand_prototype(path);
    var index = path.pop()[PATH_PROTO_INDEX];
    var templ = window.templates.inspected_js_prototype(data_model, path, index);
    parent.parentNode.re_render(templ);
  }

  window.eventHandlers.click['examine-object'] = function examine_objects(event, target)
  {
    /*
     // prototype header
     <examine-objects data-id="inspection-id-2">
      <div class="prototype" data-proto-index="0"/>
      <div class="prototype" data-proto-index="1">
        <div class="prototype-chain-object">
          <input type="button" handler="expand-prototype" class="folder-key inverted" proto-index="1"/>
          Function
        </div>
      </div>
      <div class="prototype" data-proto-index="2"/>
    </examine-objects>

    // object item
    <examine-objects rt-id="1" data-id="inspection-id-1" obj-id="1">
      <div class="prototype" data-proto-index="0">
        <item obj-id="112">
          <input type="button" handler="examine-object" class="folder-key"/>
          <key>ApplicationCache</key>
          <value class="object" >ApplicationCache</value>
        </item>
    */

    const PATH_OBJ_ID = 1;
    
    var
    parent = target.parentNode,
    data_model = window.inspections[parent.get_attr('parent-node-chain', 'data-id')],  
    examine_object = parent.getElementsByTagName('examine-objects')[0],
    path = get_path(parent);

    if (data_model)
    {
      if (examine_object) // is unfolded
      {
        if (!target.disabled)
        {
          data_model.collapse(path);
          parent.removeChild(examine_object);
          target.style.removeProperty("background-position");
        }
      }
      else
      {
        var cb = examine_object_cb.bind(null, target, parent, data_model, path);
        data_model.expand(cb, path);
      }
    }
  };

})();
