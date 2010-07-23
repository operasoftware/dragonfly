window.eventHandlers.click['get-children'] = function (event)
{
  var container = event.target.parentNode;
  var level = parseInt(container.style.marginLeft) || 0;
  var level_next = container.nextSibling && parseInt(container.nextSibling.style.marginLeft) || 0;
  var ref_id = parseInt(container.getAttribute('ref-id'));
  while (container && !container.hasAttribute('data-model-id'))
    container = container.parentNode;
  if (container.hasAttribute('data-model-id'))
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
