/**
  * @constructor 
  */

var TextSearch = function()
{
  const 
  DEFAULT_STYLE = "background-color:#ff0; color:#000;",
  HIGHLIGHT_STYLE = "background-color:#0f0; color:#000;",
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50;



  var 
  self = this, 
  search_therm = '',
  search_results = [], // collection of span elements
  cursor = -1,
  container = null,
  timeouts = new Timeouts(),
 
  search_node = function(node) 
  {
    var cur_node = node.firstChild, pos = 0, hit = null, span = null;
    while( cur_node ) 
    {
      switch(cur_node.nodeType)
      {
        case 1:
        {
          search_node(cur_node);
          break;
        }
        case 3:
        {
          while( ( pos = cur_node.nodeValue.toLowerCase().indexOf(search_therm) ) != -1 ) 
          {          
            hit = cur_node.splitText(pos);
            cur_node = hit.splitText(search_therm.length);
            search_results[search_results.length] = span = 
              node.insertBefore(node.ownerDocument.createElement('span'), hit);
            span.style.cssText = DEFAULT_STYLE;
            span.appendChild(node.removeChild(hit));
          }
          break;
        };
      }
      cur_node = cur_node.nextSibling;
    }
  };
  
  this.search = function(new_search_therm)
  {
    var cur = null, i = 0, parent = null;
    if( new_search_therm != search_therm )
    {
      search_therm = new_search_therm;
      if(search_results)
      {
        for( ; cur = search_results[i]; i++)
        {
          ( parent = cur.parentNode ).replaceChild(cur.firstChild, cur);
          parent.normalize();
        }
      }
      search_results = [];
      cursor = -1;
      if( search_therm.length > 2 )
      {
        if(container)
        {
          search_node(container);
          self.highlight(true);
          
        }
      }
      else
      {
        topCell.statusbar.updateInfo('');
      }
    }
  }

  this.searchDelayed = function(new_search_therm)
  {
    timeouts.set(this.search, SEARCH_DELAY, new_search_therm.toLowerCase());
  }
  
  this.update = function()
  {
    var new_search_therm = search_therm;
    if( search_therm.length > 2 )
    {
      search_therm = '';
      this.search(new_search_therm);
    }
  }

  this.highlight = function(check_position)
  {
    if(search_results.length)
    {
      if( cursor >= 0 )
      {
        search_results[cursor].style.cssText = DEFAULT_STYLE;
      }
      
      if( check_position )
      {
        cursor = 0;
        //var top = 0; //container.scrollTop;
        //opera.postError(search_results[cursor].offsetTop +' '+ container.scrollTop)
        while( search_results[cursor] && search_results[cursor].offsetTop < 0  )
        {
          cursor++;
        }
      }
      else
      {
        cursor++;
      }
      if( cursor > search_results.length - 1)
      {
        cursor = 0;
      }
      search_results[cursor].style.cssText = HIGHLIGHT_STYLE;
      if( !check_position || search_results[cursor].offsetTop > DEFAULT_SCROLL_MARGIN )
      {
        container.scrollTop += search_results[cursor].offsetTop - DEFAULT_SCROLL_MARGIN;
      }
      topCell.statusbar.updateInfo('matches for "' + 
        search_therm + '": ' +search_results.length +', match ' + ( cursor + 1 ) );
    }
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
    search_therm = '';
    search_results = [];
    cursor = -1;
    container = null;
  }
  
};