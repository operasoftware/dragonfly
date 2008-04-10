var ListTextSearch = function()
{
  const 
  SEARCH_DELAY = 50;

  var 
  self = this, 
  search_therm = '',
  search_results = [],
  cursor = -1,
  container = null,
  input = null, 
  timeouts = new Timeouts(),
  cache = {},
  current_id = '',
  current_context = null;

  this.search = function(new_search_therm)
  {
    var cur = null, cur_2 = null, depth = 0, display = '';
    if( new_search_therm != search_therm )
    {
      search_results = [];
      cache[current_id] = search_therm = new_search_therm;
      cur = container.getElementsByTagName('start-search-scope')[0];
      while( ( cur = cur.nextSibling ) && cur.nodeName != "end-search-scope" )
      {
        display = 
          cur.getElementsByTagName('key')[0].textContent.indexOf(search_therm) == -1 
          && 'none'
          || '';
        cur.style.display = display;
        if( !display )
        {
          //opera.postError(display +' '+cur.getElementsByTagName('key')[0].textContent)
          search_results[search_results.length] = cur;
        }
        depth = parseInt( cur.getAttribute('depth'));
        cur_2 = cur;
        while( ( cur_2 = cur_2.nextSibling ) 
                  && cur_2.nodeName != "end-search-scope"
                  && ( parseInt( cur.getAttribute('depth')) < depth ) )
        {
          cur = cur_2;
          cur.style.display = display;
        }
      }
    }
  }

  this.searchDelayed = function(new_search_therm)
  {
    timeouts.set(this.search, SEARCH_DELAY, new_search_therm);
  }
  
  this.handleEnterKey = function()
  { 
    
    switch( event.keyCode)
    {
      case 13:
      {
        if( search_results.length == 1 )
        {
          var _input = search_results[0].getElementsByTagName('input')[0];
          if( _input )
          {
            _input.click();
          }
        }
        break;
      }
      case 8:
      {
        if(input && !input.value)
        {
          var target = getTarget();
          if( target && ( target = target.getElementsByTagName('input')[0] ) )
          {
            // TOD this call causes problems
            target.click();
          }
        }
        
        break;
      }
    }
  }

  var getTarget = function(str_id)
  {
    var items = null, item = null, i = 0;
    if( container && current_context )
    {
      items = container.getElementsByTagName('item');
      for( ; item = items[i]; i++)
      {
        if( item.getAttribute('obj-id') == current_context.obj_id 
            && item.getAttribute('depth') == current_context.depth )
        {
          break;
        }
      }
    }
    return item;
  }

  this.onNewContext = function(msg)
  {
    current_context = msg;
    current_id = msg.rt_id + "." + msg.obj_id + "." + msg.depth;
    if( input )
    {
      if( cache[current_id] )
      {
        input.value = cache[current_id];
        this.search(cache[current_id]);
      }
      else
      {
        input.value = '';
      }
    }
  }

  this.setInput = function(target)
  {
    input = target;
  }

  this.setContainer = function(_container)
  {
    if( container != _container )
    {
      container = _container;
    }
  }

  this.cleanup = function()
  {
    /*
    search_therm = '';
    search_results = [];
    cursor = -1;
    */
    current_id = '';
    current_context = null;
    search_results = [];
    input = null;
    container = null;
  }
  
};