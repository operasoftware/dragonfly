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
    return ret.concat(['class', 'folder']);
  }

  this.runtimeId = function(runtime)
  {
    var ret = ['li',
          ['input', 
            'type', 'button', 
            'handler', 'show-scripts', 
            'runtime_id', runtime['runtime-id'],
            'class', 'folder-key'].concat(runtime.unfolded ? ['style', 'background-position:0 -11px'] : [] ),
          ['span', runtime['uri'], 'handler', 'show-global-scope'].
            concat( runtime.selected ? ['class', 'selected-runtime'] : [] ) 
        
      ];
    if( runtime.unfolded )
    {
      var scripts = runtimes.getScripts(runtime['runtime-id']), 
        script = null, i=0, scripts_container =['ul'];
      for( ; script = scripts[i]; i++)
      {
        scripts_container.push(templates.scriptLink(script));
      }
      ret = ret.concat([scripts_container]);
    }
    return ret;
  }
  this.scriptLink = function(script)
  {
    return ['li',
        script['script-type']+' - '+(script['uri']?script['uri']:'script-id: '+script['script-id']),
        'handler', 'display-script',
        'script-id', script['script-id']
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
        'checked', settingValue ?  true : false,
        'handler', 'set-stop-at'
        ],
        settingName
      ]
    ]
  }

  this.frame = function(frame, is_top)
  {
    return ['li',
      ( frame.fn_name ? frame.fn_name : 'anonymous' ) + 
        ( frame.line ? ' ' + 'line ' + frame.line : '' ) + 
        ( frame.script_id ? ' script id ' + frame.script_id : '' ),
      'handler', 'show-frame',
      'ref-id', frame.id,

    ].concat( is_top ? ['class', 'selected'] : [] );
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
    var ret = [];
    ret[ret.length] = self.continueWithMode('run ( F5 )', 'run');
    ret[ret.length] = self.continueWithMode('step into call ( F11 )', 'step-into-call');
    ret[ret.length] = self.continueWithMode('step next line ( F10 )', 'step-over-call');
    ret[ret.length] = self.continueWithMode('step out of call ( Shift F11 )', 'finish-call');
    return ret;
  }

  this.continueWithMode = function(name, mode)
  {
    return ['input',
          'type', 'button',
          'value', '',
          'title', name,
          'mode', mode,
          'id', 'continue-' + mode,
          'handler', 'continue',
          'disabled', true
        ]
  }

  this.examineObject = function( data )
  {
    var prop = null, 
    i = 0, 
    ret = ['ul'];


    for( i=0 ; prop = data[i]; i++)
    {
      switch(prop.type)
      {
        case 'object':
        {
          ret[ret.length] = self.key_value_folder(prop.key, i);
          break;
        }
        case 'undefined':
        case 'null':
        {
          ret[ret.length] = self.key_value(prop.key, prop.value, 'type', i);
          break;
        }
        default:
        {
          ret[ret.length] = ret[ret.length] = self.key_value(prop.key, prop.value, 'value', i);
          break;
        }
      }
    }

    if( window.__profiling__ ) 
    {
      window.__times__[4] =  new Date().getTime(); // creating markup
    }

    return ret;
  }



  this.key_value = function(key, value, value_class, ref_index)
  {
    return ['li', 
        ['span', key, 'class', 'key'], 
        ['span', value].concat( value_class ? ['class', value_class] : []),
      'ref_index', ref_index
    ];
  }

  this.key_value_folder = function(key, ref_index)
  {
    return ['li', 
      ['input', 'type', 'button', 'handler', 'examine-object', 'class', 'folder-key'],
      ['span', key, 'class', 'key'], 
      ['span', 'object', 'class', 'type'],
      'ref_index', ref_index
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


  this.toolbars = function()
  {
    return ['div', 
      ['h1', 'Opera developer tools'],
      ['div', 'id', 'continues'],
      ['ul', 
        ['li', 'Runtimes', 'handler', 'drop-down', 'ref', 'runtimes'],
        ['li', 'Configuration', 'handler', 'drop-down', 'ref', 'configuration'],
        ['li', 'Console', 'handler', 'drop-down', 'ref', 'console'],
        ['li', 'Enviroment', 'handler', 'drop-down', 'ref', 'environment'],
        (ini.debug || window.__profiling__ || window.__times_spotlight__ ? ['li', 'Debug', 'handler', 'drop-down', 'ref', 'debug'] : [] ),
        (ini.debug || window.__profiling__ ? ['li', 'Command Line', 'handler', 'drop-down', 'ref', 'command-line'] : [] ),
        (ini.debug || window.__testing__ ? ['li', 'Testing', 'handler', 'drop-down', 'ref', 'testing'] : [] ),

      'class', 'dropdowns'],
      'id', 'ecma-debugger-toolbar']
  }

  this.runtimes_dropdown = function(ele)
  {
    return ['div', ['ul', 'id', 'runtimes'], 'class', 'window-container'];
  }

  this.messages = function(messages)
  {
    var message = null, i = 0;
    var ret = ['div'];
    for( ; message = messages[i]; i++)
    {
      ret[ret.length] = self.message(message);
    }
    return ret;
  }

  this.message = function( message)
  {
    return ['ul',
      ['li', message.source + ' ' + message.severity],
      ['li', new Date(parseInt( message.time )*1000).toString().replace(/GMT.*$/, '') ],
      ['li', message.url],
      ['li', message.context],
      ['li', ['pre', message['text']]]
    ]
  }

}