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

   /* interface */
 
   /**
     * To get a tabbar by it's id.
     * @param {String} tabbar_id.
     * @returns an instance of Tabbar.
     */
    this.get_tabbar = function(id){};
    
    this.get_modebar = function(id){};

    this.register_tabbar = function(id, tabs){};
    
    this.register_tabbar = function(id, modebar){};
    
    this.show_view = function(id){};


    /* implemenation */
    this.get_tabbar = function(id)
    {
      return this._tabbars[id] || null;
    };
    
    this.get_modebar = function(id)
    {
      return this._modebars[id] || null;
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
    
    this.show_view = function(id)
    {
      // TODO make topCell a private member of UI
      if (window.topCell)
      {
        window.topCell.showView(id);
      }
    };

    this.get_button = function(id)
    {
      // TODO: make this a bit more sophisticated
      return document.getElementById(id);
    };

    this.set_tab_badge = function(id, type, content)
    {
      var badge = document.querySelector("top-tabs").querySelector("[ref-id='" + id + "'] .badge");
      if (badge)
      {
        badge.addClass(type || "");
        badge.textContent = content || "";
      }
    };

    this.clear_tab_badge = function(id)
    {
      this.set_tab_badge(id);
    };

    this.set_tab_state = function(id, state)
    {
      var tab = document.querySelector("top-tabs").querySelector("[ref-id='" + id + "']");
      if (tab)
      {
        tab.addClass(state);
      }
    };

    this.clear_tab_state = function(id)
    {
      var tab = document.querySelector("top-tabs").querySelector("[ref-id='" + id + "']");
      if (tab)
      {
        // Clear all class names. Add "active" back in case the tab was active.
        tab.className = tab.hasClass("active") ? "active" : "";
      }
    };
}

UI.get_instance = function()
{
  return this.instance || new UI();
};

