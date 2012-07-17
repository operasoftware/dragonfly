/**
  * @constructor
  */

var EventHandler = function(type, is_capturing, handler_key, cancel_bubble)
{
  if (typeof cancel_bubble != 'boolean')
  {
    cancel_bubble = true;
  }
  handler_key = handler_key ? handler_key : 'handler';
  if(!window.eventHandlers)
  {
    window.eventHandlers = window.event_handlers = {};
  }
  if(window.eventHandlers[type])
  {
    return;
  }

  window.eventHandlers[type] = {broker: window.ActionBroker &&
                                        window.ActionBroker.get_instance() ||
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

    while (ele)
    {
      handler = ele.getAttribute(handler_key);
      while (!(handler && eventHandlers[type][handler]) && (ele = ele.parentNode))
      {
        handler = ele.nodeType == 1 ? ele.getAttribute(handler_key) : null;
      }
      if (handler && ele)
      {
        if (type == 'click' && /toolbar-buttons/i.test(ele.parentNode.nodeName))
        {
          container =
            document.getElementById(ele.parentNode.parentNode.id.replace('toolbar', 'container'));
        }
        eventHandlers[type][handler](event, ele, container);
      }
      ele = cancel_bubble ? null : ele && ele.parentNode;
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
new EventHandler('mouseover', null, null, false);
new EventHandler('focus', true, 'focus-handler');
new EventHandler('blur', true, 'blur-handler');
new EventHandler('mousewheel');
new EventHandler('scroll', true);

/***** general ui click handler *****/

eventHandlers.mousedown['tab'] = function(event, target)
{
  var tabs = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  var view_id = target.get_attr('parent-node-chain', 'ref-id');
  if( tabs )
  {
    tabs.setActiveTab(view_id, null, event);
  }
  else
  {
    opera.postError(ui_strings.S_DRAGONFLY_INFO_MESSAGE +
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
  //target = target.parentElement;

  var tabbar_id = target.get_attr("parent-node-chain", "tabbar-ref-id");
  var view_id = target.get_attr("parent-node-chain", "ref-id");
  var tabbar = tabbar_id && view_id && UI.get_instance().get_tabbar(tabbar_id) || null;
  if (tabbar)
  {
    tabbar.remove_tab(view_id);
  }
}

eventHandlers.mousedown['horizontal-nav'] = function(event, target)
{
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  var dir = target.get_attr('parent-node-chain', 'dir');
  horizontal_nav.nav(dir, true);
};

eventHandlers.mouseup['horizontal-nav'] =
eventHandlers.mouseout['horizontal-nav'] = function(event, target)
{
  var selection = window.getSelection();
  if (!selection.isCollapsed)
  {
    selection.removeAllRanges();
  }
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  horizontal_nav.clear_nav_timeout();
};

eventHandlers.mousewheel['breadcrumbs-drag'] = function(event, target)
{
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  horizontal_nav.nav(event.detail < 0 ? 100 : -100);
};

eventHandlers.mousedown['breadcrumbs-drag'] = function(event, target)
{
  var horizontal_nav = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  horizontal_nav.drag_breadcrumb(event, target);

};

eventHandlers.click['settings-tabs'] = function(event, target)
{
  var tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id'));
  windows.showWindow('window-3', 'Settings', templates.settings(tabs), 200, 200, 200, 200);
}

eventHandlers.click['show-search'] = function(event, target)
{
  var toolbar = UIBase.getUIById(target.get_attr('parent-node-chain', 'ui-id'));
  if (toolbar)
  {
    var search = UI.get_instance().get_search(toolbar.cell.container.view_id);
    if (search)
    {
      target.hasClass("is-active") ? search.hide() : search.show();
    }
  }
}





eventHandlers.click['show-window'] = function(event)
{
  var target = event.target;
  var view_id = target.getAttribute('view-id');
  target.parentNode.parentNode.parentNode.removeChild(target.parentNode.parentNode);
  UIWindowBase.showWindow(view_id);
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
  window.opera.attached = !window.opera.attached;
  window.settings.general.set('window-attached',  window.opera.attached);
  window.client.create_window_controls();
}

eventHandlers.click['overlay-tab'] = function(event, target)
{
  Overlay.get_instance().change_group(event.target.getAttribute("group"));
};

eventHandlers.click['toggle-overlay'] = function(event, target)
{
  var overlay = Overlay.get_instance();
  var overlay_id = target.getAttribute("data-overlay-id");

  overlay.is_visible ?
      this.broker.dispatch_action("global", "hide-overlay", event, target) :
      this.broker.dispatch_action("global", "show-overlay", event, target);
};

eventHandlers.click['toggle-console'] = function(event, target)
{
  this.broker.dispatch_action("global", "toggle-console", event, target);
};

eventHandlers.click['toolbar-switch'] = function(event)
{
  var target = event.target;
  var arr = target.getAttribute('key') && target.getAttribute('key').split('.');
  if (arr && arr.length)
  {
    var view_id = arr[0], key = arr[1];
    var is_active = !target.hasClass('is-active');

    settings[view_id].set(key, is_active);
    views.settings_view.syncSetting(view_id, key, is_active);
    views[view_id].update();
  }
}

eventHandlers.click["toolbar-single-select"] = function(event, target)
{
  var button = event.target;
  var view_id = target.getAttribute("data-view-id");
  var name = target.getAttribute("data-single-select-name");
  var value = button.getAttribute("data-single-select-value");

  if (view_id && name && value !== null)
  {
    var single_select = window.single_selects &&
                        window.single_selects[view_id] &&
                        window.single_selects[view_id][name];
    if (single_select)
    {
      var val_index = single_select.values.indexOf(value);
      var select_multiple = event.ctrlKey && single_select.allow_multiple_select;
      if (select_multiple)
      {
        var is_selected = val_index !== -1;
        if (!is_selected)
        {
          single_select.values.push(value);
          button.addClass("is-active");
        }
        else if (single_select.values.length > 1)
        {
          // target is selected and it's not the last button that is. Unselect target.
          single_select.values.splice(val_index, 1);
          button.removeClass("is-active");
        }
      }
      else
      {
        single_select.values = [value];
        button.addClass("is-active");

        // Unselect all others
        var buttons_in_group = target.querySelectorAll(".ui-button");
        for (var i = 0, group_button; group_button = buttons_in_group[i]; i++)
        {
          if (group_button != button)
            group_button.removeClass("is-active");
        }
      }
      messages.post("single-select-changed", {
                                                view_id: view_id,
                                                name: name,
                                                values: single_select.values
                                              });
    }
  }
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
}
