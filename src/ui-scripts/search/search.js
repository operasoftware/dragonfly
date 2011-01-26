var Search = function(view_id, searchbar_class, searchwindow_class)
{
  this._init(view_id, searchbar_class, searchwindow_class);
};

Search.prototype = new function()
{
  const 
  MODE_SEARCHBAR = 1, 
  MODE_SEARCHWINDOW = 2;

  this.show = function()
  {
    if (!this._is_active)
    {
      this._is_active = true;
      if (this._mode == MODE_SEARCHBAR)
      {
        this._toggle_searchbar(this._is_active);
      }
      else
      {

      }
    }
  };

  this.hide = function()
  {
    if (this._is_active)
    {
      this._is_active = false;
      if (this._mode == MODE_SEARCHBAR)
      {
        this._toggle_searchbar(this._is_active);
      }
      else
      {

      }
    }
  };

  this._toggle_searchbar = function(bool)
  {
    if (this._searchbar.isvisible() != bool)
    {
      this._searchbar.setVisibility(bool);
      var layout_box = this._ui.get_layout_box(this._view_id);
      if (layout_box)
      {
        layout_box[(bool ? 'add' : 'remove') + '_searchbar'](this._searchbar);
      }
    }
  }

  this.__defineSetter__('is_active', function(){});
  this.__defineGetter__('is_active', function(){return this._is_active;});
  this.__defineSetter__('has_searchbar', function(){});
  this.__defineGetter__('has_searchbar', function()
  {
    return this._is_active && this._searchbar && this._mode == MODE_SEARCHBAR;
  });

  this.get_searchbar = function()
  {
    return this._is_active && 
           this._searchbar && 
           this._mode == MODE_SEARCHBAR && 
           this._searchbar || null;
  }

  this._init = function(view_id, searchbar_class, searchwindow_class)
  {
    this._is_active = false;
    this._mode = MODE_SEARCHBAR;
    this._view_id = view_id;
    this._searchbar = searchbar_class ? new searchbar_class() : null;
    this._searchwindow = searchwindow_class ? new searchwindow_class() : null;
    this._ui = UI.get_instance();
    this._ui.register_search(view_id, this);
  };

};