/**
  * @constructor
  */

var ViewBase = new function()
{
  var self = this;
  var id_count = 1;

  var ids = [];
  var _enabled_services = [];
  var _ignore_updates = true;

  var getId = function()
  {
    return 'view-' + (id_count++).toString();
  }

  var filter = function(view, filters)
  {
    var filter = '', i = 0;
    for( ; (filter = filters[i]) && !view[filter]; i++ );
    return filter && true || false;
  }

  var _is_enabled = function(service)
  {
    return _enabled_services.indexOf(service) > -1;
  };

  this.required_services = [];

  this.getSingleViews = function(filters)
  {
    var
      id = '',
      i = 0,
      ret = [];
    for( ; id = ids[i]; i++)
    {
      if(views[id].type == 'single-view' && ( !filters || !filter(views[id], filters) ) )
      {
        ret[ret.length] = id;
      }
    }
    return ret;
  }

  this._delete = function(id)
  {
    var
    _id = '',
    i = 0;
    for( ; ( _id = ids[i] ) && _id != id; i++);
    if(_id)
    {
      ids.splice(i, 1);
      return true;
    }
    return false;
  }

  this.init = function(id, name, container_class, html, default_handler, edit_handler)
  {
    this.id = id || getId();
    this.name = name;
    this.container_class = container_class;
    this.inner = html;  // only for testing;
    this.container_ids = [];
    this.type = this.type || 'single-view';
    this.default_handler = default_handler || '';
    this.edit_handler = edit_handler || '';
    this.requires_view || ( this.requires_view = '' );
    if(!window.views)
    {
      window.views = {};
    }
    window.views[id] = this;
    if (ids.indexOf(this.id) == -1)
    {
      ids[ids.length] = this.id;
    }
    messages.post('view-initialized', {'view_id': this.id});
  }

  this.addContainerId = function(id)
  {
    this.container_ids[this.container_ids.length] = id;
  }

  this.removeContainerId = function(id)
  {
    var id_c = '', i = 0;
    for( ; ( id_c = this.container_ids[i] ) && id_c != id; i++);
    if( id_c )
    {
      this.container_ids.splice(i, 1);
    }
  }

  this.createView = function(container)
  {
    container.innerHTML = this.inner;
  }

  this.create_disabled_view = function(container)
  {
    container.innerHTML = "";
  };

  this.ondestroy = function()
  {

  }

  this.update = function()
  {
    // ignore any updates before a profile is enabled
    if (_ignore_updates)
      return;

    var is_enabled = this.is_enabled;
    for (var i = 0, id = ""; id = this.container_ids[i]; i++)
    {
      var container = document.getElementById(id);
      if (container)
      {
        if (is_enabled)
          this.createView(container);
        else
          this.create_disabled_view(container);

        messages.post('view-created', {id: this.id,
                                       container: container,
                                       is_enabled: is_enabled});
      }
    }
  };

  this.applyToContainers = function(fn) // for testing
  {

    var id = '', i = 0, container = null;

    for( ; id = this.container_ids[i]; i++)
    {
      container = document.getElementById(id);
      if( container )
      {
        fn(container);
      }
    }

  }

  this.isvisible = function()
  {
    var id = '', i = 0;
    for( ; id = this.container_ids[i]; i++)
    {
      if( document.getElementById(id) )
      {
        return true;
      }
    }
    return false;
  }

  this.__defineGetter__("is_enabled", function()
  {
    return this.required_services.every(_is_enabled);
  });

  this.__defineSetter__("is_enabled", function() {});

  this.getAllContainers = function()
  {
    var id = '', i = 0, c = null, ret = [];
    for( ; id = this.container_ids[i]; i++)
    {
      if( c = document.getElementById(id) )
      {
        ret[ret.length] = c;
      }
    }
    return ret;
  }
  /* returns the first container, if there is any, otherwise null */
  this.get_container = function()
  {
    return (this.container_ids[0] &&
            document.getElementById(this.container_ids[0] ) || null);
  }

  this.getToolbarControl = function( container, handler, handler_name)
  {
    handler_name = handler_name || 'handler';
    var toolbar = document.getElementById(container.id.replace(/container/,'toolbar'));
    if(toolbar)
    {
      var all = toolbar.getElementsByTagName('*'), control = null, i = 0;
      for( ; control = all[i]; i++)
      {
        if( control.getAttribute(handler_name)  == handler )
        {
          return control;
        }
      }
    }
    return null;
  }


  this.clearAllContainers = function()
  {
    var id = '', i = 0, c = null, ret = [];
    for( ; id = this.container_ids[i]; i++)
    {
      if( c = document.getElementById(id) )
      {
        c.innerHTML = "";
      }
    }
  }

  this.reset_containers = function()
  {
    this.container_ids = [];
  };

  this.has_container_id = function(id)
  {
    return this.container_ids.indexOf(id) > -1;
  }

  this.reset_containers = function()
  {
    if (this.container_ids.length)
    {
      window.messages.post('hide-view', {id: this.id});
    }
    this.container_ids = [];
  };

  this.onresize = function(container)
  {

  }

  var onHideView = function(msg)
  {
    var view = window.views[msg.id];
    if(view)
    {
      view.ondestroy();
      messages.post('view-destroyed', {id: msg.id});
    }
  }

  window.messages.addListener("hide-view", onHideView);
  window.messages.addListener("profile-enabled", function(msg)
  {
    _ignore_updates = false;
    _enabled_services = msg.services.slice();
    for (var id in window.views)
    {
      var view = window.views[id];
      if (view.type == "side-panel" || view.type == "single-view")
      {
        view.update();
        var toolbar = window.toolbars[id];
        if (toolbar)
        {
          if (view.is_enabled)
            toolbar.enable();
          else
            toolbar.disable();
        }
      }
    }
  });

  window.messages.addListener("profile-disabled", function(msg)
  {
    msg.disabled_services.forEach(function(service)
    {
      if (_enabled_services.contains(service))
        _enabled_services.splice(_enabled_services.indexOf(service), 1);
    });
    // Updating the views will be done in the following "profile-enabled"
    // message.
  });

}

/**
  * @constructor
  * @extends ViewBase
  */


var View = function(id, name, container_class, html, default_handler)
{
  this.init(id, name, container_class, html, default_handler);
}

View.prototype = ViewBase;





