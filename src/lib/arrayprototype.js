/**
 * Return the sum of all the values in the array. If selectorfun is given,
 * it will be called to retrieve the relevant value for each item in the
 * array.
 */
Array.prototype.sum = function(selectorfun)
{
  if (selectorfun)
  {
    return this.map(selectorfun).sum();
  }
  else
  {
    var ret = 0;
    this.forEach(function(e) { ret += e });
    return ret
  }
};

Array.prototype.unique = function()
{
  return this.reduce(function(list, e)
  {
    if (list.indexOf(e) == -1)
      list.push(e);

    return list;
  }, []);
}

Array.prototype.__defineGetter__("last", function()
{
   return this[this.length - 1];
});

Array.prototype.__defineSetter__("last", function() {});

Array.prototype.extend = function(list)
{
  this.push.apply(this, list);
  return this;
};

Array.prototype.insert = function(index, list, replace_count)
{
  this.splice.apply(this, [index, replace_count || 0].extend(list));
  return this;
};

Array.prototype.contains = function(str)
{
  return this.indexOf(str) != -1;
};
