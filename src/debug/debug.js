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

  this._log_entries = [];

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

  this._is_textarea_focused = false;

  this.createView = function(container)
  {
    this._textarea = container.clearAndRender(
    [
      'textarea', 
      'class', 'debug-textarea', 
      'spellcheck', 'false',
      'onfocus', function()
      {
        self._is_textarea_focused = true;
      },
      'onblur', function()
      {
        self._is_textarea_focused = false;
        self.output();
      }
    ]);
    this._textarea.value = out.join('\n');
  }

  this.ondestroy = function()
  {
    this._textarea = null;
  }

  this.scrollToBottom = function(container)
  {
    container.scrollTop = container.scrollHeight;
  }

    const 
  SERVICE = 0,
  COMMAND = 1,
  TYPE = 2,
  LOG = 3;

  var get_log = function(entry)
  {
    return entry[LOG];
  }

  var filter_log = function(entry)
  {
    return (
      this.all.all.all ||
      this[entry[SERVICE]][entry[TYPE]].all ||
      this[entry[SERVICE]][entry[TYPE]][entry[COMMAND]]
    );
  }

  this.output = function(log)
  {
    if(log) 
    {
      out.push(log);
    }
    if(this._textarea && !this._is_textarea_focused)
    {
      this._textarea.value = out.filter(filter_log, this._filter).map(get_log).join('\n');
      this._textarea.scrollTop = this._textarea.scrollHeight;
    }
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



  this.log_message = function(service, message, command, status, tag)
  {
    var 
    command_name = _event_map[service][command].replace(/^handle/, '').replace(/^on/, 'On'),
    is_event = /^On/.test(command_name), 
    definitions = status == 0 ? 
      window.command_map[service][command][is_event && EVENT || RESPONSE] :
      window.package_map["com.opera.stp"]["Error"],
    log_entry =
      '\nreceive:\n' +
      INDENT + 'service: ' + service + '\n' + 
      INDENT + (is_event && 'event: ' || 'command: ') + command_name + '\n' + 
      INDENT + 'staus: ' + status + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
      pretty_print_payload(message, definitions, 2); 

    this.output([service, command_name, is_event && 'events' || 'commands', log_entry]);
  }

  this.log_transmit = function(service, message, command, tag)
  {
    var 
    command_name = _event_map[service][command].replace(/^handle/, '').replace(/^on/, 'On'),
    definitions = window.command_map[service][command][COMMAND],
    log_entry = 
      '\ntransmit:\n' + 
      INDENT + 'service: ' + service + '\n' + 
      INDENT + 'command: ' + command_name + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
      pretty_print_payload(message, definitions, 2);

    this.output([service, command_name, 'commands', log_entry]);
  }

  this.set_filter = function(filter_target, filter_type, bool)
  {
    this._filter[filter_target][filter_type].all = bool;
    this.output();
  }

  this.set_filter_message = function(service, type, message, bool)
  {
    this._filter[service][type][message] = bool;
    this.output();
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






