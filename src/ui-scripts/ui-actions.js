/**
  * @constructor 
  */

var EventHandler = function(type, is_capturing, handler_key)
{
  handler_key = handler_key ? handler_key : 'handler';
  if(!window.eventHandlers)
  {
    window.eventHandlers = {};
  }
  if(window.eventHandlers[type])
  {
    return;
  }

  window.eventHandlers[type] = {broker: ActionBroker && 
                                        ActionBroker.get_instance() || 
                                        null};

  var handler = function(event)
  {

    var ele = event.target, handler = null, container = null;

    if( ele.nodeType != 1 )
    {
      return;
    }
    if (event.which == 3 && event.type in {"click": 1, "mousedown": 1, "mouseup": 1})
    {
      // right click
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    handler = ele.getAttribute(handler_key);
    while( !(handler && eventHandlers[type][handler]) && ( ele = ele.parentElement ) )
    {
      handler = ele.getAttribute(handler_key);
    }
    if( handler )
    {
      if( type == 'click' && /toolbar-buttons/i.test(ele.parentNode.nodeName) )
      {
        container = 
          document.getElementById(ele.parentNode.parentNode.id.replace('toolbar', 'container'));
      }
      eventHandlers[type][handler](event, ele, container);
    }
  }

  this.post = function(handler, event)
  {
    if(eventHandlers[type][handler])
    {
      eventHandlers[type][handler](event);
    }
  }

  document.addEventListener(type, handler, is_capturing ? is_capturing : false);
}

new EventHandler('click');
new EventHandler('dblclick', false, 'edit-handler');
new EventHandler('change');
new EventHandler('input');
new EventHandler('keyup', true);
new EventHandler('keydown', true);
new EventHandler('keypress', true);
new EventHandler('mousedown');
new EventHandler('mouseup');
new EventHandler('mouseout');
new EventHandler('mouseover');
new EventHandler('focus', true, 'focus-handler');
new EventHandler('blur', true, 'blur-handler');
new EventHandler('mousewheel');

/***** general ui click handler *****/

eventHandlers.mousedown['tab'] = function(event, target)
{
  var tabs = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  var view_id = target.get_attr('parent-node-chain', 'ref-id');
  if( tabs )
  {
    tabs.setActiveTab(view_id);
  }
  else
  {
    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
      "tabs is missing in eventHandlers.click['tab'] in ui-actions");
  }
}

eventHandlers.mousewheel['change-on-scroll'] = function(event, target)
{
  if (target.nodeName == "tab")
  {
    target = target.parentNode;
  }
  var active_tab = target.querySelector(".active")
  if (event.detail < 0) {
      if (active_tab.previousElementSibling)
      {
        eventHandlers.mousedown['tab'](null, active_tab.previousElementSibling);
      }
  }
  else {
      if (active_tab.nextElementSibling)
      {
        eventHandlers.mousedown['tab'](null, active_tab.nextElementSibling);
      }
  }
}

eventHandlers.click['close-tab'] = function(event, target)
{
  target = target.parentElement;

  var 
  tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id')),
  view_id = target.getAttribute('ref-id'),
  store = global_state.ui_framework.temporary_tabs,
  cursor = '',
  i = 0;

  tabs.removeTab(view_id);
  for( ; ( cursor = store[i] ) && cursor != view_id; i++);
  if(cursor)
  {
    store.splice(i, 1);
  }
}

eventHandlers.nav_timeout = null;
eventHandlers.mousedown['horizontal-nav'] = function(event, target)
{
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  var dir = target.get_attr('parent-node-chain', 'dir');
  (function nav() {
    horizontal_nav.nav(dir);
    eventHandlers.nav_timeout = setTimeout(nav, 400);
  })();
};

eventHandlers.mouseup['horizontal-nav'] =
eventHandlers.mouseout['horizontal-nav'] = function(event, target)
{
  var selection = window.getSelection();
  if (!selection.isCollapsed)
  {
    selection.removeAllRanges();
  }
  clearTimeout(eventHandlers.nav_timeout);
};

eventHandlers.mousewheel['breadcrumbs-drag'] = function(event, target)
{
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  horizontal_nav.nav(event.detail < 0 ? 100 : -100);
};

eventHandlers.mousedown['breadcrumbs-drag'] = function(event, target)
{
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  var breadcrumbs = target;
  var pos = parseInt(getComputedStyle(breadcrumbs, null).getPropertyValue("left"));
  breadcrumbs.style.OTransitionDuration = 0;

  if (breadcrumbs.previousElementSibling.offsetWidth > 0) {
    document.addEventListener("mousemove", mouse_move, false);
    document.addEventListener("mouseup", mouse_up, false);
  }

  function mouse_move(e) {
    drag_breadcrumbs(e, event.clientX, pos);
  }

  function mouse_up() {
    horizontal_nav.current_breadcrumb_el = null;
    breadcrumbs.removeClass("drag");
    document.removeEventListener("mousemove", mouse_move, false);
    document.removeEventListener("mouseup", mouse_up, false);
  }

  function drag_breadcrumbs(e, mouse_start, pos) {
    breadcrumbs.addClass("drag")
    horizontal_nav.set_position(pos + e.clientX - mouse_start);
  }
};

eventHandlers.click['settings-tabs'] = function(event, target)
{
  var tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id'));
  windows.showWindow('window-3', 'Settings', templates.settings(tabs), 200, 200, 200, 200);
}

eventHandlers.click['toggle-setting'] = function(event, target)
{
  var old_setting = target.parentElement;
  var view_id = target.getAttribute('view-id');
  var view = views[view_id];
  var setting = document.render(templates.setting( view_id, view.name, !target.firstChild.hasClass('unfolded') ));
  old_setting.parentElement.replaceChild(setting, old_setting);
}



