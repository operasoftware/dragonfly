/**
 * @fileoverview
 * Message handling class definition and singleton instansiation.
 *
 */

/**
 * @class
 * <p>
 * Message broker singleton. There is a single, global message object instance.
 * Code can subscribe to event notifications on the object, as well as
 * dispatch messages. There can be an arbitrary number of listeners for any
 * message.
 * </p>
 * <p>
 *    Known messages:
 * </p>
 *
 * <dl>
 *
 *     <dt>application-setup</dt>
 *     <dd>If the application was set up</dd>
 *
 *     <dt>active-tab</dt>
 *     <dd>When the debug context changes or the top runtime of the active window changes. This will happen if a link is clicked in the active window. Payload: array msg.activeTab (contains all runtimes), array msg.runtimes_with_dom (contains all runtimes which have a DOM, i.e. filters out extensions)</dd>
 *
 *     <dt>new-top-runtime</dt>
 *     <dd>the top runtime of the selected window has changed. Payload: msg.top_runtime_id</dd>
 *
 *     <dt>host-state</dt>
 *     <dd>State of the host. Payload: msg.state = 'disconnected' | 'ready' | waiting'</dd>
 *
 *     <dt>before-show-view</dt>
 *     <dd>before a view was created. Payload: id msg.view</dd>
 *
 *     <dt>show-view</dt>
 *     <dd>a view was created. Payload: id msg.view</dd>
 *
 *     <dt>hide-view</dt>
 *     <dd>a view was removed. Payload: id msg.view</dd>
 *
 *     <dt>remove-view</dt>
 *     <dd>a view was removed. Payload: id msg.view</dd>
 *
 *     <dt>view-created</dt>
 *     <dd>Payload: msg.id, msg.container</dd>
 *
 *     <dt>view-destroyed</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>action-mode-changed</dt>
 *     <dd>Payload: msg.mode, msg.id</dd>
 *
 *     <dt>runtime-stopped</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>runtime-selected</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>runtime-destroyed</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>thread-stopped-event</dt>
 *     <dd>Payload: msg.stop_at</dd>
 *
 *     <dt>thread-continue-event</dt>
 *     <dd>Payload: msg.stop_at</dd>
 *
 *     <dt>script-selected</dt>
 *     <dd>A runtime was selected. Payload: msg.rt_id, msg.script_id</dd>
 *
 *     <dt>element-selected</dt>
 *     <dd>An element was selected. Payload: msg.model, msg.obj_id, msg.rt_id, msg.pseudo_element</dd>
 *
 *     <dt>settings-initialized</dt>
 *     <dd>Setting has been initialized for a view. Payload: msg.view_id, msg.settings</dd>
 *
 *     <dt>setting-changed</dt>
 *     <dd>A setting has changed. Payload: msg.id, msg.key, msg.value</dd>
 *
 *     <dt>list-search-context</dt>
 *     <dd>Payload: msg.data_id, msg.obj_id, msg.depth</dd>
 *
 *     <dt>active-inspection-type</dt>
 *     <dd>Payload: msg.inspection_type</dd>
 *
 *     <dt>frame-selected</dt>
 *     <dd>Payload: msg.frame_index</dd>
 *
 *     <dt>resize</dt>
 *     <dd>Payload: None</dd>
 *
 *     <dt>reset-state</dt>
 *     <dd>the application cuts the current connection and waits for a new one. Payload: None</dd>
 *
 *     <dt>view-scrolled</dt>
 *     <dd>A (virtual) view has scrolled. Payload: msg.id, msg.top_line, msg.bottom_line</dd>
 *
 *     <dt>window-updated</dt>
 *     <dd>a host window has changed. Payload: msg.window_id, msg.title, msg.window_type, msg.opener_id</dd>
 *
 *     <dt>view-initialized</dt>
 *     <dd>a view was initialized. Payload: msg.view_id</dd>
 *
 *     <dt>debug-context-selected</dt>
 *     <dd>A window was selected as the context for the debugging session. Happens when a tab is selected. Payload: msg.window_id</dd>
 *
 *     <dt>top-runtime-updated</dt>
 *     <dd>Meta data of a top runtime has been updated, e.g. the title. Payload: msg.rt</dd>
 *
 *     <dt>shorcuts-changed</dt>
 *     <dd>The shortcuts have changed.</dd>
 *
 *     <dt>dom-editor-active</dt>
 *     <dd>The editor mode was changed in the DOM view. It's considered active if the mode is anything else than "default". Payload: msg.editor_active</dd>
 *
 *     <dt>onbeforesearch</dt>
 *     <dd>Before TextSearch executes a search. Payload: msg.search_term.</dd>
 *
 *     <dt>error-count-update</dt>
 *     <dd>When the error count changes (new error or reset). Payload: msg.current_error_count</dd>
 *     <dt>breakpoint-added</dt>
 *     <dd>A breakpoint was set. Payload: msg.script_id, msg.line_nr, msg.id, msg.event_type.</dd>
 *
 *     <dt>breakpoint-removed</dt>
 *     <dd>A breakpoint was set. Payload: msg.id</dd>
 *
 *     <dt>monospace-font-changed</dt>
 *     <dd>The monospace font has changed.</dd>
 *
 *     <dt>dom-view-updated</dt>
 *     <dd>A template inspected_dom_node was rendered. Payload: msg.model, the according DOM model.</dd>
 *
 *     <dt>panel-search-executed</dt>
 *     <dd>A new search in a search panel has been executed and the according result is displayed in the panel.</dd>
 *
 *     <dt>window-controls-created</dt>
 *     <dd>The window controls have been created. Payload: msg.window_controls.</dd>
 *
 *     <dt>profile-enabled</dt>
 *     <dd>A profile has been enabled. Payload: msg.profile, msg.services.</dd>
 *
 *     <dt>profile-disabled</dt>
 *     <dd>A profile has been disabled. Payload: msg.profile, msg.services.</dd>
 * </dl>
 *
 */
var messages = new function()
{
  var __listeners = {};

  /**
   * Add a message listener
   * @param key {String} The name of the message to listen for
   * @param cb {function} The callback to call when message is received
   */
  this.addListener = function(key, cb)
  {
    if (__listeners[key])
    {
      if (__listeners[key].indexOf(cb) == -1)
      {
        __listeners[key].push(cb);
      }
    }
    else
    {
      __listeners[key] = [cb];
    }
  };

  this.add_listener = this.addListener;

  /**
   * Remove a listener for a specific message.
   * @param key {String} the name of the message to dispatch
   * @param cb {Object} the callback function for the message.
   */
  this.removeListener = function(key, cb)
  {
    var cur = null, listeners = __listeners[key], i = 0;
    if (listeners)
    {
      for (; cur = listeners[i]; i++)
      {
        if (cur == cb)
        {
          listeners.splice(i, 1);
          i--;
        }
      }
    }
  };

  this.remove_listener = this.removeListener;

  /**
   * Post a message to all its listeners, optionally with a payload. The
   * payload object gets an extra "type" key with the name of the message
   * @param key {String} the name of the message to dispatch
   * @param msg {Object} the payload to the message. Optional
   */
  this.post = function(key, msg)
  {
    msg || (msg = {});
    var listeners = __listeners[key];
    msg.type = key;
    if (listeners)
    {
      for (var  cb = null, i = 0; cb = listeners[i]; i++)
      {
        cb(msg);
      }
    }
  }
}
