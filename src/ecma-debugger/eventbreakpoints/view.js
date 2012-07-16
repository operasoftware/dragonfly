window.cls || (window.cls = {});

/**
  * @constructor
  * @extends ViewBase
  */

cls.EventBreakpointsView = function(id, name, container_class)
{

  /* settings */
  this.window_top = 40;
  this.window_left = 40;
  this.window_width = 300;
  this.window_height = 300;
  this.window_statusbar = false;
  this._container = null;
  this.required_services = ["ecmascript-debugger"];

  this.createView = function(container)
  {
    this._container = container;
    container.clearAndRender(window.templates.ev_brp_config(window.event_breakpoints.get_events()));
  }

  this.show_filtered_view = function(filter_str)
  {
    if (this._container && this.isvisible())
    {
      filter_str = filter_str.toLowerCase();
      const NAME = 0, CHECKED = 1;
      var events = window.event_breakpoints.get_events();
      var event_list = null;
      var filter = function(event)
      {
        return event[NAME].toLowerCase().indexOf(filter_str) > -1;
      };

      if (filter_str)
      {
        events = events.map(function(section, index)
        {
          event_list = section.events.filter(filter);
          return (
          {
            title: section.title,
            spec: section.spec,
            events: event_list,
            is_unfolded: Boolean(event_list.length),
            is_search: true
          });
        });
      }
      this._container.clearAndRender(window.templates.ev_brp_config(events));
    }
  }

  this.ondestroy = function()
  {
    this._container = null;
  }

  this.init(id, name, container_class);
}

cls.EventBreakpointsView.create_ui_widgets = function()
{

  new ToolbarConfig
  (
    'event-breakpoints',
    [
      {
        handler: 'ev-brp-expand-all-sections',
        title: ui_strings.S_BUTTON_EXPAND_ALL_SECTIONS,
      },
      {
        handler: 'ev-brp-remove-all-breakpoints',
        title: ui_strings.S_BUTTON_REMOVE_ALL_BREAKPOINTS,
        disabled: true
      },
    ],
    [
      {
        handler: 'ev-brp-filter',
        title: ui_strings.S_BUTTON_SEARCH_EVENT,
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
        type: "filter"
      }
    ]
  );

  new Settings
  (
    // id
    'event-breakpoints',
    // key-value map
    {
      'expanded-sections': [],
      'edited-events': {},
    }
  );

  window.eventHandlers.click['ev-brp-expand-all-sections'] = function(event, target)
  {
    window.event_breakpoints.expand_all_sections();
    window.views['event-breakpoints'].update();
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
      var section = window.event_breakpoints.get_events()[index];
      if (section)
      {
        parent.render(window.templates.ev_brp_event_list(section));
        input.addClass('unfolded');
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

  window.eventHandlers.click['ev-brp-remove-all-breakpoints'] = function(event, target)
  {
    window.event_breakpoints.remove_all_breakpoints();
    window.views['event-breakpoints'].update();
  }

  window.eventHandlers.input['ev-brp-filter'] = function(event, target)
  {
    window.views['event-breakpoints'].show_filtered_view(target.value);
  }

  var update_section = function(event, target, template_name)
  {
    var li = target.parentNode.has_attr('parent-node-chain', 'index');
    if (li)
    {
      var section = window.event_breakpoints.get_events()[parseInt(li.getAttribute('index'))];
      li.removeChild(li.getElementsByTagName('ul')[0]);
      li.render(window.templates[template_name](section));
    }
  }

  window.eventHandlers.click['ev-brp-edit-custom-events'] = function(event, target)
  {
    update_section(event, target, 'ev_brp_edit_section');
  }

  window.eventHandlers.click['ev-brp-edit-custom-events-cancel'] = function(event, target)
  {
    update_section(event, target, 'ev_brp_event_list');
  }

  window.eventHandlers.click['ev-brp-edit-custom-events-save'] = function(event, target)
  {
    var li = target.parentNode.has_attr('parent-node-chain', 'index');
    if (li)
    {
      var index = parseInt(li.getAttribute('index'));
      var event_list = li.getElementsByTagName('textarea')[0].value.split(/,?\s+/);
      window.event_breakpoints.update_section(index, event_list);
      update_section(event, target, 'ev_brp_event_list');
    }
  }

};
