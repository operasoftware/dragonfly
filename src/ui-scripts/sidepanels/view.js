var SidePanelView = function(id, view_list)
{
  this.container_class = 'scroll side-panel';

  this._views = view_list.map(function(view_id)
  {
    return new PanelContainer(view_id, false);
  }, this);



  this._show_view = function(obj, div)
  {
    var view = window.views[obj.view_id];
    if (view)
    {
      div.addClass('unfolded');
      var container = div.render(['panel-container', 'id', 'panel-container-' + obj.id, 'ui-id', obj.id]);
      view.addContainerId('panel-container-' + obj.id);
      /*
      if(toolbars[view_id])
      {
        toolbars[view_id].addContainerId(toolbar_id);
      }
      */
      
      if (view.default_handler)
      {
        container.setAttribute('handler', view.default_handler); 
      }
      container.className = view.container_class || '';
      container.setAttribute('data-menu', view.id || '');
      view.update();
      messages.post("show-view", {id: view.id});
    }
  }

  this._hide_view = function(obj, div)
  {
    var view = window.views[obj.view_id];
    if (view)
    {
      div.removeClass('unfolded');
      var container = div.getElementsByTagName('panel-container')[0];
      container.parentNode.removeChild(container);
      view.removeContainerId('panel-container-' + obj.id);
      /*
      if(toolbars[view_id])
      {
        toolbars[view_id].addContainerId(toolbar_id);
      }
      */
      messages.post("hide-view", {id: view.id});
      //view.update();
    }
  }

  this.toggle_view = function(evenet, target)
  {
    var div = target.has_attr('parent-node-chain', 'data-view-index');
    if (div)
    {
      var obj = this._views[parseInt(div.getAttribute('data-view-index'))];
      if (obj.is_unfolded)
      {
        this._hide_view(obj, div);
      }
      else
      {
        this._show_view(obj, div);
      }
      obj.is_unfolded = !obj.is_unfolded;
    }
  }

  this.createView = function(container)
  {
    var divs = container.clearAndRender(templates.side_panel(this._views)).childNodes;
    this._views.forEach(function(obj, index)
    {
      if (obj.is_unfolded)
      {
        this._show_view(obj, divs[index]);
      }
    }, this);
  }

  

  this.init(id, 'Side Panel', this.container_class);
};

SidePanelView.prototype = ViewBase;

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
}
