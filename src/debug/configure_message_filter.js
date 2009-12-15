window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.ConfigureMessgeFilters = function(id, name, container_class)
{
  /* interface */
  this.createView = function(container){};
  this.show_configuration = function(container, service){};
  this.set_unfold = function(service, bool){};

  /* private */
  this.show_in_views_menu = true;
  this.window_width = 250;
  this._event_map = cls.ServiceBase.get_event_map();
  this._unfolded = {};

  this._filter_command = function(msg)
  {
    return /^handle/.test(msg);
  }

  this._filter_event = function(msg, index)
  {
    return /^on/.test(msg);
  }
  
  this.get_message_class = function(msg)
  {
    return msg.replace(/^handle/, "").replace(/^on/, "On");
  }

  this._template_message = function(msg)
  {
    // this is the filter of the given service
    return (
    ['li',
      ['label',
        ['input',
          'type', 'checkbox',
          'data-filter-target', msg, 
          'handler', 'config-filter-msg'
        ].concat(this.all ? ['disabled', 'disabled'] : []). 
         concat(this[msg] ? ['checked', 'checked'] : []),
        ' '+ msg
      ]
    ]);
  }

  this._template_checkbox_all = function(service, msg_type, label, checked)
  {
    return (
    ['ul',
      ['li',
        ['label',
          ['input',
            'type', 'checkbox',
            'data-filter-target', service,
            'data-filter-type', msg_type,
            'handler', 'config-filter-msg-all'
          ].concat(checked ? ['checked', 'checked'] : []),
          ' ' + label
        ]
      ]
    ]);
  }
  
  this._template_messages = function(service, title, type, filter, messages)
  {
    return (
    [
      ['h3', title],
      this._template_checkbox_all(service, type, 'log all ' + type, filter.all),
      ['ul',
        messages.map(this._template_message, filter),
        'data-filter-type', type,
        'data-service-name', service,
      ].concat(filter.all ? ['class', 'disabled'] : []),
    ]);
  }

  this._template_service_config = function(service)
  {
    var 
    ret = ['div'],
    event_map_service = this._event_map[service],
    messages = event_map_service.filter(this._filter_command),
    filter = window.debug.get_filter()[service];
    
    if (messages.length)
    {
      ret.push(this._template_messages(service, 'Commands', 'commands', 
                      filter.commands, messages.map(this.get_message_class)));
    }
    messages = event_map_service.filter(this._filter_event);
    if (messages.length)
    {
      ret.push(this._template_messages(service, 'Events', 'events', 
                      filter.events, messages.map(this.get_message_class)));
    }
    return ret;
  }
  
  this._template_service = function(service)
  {
    // this is a temporary object with a view and a filter property
    // to pass context to map
    return (
    ['li', 
      ['input',
        'type', 'button',
        'handler', 'toggle-filter-messages',
        'data-service-name', service
      ].concat(this.filter.all ? ['disabled', 'disabled'] : []), 
      ['h3', window.helpers.service_class_name(service)],
      (this.view._unfolded[service] ? this.view._template_service_config(service) : [])
    ].concat(this.view._unfolded[service] ? ['class', 'open']: []));
  }

  this._template_main = function()
  {
    var services = [], service = null, filter = window.debug.get_filter().all.all;
    for(service in window.services)
    {
      if(window.services[service].is_implemented)
      {
        services.push(service);
      }
    }
    return (
    ['div',
      ['h2', 'Services'],
      this._template_checkbox_all('all', 'all', 'log all messages', filter.all),
      ['ul', 
        services.map(this._template_service, {view: this, filter: filter})
      ].concat(filter.all ? ['class', 'disabled'] : []),
    'class', 'padding'
    ]);
  }

  /* implementation */

  this.createView = function(container)
  {
    container.clearAndRender(this._template_main());
  }

  this.show_configuration = function(container, service)
  {
    container.render(this._template_service_config(service));
  }

  this.set_unfold = function(service, bool)
  {
    this._unfolded[service] = bool;
  }

  this.init(id, name, container_class);

}
cls.debug.ConfigureMessgeFilters.prototype = ViewBase;