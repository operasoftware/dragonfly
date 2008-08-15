/**
  * @constructor 
  */

var ServiceBase = new function(name)
{

  this.name = name;

  this.onreceive = function(xml)
  {

  }

  this.onconnect = function(xml)
  {

  }

  this.onquit = function(xml)
  {

  }

  this.post = function(msg)
  {
    client.post(this.name, msg);
  }

  this.initBase = function(name)
  {
    this.name = name;

    if(!window.services)
    {
      window.services = {};
    }
    window.services[name] = this;
  }

}