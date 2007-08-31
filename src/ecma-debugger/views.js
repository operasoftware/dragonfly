(function(){ window.views = window.views || {}; })();

views.runtimes = new function()
{
  var self = this;
  var container_id = 'runtimes';
  this.update = function()
  {
    var container = document.getElementById('runtimes');
    if( container )
    {
      container.innerHTML = '';
      container.render(templates.runtimes(runtimes.getRuntimes()));
    }
  }
}

/*
      views.configuration.render();
      views.continues.render();

      document.getElementById('configuration').render(templates.configStopAt(config));
      document.getElementById('continues').render(templates.continues());

      */

views.configuration = new function()
{
  var self = this;
  var container_id = 'configuration';
  this.update = function()
  {
    var container = document.getElementById(container_id);
    if( container )
    {
      container.render(templates.configStopAt(stop_at.getStopAts()));
    }
  }

}

views.continues = new function()
{
  var self = this;
  var container_id = 'continues';
  this.render = function()
  {
    document.getElementById(container_id).render(templates.continues());
  }
  this.update = function()
  {
    var bol = !stop_at.getControlsEnabled();
    var inputs = document.getElementById(container_id).getElementsByTagName('input'),
        input = null, i=0;
    for( ; input = inputs[i]; i++)
    {
      input.disabled = bol;
    }
  }
}

views.callstack = new function()
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

  this.update = function()
  {
    if( __clear_timeout )
    {
      __clear_timeout = clearTimeout( __clear_timeout );
    }
    var _frames = stop_at.getFrames(), frame = null, i = 0;
    var container = document.getElementById(container_id);
    if( container )
    {
      container.innerHTML = '';
      for( ; frame = _frames[i]; i++)
      {
        container.render(templates.frame(frame, i == 0));
      }
    }
  }

  this.clearView = function()
  {
    __clear_timeout = setTimeout( __clearView, 150 );
  }
}

/*
views.scope = new function()
{
  var container_id = 'examine-objects';

  this.clear = function()
  {
    var container = document.getElementById(container_id);
    container.innerHTML = '';
  }
  this.get = function()
  {
    return document.getElementById(container_id);
  }
}
*/

views.environment = new function()
{
  var self = this;
  var container_id = 'view-environment';
  this.update = function()
  {
    var container = document.getElementById(container_id);
    if( container )
    {
      container.innerHTML = '';
      container.render( templates.hello( debugger.getEnvironment()) );
    }
  }
}

views.frame_inspection = new function()
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

  this.update = function( path_arr )
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
/*
  this.clear = function()
  {
    var container = document.getElementById(container_id);
    container.innerHTML = '';
  }
*/
}