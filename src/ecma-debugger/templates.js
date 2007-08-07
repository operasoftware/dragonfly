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

  this.runtimes = function(runtimes)
  {
    var ret = ['ul'];
    var cur = '';
    for( cur in runtimes )  
    {
      if( runtimes[cur] ) // this is a temporary fix
      {
        ret[ret.length] = self.runtimeId(runtimes[cur]);
      }
    }
    return ret;
  }

  this.runtimeId = function(runtime)
  {
    return ['li',
        runtime['uri'],
        'handler', 'show-scripts',
        'runtime_id', runtime['runtime-id'],
        'hanler', 'yes'
      ]
  }
  this.scriptLink = function(script)
  {
    return ['li',
        script['script-type']+' - '+(script['uri']?script['uri']:'script-id: '+script['script-id']),
        'onclick', handlers.showScript,
        'script-id', script['script-id'],
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

  this.frame = function(frame)
  {
    return ['li',
      ( frame.fn_name ? frame.fn_name : 'anonymous' ) + 
        ( frame.line ? ' ' + 'line ' + frame.line : '' ) + 
        ( frame.script_id ? ' script id ' + frame.script_id : '' ),
      'handler', 'show-frame',
      'ref-id', frame.id
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
    ret[ret.length] = self.continueWithMode('step next line', 'step-over-call');
    ret[ret.length] = self.continueWithMode('step out of call', 'finish-call');
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
          'handler', 'continue',
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
      var unsorted = [];


      for( ; prop = props[i]; i++)
      {
        // "number" | "boolean" | "string" | "null" | "undefined" | "object"
        switch(prop.getNodeData('data-type'))
        {
          case 'object':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: prop.getNodeData('object-id'),
              type: 'object'
            }
            //self.key_value_folder(prop.getNodeData('property-name'), runtime_id, prop.getNodeData('object-id'));
            break;
          }

          case 'undefined':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: '"undefined"',
              type: 'undefined'
            }
            //self.key_value(prop.getNodeData('property-name'), '"undefined"', 'type');
            break;
          }
          case 'null':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: 'null',
              type: 'null'
            }
            //self.key_value(prop.getNodeData('property-name'), 'null', 'type');
            break;
          }
          case 'number':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: prop.getNodeData('string'),
              type: 'number'
            }
            //self.key_value(prop.getNodeData('property-name'), prop.getNodeData('object-value'), 'value');
            break;
          }
          case 'string':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: '"' + prop.getNodeData('string') + '"',
              type: 'string'
            }
            //self.key_value(prop.getNodeData('property-name'), '"' + prop.getNodeData('string') + '"', 'value');
            break;
          }
          case 'boolean':
          {
            unsorted[unsorted.length] = 
            {
              key: prop.getNodeData('property-name'),
              value: prop.getNodeData('string'),
              type: 'boolean'
            }
            //self.key_value(prop.getNodeData('property-name'), prop.getNodeData('object-value'), 'value');
            break;
          }
        }
      }
      
      unsorted.sortByFieldName('key');

      for( i=0 ; prop = unsorted[i]; i++)
      {
        switch(prop.type)
        {
          case 'object':
          {
            ret[ret.length] = self.key_value_folder(prop.key, runtime_id, prop.value);
            break;
          }
          case 'undefined':
          case 'null':
          {
            ret[ret.length] = self.key_value(prop.key, prop.value, 'type');
            break;
          }
          default:
          {
            ret[ret.length] = ret[ret.length] = self.key_value(prop.key, prop.value, 'value');
            break;
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
      ['span', 'object', 'class', 'type'],
      'runtime-id', runtime_id, 'object-id', object_id
    ];
  }

  this.breakpoint = function(line_nr, top)
  {
    return ['li',
          'class', 'breakpoint',
          'line_nr', line_nr,
          'style', 'top:'+ top +'px'
        ]
  }

}