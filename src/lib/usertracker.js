window.cls || ( window.cls = {} );

cls.UserTracker = function(url, storagekey)
{

  this._make_id = function(length)
  {
    length = length || 16;
    var chars = "0123456789abcdefghijklmnopqrstuvwxyz";
    var ret = "";
    while (length--)
    {
        ret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return ret;
  }

  this.call_home = function(callback)
  {
    callback = callback || function() {};
    var conn = new XMLHttpRequest();
    var url = this.url + "?user=" + this.id + "&timestamp=" + (new Date().getTime());

    var rshandler = function()
    {
      if (conn.readyState == 4)
      {
        callback(conn.status, url);
      }
    }

    conn.onreadystatechange = rshandler;
    conn.open("GET", url, true);
    conn.send(null);
  }


  this.url = url;
  this.storagekey = "usertracker_id";

  if (window.localStorage)
  {
    this.id = window.localStorage.getItem(this.storagekey);
    if (!this.id)
    {
      this.id = this._make_id(8);
      window.localStorage.setItem(this.storagekey, this.id);
    }
  }
  else
  {
    this.id = "client-without-localstorage";
  }
}
