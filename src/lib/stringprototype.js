if (!"".trim)
{
  String.prototype.trim = function()
  {
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
  }
}

/**
 * Check if a string appears to be a number, that is, all letters in the
 * string are numbers. Does not take in to account decimals. Clones the
 * behaviour of str.isdigit in python
 */
String.prototype.isdigit = function()
{
  return this.length && !(/\D/.test(this));
};

String.prototype.startswith = function(str)
{
  return this.slice(0, str.length) === str;
};

String.prototype.endswith = function(str)
{
  return this.slice(this.length - str.length) === str;
};

String.prototype.zfill = function(width)
{
  return this.replace(/(^[+-]?)(.+)/, function(str, sign, rest) {
    var fill = Array(Math.max(width - str.length + 1, 0)).join(0);
    return sign + fill + rest;
  });
};

String.prototype.ljust = function(width, char)
{
  return this + Array(Math.max(width - this.length + 1, 0)).join(char || ' ');
};

/**
 * Capitalizes the first character of the string. Lowercases the rest of
 * the characters, unless `only_first` is true.
 */
String.prototype.capitalize = function(only_first)
{
  var rest = this.slice(1);
  if (!only_first)
  {
    rest = rest.toLowerCase();
  }
  return this[0].toUpperCase() + rest;
};

String.prototype.contains = function(str)
{
  return this.indexOf(str) != -1;
};
