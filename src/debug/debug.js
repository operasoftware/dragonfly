/**
  * @constructor 
  * @extends ViewBase
  * this is a bit a hack
  */
window.cls || (window.cls = {});
cls.debug || (cls.debug = {});

cls.debug.Debug = function(id, name, container_class)
{
  //var d_c = null;
  var self = this;
  var indent='  ';
  this.show_in_views_menu = true;

  

  this.get_filter = function()
  {
    return this._filter;
  }

  var reCommand=/<([^>]*)>/;

  event_filter = null;
  command_filter = null;

  var getIndent = function(n)
  {
    var ret = '';
    if(n < 1)
    {
      return ret;
    }
    while(n--) ret += indent;
    return ret;
  }

  var out = [];

  this._textarea = null;

  this.createView = function(d_c)
  {
    //var first_child = d_c.firstChild || d_c.render(['div', 'class', 'padding']);
    //first_child.textContent = out.join('\n');
    this._textarea = d_c.clearAndRender(['textarea', 'class', 'debug-textarea', 'spellcheck', 'false']);
    this._textarea.value = out.join('\n');
    /*
    if( string && string.indexOf('<timeout/>') == -1 )
    {
      //d_c=document.getElementById('debug-container');
      d_c.scrollTop = d_c.scrollHeight;
    }
    */
  }

  this.ondestroy = function()
  {
    alert('destroy');
  }

  this.scrollToBottom = function(container)
  {
    container.scrollTop = container.scrollHeight;
  }

  this.output = function(string)
  {
    if(string) 
    {
      out.push(string);
      if(this._textarea)
      {
        this._textarea.value = out.join('\n');
      }
    }
    /*
    this.update();
    this.applyToContainers(this.scrollToBottom);
    */


  }

  this.export_data = function(string)
  {

    export_data.data = out.join('\n').replace(/</g, '&lt;');
    if(!topCell.tab.hasTab('export_new'))
    {
      topCell.tab.addTab(new Tab('export_new', views['export_new'].name, true))
    }
    topCell.showView('export_data');

    // window.open('data:text/plain;charset=utf-8,'+encodeURIComponent( out.join('\n') ));

  }

  this.clear = function()
  {
    out = [];
    this.update();
  }



  var get_indent = function(count)
  {
    var ret = "";
    while(count && count-- > 0)
    {
      ret += INDENT;
    }
    return ret;
  }

  var pretty_print_payload_item = function(indent, name, definition, item)
  {
    return (
      get_indent(indent) +
      name + ': ' + (
        "message" in definition && "\n" + 
            pretty_print_payload(item, definition["message"], indent + 1) ||
        !item && "null" || 
        typeof item == "string" && "\"" + item + "\"" || 
        item));
  }


  var pretty_print_payload = function(payload, definitions, indent)
  {
    var 
    ret = [], 
    item = null,
    i = 0,
    definition = null,
    j = 0;

    //# TODO message: self
    if (definitions)
    {
      for (; i < payload.length; i++)
      {
        item = payload[i];
        definition = definitions[i];
        if (definition["q"] == "repeated")
        {
          ret.push(get_indent(indent) + definition['name'] + ':');
          for( j = 0; j < item.length; j++)
          {
            ret.push(pretty_print_payload_item(
              indent + 1,
              definition['name'].replace("List", ""),
              definition,
              item[j]));
          }
        }
        else
        {
          ret.push(pretty_print_payload_item(
            indent,
            definition['name'],
            definition,
            item))
        }
      }
      return ret.join("\n")
    }
    return "";
  }

  const INDENT = "  ", COMMAND = 1, RESPONSE = 2, EVENT = 3;
  var _status_map = cls.ServiceBase.get_status_map();
  var _event_map = cls.ServiceBase.get_event_map();

  // TODO
  this.log_message = function(service, message, command, status, tag)
  {
    /*
    var response = document.getElementById('message-response');
    if(response)
    {
      response.parentNode.removeChild(response);
    }
    response = 
      document.getElementById('message-container').
      appendChild(document.createElement('pre'));
    response.id = 'message-response';
    service = _dashed_name(service);
    var command_id = _event_map[service].indexOf('handle' + command);
    var definitions = window.command_map[service][command_id][RESPONSE];
    if (status != 0) // Use the error structure if we received an error response
        definitions = window.package_map["com.opera.stp"]["Error"];
    response.textContent = 
      "response:\n  status: " + 
      _status_map[status] + "\n" +
      "  payload: \n" + 
      pretty_print_payload(message, definitions, 2);
    */
    ///////////
    var command_name = _event_map[service][command].replace('handle', '');
    var definitions = window.command_map[service][command][/^on/g.test(command_name) && EVENT || RESPONSE];
    this.output(
      '\nreceive:\n' + 
      INDENT + 'service: ' + service + '\n' + 
      INDENT + 'command: ' + command_name + '\n' + 
      INDENT + 'staus: ' + status + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
        pretty_print_payload(message, definitions, 2)
      ); 
  }

  this.log_transmit = function(service, message, command, tag)
  {
    var command_name = _event_map[service][command].replace('handle', '');
    var definitions = window.command_map[service][command][COMMAND];
    this.output(
      '\ntransmit:\n' + 
      INDENT + 'service: ' + service + '\n' + 
      INDENT + 'command: ' + command_name + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
        pretty_print_payload(message, definitions, 2)
      ); 
    //this.output('transmit\n' + service + ' ' + message + ' ' + command + ' ' + tag)
  }

  /*

      for(service in window.services)
    {
      if(window.services[service].is_implemented)
      {
        markup += "<li>" +
          "<input " +
              "type='button' handler='toggle-filter-messages' " +
              "data-service-name='" + service + "' " +
              (filter == null ? "disabled" : "") + " >" +
          "<h3>" + window.helpers.service_class_name(service) + "</h3>" +
          "</li>";
      }
    }

    */


  this.set_filter = function(filter_target, filter_type, bool)
  {
    this._filter[filter_target][filter_type].all = bool;
  }

  this.set_filter_message = function(service, type, message, bool)
  {
    this._filter[service][type][message] = bool;
  }


  this.create_filter = function()
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
  }

  this.create_filter();
  this.init(id, name, container_class);
}

