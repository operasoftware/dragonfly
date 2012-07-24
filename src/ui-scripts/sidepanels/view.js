var SidePanelBaseView = function(id, name, view_list)
{
  this.container_class = 'scroll side-panel';
  this.type = 'side-panel';
  this._container = null;
  this._divs = null;

  this._init_super = this.init;

  this.init = function(id, name, view_list, default_unfolded_list)
  {
    this._view_list = view_list;
    var key_value_map = {};
    key_value_map['panel-expanded-' + id] = default_unfolded_list || [];
    new Settings(id, key_value_map);
    var unfolded_views = window.settings[id].get('panel-expanded-' + id);
    this._views = view_list.map(function(view_id, index)
    {
      return new PanelContainer(view_id, unfolded_views[index]);
    }, this);
    this._init_super(id, name, this.container_class);
    this._toolbar = new Toolbar();
  }

  this.has_view = function(view_id)
  {
    var view, i = 0;
    for (; (view = this._views[i]) && view_id != view.view_id; i++);
    return Boolean(view);
  }

  this.set_view_unfolded = function(view_id)
  {
    var view, i = 0
    for (; (view = this._views[i]) && view.view_id != view_id; i++);
    if (view && !view.is_unfolded)
    {
      view.is_unfolded = true;
      this._store_views_unfolded();
    }
    this.update();
  }

  this.get_visible_tabs = function()
  {
    return this._view_list.slice(0);
  }

  this.createView = function(container)
  {
    this._container = container;
    this._divs = container.clearAndRender(templates.side_panel(this._views)).childNodes;
    this._views.forEach(function(obj, index)
    {
      if (obj.is_unfolded)
      {
        this._show_view(obj, this._divs[index]);
      }
    }, this);
  }

  this.ondestroy = function()
  {
    if (this._divs)
    {
      this._views.forEach(function(obj, index)
      {
        if (obj.is_unfolded)
        {
          this._hide_view(obj, this._divs[index]);
        }
      }, this);
    }
    this._container = null;
    this._divs = null;

  }

  this._store_views_unfolded = function()
  {
    window.settings[this.id].set('panel-expanded-' + this.id,
                                 this._views.map(function(view){return view.is_unfolded}));
  }

  this._show_view = function(obj, div)
  {
    var view = window.views[obj.view_id];
    if (view)
    {
      div.addClass('unfolded');
      if(toolbars[view.id])
      {
        var toolbar = div.render(['panel-toolbar',
                                  'id', 'panel-toolbar-' + obj.id,
                                  'ui-id', toolbars[view.id].id]);
        toolbars[view.id].addContainerId('panel-toolbar-' + obj.id);
        this._toolbar.create_toolbar_content(view.id, toolbar)
      }
      var container = div.render(['panel-container', 'id', 'panel-container-' + obj.id, 'ui-id', obj.id]);
      view.addContainerId('panel-container-' + obj.id);
      if (view.default_handler)
      {
        container.setAttribute('handler', view.default_handler);
      }
      if (view.edit_handler)
      {
        container.setAttribute('edit-handler', view.edit_handler);
      }
      container.className = view.container_class || '';
      container.setAttribute('data-menu', view.id || '');
      view.update();
      messages.post("show-view", {id: view.id});
      this._store_views_unfolded();
    }
  }

  this._hide_view = function(obj, div)
  {
    var view = window.views[obj.view_id];
    if (view && div)
    {
      div.removeClass('unfolded');
      var container = div.getElementsByTagName('panel-container')[0];
      if (container && container.parentNode)
        container.parentNode.removeChild(container);

      view.removeContainerId('panel-container-' + obj.id);
      if (toolbars[view.id])
      {
        var toolbar = div.getElementsByTagName('panel-toolbar')[0];
        if (toolbar)
          toolbar.parentNode.removeChild(toolbar);

        toolbars[view.id].removeContainerId('panel-toolbar-' + obj.id);
      }
      messages.post("hide-view", {id: view.id});
      this._store_views_unfolded();
    }
  }

  this.toggle_view = function(evenet, target)
  {
    var index = target.get_attr('parent-node-chain', 'data-view-index');
    if (index && this._divs)
    {
      index = parseInt(index);
      var obj = this._views[index];
      obj.is_unfolded = !obj.is_unfolded;
      if (obj.is_unfolded)
      {
        this._show_view(obj, this._divs[index]);
      }
      else
      {
        this._hide_view(obj, this._divs[index]);
      }
    }
  }

};

var SidePanelView = function(id, name, view_list, default_unfolded_list)
{
  this.init(id, name, view_list, default_unfolded_list);
}

SidePanelBaseView.prototype = ViewBase;
SidePanelView.prototype = new SidePanelBaseView();

var PanelContainer = function(view_id, is_unfolded)
{
  this.view_id = view_id;
  this.is_unfolded = is_unfolded;
  this.initBase();
}

PanelContainer.prototype = UIBase;


window.eventHandlers.click['toggle-panel-view'] = function(event, target)
{
  var ui_obj = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  var panel = window.views[ui_obj && ui_obj.cell.tab.activeTab];
  if (panel)
  {
    panel.toggle_view(event,target);
  }
};

