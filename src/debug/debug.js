/**
  * @constructor
  * @extends ViewBase
  * this is a bit a hack
  */
window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.Debug = function(id, name, container_class)
{

  /* interface */

  this.createView = function(container){};
  this.ondestroy = function(){};
  this.log_message = function(service, message, command, status, tag){};
  this.log_transmit = function(service, message, command, tag){};
  this.get_log_filter = function(){};
  this.set_log_filter = function(service, type, message, visible){};
  this.clear_log = function(){};
  this.show_configuration = function(container, service){};
  this.set_unfold = function(service, unfolded){};

  /* private */

  const
  SERVICE = 0,
  COMMAND = 1,
  RESPONSE = 2,
  EVENT = 3,
  TYPE = 2,
  LOG = 3,
  INDENT = "  ";

  var self = this;

  this._times = {};

  this._status_map = cls.ServiceBase.get_status_map();
  this._event_map = cls.ServiceBase.get_event_map();
  this.show_in_views_menu = true;
  this._log_entries = [];
  this._textarea = null;
  this._event_map = cls.ServiceBase.get_event_map();
  this._unfolded = {};

  this._main_template = function()
  {
    return (
    [
      this._template_message_filter(),
      [
        'textarea',
        'class', 'debug-textarea'
      ]
    ]);
  };

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
    var view_unfolded = this.view._unfolded[service];
    // this is a temporary object with a view and a filter property
    // to pass context to map
    return (
    ['li',
      ['header',
        ['input',
          'type', 'button',
          'class', (view_unfolded ? 'unfolded' : '')
        ],
        window.helpers.service_class_name(service),
        'data-service-name', service
      ].concat(this.filter.all ? [] : ['handler', 'toggle-filter-messages']),
      (view_unfolded ? this.view._template_service_config(service) : [])
    ].concat(view_unfolded ? ['class', 'open']: []));
  }

  this._template_message_filter = function()
  {
    var services = [], service = null, filter = window.debug.get_log_filter().all.all;
    for (service in window.services)
    {
      if (window.services[service].is_implemented)
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
    'class', 'padding message-filter'
    ]);
  }

  this._get_log_text = function(entry) { return entry[LOG]; }

  this._filter_log = function(entry)
  {
    return (
      this.all.all.all ||
      this[entry[SERVICE]][entry[TYPE]].all ||
      this[entry[SERVICE]][entry[TYPE]][entry[COMMAND]]
    );
  };

  this._get_indent = function(count)
  {
    var ret = "";
    while(count && count-- > 0)
    {
      ret += INDENT;
    }
    return ret;
  };

  this._display_log = function(log)
  {
    if(log)
    {
      this._log_entries.push(log);
    }
    if(this._textarea &&
       this._textarea.selectionStart == this._textarea.selectionEnd)
    {
      this._textarea.value = this._log_entries.filter(this._filter_log, this._filter).map(this._get_log_text).join('\n');
      this._textarea.scrollTop = this._textarea.scrollHeight;
    }
  };

  this._create_filter = function()
  {
    this._filter = {all: {all: {all: true}}};
    var service = '';
    for(service in window.services)
    {
      if(window.services[service].hasOwnProperty('is_implemented'))
      {
        this._filter[service] = {
          commands: {
            all: false
          },
          events: {
            all: false
          }
        };
      }
    }
  };

  this._filter_command = function(msg) { return /^handle/.test(msg); }

  this._filter_event = function(msg, index) { return /^on/.test(msg); }

  this._get_message_class = function(msg) { return msg.replace(/^handle/, "").replace(/^on/, "On"); }

  /* implementation */

  this.createView = function(container)
  {
    this._textarea = container.clearAndRender(this._main_template()).querySelector("textarea");
    this._display_log();
  };

  this.ondestroy = function()
  {
    this._textarea = null;
  };

  this.log_message = function(service, message, command, status, tag)
  {
    var
    command_name = this._event_map[service][command].replace(/^handle/, '').replace(/^on/, 'On'),
    is_event = /^On/.test(command_name),
    definitions = status == 0 ?
      (
        window.message_maps[service] &&
        window.message_maps[service][command] &&
        window.message_maps[service][command][is_event && EVENT || RESPONSE] ||
        null
      ) :
      window.package_map["com.opera.stp"]["Error"],
    time_submitted = this._times[service + command + tag] || 0,
    delta = time_submitted ? new Date().getTime() - time_submitted : 0,
    log_entry =
      '\nreceive' + (delta ? ', delta: ' + delta : '') + ':\n' +
      INDENT + 'service: ' + service + '\n' +
      INDENT + (is_event && 'event: ' || 'command: ') + command_name + '\n' +
      INDENT + 'status: ' + status + '\n' +
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
      (
        definitions && window.settings.debug.get('pretty-print-messages')?
        this._pretty_print_payload(message, definitions, 2) :
        JSON.stringify(message)
      );

    this._display_log([service, command_name, is_event && 'events' || 'commands', log_entry]);
  };

  this.log_transmit = function(service, message, command, tag)
  {
    var
    command_name = this._event_map[service][command].replace(/^handle/, '').replace(/^on/, 'On'),
    definitions =
      window.message_maps[service] &&
      window.message_maps[service][command] &&
      window.message_maps[service][command][COMMAND] ||
      null,
    log_entry =
      '\ntransmit:\n' +
      INDENT + 'service: ' + service + '\n' +
      INDENT + 'command: ' + command_name + '\n' +
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
      (
        definitions ?
        this._pretty_print_payload(message, definitions, 2) :
        JSON.stringify(message)
      );

    this._display_log([service, command_name, 'commands', log_entry]);
    this._times[service + command + tag] = new Date().getTime();
  };

  this.get_log_filter = function() { return this._filter; }

  this.set_log_filter = function(service, type, message, visible)
  {
    this._filter[service][type][message] = visible;
    this._display_log();
  };

  this.clear_log = function()
  {
    this._log_entries = [];
    this._times = {};
    this.update();
  };

  this.show_configuration = function(container, service)
  {
    container.render(this._template_service_config(service));
  }

  this.set_unfold = function(service, unfolded)
  {
    this._unfolded[service] = unfolded;
  }

  /* event handlers */

  eventHandlers.click['toggle-filter-messages'] = function(event, target)
  {
    var
    parent = event.target.parentNode,
    view = window.views['debug'],
    service = event.target.getAttribute('data-service-name'),
    unfold_container = parent.getElementsByTagName('div')[0],
    fold_marker = event.target.getElementsByTagName('input')[0];

    view.set_unfold(service, !unfold_container);
    if (unfold_container)
    {
      parent.removeChild(unfold_container);
      parent.removeClass('open');
      fold_marker.removeClass('unfolded');
    }
    else
    {
      view.show_configuration(parent, service);
      parent.addClass('open');
      fold_marker.addClass('unfolded');
    }
  }

  eventHandlers.change['config-filter-msg'] = function(event, target)
  {
    var
    parent = event.target.parentNode.parentNode.parentNode,
    msg = event.target.getAttribute('data-filter-target'),
    type = parent.getAttribute('data-filter-type'),
    service = parent.getAttribute('data-service-name');

    window.debug.set_log_filter(service, type, msg, event.target.checked);
    if (msg == 'all')
    {
      if (service == 'all')
      {
        window.views['debug'].update();
      }
      else
      {
        parent = parent.parentNode.parentNode;
        var div = parent.getElementsByTagName('div')[0];
        parent.removeChild(div);
        window.views['debug'].show_configuration(parent, service);
      }
    }
  }

  /* initialisation */

  this._create_filter();
  this.init(id, name, container_class);
};
