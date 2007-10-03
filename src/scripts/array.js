Array.prototype.search=function(fieldname, searchTherm) 
{
  var pointer=null, i=this.length, ret=[];
  var re=(searchTherm instanceof RegExp)?searchTherm:(new RegExp(searchTherm, 'i'));
  for( ; i--; )
  {
    if((pointer=this[i]) && (re.test(pointer[fieldname]))) ret[ret.length]=pointer;
  }
  return ret;
}


Array.prototype.sortByItemProperty = function( property )
{
  this.sort
  (
    function( a, b )
    {
      if( a[property] < b[property] ) return -1;
      if( a[property] > b[property] ) return +1;
      return 0;
    }
  )
}