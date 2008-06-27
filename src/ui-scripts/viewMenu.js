/**
  * @constructor 
  */

var ViewsMenu = function(menu_id)
{
  var hide_timeouts = [];
  var menu = null;
  var self = this;
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
    while(hide_timeouts.length)
    {
      clearTimeout(hide_timeouts.pop());
    }
    var ul = menu.getElementsByTagName('ul')[0];
    if( !ul)
    {
      var 
        _views = ViewBase.getSingleViews(['ishidden_in_menu']),
        unvisbibleViews = [],
        view = '',
        i = 0;
      for( ; id = _views[i]; i++)
      {
        if(!views[id].isvisible())
        {
          unvisbibleViews[unvisbibleViews.length] = id;
        }
      }
      unvisbibleViews.sort(sortViewsWithIds);
      menu.render(menuTemplate(unvisbibleViews));
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
    for( ; id = view_id_arr[i]; i++)
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
    hide_timeouts[hide_timeouts.length] = setTimeout(__hide, 100);
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
    topCell.tab.addRightPadding(200);
  }

  this.remove = function()
  {
    menu = document.getElementById(menu_id);
    if(menu)
    {
      menu.parentNode.removeChild(menu);
      topCell.tab.addRightPadding(-200);
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

  messages.addListener('setting-changed', onSettingChange);

}

window.viewsMenu = new ViewsMenu('main-view-menu');