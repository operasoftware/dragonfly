window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.ConfigureMessageFilters = function(id, name, container_class)
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

  this._filter_command = function(msg){return /^handle/.test(msg);}

  this._filter_event = function(msg, index){return /^on/.test(msg);}

  this._get_message_class = function(msg){return msg.replace(/^handle/, "").replace(/^on/, "On");}

  this._template_checkbox_message = function(msg, label)
  {
    // this is the filter of the given service
    var is_disabled = msg != 'all' && this.all;
    return (
    ['li',
      ['label',
        ['input',
          'type', 'checkbox',
          'data-filter-target', msg,
          'handler', 'config-filter-msg'
        ].concat(is_disabled ? ['disabled', 'disabled'] : []).
         concat(this[msg] ? ['checked', 'checked'] : []),
        ' '+ (label && typeof label == 'string' ? label : msg)
      ]
    ].concat(is_disabled ? ['class', 'disabled'] : []));
  }

  this._template_messages = function(service, title, type, messages, filter)
  {
    return (
    [
      ['h3', title],
      ['ul',
        messages.map(this._template_checkbox_message, filter),
        'data-filter-type', type,
        'data-service-name', service,
      ],
    ]);
  }

  this._template_service_config = function(service)
  {
    var
    ret = ['div'],
    event_map_service = this._event_map[service],
    messages = event_map_service.filter(this._filter_command),
    filter = window.debug.get_log_filter()[service];

    if (messages.length)
    {
      ret.push(this._template_messages(service, 'Commands', 'commands',
                      ['all'].concat(messages.map(this._get_message_class)), filter.commands));
    }
    messages = event_map_service.filter(this._filter_event);
    if (messages.length)
    {
      ret.push(this._template_messages(service, 'Events', 'events',
                      ['all'].concat(messages.map(this._get_message_class)), filter.events));
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
    var services = [], service = null, filter = window.debug.get_log_filter().all.all;
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
      ['ul',
        this._template_checkbox_message.call(filter, 'all', 'log all messages'),
        'data-filter-type', 'all',
        'data-service-name', 'all',
      ],
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
cls.debug.ConfigureMessageFilters.prototype = ViewBase;
