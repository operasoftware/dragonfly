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

Array.prototype.sortByFieldName=function(fieldname)
{
  if(this.length)
  {
    switch(typeof this[0][fieldname])
    {
      case 'number':
      {
        this.sort
        (
          function(a,b)
          {
            return a[fieldname]-b[fieldname];
          }
        )
        break;
      }

      case 'string':
      {
        this.sort
        (
          function(a,b)
          {
            var prov=0, charA=0, charB=0, i=0;
            var _a=a[fieldname], _b=b[fieldname];
            do
            {
              if(isNaN(charA=_a.charCodeAt(i))) charA=0;
              if(isNaN(charB=_b.charCodeAt(i))) charB=0;
              prov=charA-charB;
              i++;
            }
            while(prov==0 && (i<(_a.length+_b.length))/2);
            return prov;
          }
        )
        break;
      }
    }
  }
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