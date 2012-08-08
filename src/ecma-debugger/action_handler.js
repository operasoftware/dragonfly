window.eventHandlers.click['show-frame'] = function(event)
{
  var target = event.target.has_attr("parent-node-chain", "ref-id");
  var ref_id = parseInt(target.getAttribute("ref-id"));

  var frame = stop_at.getFrame(ref_id);
  if (frame)
  {
    topCell.showView(views['inspection'].id);
    messages.post('active-inspection-type', {inspection_type: 'frame'});
    messages.post('frame-selected', {frame_index: ref_id});
    if (event.type == 'click')
    {
      helpers.setSelected(target);
      if (views.js_source.isvisible())
      {
        if (frame.script_id)
        {
          views.js_source.showLine(frame.script_id, frame.line);
          views.js_source.showLinePointer(frame.line, frame.id == 0);
        }
        else
        {
          views.js_source.clearView();
        }
      }
    }
  }
  else
  {
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE + "missing frame in 'show-frame' handler");
  }
};

window.eventHandlers.click["goto-script-line"] = function(event, target)
{
  var script_id = Number(event.target.get_attr("parent-node-chain", "data-script-id"));
  var script_line = Number(event.target.get_attr("parent-node-chain", "data-script-line"));
  window.views.js_source.show_and_flash_line(script_id, script_line);
};

window.eventHandlers.click['expand-value'] = function(event, target)
{
  var
  val = target.parentNode.getElementsByTagName('value')[0],
  text_content = val.textContent;

  val.textContent = val.getAttribute('data-value');
  val.setAttribute('data-value', text_content);
  if (target.style.backgroundPosition)
  {
    target.style.removeProperty('background-position');
  }
  else
  {
    target.style.backgroundPosition = '0px -11px';
  }
};

window.eventHandlers.click['examine-object-2'] = function(event, target)
{
  var
  parent = target.parentNode,
  parent_parent = parent.parentNode,
  obj_id = parseInt(parent.getAttribute('obj-id')),
  depth = parseInt(parent.getAttribute('depth')),
  rt_id = parseInt(parent_parent.getAttribute('rt-id')),
  data_id = parent_parent.getAttribute('data-id'),
  data = null,
  examine_object = parent.getElementsByTagName('examine-objects')[0];

  if (window[data_id])
  {
    if (examine_object) // is unfolded
    {
      if (!target.disabled)
      {
        window[data_id].clearData(rt_id, obj_id, depth, parent.getElementsByTagName('key')[0].textContent);
        parent.removeChild(examine_object);
        target.style.removeProperty("background-position");
      }
    }
    else
    {
      if (data = window[data_id].getData(rt_id, obj_id, depth, arguments))
      {
        if (data.length)
        {
          examine_object = parent_parent.cloneNode(false);
          examine_object.innerHTML = window[data_id].prettyPrint(data, depth,
            settings['inspection'].get("hide-default-properties"), window[data_id].filter_type);
          parent.appendChild(examine_object);
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

window.eventHandlers.click['show-scripts'] = function(event)
{
  var runtime_id = event.target.getAttribute('runtime_id');
  var scripts = runtimes.getScripts(runtime_id);
  var scripts_container = event.target.parentNode.getElementsByTagName('ul')[0];
  var script = null, i = 0;

  if (scripts_container)
  {
    event.target.parentNode.removeChild(scripts_container);
    event.target.style.removeProperty('background-position');
    runtimes.setUnfolded(runtime_id, 'script', false);
  }
  else
  {
    scripts_container = ['ul'];
    for ( ; script = scripts[i]; i++)
    {
      scripts_container.push(templates.scriptLink(script));
    }
    scripts_container.splice(scripts_container.length, 0, 'runtime-id', runtime_id);
    event.target.parentNode.render(scripts_container);
    event.target.style.backgroundPosition = '0 -11px';
    runtimes.setUnfolded(runtime_id, 'script', true);
  }
};

window.eventHandlers.click['show-stylesheets'] = function(event, target)
{
  var rt_id = target.getAttribute('runtime_id');
  // stylesheets.get_stylesheets will call this function again if data is not avaible
  // handleGetAllStylesheets in stylesheets will
  // set for this reason __call_count on the event object
  var sheets = cls.Stylesheets.get_instance().get_stylesheets(rt_id, arguments);
  if (sheets)
  {
    var container = event.target.parentNode.getElementsByTagName('ul')[0];
    var sheet = null, i = 0;
    if (container)
    {
      target.parentNode.removeChild(container);
      target.style.removeProperty('background-position');
      runtimes.setUnfolded(rt_id, 'css', false);
    }
    else
    {
      container = ['ul'];
      for ( ; sheet = sheets[i]; i++)
      {
        container.push(templates.sheetLink(sheet, i));
      }
      container.splice(container.length, 0, 'runtime-id', rt_id);
      event.target.parentNode.render(container);
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setUnfolded(rt_id, 'css', true);
    }
  }
};

window.eventHandlers.click['continue'] = function(event)
{
  this.broker.dispatch_action('global', event.target.id);
};

window.eventHandlers.click['set-stop-at'] = function(event)
{
  stop_at.setUserStopAt(event.target.value, event.target.checked);
};

window.eventHandlers.click['set-break-point'] = function(event)
{
  var bps = cls.Breakpoints.get_instance();
  var target = event.target;
  var li = target.get_ancestor("li");
  if (li)
  {
    var input = li.querySelector("input");
    var line_number = input && Number(input.value);
    if (!line_number)
    {
      var span = li.querySelector(".line-number");
      line_number = span && Number(span.textContent);
    }
    var script_id = window.views.js_source.getCurrentScriptId() ||
                    Number(target.get_ancestor_attr("data-script-id"));
    if (script_id && line_number)
    {
      if (bps.script_has_breakpoint_on_line(script_id, line_number))
      {
        var bp_id = bps.remove_breakpoint(script_id, line_number);
        bps.delete_breakpoint(bp_id);
      }
      else
        bps.add_breakpoint(script_id, line_number);
    }
  }
};
