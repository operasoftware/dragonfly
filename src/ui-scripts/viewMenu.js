var ViewMenu = function(menu_id)
{
  var hide_timeouts = [];
  var menu = null;
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

  document.addEventListener('DOMNodeInserted', init, false);
}

new ViewMenu('main-view-menu');