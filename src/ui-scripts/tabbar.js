/**
  * @constructor
  * data model for a tabbar.
  */

var Tabbar = function(id, tabs)
{

   
 
  /* interface */

  /**
    * To add a new tab dynamically.
    * The data model differentiates between static and dynamic.
    * @param {String} view_id.
    */
  this.add_tab = function(view_id){};


  /**
    * To remove a tab dynamically.
    * @param {String} view_id.
    */
  this.remove_tab = function(view_id){};


  this.register_ui_tabs = function(tabs){};


  /* private */

  this._init = function(id, tabs)
  {
    this._ui_tabs = [];
    this.id = id;
    this.static_tabs = tabs || [];
    this.dynamic_tabs = [];
  }

  /* implementation */

  this.register_ui_tabs = function(tabs)
  {
    this._ui_tabs.push(tabs);
    opera.postError('tabs pushed');
  };

  this.add_tab = function(view_id)
  {
    if (window.views[view_id])
    {
      this.dynamic_tabs.push(view_id);
      var tab = new Tab(view_id, window.views[view_id].name, true);
      this._ui_tabs.forEach(function(tabs)
      {
        tabs.addTab(tab);
      });
    }
  };

  this.remove_tab = function(view_id)
  {
    this.dynamic_tabs = this.dynamic_tabs.filter(function(id)
    {
      return id !== view_id;  
    });
    this._ui_tabs.forEach(function(tabs)
    {
      tabs.removeTab(view_id);
    });
  };


  /* initialisation */

  this._init(id, tabs);

}