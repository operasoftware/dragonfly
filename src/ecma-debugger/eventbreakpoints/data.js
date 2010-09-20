window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.EventBreakpoints = function()
{
  const NAME = 0, CHECKED = 1;

  this._is_synced = false;

  this.set_unfold = function(index, is_unfolded)
  {
    this._events[index].is_unfolded = is_unfolded;
    this._store_unfolded_flags();
  };

  this._store_unfolded_flags = function()
  {
    window.settings['event-breakpoints'].set('expanded-sections', this._events.map(this._get_unfolded_flags));
  }

  this._get_unfolded_flags = function(section){return section.is_unfolded ? 1 : 0;}

  this._breakpoints = {};

  this.handle_breakpoint = function(section_index, event_index, checked)
  {
    var event = this._events[section_index] && this._events[section_index].events[event_index];
    if (event)
    {
      if (checked)
      {
        event[CHECKED] = window.runtimes.getBreakpointId();
        this._breakpoints[event[CHECKED]] = event;
        window.services['ecmascript-debugger'].requestAddEventBreakpoint(0, [event[CHECKED], event[NAME]]);
      }
      else
      { 
        window.services['ecmascript-debugger'].requestRemoveBreakpoint(0, [event[CHECKED]]);
        this._breakpoints[event[CHECKED]] = 0;
        event[CHECKED] = 0;
      }
      if (this.has_breakpoints())
        window.toolbars['event-breakpoints'].enableButtons('ev-brp-remove-all-breakpoints');
      else
        window.toolbars['event-breakpoints'].disableButtons('ev-brp-remove-all-breakpoints');
    }
  }

  this.has_breakpoints = function()
  {
    var i =0, j = 0, section = null, events = null, event = null;
    for (; section = this._events[i]; i++)
      for (j = 0, events = section.events; event = events[j]; j++)
        if (event[CHECKED])
          return true;
    return false;
  }

  this.expand_all_sections = function()
  {
    for (var i =0, section = null; section = this._events[i]; i++)
      section.is_unfolded = true;
  }

  this.get_events = function()
  {
    if (!this._is_synced)
    {
      var 
      unfolded_flags = window.settings['event-breakpoints'].get('expanded-sections'), 
      i = 0, 
      section = null;
      
      for (; section = this._events[i]; i++)
        section.is_unfolded = unfolded_flags[i];
      this._is_synced = true;
    }
    return this._events;
  }

  this._events =
  [
    {
      title: 'DOM Level 3',
      spec: "http://www.w3.org/TR/2010/WD-DOM-Level-3-Events-20100907/#event-types-list",
      events: 
      [
        ['abort', 0],
        ['blur', 0],
        ['click', 0],
        ['compositionstart', 0],
        ['compositionupdate', 0],
        ['compositionend', 0],
        ['dblclick', 0],
        ['DOMActivate', 0],
        ['DOMAttributeNameChanged', 0],
        ['DOMAttrModified', 0],
        ['DOMCharacterDataModified', 0],
        ['DOMElementNameChanged', 0],
        ['DOMFocusIn', 0],
        ['DOMFocusOut', 0],
        ['DOMNodeInserted', 0],
        ['DOMNodeInsertedIntoDocument', 0],
        ['DOMNodeRemoved', 0],
        ['DOMNodeRemovedFromDocument', 0],
        ['DOMSubtreeModified', 0],
        ['error', 0],
        ['focus', 0],
        ['focusin', 0],
        ['focusout', 0],
        ['keydown', 0],
        ['keypress', 0],
        ['keyup', 0],
        ['load', 0],
        ['mousedown', 0],
        ['mouseenter', 0],
        ['mouseleave', 0],
        ['mousemove', 0],
        ['mouseout', 0],
        ['mouseover', 0],
        ['mouseup', 0],
        ['resize', 0],
        ['scroll', 0],
        ['select', 0],
        ['textInput', 0],
        ['unload', 0],
        ['wheel', 0],
      ],
      is_unfolded: false,
    },
    {
      title: 'HTML5',
      spec: "http://dev.w3.org/html5/spec/index.html#events-0",
      events:
      [
        ['DOMActivate', 0],
        ['DOMContentLoaded', 0],
        ['abort', 0],
        ['afterprint', 0],
        ['beforeprint', 0],
        ['beforeunload', 0],
        ['blur', 0],
        ['change', 0],
        ['contextmenu', 0],
        ['error', 0],
        ['focus', 0],
        ['formchange', 0],
        ['forminput', 0],
        ['hashchange', 0],
        ['input', 0],
        ['invalid', 0],
        ['load', 0],
        ['message', 0],
        ['offline', 0],
        ['online', 0],
        ['pagehide', 0],
        ['pageshow', 0],
        ['popstate', 0],
        ['readystatechange', 0],
        ['redo', 0],
        ['reset', 0],
        ['show', 0],
        ['submit', 0],
        ['undo', 0],
        ['unload', 0],
      ],
      is_unfolded: false,
    },
    {
      title: 'HTML5 media elements',
      spec: "http://dev.w3.org/html5/spec/video.html#mediaevents",
      events:
      [
        ['loadstart', 0],
        ['progress', 0],
        ['suspend', 0],
        ['abort', 0],
        ['error', 0],
        ['emptied', 0],
        ['stalled', 0],
        ['play', 0],
        ['pause', 0],
        ['loadedmetadata', 0],
        ['loadeddata', 0],
        ['waiting', 0],
        ['playing', 0],
        ['canplay', 0],
        ['canplaythrough', 0],
        ['seeking', 0],
        ['seeked', 0],
        ['timeupdate', 0],
        ['ended', 0],
        ['ratechange', 0],
        ['durationchange', 0],
        ['volumechange', 0],
      ],
      is_unfolded: false,
    },
    {
      title: 'HTML5 application cache events',
      spec: "http://dev.w3.org/html5/spec/offline.html#appcacheevents",
      events:
      [
        ['checking', 0],
        ['noupdate', 0],
        ['downloading', 0],
        ['progress', 0],
        ['cached', 0],
        ['updateready', 0],
        ['obsolete', 0],
        ['error', 0],
      ],
      is_unfolded: false,
    },
    {
      title: 'HTML5 drag-and-drop events',
      spec: "http://dev.w3.org/html5/spec/dnd.html#dndevents",
      events:
      [
        ['dragstart', 0],
        ['drag', 0],
        ['dragenter', 0],
        ['dragleave', 0],
        ['dragover', 0],
        ['drop', 0],
        ['dragend', 0],
      ],
      is_unfolded: false,
    },
    {
      title: "Opera User JavaScript",
      spec: "http://www.opera.com/docs/userjs/specs/#evlistener",
      events:
      [
        ['BeforeExternalScript', 0],
        ['BeforeScript', 0],
        ['AfterScript', 0],
        ['BeforeEvent', 0],
        ['BeforeEvent.type', 0],
        ['AfterEvent', 0],
        ['AfterEvent.type', 0],
        ['BeforeEventListener', 0],
        ['BeforeEventListener.type', 0],
        ['AfterEventListener', 0],
        ['AfterEventListener.type', 0],
        ['BeforeJavascriptURL', 0],
        ['AfterJavascriptURL', 0],
        ['pluginInitialized', 0],
      ],
      is_unfolded: false,
    }
  ];

  

}

