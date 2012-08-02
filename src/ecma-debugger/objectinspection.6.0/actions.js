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
    data_model = window.inspections[target.get_attr('parent-node-chain', 'data-id')],
    is_unfolded = target.hasClass('unfolded'),
    path = get_path(target),
    name = target.getElementsByTagName('key')[0].textContent;

    if (is_unfolded)
      data_model.collapse_prototype(path);
    else
      data_model.expand_prototype(path);
    var index = path.pop()[PATH_PROTO_INDEX];
    var templ = window.templates.inspected_js_prototype(data_model, path, index, name);
    target.parentNode.re_render(templ);
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
        var cb = examine_object_cb.bind(this, target, parent, data_model, path);
        data_model.expand(cb, path);
      }
    }
  };

  window.eventHandlers.click['get-getter-value'] = function examine_objects(event, target)
  {
    var obj_id = Number(target.get_attr('parent-node-chain', 'obj-id'));
    var data_model = window.inspections[target.get_attr('parent-node-chain', 'data-id')];
    var parent = target.get_ancestor("item");
    var key = parent && parent.querySelector("key");
    var path = data_model && data_model.norm_path(get_path(parent));
    if (obj_id && data_model && key && path)
    {
      var getter = key.textContent;
      var cb = _expand_getter.bind(null, target, obj_id, data_model, getter, path);
      var tag = window.tag_manager.set_callback(null, cb, []);
      var ex_ctx = window.runtimes.get_execution_context();
      var rt_id = ex_ctx.rt_id;
      var thread_id = ex_ctx.thread_id;
      var frame_index = ex_ctx.frame_index;
      if (data_model.runtime_id != rt_id)
      {
        rt_id = data_model.runtime_id;
        thread_id = 0;
        frame_index = 0;
      }
      var script = "obj[\"" + window.helpers.escape_input(getter) + "\"]";
      var msg = [rt_id, thread_id, frame_index, script, [["obj", obj_id]]];
      window.services["ecmascript-debugger"].requestEval(tag, msg);
    }
  };

  window.eventHandlers.click['expand-scope-chain'] = function(event, target)
  {
    var
    parent = target.parentNode,
    data_model = window.inspections[target.getAttribute('data-id')],
    examine_object = parent.getElementsByTagName('examine-objects')[0];

    if (examine_object) // is unfolded
    {
      data_model.collapse_scope_chain();
      parent.re_render(window.templates.inspected_js_scope_chain(data_model));
    }
    else
    {
      data_model.expand_scope_chain();
      parent.re_render(window.templates.inspected_js_scope_chain(data_model));
    }
  };

  var _expand_getter = function(target, obj_id, data_model, getter, path, status, message)
  {
    var PATH_PROTO_INDEX = 2;
    var STATUS_OK = 0;
    if (status === STATUS_OK &&
        data_model.set_getter_value(obj_id, getter, message) &&
        target.parentNode && target.parentNode.parentNode)
    {
      var index = path.pop()[PATH_PROTO_INDEX];
      var templ = window.templates.inspected_js_prototype(data_model, path, index);
      target.parentNode.parentNode.re_render(templ);
    }
  };

  var _inspect_object = function(rt_id, obj_id, force_show_view)
  {
    messages.post('active-inspection-type', {inspection_type: 'object'});
    if (force_show_view)
    {
      UI.get_instance().show_view(views.inspection.id);
    }
    messages.post('object-selected', {rt_id: rt_id, obj_id: obj_id});
  };

  window.eventHandlers.click['inspect-object-link'] = function(event, target)
  {
    var rt_id = Number(target.get_ancestor_attr('rt-id') ||
                       target.get_ancestor_attr('data-rt-id'));
    var obj_id = Number(target.get_ancestor_attr('obj-id') ||
                        target.get_ancestor_attr('data-obj-id'));
    if (rt_id && obj_id)
      _inspect_object(rt_id, obj_id, true);
  };

  window.eventHandlers.click['inspect-object-inline-link'] = function(event, target)
  {
    if (event.target.nodeName.toLowerCase() == "key" &&
        event.target.parentNode.hasAttribute('obj-id'))
    {
      var obj_id = parseInt(event.target.parentNode.getAttribute('obj-id'));
      var model_id = event.target.get_attr('parent-node-chain', 'data-id');
      var model = model_id && window.inspections[model_id];
      var rt_id = model && model.runtime_id;
      _inspect_object(rt_id, obj_id);
    }
  };

})();
