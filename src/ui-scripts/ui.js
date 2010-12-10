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
}

UI.get_instance = function()
{
  return this.instance || new UI();
}