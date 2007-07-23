var tagManager = new function()
{
  var counter = 1;
  var tags = {};

/** To set a tagged callback. Arguments are object, method, additional arguments. 
  * The method will be called on the object with the response (xml document) as first argument, 
  * concatenated with the additional arguments.
  * @param {Object} obj This is a string parameter
  * @param {Object} methode This is a string parameter
  * @param { } additinal argument
  * @param { } ...
  */
  this.setCB = function(obj, methode, args_list) // object, methode, other args
  {
    var tag = (counter++).toString();
    tags[tag] = {obj: obj, methode: methode, args: args_list ? args_list : []};
    return tag;
  }

  this.handleResponse = function(response) // response is xml document
  {
    var tag = response.getNodeData('tag'), cb = null;
    if( tag && ( cb = tags[tag] ) )
    {
      cb.methode.apply(cb.obj, [response].concat(cb.args));
      delete cb;
      return true;
    }
    else
    {
      return false;
    }
  }

}
