debug = new function()
{
  //var d_c = null;
  var self = this;
  var indent='  ';

  var getIndent = function(n)
  {
    var ret = '';
    while(n--) ret += indent;
    return ret;
  }

  var out = [];

  this.output = function(string)
  {
    if(string) out.push(string);
    var d_c=document.getElementById('debug');
    if( d_c )
    {
      d_c.textContent = out.join('\n');
      if( string && string.indexOf('<timeout/>') == -1 )
      {
        d_c=document.getElementById('debug-container');
        d_c.scrollTop = d_c.scrollHeight;
      }
    }
  }

  this.export = function(string)
  {

    

    window.open('data:text/plain;charset=utf-8,'+encodeURIComponent( out.join('\n') ));

  }

  this.clear = function()
  {
    out = [];
    var d_c=document.getElementById('debug');
    if( d_c )
    {
      d_c.textContent = '';
    }
  }

  this.checkProfiling = function()
  {
    if( window.__profiling__ ) 
    {
      window.__times__[5] =  new Date().getTime(); // rendering
      var stamps = ['request', 'response', 'parsing', 'sorting', 'markup', 'rendering'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times__[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times__[i] - window.__times__[i-1] ) : '' ) +
          '\n';
      }
      out += 'total delta: ' + ( window.__times__[5] - window.__times__[0] ) + '\n';
      debug.output(out);
    }
    if( window.__times_dom && window.__times_dom.length == 5 ) 
    {
      var stamps = ['click event', 'return object id', 'return object', 'parse xml', 'render view'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times_dom[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times_dom[i] - window.__times_dom[i-1] ) : '' ) +
          '\n';
      }
      out += 'total delta: ' + ( window.__times_dom[4] - window.__times_dom[0] ) + '\n';
      //out += 'response text length: ' + ( window.__times_dom.response_length ) + '\n';
      debug.output(out);
    }
  }

  this.profileSpotlight = function()
  {

      window.__times_spotlight__[1] =  new Date().getTime(); // rendering
      var stamps = ['event handle-event', 'command spotlight'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times_spotlight__[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times_spotlight__[i] - window.__times_spotlight__[i-1] ) : '' ) +
          '\n';
      }
      debug.output(out);
    
  }

  this.formatXML=function(string)
  {
    string=string.replace(/<\?[^>]*>/, '');
    var re = /([^<]*)(<(\/)?[^>/]*(\/)?>)/g, match = null, indentCount = 0;
   
    var ret = '';
    while(match = re.exec(string))
    {
      if( match[3] )
      {
        indentCount--;
        if( match[1] )
        {
          /*
          if( match[1].length > 20  )
          {
            ret +=  match[1].slice(0, 20) +"..."+ match[2];
          }
          else
          {
            ret +=  match[1] + match[2];
          }
          */
          ret +=  match[1] + match[2];
        }
        else
        {
          ret += '\n' + getIndent(indentCount) + match[0];
        }
      }
      else if(match[4])
      {
        ret += '\n' + getIndent(indentCount) + match[0];
      }
      else
      {
        ret += '\n' + getIndent(indentCount) + match[0];
        indentCount++;
      }
    }
    self.output(ret);
  }
}