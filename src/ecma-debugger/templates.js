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
}