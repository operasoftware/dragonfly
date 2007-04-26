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
    return ['div', ['h3', 'Stop At']].concat([ret]);
  }
}