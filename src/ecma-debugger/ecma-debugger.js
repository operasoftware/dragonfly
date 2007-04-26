var debugger = new function()
{
  var self = this;
  var service = "ecmascript-debugger";

  this.getData = function()
  {
    proxy.GET( "/" + service, genericEventListener );
  }

  var genericEventListener = function(xml) 
  {
    if(xml)
    {
      if( self[xml.documentElement.nodeName])
      {
        self[xml.documentElement.nodeName](xml)
      }
      else
      {
        debug.output('not implemented: '+new XMLSerializer().serializeToString(xml));
        //alert("message not implemented: " +(new XMLSerializer().serializeToString(xml));
      }
      debug.formatXML(new XMLSerializer().serializeToString(xml));
    }
    self.getData();
  }

  var runtimes = {};

  var addRuntime = function(id)
  { 
    if( !(id in runtimes) )
    {
      runtimes[id] = null;
      self.getRuntime(id);
    }
  }

  var parseRuntime = function(xml)
  {
    var r_ts = xml.getElementsByTagName('runtime'), r_t=null, i=0;
    var runtimeId = '', runtime=null, prop = '', 
      children = null, child = null, j = 0;
    for ( ; r_t=r_ts[i]; i++)
    {
      runtimeId = r_t.getNodeData('runtime-id'); 
      if(runtimeId)
      {
        runtime={};
        children = r_t.childNodes;
        for(j=0 ; child = children[j]; j++)
        {
          runtime[child.nodeName] = child.textContent;
        }
        runtimes[runtimeId] = runtime;
        document.getElementById('runtime-ids').render(templates.runtimeId(runtime))
      }
    }
  }
  
  var environment = {}

  /**** generic event listener ****/

  this['hello'] = function(xml)
  {
    var children = xml.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      environment[child.nodeName] = child.textContent;
    }
    document.getElementById('hello').render(templates.hello(environment));
    var config = storage.config_stop_at.get();
    var config_arr = [], prop = '';
    for ( prop in config )
    {
      config_arr[config_arr.length] = prop;
      config_arr[config_arr.length] = config[prop];
    }
    self.setConfiguration.apply(self, config_arr);
    document.getElementById('configuration').render(templates.configStopAt(config));
  }

  this['new-script'] = function(xml)
  {
    var script = {};
    var children = xml.documentElement.childNodes, child=null, i=0;
    for ( ; child = children[i]; i++)
    {
      script[child.nodeName] = child.firstChild.nodeValue;
    }
    scripts[scripts.length] = script;
    addRuntime(script['runtime-id'])
  }

  this['timeout'] = function() {}

  this['runtimes-reply'] = function(xml)
  {
    var tag = xml.getNodeData('tag'), handler=null;
    if(tag && ( handler = tags[parseInt(tag)] ))
    {
      handler(xml);
    }
    else
    {
      throw "runtimes-reply, missing tag";
    }
  }

  var scripts = [];

  this.getScripts=function(runtime_id)
  {
    var ret=[], script = null, i=0;
    for( ; script = scripts[i]; i++)
    {
      if(script['runtime-id'] == runtime_id)
      {
        ret[ret.length] = script;
      }
    }
    return ret;
  }



  this.setup = function()
  {
    var host = location.host.split(':');
    proxy.onsetup = function()
    {
      if (!proxy.enable(service))	
      {
        alert( "No service: " + service );
        return;
      }
      self.getData();

    }
    proxy.configure(host[0], host[1]);
  }


  /**** commands ****/

  this.setConfiguration = function() 
  {
    var msg = "<set-configuration>", type='', bol='', i=0; 
    for ( ; (type = arguments[i++]) && (bol=arguments[i]); i++ )
    {
      msg += "<stop-at>" + 
          ( bol=='yes' ? "<yes/>" : "<no/>" ) +
          "<stop-type>"+type+"</stop-type>"+
        "</stop-at>";
    }
    msg += "</set-configuration>";
    proxy.POST("/" + service, msg);
  }

  this.getRuntime = function()
  {
    var msg = "<runtimes>";
    var tag = getTagId();
    msg += "<tag>" + tag +"</tag>";
    var i=0, r_t=0;
    for ( ; r_t = arguments[i]; i++)
    {
      msg += "<runtime-id>" + r_t +"</runtime-id>";
    }
    msg += "</runtimes>";
    setTagCB(tag, parseRuntime);
    proxy.POST("/" + service, msg);
  }

  /**** tags handling ****/

  var tags = {};
  var __tagCounter=0;

  var getTagId = function()
  {
    return __tagCounter++;
  }

  var setTagCB =function(tagId, cb)
  {
    tags[tagId] = cb;
  }

  var clearTagId = function(tagId)
  {
    delete tags[tagId];
  }

}


onload = debugger.setup