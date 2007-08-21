var messages = new function()
{
  var __listeners = {};
  this.addListener = function(key, cb)
  {
    if( __listeners[ key ] )
    {
      __listeners[ key ].push( cb );
    }
    else
    {
      __listeners[ key ] = [ cb ];
    }
  }
  this.removeListener = function(key)
  {

  }
  this.post = function( key, msg )
  {
    var listeners = __listeners[ key ], cb = null, i = 0
    if( listeners )
    {
      for( ; cb = listeners[i]; i++)
      {
        cb(msg);
      }
    }
  }
}