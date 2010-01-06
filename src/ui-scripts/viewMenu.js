/**
  * @constructor 
  */

var ViewsMenu = function(menu_id)
{
  var hideTimeouts = new Timeouts();
  var menu = null;
  var self = this;

  var default_actions =
  [
    {label: "Show Live Source of DF", handler: "df-show-live-source"}
  ];

  this.getAllViews = function()
  {

  }

  this.getHiddenViews = function()
  {
    var hiddenViews = UIBase.getSingleUnvisibleViews();
  }

  var sortViewsWithIds = function(a, b)
  {
    var 
      name_a = views[a].name
      name_b = views[b].name;
    return name_a > name_b && 1 || name_a < name_b && -1 || 0;
  }

  var show = function(event)
  {
    hideTimeouts.clear();
    if(!menu.getElementsByTagName('ul')[0])
    {
      menu.render(
        menuTemplate(
          window.ViewBase.getSingleViews().filter(function(id){return window.views[id].show_in_views_menu})
        )
      );
    }
  }

  var menuItemTemplate = function(id)
  {
    return ;
  }

  var menuTemplate = function(view_id_arr)
  {
    var 
      ret = ['ul'],
      id = '',
      i = 0;
    for( ; id = default_actions[i]; i++)
    {
      ret[ret.length] = ['li', ['h2', id.label, 'handler', id.handler, 'tabindex', '1']]
    }
    for( i = 0 ; id = view_id_arr[i]; i++)
    {
      ret[ret.length] = ['li', ['h2', views[id].name, 'handler', 'show-window', 'view-id', id, 'tabindex', '1']]
    }
    return ret;
  }

  var __hide = function()
  {
    var ul = menu.getElementsByTagName('ul')[0];
    if(ul)
    {
      menu.removeChild(ul);
    }
  }

  var hide = function(event)
  {
    hideTimeouts.set(__hide, 100);
  }

  var init = function(event)
  {
    menu = document.getElementById(menu_id);
    if(menu)
    {
      document.removeEventListener('DOMNodeInserted', arguments.callee, false);
      menu.addEventListener('mouseover', show, false);
      menu.addEventListener('mouseout', hide, false);
    }
  }

  this.create = function()
  {

    document.addEventListener('DOMNodeInserted', init, false);
    document.documentElement.render(templates.viewMenu());
    if(opera.attached)
    {
      topCell.tab.changeStyleProperty("padding-right", 188);
    }
    else
    {
      topCell.toolbar.changeStyleProperty("padding-right", 188);
    }
    
  }

  this.remove = function()
  {
    menu = document.getElementById(menu_id);
    if(menu)
    {
      menu.parentNode.removeChild(menu);
      if(opera.attached)
      {
        topCell.tab.changeStyleProperty("padding-right", -188);
      }
      else
      {
        topCell.toolbar.changeStyleProperty("padding-right", -188);
      }
    }
  }

  var onSettingChange = function(msg)
  {
    if( msg.id == 'general' )
    {
      switch(msg.key)
      {
        case 'show-views-menu':
        {
          if(settings.general.get(msg.key))
          {
            self.create();
          }
          else
          {
            self.remove();
          }
          break;
        }
      }
    }
  }

  //messages.addListener('setting-changed', onSettingChange);

}

window.viewsMenu = new ViewsMenu('main-view-menu');