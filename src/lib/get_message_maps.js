window.cls || (window.cls = {});
window.cls.GetMessageMaps = function (){};

/* static interface */
window.cls.GetMessageMaps.pretty_print_map = function(map){};

window.cls.GetMessageMaps = function ()
{

  /* interface */
  this.get_maps = function(service_descriptions, onsuccess, onerror){};
  
  /* constants */
  const 
  INDENT = '  ',
  NAME = 1,
  FIELD_LIST = 2,
  FIELD_NAME = 0,
  FIELD_TYPE = 1,
  FIELD_NUMBER = 2,
  FIELD_Q = 3,
  FIELD_ID = 4,
  ENUM_ID = 5,
  Q_MAP = 
  {
    0: "required",
    1: "optional",
    2: "repeated"
  },
  MSG_TYPE_COMMAND = 1,
  MSG_TYPE_RESPONSE = 2,
  MSG_TYPE_EVENT = 3,
  // Command Info
  COMMAND_LIST = 0,
  EVENT_LIST = 1,
  MSG_NAME = 0,
  NUMBER = 1,
  MESSAGE_ID = 2,
  RESPONSE_ID = 3,
  // Command MessageInfo
  MSG_LIST = 0,
  MSG_ID = 0;
  
  /* private */
  this._service_infos = null;
  this._map = null;
  // ===========================
  // get the messages from scope
  // ===========================
  this._get_maps = function()     
  {
    if (this._service_descriptions.scope)
    {
      var version = this._service_descriptions.scope.version.split('.').map(Number);
      if (version[1] >= 1) 
        this._request_enums();
      else 
        this._request_infos();
    }
    else 
      this._onerror({message: "failed to get maps, no scope in  service descriptions"});

  };
  
  this._request_enums = function()
  {
    var service = '', tag = 0;
    for (service in this._service_infos)
    {
      tag = tagManager.set_callback(this, this._handle_enums, [service]);
      services["scope"].requestEnumInfo(tag, [service, [], 1]);
    }
  };
  
  this._handle_enums = function(status, msg, service)
  {
    if (!status)
    {
      this._service_infos[service]['raw_enums'] = msg;
      if (this._check_map_complete('raw_enums'))
        this._request_infos();
    }
    else
      this._onerror({message: "failed to get enums for " + service + " in _handle_enums"});
  };

  this._request_infos = function()
  {
    var service = '', tag = 0;
    for (service in this._service_infos)
    {
      tag = tagManager.set_callback(this, this._handle_infos, [service]);
      services["scope"].requestInfo(tag, [service]);
    }
  };

  this._handle_infos = function(status, msg, service)
  {
    if (!status)
    {
      this._service_infos[service]['raw_infos'] = msg;
      var tag = tagManager.set_callback(this, this._handle_messages, [service]);
      services["scope"].requestMessageInfo(tag, [service, [], 1, 1]);
    }
    else
      this._onerror({message: "failed to get infos for " + service + " in _handle_infos"});
  };

  this._handle_messages = function(status, msg, service)
  {
    if (!status)
    {
      this._service_infos[service]['raw_messages'] = msg;
      try
      {
        this._parse_raw_lists(service);
      }
      catch(e)
      {
        this._service_infos[service]['raw_messages'] = null;
        this._onerror({message: "failed to build the message maps for " + service});
      }
      if (this._check_map_complete('raw_messages'))
        this._finalize();
    }
    else
      this._onerror({message: "failed to get infos for " + service + " in _handle_infos"});
  };

  this._check_map_complete = function(prop)
  {
    for (var service in this._service_infos)
      if (!this._service_infos[service][prop])
        return false;
    return true;
  };

  // =======================
  // create the message maps
  // =======================

  this._get_msg = function(list, id)
  {
    const MSG_ID = 0;
    for (var i = 0; i < list.length && list[i][MSG_ID] !== id; i++);
    return list[i];
  };

  this._get_enum = function(list, id)
  {
    var 
    enums = this._get_msg(list, id),
    name = enums && enums[1] || '', 
    dict = {}, 
    enum = null, 
    i = 0;

    if (enums && enums.length == 3)
      for (; enum = enums[2][i]; i++)
        dict[enum[1]] = enum[0];
    return [name, dict];
  };

            
  this._parse_msg = function(msg, msg_list, parsed_list, raw_enums, ret)
  {
    var field = null, i = 0, name = '', field_obj = null, enum = null, sub_msg = null;
    if (msg)
    {
      for (; i < msg[FIELD_LIST].length; i++)
      {
        field = msg[FIELD_LIST][i];
        name = field[FIELD_NAME];
        field_obj = 
        {
          name: name,
          q: 'required',
          type: field[FIELD_TYPE],
        };
        if (field[FIELD_Q])
          field_obj.q = Q_MAP[field[FIELD_Q]];
        if (field[FIELD_ID])
        {
          if (name in parsed_list)
          {
            field_obj.message = parsed_list[name].message;
            field_obj.message_name = parsed_list[name].message_name;
          }
          else
          {
            parsed_list[name] = field_obj;
            sub_msg = this._get_msg(msg_list, field[FIELD_ID]);
            field_obj.message_name = sub_msg && sub_msg[1] || 'default';
            field_obj.message = [];
            this._parse_msg(sub_msg, msg_list, parsed_list, raw_enums, field_obj.message);
          }
        }
        if (field[ENUM_ID])
        {
          enum = this._get_enum(raw_enums, field[ENUM_ID]);
          field_obj.enum = {name: enum[0], numbers: enum[1]};
        }
        ret.push(field_obj);
      }
    }
    return ret
  };

  this._parse_raw_lists = function(service)
  {
    var 
    map = this._map[service] = {},
    command_list = this._service_infos[service].raw_infos[COMMAND_LIST]
    msgs = this._service_infos[service].raw_messages[MSG_LIST]
    enums = this._service_infos[service].raw_enums && 
        this._service_infos[service].raw_enums[MSG_LIST] || [],
    command = '',
    command_obj = null, 
    event_list = this._service_infos[service].raw_infos[EVENT_LIST],
    event = null,
    event_obj = null,
    msg = null,
    i = 0;

    for (; i < command_list.length; i++)
    {
      command = command_list[i];
      command_obj = map[command[NUMBER]] = {};
      command_obj.name = command[MSG_NAME];
      msg = this._get_msg(msgs, command[MESSAGE_ID]);
      command_obj[MSG_TYPE_COMMAND] = this._parse_msg(msg, msgs, {}, enums, []);
      msg = this._get_msg(msgs, command[RESPONSE_ID]);
      command_obj[MSG_TYPE_RESPONSE] = this._parse_msg(msg, msgs, {}, enums, []);
    };
    if (event_list)
      for (i = 0; i < event_list.length; i++)
      {
        event = event_list[i];
        event_obj = map[event[NUMBER]] = {};
        event_obj.name = event[MSG_NAME];
        msg = this._get_msg(msgs, event[MESSAGE_ID]);
        event_obj[MSG_TYPE_EVENT] = this._parse_msg(msg, msgs, {}, enums, []);
      }
  };

  this._finalize = function()
  {
    this._onsuccess(this._map);
    this._service_descriptions = null; 
    this._onsuccess = null;
    this._onerror = null;
    this._service_infos = null;
    this._map = null;
  };

  /* implementation */
  
  this.get_maps = function(service_descriptions, onsuccess, onerror)
  {
    if (!onsuccess || !onerror)
    {
      throw new Error("get_maps must be called with an onsuccess and an onerror callback");
    }
    this._service_descriptions = service_descriptions;
    this._onsuccess = onsuccess;
    this._onerror = onerror;
    this._service_infos = {};
    this._map = {};
    for (var service in service_descriptions)
    {
      if (!/^stp-|^core-/.test(service))
      {
        this._service_infos[service] =
        {
          'raw_enums': null,
          'raw_infos': null,
          'raw_messages': null,
        }
      }
    }
    this._get_maps(service_descriptions);
  }
};

