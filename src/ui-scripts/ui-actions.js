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

  window.eventHandlers[type] = {};

  var handler = function(event)
  {

    var ele = event.target, handler = null, container = null;

    if( ele.nodeType != 1 )
    {
      return;
    }
    if(event.which == 3)
    {
      // right click
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    handler = ele.getAttribute(handler_key);
    while( !handler && ( ele = ele.parentElement ) )
    {
      handler = ele.getAttribute(handler_key);
    }
    if( handler && eventHandlers[type][handler] )
    {
      if( type == 'click' && /toolbar-buttons/.test(ele.parentNode.nodeName) )
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
new EventHandler('focus', true, 'focus-handler');
new EventHandler('blur', true, 'blur-handler');

/***** general ui click handler *****/

eventHandlers.click['tab'] = function(event, target)
{
  target = target.parentElement;
  var tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id'));
  var view_id = target.getAttribute('ref-id');
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
  document.documentElement.removeChild(event.target.parentNode);
  var win_controls = document.documentElement.render(templates.window_controls(is_attached));

  // TODO active window must be set correct
  // then the window dropdown will be removed in the attached view
  // topCell.tab.changeStyleProperty("padding-right", 60);
  if( is_attached )
  {
    topCell.tab.changeStyleProperty("padding-right", 275);
    topCell.toolbar.changeStyleProperty("padding-right", -30);
  }
  else
  {
    topCell.tab.changeStyleProperty("padding-right", -275);
    topCell.toolbar.changeStyleProperty("padding-right", 30);
  }

  settings.general.set('window-attached',  is_attached || false);
  if( settings.general.get('show-views-menu') )
  {
    viewsMenu.create();
  }
  setTimeout(client.setupTopCell, 0);
}

eventHandlers.click['toolbar-switch'] = function(event)
{
  var target = event.target;
  var arr = target.getAttribute('key').split('.');
  var setting = arr[0], key = arr[1];
  var is_active = !( target.getAttribute('is-active') == 'true' && true || false );

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
  target.setAttribute('is-active', is_active ? 'true' : 'false');
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
  if( parent.nodeName == 'filter' )
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
  if( parent.nodeName == 'filter' )
  {
    if( !event.target.value )
    {
      parent.firstChild.textContent = event.target.getAttribute('default-text');
      
    }
    parent.removeClass('focus');
  }
}

eventHandlers.click['switch-info-type'] = function(event, target)
{
  var parent = event.target.parentNode;
  var mode = topCell.statusbar.changeMode();
  if( mode == "tooltip" )
  {
    parent.addClass('type-tooltip');
  }
  else
  {
    parent.removeClass('type-tooltip');
  }
}

eventHandlers.click['switch-pin-debug-context'] = function(event, target)
{
  settings['general'].set('pin-active-window', !settings['general'].get('pin-active-window'));
  helpers.updatePinLabel();
}







