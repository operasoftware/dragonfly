window.cls || (window.cls = {});

window.cls.ScreenShotControlsView = function(id, name, container_class)
{
  this.createView = function(container)
  {
    container.innerHTML = "<p>hello again";
  }

  this.init(id, name, container_class);
};

cls.ScreenShotControlsView.prototype = ViewBase;
