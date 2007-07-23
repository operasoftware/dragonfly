templates = new function()
{
  var self = this; 
  this.hello = function(enviroment)
  {
    var ret = ['ul'];
    var prop = '';
    for( prop in enviroment)
    {
      ret[ret.length] = ['li', prop+': '+enviroment[prop]];
    }
    return ret;
  }
  this.runtimeId = function(runtime)
  {
    return ['li',
        runtime['uri'],
        'onclick', handlers.showAllScripts,
        'runtime_id', runtime['runtime-id'],
        'hanler', 'yes'
      ]
  }
  this.scriptLink = function(script)
  {
    return ['li',
        script['script-type']+' - '+(script['uri']?script['uri']:'script-id: '+script['script-id']),
        'onclick', handlers.showScript,
        'ref', script,
        'hanler', 'yes'
      ]
  }
  //templates.configStopAt(config)
  // stop at: "script" | "exception" | "error" | "abort" | "gc", yes/no;

  this.checkbox = function(settingName, settingValue)
  {
    return ['li',
      ['label',
        ['input', 
        'type', 'checkbox', 
        'value', settingName,
        'checkbox', settingValue == 'yes' ? true : false,
        'onclick', handlers.setStopAt
        ],
        settingName
      ]
    ]
  }

  this.frame = function(fn_name, line, runtime_id, script_id, argument_id, scope_id)
  {
    return ['li',
      ( fn_name ? fn_name : 'anonymous' ) + ' ' + 'line '+line + ' script id ' + script_id,
      'handler', 'show-frame',
      'runtime_id', runtime_id.toString(),
      'argument_id', argument_id, 
      'scope_id', scope_id,
      'line', line,
      'script_id', script_id
    ];
  }

  this.configStopAt = function(config)
  {
    var ret =['ul'];
    var arr = ["script", "exception", "error", "abort", "gc"], n='', i=0;
    for( ; n = arr[i]; i++)
    {
      ret[ret.length] = this.checkbox(n, config[n]); 
    }
    return ['div'].concat([ret]);
  }
/*

MODE ::= "<mode>" 
             ( "run" | "step-into-call" | "step-over-call" | "finish-call" )
           "</mode>" ;

           */
  this.continues = function()
  {
    var ret = ['ul'];
    ret[ret.length] = self.continueWithMode('run', 'run');
    ret[ret.length] = self.continueWithMode('step into call', 'step-into-call');
    ret[ret.length] = self.continueWithMode('step over call', 'step-over-call');
    ret[ret.length] = self.continueWithMode('finish call', 'finish-call');
    return ret;
  }

  this.continueWithMode = function(name, mode)
  {
    return ['li',
        ['input',
          'type', 'button',
          'value', name,
          'mode', mode,
          'id', 'continue-' + mode,
          'onclick', handlers.__continue,
          'disabled', true
        ]
      ]
  }

  this.examineObject = function(xml, runtime_id)
  {
    var obj = xml.getElementsByTagName('object')[0];
    if(obj)
    {
      var props = obj.getElementsByTagName('property'), prop = null, i=0;
      var ret = ['ul'];
      var prop_type = '';
      for( ; prop = props[i]; i++)
      {
        // "number" | "boolean" | "string" | "null" | "undefined" | "object"
        switch(prop.getNodeData('data-type'))
        {
          case 'object':
          {
            ret[ret.length] = 
             self.key_value_folder(prop.getNodeData('property-name'), runtime_id, prop.getNodeData('object-id'));
            break;
          }
          case 'number':
          {
            ret[ret.length] = 
              self.key_value(prop.getNodeData('property-name'), prop.getNodeData('object-value'));
            break;
          }
          case 'undefined':
          {
            ret[ret.length] = 
              self.key_value(prop.getNodeData('property-name'), 'undefined');
            break;
          }
          default:
          {
            ret[ret.length] = 
              self.key_value(prop.getNodeData('property-name'), prop.getNodeData('string'));
          }
        }
      }
      return ret;
    }
    return [];
  }



  this.key_value = function(key, value, value_class)
  {
    return ['li', ['span', key, 'class', 'key'], ['span', value].concat( value_class ? ['class', value_class] : [])];
  }

  this.key_value_folder = function(key, runtime_id, object_id)
  {
    return ['li', 
      ['input', 'type', 'button', 'handler', 'examine-object', 'class', 'folder-key'],
      ['span', key, 'class', 'key'], 
      ['span', 'object', 'class', 'object'],
      'runtime-id', runtime_id, 'object-id', object_id
    ];
  }

}