cls.debug.Debug.prototype = ViewBase;

cls.debug.ConfigureMessgeFilters = function(id, name, container_class)
{
  var _event_map = cls.ServiceBase.get_event_map();

  this.createView = function(container)
  {
    var 
    markup = "",
    service = null,
    filter = window.debug.get_filter();

    for(service in window.services)
    {
      if(window.services[service].is_implemented)
      {
        markup += "<li>" +
          "<input " +
              "type='button' handler='toggle-filter-messages' " +
              "data-service-name='" + service + "' " +
              (filter.all.all.all ? "disabled" : "") + " >" +
          "<h3>" + window.helpers.service_class_name(service) + "</h3>" +
          "</li>";
      }
    }
    container.innerHTML = 
      "<div class='padding'>" +
        "<h2>Services</h2>" +
        markup_checkbox_all('all', 'all', 'log all messages', filter.all.all.all) +
        "<ul" + (filter.all.all.all ? " class='disabled'" : "") + ">" + markup + "</ul>" +
      "</div>";


  }

  /*

    _event_map['scope'][3] = 'handleConnect';
  _event_map['scope'][4] = 'handleDisconnect';
  _event_map['scope'][5] = 'handleEnable';
  _event_map['scope'][6] = 'handleDisable';
  _event_map['scope'][7] = 'handleInfo';
  _event_map['scope'][8] = 'handleQuit';
  _event_map['scope'][10] = 'handleHostInfo';
  _event_map['scope'][11] = 'handleMessageInfo';
  _event_map['scope'][0] = 'onServices';
  _event_map['scope'][1] = 'onQuit';
  _event_map['scope'][2] = 'onConnectionLost';
  _event_map['scope'][9] = 'onError';

  */



  var filter_command = function(msg)
  {
    return /^handle/.test(msg);
  }

  var filter_event = function(msg, index)
  {
    return /^on/.test(msg);
  }

  var markup_message = function(msg)
  {
    msg = msg.replace(/^handle/, "").replace(/^on/, "On");
    return "<li><label>" +
      "<input type='checkbox' " +
        "data-filter-target='" + msg + "' " + 
        (this.all ? "disabled" : "") + 
        (this[msg] ? " checked='checked' " : "") +
        " handler='config-filter-msg'>" +
      msg + "</label></li>";
  }

  var markup_checkbox_all = function(service, msg_type, label, checked)
  {
    return (
    "<ul>" +
      "<li><label>" +
        "<input type='checkbox' " +
          (checked ? "checked='checked'" : "") +
          "data-filter-target='" + service + "' " +
          "data-filter-type='" + msg_type + "' " +
          "handler='config-filter-msg-all'>" +
        " " + label + "</label></li>" +
    "</ul>");
  }

  this.show_configuration = function(container, service)
  {
    var 
    div = container.appendChild(document.createElement('div')),
    msgs = null,
    filter = window.debug.get_filter()[service];

    if ((msgs = _event_map[service].filter(filter_command)).length)
    {
      div.innerHTML +=
        "<h3>Commands</h3>" +
        markup_checkbox_all(service, 'commands', 'log all commands', filter.commands.all) +
        "<ul" + (filter.commands.all ? " class='disabled'" : "") + 
          " data-filter-type='commands' " +
          " data-service-name='" + service + "'>" +
          msgs.map(markup_message, filter.commands).join('') + 
        "</ul>";
    }
    if ((msgs = _event_map[service].filter(filter_event)).length)
    {
      div.innerHTML +=
        "<h3>Events</h3>" +
        markup_checkbox_all(service, 'events', 'log all events', filter.events.all) +
        "<ul" + (filter.events.all ? " class='disabled'" : "") + 
          " data-filter-type='commands' " +
          " data-service-name='" + service + "'>" +
          msgs.map(markup_message, filter.events).join('') + 
        "</ul>";
    }
  }

  this.init(id, name, container_class);

}
cls.debug.ConfigureMessgeFilters.prototype = ViewBase;

