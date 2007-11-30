(function(){ window.views = window.views || {}; })();

(function()
{



  var View = function(id, name, container_class)
  {
    var self = this;

    this.createView = function(container)
    {
      container.innerHTML = '';
      container.render(templates.runtimes(runtimes.getRuntimes()));
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('runtimes', 'Runtimes', 'scroll runtimes');





  View = function(id, name, container_class)
  {
    var self = this;
    this.createView = function(container)
    {
      container.innerHTML = '';
      container.render( templates.hello( services['ecmascript-debugger'].getEnvironment()) );
    }
    this.init(id, name, container_class);
  }
  View.prototype = ViewBase;
  new View('environment', 'Environment', 'scroll');





  View = function(id, name, container_class)
  {
    var container_id = 'backtrace';
    var __clear_timeout = 0;

    var __clearView = function()
    {
      var container = document.getElementById(container_id);
      if( container ) 
      {
        container.innerHTML = ''; 
        __clear_timeout = 0;
      }
    }

    this.createView = function(container)
    {
      var list = container.getElementsByTagName('ul')[0];
      if(!list)
      {
        container.innerHTML = "<div id='backtrace-container'><ul id='backtrace'></ul></div>"; // TODO clean up
        list = container.getElementsByTagName('ul')[0];
      }

      if( __clear_timeout )
      {
        __clear_timeout = clearTimeout( __clear_timeout );
      }
      var _frames = stop_at.getFrames(), frame = null, i = 0;
      list.innerHTML = '';
      for( ; frame = _frames[i]; i++)
      {
        list.render(templates.frame(frame, i == 0));
      }
      
    }

    this.clearView = function()
    {
      __clear_timeout = setTimeout( __clearView, 150 );
    }

    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;
  new View('callstack', 'Callstack', 'scroll');





  View = function(id, name, container_class)
  {

    var self = this;
    var container_id = 'examine-objects';

    var getContainer = function(path_arr)
    {
      var container = document.getElementById(container_id);
      var prov = null, length = 0, i = 0;
      if( container )
      {
        if( path_arr )
        {
          length = path_arr.length
          for( ; i < length; i++ )
          {
            container = container.getElementsByTagName('ul')[0].childNodes[ path_arr[ i ] ];
            if( !container )
            {
              opera.postError('Error in views.frame_inspection.update');
              break;
            }
          }
        }
      }
      return container;
    }

    this.createView = function(container)
    {
      container.render(['div', ['div', 'id', container_id], 'id', 'examine-objects-container']); // TODO clean up
      this.updatePath(null);
    }

    this.updatePath = function( path_arr )
    {
      var container = getContainer( path_arr );
      if( container )
      {
        container.renderInner( templates.examineObject( frame_inspection.getObject( path_arr ).items ) );
      }
    }

    this.clearView = function(path_arr) 
    {
      var container = getContainer( path_arr );
      if( container )
      {
        var ul = container.getElementsByTagName('ul')[0];
        if( ul )
        {
          container.removeChild( ul );
        }
      }
    }

    this.init(id, name, container_class);

  }

  View.prototype = ViewBase;
  new View('frame_inspection', 'Frame Inspection', 'scroll');

})()


