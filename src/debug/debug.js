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
    this._textarea = d_c.render(['textarea', 'class', 'debug-textarea']);
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

  this.checkProfiling = function()
  {
    if( window.__profiling__ ) 
    {
      window.__times__[5] =  new Date().getTime(); // rendering
      var stamps = ['request', 'response', 'parsing', 'sorting', 'markup', 'rendering'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times__[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times__[i] - window.__times__[i-1] ) : '' ) +
          '\n';
      }
      out += 'total delta: ' + ( window.__times__[5] - window.__times__[0] ) + '\n';
      debug.output(out);
    }
    if( window.__times_dom && window.__times_dom.length == 5 ) 
    {
      var stamps = ['click event', 'return object id', 'return object', 'parse xml', 'render view'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times_dom[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times_dom[i] - window.__times_dom[i-1] ) : '' ) +
          '\n';
      }
      out += 'total delta: ' + ( window.__times_dom[4] - window.__times_dom[0] ) + '\n';
      //out += 'response text length: ' + ( window.__times_dom.response_length ) + '\n';
      debug.output(out);
    }
  }

  this.profileSpotlight = function()
  {

      window.__times_spotlight__[1] =  new Date().getTime(); // rendering
      var stamps = ['event handle-event', 'command spotlight'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times_spotlight__[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times_spotlight__[i] - window.__times_spotlight__[i-1] ) : '' ) +
          '\n';
      }
      debug.output(out);
    
  }

  this.setEventFilter = function(events)
  {
    events = events.split(',');
    event_filter = {};
    var e='', i=0;
    for( ; e = events[i]; i++)
    {
      event_filter[e.replace(/^ +/, '').replace(/ +$/,'')] = true;
    }
  }

  this.setCommandFilter = function(events)
  {
    events = events.split(',');
    command_filter = {};
    var e='', i=0;
    for( ; e = events[i]; i++)
    {
      command_filter[e.replace(/^ +/, '').replace(/ +$/,'')] = true;
    }
  }

  this.logEvents = function(xml)
  {
    var event = xml.documentElement.nodeName;
    if( !event_filter || ( event_filter && event in event_filter ) )
    {
      self.formatXML(new XMLSerializer().serializeToString(xml));
    }
  }

  this.logCommand = function(msg)
  {
    var command = reCommand.exec(msg)[1];
    if( !command_filter || ( command_filter && command in command_filter ) )
    {
      self.formatXML('POST:\n'+msg);
    }
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
    var command_name = _event_map[service][command];
    var definitions = window.command_map[service][command][/^on/g.test(command_name) && EVENT || RESPONSE];
    this.output(
      '\nreceive:\n' + 
      INDENT + 'service: ' + service + '\n' + 
      INDENT + 'command: ' + _event_map[service][command] + '\n' + 
      INDENT + 'staus: ' + status + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
        pretty_print_payload(message, definitions, 2)
      ); 
  }

  this.log_transmit = function(service, message, command, tag)
  {
    var command_name = _event_map[service][command];
    var definitions = window.command_map[service][command][COMMAND];
    this.output(
      '\ntransmit:\n' + 
      INDENT + 'service: ' + service + '\n' + 
      INDENT + 'command: ' + _event_map[service][command] + '\n' + 
      INDENT + 'tag: ' + tag + '\n' +
      INDENT + 'payload:\n' +
        pretty_print_payload(message, definitions, 2)
      ); 
    //this.output('transmit\n' + service + ' ' + message + ' ' + command + ' ' + tag)
  }


 
  this.formatXML=function(string)
  {
    string=string.replace(/<\?[^>]*>/, '');
    var re = /([^<]*)(<(\/)?[^>/]*(\/)?>)/g, match = null, indentCount = 0;
   
    var ret = '';
    while(match = re.exec(string))
    {
      if( match[3] )
      {
        indentCount--;
        if( match[1] )
        {
          /*          
          if( match[1].length > 20  )
          {
            ret +=  match[1].slice(0, 20) +"..."+ match[2];
          }
          else
          {
            ret +=  match[1] + match[2];
          }
          */
          ret +=  match[1] + match[2];
        }
        else
        {
          ret += '\n' + getIndent(indentCount) + match[0];
        }
      }
      else if(match[4])
      {
        ret += '\n' + getIndent(indentCount) + match[0];
      }
      else
      {
        ret += '\n' + getIndent(indentCount) + match[0];
        indentCount++;
      }
      
    }
    
    self.output(ret);
  }

  this.init(id, name, container_class);
}

cls.debug.Debug.prototype = ViewBase;

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
      }
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


