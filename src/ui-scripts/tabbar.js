/**
  * @constructor
  * data model for a tabbar.
  */

var Tabbar = function(id, tabs)
{

  /* interface */

  /**
    * To add a new tab dynamically.
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
    this.id = id;
    this._ui_tabs = [];
    this._static_tabs = tabs || [];
    this._dynamic_tabs = [];
  }

  /* implementation */

  this.register_ui_tabs = function(tabs)
  {
    if (this._ui_tabs.indexOf(tabs) == -1)
    {
      this._ui_tabs.push(tabs);
      this._dynamic_tabs.forEach(function(view_id)
      {
        var view = window.views[view_id];
        tabs.addTab(new Tab(view_id, view && view.name || '', true));
      });
    }
  };

  this.add_tab = function(view_id)
  {
    if (window.views[view_id])
    {
      this._dynamic_tabs.push(view_id);
      var tab = new Tab(view_id, window.views[view_id].name, true);
      this._ui_tabs.forEach(function(tabs)
      {
        if (!tabs.hasTab(view_id))
        {
          tabs.addTab(tab);
        }
      });
    }
  };

  this.remove_tab = function(view_id)
  {
    this._dynamic_tabs = this._dynamic_tabs.filter(function(id)
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
