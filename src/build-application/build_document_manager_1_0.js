window.app.builders.DocumentManager || ( window.app.builders.DocumentManager = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.DocumentManager["1.0"] = function(service)
{
  var namespace = cls.DocumentManager && cls.DocumentManager["1.0"];
  if(namespace)
  {
    return true;
  }
};
