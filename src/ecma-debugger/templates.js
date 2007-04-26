templates = new function()
{
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
        'runtime_id', runtime['runtime-id']
      ]
  }
  this.scriptLink = function(script)
  {
    return ['li',
        script['script-type']+' - '+(script['uri']?script['uri']:'script-id: '+script['script-id']),
        'onclick', handlers.showScript,
        'ref', script
      ]
  }
}