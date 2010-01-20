/**
  * @constructor 
  */

var tagManager = new function()
{
  var counter = 1;
  var tags = {};

/** To set a tagged callback. Arguments are object, method, additional arguments. 
  * The method will be called on the object with the response (xml document) as first argument, 
  * concatenated with the additional arguments.
  * @param {Object} obj the object on which the methode will be called or null
  * @param {Function} methode the callback function
  * @param {Array} args_list the arguments of this list will be concateneted with the xml response document as first argument
  * @return {String} unique tag
  */
  this.set_callback = function(obj, methode, args_list) // object, methode, other args
  {
    var tag = (counter++).toString();
    tags[tag] = {obj: obj, methode: methode, args: args_list ? args_list : []};
    if( window.__debug_event_flow__ ) 
    {
      tags[tag].time = new Date().getTime();
    }
    if( window.__profiling__ ) 
    {
      window.__times__[0] =  new Date().getTime();
    }
    return tag;
  }

  this.handleResponse = function(response) // response is xml document
  {
    var tag = response.getNodeData('tag'), cb = null;
    if( tag && ( cb = tags[tag] ) )
    {
      delete tags[tag];
      if( window.__debug_event_flow__ )  
      {
        debug.output('tag: '+( (new Date().getTime())- cb.time ));
      }
      cb.methode.apply(cb.obj, [response].concat(cb.args));
      return true;
    }
    else
    {
      return false;
    }
  }

}
