"use strict";

var Dict = function(obj)
{
  this._init(obj);
};

Dict.prototype = new function()
{
  var PREFIX = "$";
  var to_string = Object.prototype.toString.call.bind(Object.prototype.toString);

  this.get = function(key) { return this._dict[PREFIX + key]; };

  this.set = function(key, value) { this._dict[PREFIX + key] = value; };

  this["delete"] = function(key) { delete this._dict[PREFIX + key]; };

  this.get_chain = function(prop_list)
  {
    for (var i = 0, value = this; i < prop_list.length && (value = value.get(prop_list[i])); i++);
    return value;
  };

  this.keys = function()
  {
    var keys = [];
    for (var key in this._dict)
    {
      keys.push(key.slice(PREFIX.length));
    }
    return keys;
  };

  this.setdefault = function(key, value)
  {
    if (this._dict.hasOwnProperty(PREFIX + key))
      return this.get(key);

    this.set(key, value);
    return value;
  };

  this.toString = function()
  {
    var rep = [];
    for (var key in this._dict)
    {
      var value = this._dict[key];
      value = typeof value == "string" ? "\"" + value + "\"" : String(value);
      key = key.slice(PREFIX.length);
      rep.push((rep.length ? ", " : ""), "\"", key, "\": ", value);
    }
    return "{" + rep.join("") + "}";
  };

  this._init = function(obj)
  {
    this._dict = Object.create ? Object.create(null) : {};
    for (var key in obj)
    {
      var value = obj[key];
      if (to_string(value) == "[object Object]" && !(value instanceof Dict))
        value = new Dict(value);
      this.set(key, value);
    }
  };
};
