var UI = function()
{
  /*

    static methods
      UI.get_instance
  */
  if (UI.instance)
  {
    return UI.instance;
  }
  UI.instance = this;

  this._tabbars = {};
  this._modebars = {};
  this._searches = {};
  this._overlays = {};

   /* interface */

   /**
     * To get a tabbar by it's id.
     * @param {String} tabbar_id.
     * @returns an instance of Tabbar.
     */
  this.get_tabbar = function(id){};

  this.get_modebar = function(id){};

  this.get_search = function(id){};

  this.get_overlay = function(id){};

  this.register_tabbar = function(id, tabs){};

  this.register_modebar = function(id, modebar){};

  this.register_search = function(id, search){};

  this.register_overlay = function(id, items){};

  this.show_view = function(id){};
  this.show_dropdown = function(id) {};

  this.get_layout_box = function(view_id){};

  this.get_container = function(view_id){};

  this.store_last_selected_view = function(view_id){};

  this.retrieve_last_selected_view = function(){};

  this.get_visible_tabs = function(){};

  /**
    * To get the top bar view id.
    */
  this.get_mode = function() {};


  /* implemenation */
  this.get_tabbar = function(id)
  {
    return this._tabbars[id] || null;
  };

  this.get_modebar = function(id)
  {
    return this._modebars[id] || null;
  };

  this.get_search = function(id)
  {
    return this._searches[id] || null;
  };

  this.get_overlay = function(id)
  {
    return this._overlays[id] || null;
  };

  this.get_layout_box = function(view_id)
  {
    return window.topCell.get_cell(view_id);
  };

  this.get_container = function(view_id)
  {
    return window.views[view_id] && window.views[view_id].get_container() || null;
  };

  this.register_tabbar = function(id, tabs)
  {
    if (!this._tabbars[id])
    {
      this._tabbars[id] = new Tabbar(id, tabs);
    }
    return this._tabbars[id];
  };

  this.register_modebar = function(id, _class)
  {
    if (!this._modebars[id])
    {
      this._modebars[id] = new _class();
    }
    return this._modebars[id];
  };

  this.register_search = function(id, search)
  {
    if (!this._searches[id])
    {
      this._searches[id] = search;
    }
    return this._searches[id];
  };

  this.register_overlay = function(id, items)
  {
    if (!this._overlays[id])
    {
      this._overlays[id] = items;
    }
    return this._overlays[id];
  };

  this.show_view = function(id)
  {
    // TODO make topCell a private member of UI
    var view = window.views[id];
    if (window.topCell && view)
    {
      if (!view.isvisible())
      {
        window.topCell.showView(id);
      }
      return window.views[id];
    }
  };

  this.get_button = function(id)
  {
    // TODO: make this a bit more sophisticated
    return document.getElementById(id);
  };

  this.get_mode_tab = function(id)
  {
    return TabBase.get_tab_by_ref_id(id);
  };

  this.store_last_selected_view = function(view_id)
  {
    window.settings.general.set('last-selected-view', view_id);
  };

  this.retrieve_last_selected_view = function()
  {
    return window.settings.general.get('last-selected-view');
  };

  this.get_visible_tabs = function()
  {
    return window.topCell && window.topCell.get_visible_tabs() || [];
  };

  this.get_mode = function()
  {
    return window.topCell && window.topCell.tab &&
           window.topCell.tab.activeTab || '';
  };

  this.show_dropdown = function(id)
  {
    CstSelect.show_dropdown(id);
  };

}

UI.get_instance = function()
{
  return this.instance || new UI();
};

UI.TYPE_SINGLE_SELECT = "single-select";
UI.TYPE_INPUT = "input";
UI.TYPE_SWITCH = "switch";
UI.TYPE_SWITCH_CUSTOM_HANDLER = "switch-custom-handler";
UI.TYPE_BUTTONS = "buttons";
