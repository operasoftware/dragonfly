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
  this._container = null;

  

  this.createView = function(container)
  {
    this._container = container;
    container.clearAndRender(window.templates.ev_brp_config(window.event_breakpoints.get_events()));
  }

  this.show_filtered_view = function(filter_str)
  {
    if (this._container && this.isvisible())
    {
      const NAME = 0, CHECKED = 1;
      var events = window.event_breakpoints.get_events();
      var event_list = null;
      var filter = function(event)
      {
        return event[NAME].indexOf(filter_str) > -1;
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
        title: "Expand all sections",
      },
      {
        handler: 'ev-brp-remove-all-breakpoints',
        title: 'Remove all event breakpoints',
        disabled: true
      },
    ],
    [
      {
        handler: 'ev-brp-filter',
        title: 'Search event',
        label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER
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
    },
    // key-label map
    {

    },
    // settings map
    {
      checkboxes:
      [

      ],
      customSettings:
      [

      ]
    }
    // custom templates

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
        parent.render(window.templates.ev_brp_event_list(section.events));
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

  window.eventHandlers.input['ev-brp-filter'] = function(event, target)
  {
    window.views['event-breakpoints'].show_filtered_view(target.value);
  }

};