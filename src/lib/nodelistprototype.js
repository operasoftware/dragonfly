/**
 * Returns the index of item in the nodelist
 * (The same behaviour as js1.6 array.indexOf)
 * @argument item {Element}
 */
NodeList.prototype.indexOf = function(item)
{
  for (var cursor = null, i = 0; cursor = this[i]; i++)
  {
    if (cursor == item)
    {
      return i;
    }
  }
  return -1;
};
