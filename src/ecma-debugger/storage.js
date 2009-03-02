/**
 * Code dealing with persistant storage
 *
 */
 

/**
 * This singleton deals with actual storing of data. It currently uses
 * cookies for this purpose. The store can save all data types supported
 * by json. Storage are based on key/value pairs, with optional timestamp
 * for expiry.
 * @class
 * @constructor 
 */
storage = new function()
{
  /**
   * @private
   */
  var setCookie = function(name, value, time)
  {
    document.cookie = name + "="+
      encodeURIComponent(value)+
      "; expires="+(new Date(new Date().getTime()+ ( time || 360 * 24 * 60 * 60 * 1000 ))).toGMTString()+
      "; path=/";
  }

  /**
   * @private
   */
  var getCookie = function(name)
  {
    var match = null;
	  if( match = new RegExp(name+'\=([^;]*);','').exec(document.cookie+';') )
    {
      return decodeURIComponent(match[1]);
    }
	  return null;
  }
  
  /**
   * store a value with the given key
   */
  this.set = function(key, value)
  {
    setCookie(key, JSON.stringify(value))
  }
  
  /**
   * get a value with the given key. If there is no value for the key, the
   * optional default_value argument is returned. If there is no value for
   * the key, nor any default_value, undefined is returned.
   */
  this.get = function(key, default_value)
  {
    var val = getCookie(key);
    if(val)
    {
      // this can be false;
      return JSON.parse(val);
    }
    return default_value;
  }
  
  var storage = {};

  this.config_stop_at = 
  {
    map:
    {
      sc: 'script',
      ex: 'exception',
      er: 'error',
      ab: 'abort'
    },
    defaults:
    {
      sc: '0',
      ex: '0',
      er: '0',
      ab: '0'
    },
    name: 'stop_at',
    get: function()
    {
      var stop_at = getCookie(this.name);
      var ret={}, prop = '';
      if(stop_at)
      {
        while(stop_at)
        {
          ret[this.map[stop_at.slice(0,2)]] = stop_at.slice(2,3) == '1' ? 'yes' : 'no';
          stop_at = stop_at.slice(3);
        }
      }
      else
      {
        for ( prop in this.defaults )
        { 
          ret[this.map[prop]] = this.defaults[prop] == '1' ? 'yes' : 'no';
        }
      }
      return ret;
    }, 
    set : function()
    {
      var stop_at = getCookie(this.name);
      var cur={}, new_val = '';
      if(stop_at)
      {
        while(stop_at)
        {
          cur[stop_at.slice(0,2)] = stop_at.slice(2,3);
          stop_at = stop_at.slice(3);
        }
      }
      else
      {
        for ( prop in this.defaults )
        { 
          cur[prop] = this.defaults[prop] ;
        }        
      }
      var key = value='', i = 0, prop = '';
      for ( ; ( key = arguments[i++] ) && ( value = arguments[i] ) ; i++ )
      {
        for (prop in cur)
        {
          if(this.map[prop] == key)
          {
            cur[prop] = value == 'yes' ? '1': '0';
          }
        }
      }
      for (prop in cur)
      {
        new_val += prop + cur[prop];
      }
      setCookie(this.name, new_val)
    }
  }
}

