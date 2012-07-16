(function()
{

  this.side_panel = function(views)
  {
    return views.map(this._side_panel_view, this);
  };

  this._side_panel_view = function(obj, index)
  {
    return (
    ['div',
      this._side_panel_header(obj, index),
      'data-view-index', String(index)
    ]);
  }

  this._side_panel_header = function(obj, index)
  {
    return (
    ['header',
      ['input',
        'type', 'button',
      ], //.concat(obj.is_unfolded ? ['class', 'unfolded'] : [] ),
      window.views[obj.view_id].name,
      'handler', 'toggle-panel-view'
    ]);
  }

}).apply(window.templates || (window.templates = {}));
