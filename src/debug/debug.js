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
  this.set_log_filter = function(service, type, message, bool){};
  this.clear_log = function(){};

  /* privat */

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
  this._is_textarea_focused = false;

  this._textarea_focus_handler = function()
  {
    self._is_textarea_focused = true;
  }

  this._textarea_blur_handler = function()
  {
    self._is_textarea_focused = false;
    self._display_log();
  }

  this._main_template = function()
  {
    return (
    [
      'textarea', 
      'class', 'debug-textarea', 
      'spellcheck', 'false',
      'onfocus', this._textarea_focus_handler,
      'onblur', this._textarea_blur_handler
    ]);
  }

  this._get_log_text = function(entry){ return entry[LOG];}

  this._filter_log = function(entry)
  {
    return (
      this.all.all.all ||
      this[entry[SERVICE]][entry[TYPE]].all ||
      this[entry[SERVICE]][entry[TYPE]][entry[COMMAND]]
    );
  }

  this._get_indent = function(count)
  {
    var ret = "";
    while(count && count-- > 0)
    {
      ret += INDENT;
    }
    return ret;
  }

  this._display_log = function(log)
  {
    if(log) 
    {
      this._log_entries.push(log);
    }
    if(this._textarea && !this._is_textarea_focused)
    {
      this._textarea.value = this._log_entries.filter(this._filter_log, this._filter).map(this._get_log_text).join('\n');
      this._textarea.scrollTop = this._textarea.scrollHeight;
    }
  }

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
  }

  /* implementation */

  this.createView = function(container)
  {
    this._textarea = container.clearAndRender(this._main_template());
    this._display_log();
  }

  this.ondestroy = function()
  {
    this._textarea = null;
  }

  this.log_message = function(service, message, command, status, tag)
  {
    var 
    command_name = this._event_map[service][command].replace(/^handle/, '').replace(/^on/, 'On'),
    is_event = /^On/.test(command_name), 
    definitions = status == 0 ? 
      window.command_map[service][command][is_event && EVENT || RESPONSE] :
      window.package_map["com.opera.stp"]["Error"],
    time_submitted = this._times[service + command + tag] || 0,
    delta = time_submitted ? new Date().getTime() - time_submitted : 0,
    log_entry =
      '\nreceive' + (delta ? ', delta: ' + delta : '') + ':\n' +
      INDENT + 'service: ' + service + '\n' + 
      INDENT + (is_event && 'event: ' || 'command: ') + command_name + '\n' + 
      INDENT + 'staus: ' + status + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
      this._pretty_print_payload(message, definitions, 2); 

    this._display_log([service, command_name, is_event && 'events' || 'commands', log_entry]);
  }

  this.log_transmit = function(service, message, command, tag)
  {
    var 
    command_name = this._event_map[service][command].replace(/^handle/, '').replace(/^on/, 'On'),
    definitions = window.command_map[service][command][COMMAND],
    log_entry = 
      '\ntransmit:\n' + 
      INDENT + 'service: ' + service + '\n' + 
      INDENT + 'command: ' + command_name + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
      this._pretty_print_payload(message, definitions, 2);

    this._display_log([service, command_name, 'commands', log_entry]);
    this._times[service + command + tag] = new Date().getTime();
  }

  this.get_log_filter = function(){return this._filter;}

  this.set_log_filter = function(service, type, message, bool)
  {
    this._filter[service][type][message] = bool;
    this._display_log();
  }

  this.clear_log = function()
  {
    this._log_entries = [];
    this._times = {};
    this.update();
  }

  /* initialisation */

  this._create_filter();
  this.init(id, name, container_class);
}


