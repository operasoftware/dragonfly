debug = new function()
{
  var d_c = null;
  var self = this;
  var indent='  ';

  var getIndent = function(n)
  {
    var ret = '';
    while(n--) ret += indent;
    return ret;
  }

  this.output = function(string)
  {
    if( !d_c )
    {
      var d_c=document.getElementById('debug');
      if(!d_c)
      {
        self.output=function(){};
        return;
      }
    }
    d_c.textContent += string +'\n';
    //d_c.scrollTop = d_c.scrollHeight;
  }

  this.formatXML=function(string)
  {
    string=string.replace(/<\?[^>]*>/, '');
    var re = /([^<]*)(<(/)?[^>/]*(/)?>)/g, match = null, indentCount = 0;
   
    var ret = '';
    while(match = re.exec(string))
    {
      if( match[3] )
      {
        indentCount--;
        if( match[1] )
        {
          if( match[1].length > 20 )
          {
            ret +=  match[1].slice(0, 20) +"..."+ match[2];
          }
          else
          {
            ret +=  match[1] + match[2];
          }
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