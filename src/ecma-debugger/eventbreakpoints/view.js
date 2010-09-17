window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.EventBreakpointsView = function(id, name, container_class)
{

  /* settings */
  this.window_top = 20;
  this.window_left = 20;
  this.window_width = 300;
  this.window_height = 300;
  this.window_statusbar = false;

  this.createView = function(container)
  {
    container.render(window.templates.ev_brp_config(window.event_breakpoints.events));
  }

  this.ondestroy = function()
  {

  }

  window.eventHandlers.click['ev-brp-expand-section'] = function(event, target)
  {
    var 
    parent = target.parentNode, 
    index = parseInt(parent.getAttribute('index')),
    event_list = parent.getElementsByTagName('ul')[0],
    input = target.getElementsByTagName('input')[0];

    if (event_list)
    {
      parent.removeChild(event_list);
      input.removeClass('unfolded');
    }
    else
    {
      var section = window.event_breakpoints.events[index];
      if (section)
      {
        parent.render(window.templates.ev_brp_event_list(section.events));
        input.removeClass('unfolded');
      }
    }
    window.event_breakpoints.set_unfold(index, !event_list);
  }

  window.eventHandlers.click['event-breakpoint'] = function(event, target)
  {
    var 
    event_index = parseInt(target.getAttribute('index')),
    section_index = parseInt(target.parentNode.get_attr('parent-node-chain', 'index')),
    checked = target.checked;

    window.event_breakpoints.handle_breakpoint(section_index, event_index, checked);
  }


  this.init(id, name, container_class);
}