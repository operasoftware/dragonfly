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

   /* interface */
 
   /**
     * To get a tabbar by it's id.
     * @param {String} tabbar_id.
     * @returns an instance of Tabbar.
     */
    this.get_tabbar = function(id){};

    this.register_tabbar = function(id, tabs){};
    
    this.show_view = function(id){};


    /* implemenation */
    this.get_tabbar = function(id)
    {
      return this._tabbars[id] || null;
    };

    this.register_tabbar = function(id, tabs)
    {
      if (!this._tabbars[id])
      {
        this._tabbars[id] = new Tabbar(id, tabs);
      }
      return this._tabbars[id];
    };
    
    this.show_view = function(id)
    {
      // TODO make topCell a private member of UI
      if (window.topCell)
      {
        window.topCell.showView(id);
      }
    };
}

UI.get_instance = function()
{
  return this.instance || new UI();
}