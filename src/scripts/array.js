/**
 * @fileoverview
 * Array prototype functions
 * fixme: This file can probably be removed. There doesn't seem to be any
 * code still using it
 */

/**
 * Not used anywhere and looks broken.
 * @deprecated
 */
Array.prototype.search=function(fieldname, searchTerm) 
{
  var pointer=null, i=this.length, ret=[];
  var re=(searchTerm instanceof RegExp)?searchTerm:(new RegExp(searchTerm, 'i'));
  for( ; i--; )
  {
    if((pointer=this[i]) && (re.test(pointer[fieldname]))) ret[ret.length]=pointer;
  }
  return ret;
}

/**
 * Not used anywhere
 * @deprecated
 */
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