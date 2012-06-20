window.cls || (window.cls = {});
cls.Overlay || (cls.Overlay = {});
cls.Overlay["1.0"] || (cls.Overlay["1.0"] = {});
cls.Overlay["1.0"].name = 'overlay';

/**
  * @constructor 
  * @extends ServiceBase
  * generated with hob from the service definitions
  */

cls.Overlay["1.0"].Service = function()
{
  /**
    * The name of the service used in scope in ScopeTransferProtocol
    */
  this.name = 'overlay';
  this.version = '1.0';


  // see http://dragonfly.opera.com/app/scope-interface/Overlay.html#createoverlay
  this.requestCreateOverlay = function(tag, message)
  {
    opera.scopeTransmit('overlay', message || [], 1, tag || 0);
  }
  this.handleCreateOverlay = function(status, message)
  {
    /*
    const
    OVERLAY_ID = 0;
    */
    opera.postError("NotBoundWarning: Overlay, CreateOverlay");
  }

  // see http://dragonfly.opera.com/app/scope-interface/Overlay.html#removeoverlay
  this.requestRemoveOverlay = function(tag, message)
  {
    opera.scopeTransmit('overlay', message || [], 2, tag || 0);
  }
  this.handleRemoveOverlay = function(status, message)
  {
    opera.postError("NotBoundWarning: Overlay, RemoveOverlay");
  }
}
