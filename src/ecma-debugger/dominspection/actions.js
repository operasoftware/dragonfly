window.eventHandlers.click['get-children'] = function (event)
{
  var container = event.target.parentNode;
  var level = parseInt(container.style.marginLeft) || 0;
  var level_next = container.nextSibling && parseInt(container.nextSibling.style.marginLeft) || 0;
  var ref_id = parseInt(container.getAttribute('ref-id'));
  if (container = container.has_attr("parent-node-chain", "data-model-id"))
  {
    var model = window.dominspections[container.getAttribute('data-model-id')];
    var target = document.getElementById('target-element');
    var is_editable = container.hasAttribute('edit-handler');
    var cb = null;
    var target_id = 0;

    if (container.contains(target))
      target_id = parseInt(target.getAttribute('ref-id'));
    if (level_next > level)
    {
      model.collapse(ref_id);
      window.eventHandlers.click['get-children'].callback(container, model, target_id, is_editable);
    }
    else
    {
      cb = window.eventHandlers.click['get-children'].callback.bind(null, container, model, target_id, is_editable);
      model.expand(cb, ref_id, event.ctrlKey ? 'subtree' : 'children');
    }
  }
};

window.eventHandlers.click['get-children'].callback = function(container, model, target_id, is_editable)
{
  var tmpl = window.templates.inspected_dom_node(model, target_id, is_editable, true);
  container.re_render(tmpl);
};

window.eventHandlers.click['spotlight-node'] = function(event, current_target)
{
  var 
  obj_id = parseInt(current_target.getAttribute('ref-id')),
  model_id = current_target.get_attr("parent-node-chain", "data-model-id"),
  inspections = window.dominspections,
  model = null,
  target = null,
  css_path = null;

  if (model_id && obj_id)
  {
    model = inspections[model_id];
    hostspotlighter.spotlight(obj_id,
                              settings.dom.get('scroll-into-view-on-spotlight') && 
                              obj_id != (inspections.active && inspections.active.target));
    model.target = obj_id;
    inspections.active = model;
    window.messages.post("element-selected", {model: model, obj_id: obj_id, rt_id: model.getDataRuntimeId()});
    if (current_target)
    {
      if (target = document.getElementById('target-element'))
        target.removeAttribute('id');
      if (!window.settings.dom.get('dom-tree-style') && /<\//.test(current_target.firstChild.textContent))
      {
        while ((current_target = current_target.previousSibling) && 
                current_target.getAttribute('ref-id') != obj_id);
      }
      topCell.statusbar.updateInfo(templates.breadcrumb(model, obj_id));
    }
    if (current_target)
      current_target.id = 'target-element';
  }
};

window.eventHandlers.click['breadcrumb-link'] = function(event, target)
{
  var 
  obj_id = parseInt(target.getAttribute('obj-id')),
  model_id = target.get_attr("parent-node-chain", "data-model-id"),
  inspections = window.dominspections,
  model = null;

  if (model_id && obj_id)
  {
    model = inspections[model_id];
    model.target = obj_id;
    inspections.active = model;
    window.messages.post("element-selected", {model: model, obj_id: obj_id, rt_id: model.getDataRuntimeId()});
    var target = document.getElementById('target-element');
    if (target)
    {
      target.removeAttribute('id');
      while (target && !/container/i.test(target.nodeName) && (target = target.parentElement));
      if (target)
      {
        var divs = target.getElementsByTagName('div'), div = null, i = 0;
        for ( ; (div = divs[i]) && div.getAttribute('ref-id') != obj_id; i++);
        if (div)
        {
          div.id = 'target-element';
          window.helpers.scroll_dom_target_into_view();
          hostspotlighter.spotlight(obj_id, true);
        }
      }
    }
  }
};

window.eventHandlers.mouseover['spotlight-node'] = function(event, target)
{
  if(settings['dom'].get('highlight-on-hover'))
  {
    hostspotlighter.soft_spotlight(parseInt(target.getAttribute('ref-id')));
  }
}

window.eventHandlers.click['dom-inspection-export'] = function(event)
{
  export_data.data = window.helpers.escapeTextHtml(views['dom'].export_markup());
  topCell.showView('export_data');
};

// button handlers
window.eventHandlers.click['dom-inspection-snapshot'] = function(event, target)
{
  dom_data.get_snapshot();
};

window.eventHandlers.click['df-show-live-source'] = function(event, target)
{
  debug_helpers.liveSource.open();
};

window.eventHandlers.click['dom-resource-link'] = function(event, target)
{
  window.eventHandlers.dblclick['edit-dom'].delay(arguments.callee.execute, event, target);
};

window.eventHandlers.click['dom-resource-link'].execute = function(event, target)
{
  var
  url = target.textContent,
  rt_id = target.parentNode.parentNode.parentNode.getAttribute('rt-id')
    // for the case of dom tree-style
    || target.parentNode.parentNode.parentNode.parentNode.getAttribute('rt-id');
  // TODO use the exec service to open new link when it's ready
  window.open(helpers.resolveURLS(runtimes.getURI(rt_id), url.slice(1, url.length - 1)), "_blank");
};

window.eventHandlers.dblclick['edit-dom'] = (function(event, target)
{
  var click_timeouts = new Timeouts();
  var handler = function(event, target)
  {
    click_timeouts.clear();
    actions['dom'].editDOM(event, target);
  };
  handler.delay = function()
  {
    click_timeouts.set.apply(click_timeouts, [arguments[0], 300, arguments[1], arguments[2]]);
  }
  return handler;
})();
