window.cls || (window.cls = {});

window.cls.SearchWindow = function(id, name, container_class)
{
  /* interface */
  this.createView = function(container){};
  /**
    * To show the color picker.
    * @param {Event} event. The event target is the color sample to be edited.
    */
  this.show_search_window = function(event){};

  /* settings */
  this.show_in_views_menu = true;
  this.window_top = 20;
  this.window_left = 20;
  this.window_width = 450;
  this.window_height = 250;
  this.window_statusbar = false;

  /* private */




  /* implementation */
  this.createView = function(container)
  {
    container.clearAndRender(['h1', 'hello']);
  }

  this.show_search_window = function(event)
  {
    UIWindowBase.showWindow(this.id,
                            this.window_top,
                            this.window_left,
                            this.window_width,
                            this.window_height);
  }





  this.ondestroy = function()
  {

  }

  /* initialistaion */
  this.init(id, name, container_class);

}

window.cls.SearchWindow.CSS_CLASS_TARGET = 'color-picker-target-element';

window.cls.SearchWindow.prototype = ViewBase;
