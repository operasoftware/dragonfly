window.cls || (window.cls = {});

cls.ColorPalette = function()
{
  /*
    static methods
      ColorPalette.get_instance
  */

  if (cls.ColorPalette.instance)
  {
    return cls.ColorPalette.instance;
  }

  cls.ColorPalette.instance = this;

  /* interface */

  this.store_color = function(hex){};
  this.delete_color = function(id){};
  this.update_color = function(id, hex){};
  this.get_color_palette = function(){};

  /* private */

  /*
    data item
    {
      color: <hex-value>,
      id: <id>
    }
  */

  this._init = function()
  {
    this._setting = window.settings['screenshot-controls'];
    this._data = this._setting.get('color-palette');
    this._id_count = 0;
  };

  this.store_color = function(hex)
  {
    if (!this._id_count)
    {
      this._id_count = this._data.reduce(function(max, item)
      {
        return Math.max(max, item.id);
      }, 0);
      this._id_count++;
    }
    var color_id = this._id_count++;
    this._data.unshift({color: hex, id: color_id});
    this._setting.set('color-palette', this._data);
    return this._data[this._data.length - 1];
  };

  this.delete_color = function(id)
  {
    for (var i = 0; i < this._data.length; i++)
    {
      if (this._data[i].id == id)
      {
        var ret = this._data.splice(i, 1)[0];
        this._setting.set('color-palette', this._data);
        return ret;
      }
    }
    return null;
  };

  this.update_color = function(id, hex)
  {
    for (var i = 0; i < this._data.length; i++)
    {
      if (this._data[i].id == id)
      {
        this._data[i].color = hex;
        this._setting.set('color-palette', this._data);
        return true;
      }
    }
    return false;
  };

  this.get_color_palette = function()
  {
    return this._data;
  };

  this._init();

};

cls.ColorPalette.get_instance = function()
{
  return this.instance || new cls.ColorPalette();
};
