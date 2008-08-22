/**
 * @fileoverview
 */

var cls = window.cls || ( window.cls = {} );

/**
  * Window manager service class
  * @constructor 
  * @extends ServiceBase
  */
cls.HTTPLoggerService = function(name)
{
    var self = this;
    var view = "http_logger";


    this.onreceive = function(xml) // only called if there is a xml
    {
        if( ini.debug )
        {
            debug.logEvents(xml);
        }

        if( self[xml.documentElement.nodeName] )
        {
            self[xml.documentElement.nodeName](xml)
        }
        else
        {
            opera.postError( "window manager not handled: " + new XMLSerializer().serializeToString(xml))
            // opera.postError('error in window manager, genericEventListener');
        }
    }

  // events
  // request, response

    this['request'] = function(msg) 
    {
      opera.postError( "Got request: " + new XMLSerializer().serializeToString(msg))
    }

    this['response'] = function(msg) 
    {
        opera.postError( "Got response: " + new XMLSerializer().serializeToString(msg))
    }

  // commands

  //this.getActiveWindow = function()
  //{
  //  this.post("<get-active-window />");
  //}
  //
  //this.getWindowList = function()
  //{
  //  this.post("<list-windows />");
  //}

  

    this.onconnect = function(xml)
    {
    }

    var onAplicationsetup = function()
    {
    }

  // constructor calls

    this.initBase(name);
  
    if( ! client)
    {
        opera.postError('client does not exist');
        return;
    }
    client.addService(this);

  // messages.addListener('application-setup', onAplicationsetup);
}

cls.HTTPLoggerService.prototype = ServiceBase;
new cls.HTTPLoggerService('http-logger');

// for testing
//
//var window_manager_data = new function()
//{
//  this.active_window = null;
//}
//
//var cls = window.cls || ( window.cls = {} );
//
///**
//  * @constructor 
//  * @extends ViewBase
//  */
//
//cls.WindowManagerTestView = function(id, name, container_class)
//{
//  var self = this;
//  this.createView = function(container)
//  {
//    container.innerHTML = "<div class='padding'>" +
//      "<p>active window: " + window_manager_data.active_window + "</p>" +
//      "</div>";
//
//  }
//  this.init(id, name, container_class);
//}
//
//cls.WindowManagerTestView.prototype = ViewBase;
//new cls.WindowManagerTestView('window_manager', 'Test Window Manager', 'scroll');
//