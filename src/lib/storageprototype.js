Storage.prototype.get_and_parse_item = function(key, default_value)
{
  var raw_value = this.getItem(key);
  var value = null;
  try
  {
    value = JSON.parse(raw_value);
  }
  catch(e)
  {
    value = default_value;
  }
  return value == null ? default_value : value;
};

Storage.prototype.stringify_and_set_item = function(key, value)
{
  this.setItem(key, JSON.stringify(value));
};
