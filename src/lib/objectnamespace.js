if (!Object.getOwnPropertyNames)
{
  Object.getOwnPropertyNames = function(obj)
  {
    var ret = [];
    for (var p in obj)
    {
      if (Object.prototype.hasOwnProperty.call(obj, p))
        ret.push(p);
    }
    return ret;
  }
}