eventHandlers.click['show-window'] = function(event)
{
  var target = event.target;
  var view_id = target.getAttribute('view-id');
  target.parentNode.parentNode.parentNode.removeChild(target.parentNode.parentNode);
  UIWindowBase.showWindow(view_id);
}

eventHandlers.click['top-settings'] = function(event)
{
  UIWindowBase.showWindow('settings_view');
}

eventHandlers.click['documentation'] = function(event)
{
  window.open(event.target.getAttribute('param'), '_info_window').focus();
}


eventHandlers.click['top-window-close'] = function(event)
{
  window.close();
}

eventHandlers.click['top-window-toggle-attach'] = function(event)
{
  viewsMenu.remove();
  window.topCell.onresize = function(){};
  var is_attached = ( window.opera.attached = !window.opera.attached );
  event.target.parentNode.parentNode.removeChild(event.target.parentNode);

  // TODO active window must be set correct
  // then the window dropdown will be removed in the attached view
  // topCell.tab.changeStyleProperty("padding-right", 60);
  topCell.tab.switch_history(is_attached);
  
  if( is_attached )
  {
    topCell.tab.changeStyleProperty("padding-right", 50);
    topCell.toolbar.changeStyleProperty("padding-right", -30);
  }
  else
  {
    topCell.tab.changeStyleProperty("padding-right", -50);
    topCell.toolbar.changeStyleProperty("padding-right", 30);
  }

  settings.general.set('window-attached',  is_attached || false);
  if(window.ini.debug)
  {
    viewsMenu.create();
  }

  setTimeout(function() {
    client.setupTopCell();
    document.querySelector("main-view").render(templates.window_controls(is_attached));
  }, 0);
}

eventHandlers.click['overlay-tab'] = function(event, target)
{
  var overlay = window.topCell.overlay;
  overlay.change_group(event.target.getAttribute("group"));
};

eventHandlers.click['toggle-settings-overlay'] =
eventHandlers.click['toggle-remote-debug-config-overlay'] = function(event, target)
{
  const OVERLAY_TOP_MARGIN = 10;
  const OVERLAY_LEFT_MARGIN = 10;
  const OVERLAY_RIGHT_MARGIN = 20;

  // This should really just be a class, this is just for consistency with
  // existing stuff
  target.setAttribute("is-active", target.getAttribute("is-active") != "true");

  var overlay = window.topCell.overlay;

  if (overlay.is_visible())
  {
    overlay.hide_overlay();
    return;
  }

  switch (target.getAttribute("handler"))
  {
  case "toggle-settings-overlay":
    overlay.show_overlay("settings-overlay");
    break;
  case "toggle-remote-debug-config-overlay":
    overlay.show_overlay("remote-debug-overlay");
    break;
  }

  var button_dims = target.getBoundingClientRect();
  var element = overlay.element.querySelector("overlay-window");
  var arrow = overlay.element.querySelector("overlay-arrow");
  element.style.top = button_dims.bottom + OVERLAY_TOP_MARGIN + "px";
  if (1||window.opera.attached)
  {
    element.addClass("attached");
    arrow.style.right = document.documentElement.clientWidth - button_dims.right - OVERLAY_RIGHT_MARGIN + "px";
  }
  else
  {
    arrow.style.left = button_dims.left - OVERLAY_LEFT_MARGIN + "px";
  }
};

eventHandlers.click['toggle-console'] = function(event, target)
{
  this.broker.dispatch_action("global", "toggle-command-line", event, target);
};

eventHandlers.click['toolbar-switch'] = function(event)
{
  var target = event.target;
  var arr = target.getAttribute('key').split('.');
  var setting = arr[0], key = arr[1];
  var is_active = !( target.getAttribute('is-active') == 'true' && true || false );
  target.setAttribute('is-active', is_active ? 'true' : 'false');

  settings[setting].set(key, is_active);
  views.settings_view.syncSetting(setting, key, is_active);
  views[setting].update();
  /*
  // if the switch view is different, e.g. 'setting' is not the actual view
  // getViewWithHandler is a bit expensive
  var view = UIBase.getViewWithHandler(target);
  view && view.update();
  */
  messages.post("setting-changed", {id: setting, key: key});
  // hack to trigger a repaint while
  target.style.backgroundColor = "transparent";
  target.style.removeProperty('background-color');
}



/***** change handler *****/

eventHandlers.change['checkbox-setting'] = function(event)
{
  var ele = event.target;
  var view_id = ele.getAttribute('view-id');
  settings[view_id].set(ele.name, ele.checked, true);
  views[view_id].update();
  var host_view = ele.getAttribute('host-view-id');
  if( host_view )
  {
    views.settings_view.syncSetting(view_id, ele.name, ele.checked);
  }
  messages.post("setting-changed", {id: view_id, key: ele.name});
}

eventHandlers.focus['focus'] = function(event, target)
{
  var parent = event.target.parentNode;
  if( parent.nodeName.toLowerCase() == 'filter' )
  {
    parent.firstChild.textContent = '';
    parent.addClass('focus');
    if(event.target.value)
    {
      event.target.selectionStart = 0;
      event.target.selectionEnd = event.target.value.length;

    }
  }
}

eventHandlers.blur['blur'] = function(event, target)
{
  var parent = event.target.parentNode;
  if( parent.nodeName.toLowerCase() == 'filter' )
  {
    if( !event.target.value )
    {
      parent.firstChild.textContent = event.target.getAttribute('default-text');
      
    }
    parent.removeClass('focus');
  }
}