// =========================
// pretty print message maps
// =========================
  
window.cls.GetMessageMaps.pretty_print_map = function(map)
{
  var pp_map = this._pretty_print_object('', map, 0, ['message map =']);
  window.open("data:text/plain," + encodeURIComponent(pp_map.join('\n')));
};

window.cls.GetMessageMaps._pretty_print_object = 
function(name, obj, indent, print_list, circular_check_list)
{
  circular_check_list = circular_check_list && circular_check_list.slice(0) || [];
  const
  TYPE =
  {
     1: 'NUMBER', // Double
     2: 'NUMBER', // Float
     3: 'NUMBER', // Int32
     4: 'NUMBER', // Uint32
     5: 'NUMBER', // Sint32
     6: 'NUMBER', // Fixed32
     7: 'NUMBER', // Sfixed32
     8: 'BOOLEAN', // Bool
     9: 'STRING', // String
    10: 'BYTES', // Bytes
    11: 'MESSAGE', // Message
    12: 'NUMBER', // Int64 (not supported yet)
    13: 'NUMBER', // Uint64 (not supported yet)
    14: 'NUMBER', // Sint64 (not supported yet)
    15: 'NUMBER', // Fixed64 (not supported yet)
    16: 'NUMBER', // Sfixed64 (not supported yet)
  },
  MSG_TYPE =
  {
    1: "Command",
    2: "Response",
    3: "Event",
  };
  print_list.push(this._get_indent(indent) + this._quote(name, ': ') + '{');
  indent++;
  for (var key in obj)
  {
    if (typeof obj[key] == 'string' || typeof obj[key] == 'number')
    {
      if (key == 'type' && /^\d+$/.test(obj[key]))
        print_list.push(this._get_indent(indent) + 
            this._quote(key) + ': "' + TYPE[obj[key]] + '", // ' + obj[key]);
      else
        print_list.push(this._get_indent(indent) + 
            this._quote(key) + ': ' + this._quote(obj[key]) +',');
    }
  }
  for (key in obj)
  {
    if (Object.prototype.toString.call(obj[key]) == '[object Object]')
      this._pretty_print_object(key, obj[key], indent, print_list, circular_check_list || []);
  }
  for (key in obj)
  {
    if (Object.prototype.toString.call(obj[key]) == '[object Array]')
    {
      if (key == 'message')
      {
        if (circular_check_list.indexOf(obj.message_name) != -1)
        {
          print_list.push(this._get_indent(indent) + '"message": <circular reference>,');
          continue;
        }
        else
          circular_check_list.push(obj.message_name);
      }
      if (indent == 3)
        print_list.push(this._get_indent(indent) + '// ' + MSG_TYPE[key]);
      if (obj[key].length)
      {
        print_list.push(this._get_indent(indent) + this._quote(key) + ': [');
        for (var i = 0; i < obj[key].length; i++)
          this._pretty_print_object('', obj[key][i], indent + 1, print_list, circular_check_list);
        print_list.push(this._get_indent(indent) + '],');
      }
      else
        print_list.push(this._get_indent(indent) + this._quote(key) + ': [],');
    }
  }
  indent--;
  print_list.push(this._get_indent(indent) + '},');
  return print_list;
};

window.cls.GetMessageMaps._get_indent = function(indent)
{
  const INDENT = '  ';
  for (var ret = ''; indent-- && (ret += INDENT); );
  return ret;
};

window.cls.GetMessageMaps._quote = function(value, token)
{
  return value ? (/^\d+$/.test(value) ?  value : '"' + value + '"') + (token || '') : '';
}
 