cls.debug.wrap_transmit = function()
{
  opera._scopeTransmit = opera.scopeTransmit;
  opera.scopeTransmit = function(service, message, command, tag)
  {
    window.debug.log_transmit(service, message, command, tag);
    opera._scopeTransmit(service, message, command, tag);
  };
}

cls.debug.create_debug_environment = function(params)
{
  window.ini.debug = true;
  window.debug = new cls.debug.Debug('debug', 'Debug', 'scroll debug-container');
  new cls.debug.ConfigureMessgeFilters('configure-message-filters', 
                      'Message Filters', 'scroll filter-container');
  new CompositeView('debug_new', 'Debug', {
      dir: 'v', width: 700, height: 700,
      children: 
      [
        { height: 200, tabs: ['debug'] }
      ]
    });
  
  
  new Settings
  (
    // id
    'debug', 
    // kel-value map
    {
      'show-as-tab': true
    }, 
    // key-label map
    {
      'show-as-tab': 'Show view in a tab',
    },
    // settings map
    {
      checkboxes:
      [

      ]
    }
  );
  new ToolbarConfig
  (
    'debug',
    [
      {
        handler: 'clear-debug-view',
        title: 'clear debug log'
      },
      {
        handler: 'export-debug-log',
        title: 'export debug log'
      },
      {
        handler: 'configure-message-filters',
        title: 'Configure Message Filters'
      }
    ]
  )
  new Switches
  (
    'debug',
    [
      'show-as-tab'
    ]
  )
  eventHandlers.click['clear-debug-view'] = function(event, target)
  {
    debug.clear();
  }
  eventHandlers.click['export-debug-log'] = function(event, target)
  {
    debug.export_data();
  }

  eventHandlers.click['configure-message-filters'] = function(event, target)
  {
    UIWindowBase.showWindow('configure-message-filters');
  }

  eventHandlers.click['toggle-filter-messages'] = function(event, target)
  {
    var parent = event.target.parentNode;
    if(parent.getElementsByTagName('div')[0])
    {
      parent.removeChild(parent.getElementsByTagName('div')[0]);
    }
    else
    {
      window.views['configure-message-filters'].show_configuration(
                    parent, event.target.getAttribute('data-service-name'));
    }
  }

  eventHandlers.change['config-filter-msg-all'] = function(event, target)
  {
    var filter_target = event.target.getAttribute('data-filter-target');
    window.debug.set_filter(filter_target, 
      event.target.getAttribute('data-filter-type'), event.target.checked);
    if(filter_target == 'all')
    {
      window.views['configure-message-filters'].update();
    }
    else
    {
      var parent = event.target.parentNode.parentNode.parentNode.parentNode.parentNode;
      var div = parent.getElementsByTagName('div')[0];
      parent.removeChild(div);
      window.views['configure-message-filters'].show_configuration(
                    parent, parent.firstElementChild.getAttribute('data-service-name'));
    }
  }

  eventHandlers.change['config-filter-msg'] = function(event, target)
  {
    var 
    msg = event.target.getAttribute('data-filter-target'),
    parent = event.target.parentNode.parentNode.parentNode,
    type = parent.getAttribute('data-filter-type'),
    service = parent.getAttribute('data-service-name');

    window.debug.set_filter_message(service, type, msg, event.target.checked);
  }

  
  // 

/*
  var View = function(id, name, container_class)
  {




    this.createView = function(container)
    {
      container.render
      (
        ['div', 
          ['div',
            ['input', 
              'type', 'button', 
              'value', 'spotlight', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<spotlight-objects>\\n  <spotlight-object>\\n    <object-id>xx</object-id>\\n    <scroll-into-view>1</scroll-into-view>\\n    <box>\\n      <box-type>0</box-type>\\n      <fill-color>16711858</fill-color>\\n      <frame-color>4278190335</frame-color>\\n      <grid-color>0</grid-color>\\n    </box> \\n  </spotlight-object>\\n</spotlight-objects>';"],
            ['input', 
              'type', 'button', 
              'value', 'eval', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<eval>\\n  <tag>1</tag>\\n  <runtime-id></runtime-id>\\n  <thread-id></thread-id>\\n  <frame-id></frame-id>\\n  <script-data></script-data>\\n</eval>';"],
            ['input', 
              'type', 'button', 
              'value', 'set breakpoint', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<add-breakpoint>\\n  <breakpoint-id> x </breakpoint-id>\\n  <source-position>\\n    <script-id> x </script-id>\\n    <line-number> x </line-number>\\n  </source-position>\\n</add-breakpoint>';"],
            ['input', 
              'type', 'button', 
              'value', 'examine obj', 
              'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<examine-objects>\\n  <tag>1</tag>\\n  <runtime-id>x</runtime-id>\\n  <object-id>x</object-id>\\n</examine-objects>';"],
            ['input', 
              'type', 'button', 
              'value', 'post', 
              'style', 'margin-left:10px',
              'onclick', 'services[\'ecmascript-debugger\'].postCommandline()'],
          'style', 'text-align: right'],
          ['div', ['textarea'], 'id', 'command-line-debug-container'],
        'class', 'window-container', 'id', 'command-line-debug']
      )
      
    }



    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('commandline_debug', 'Commandline Debug', 'scroll');
  */
}


