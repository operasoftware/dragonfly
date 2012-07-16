window.potools = {
    parse: function(input, scope)
    {
        return this._parser.parseString(input, scope);
    },

  malformed_interpolation_markers: function(entries)
  {
    var re = /%\(\w+\)(?:[^s]|$)/g;
    return entries.filter(function(e) { return e.msgstr.match(re) })
  },

  missing_interpolation_markers: function(entries)
  {
    var re = /%\((\w+\))s/g
    return entries.filter(function(e) {
      return (e.msgstr.match(re) || []).sort().join("") == (e.msgid.match(re) || []).sort().join("") ? null : e;
    });
  },
  /**
   * The following parser is originally written in coffeescript, and
   * this is the compiled version. Thus the style is different from
   * the rest of the dragonfly code. The original coffeescript version
   * can be found here: https://bitbucket.org/runeh/poodle
   */
  _parser: (function() {
    var parser;
    var __indexOf = Array.prototype.indexOf || function(item) {
      for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] === item) return i;
      }
      return -1;
    }, __slice = Array.prototype.slice;
    parser = new ((function() {
      var stripQuotes;
      function _Class() {}
      stripQuotes = function(s) {
        var _ref;
        if ((_ref = s[0] + s.slice(-1)) === '""' || _ref === "''") {
          return s.slice(1, -1);
        } else {
          return s;
        }
      };
      _Class.prototype.parseString = function(input, scope) {
        var block, e, items;
        items = ((function() {
          var _i, _len, _ref, _results;
          _ref = this._getEntryBlocks(input);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            block = _ref[_i];
            _results.push(this._parseEntry(block));
          }
          return _results;
        }).call(this)).filter(Boolean);
        if (scope) {
          items = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = items.length; _i < _len; _i++) {
              e = items[_i];
              if (__indexOf.call(e.scopes, scope) >= 0) {
                _results.push(e);
              }
            }
            return _results;
          })();
        }
        return items;
      };
      _Class.prototype._getEntryBlocks = function(input) {
        var e, _i, _len, _ref, _results;
        _ref = input.split(/\n{2,}/g);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          e = _ref[_i];
          _results.push(e.split("\n"));
        }
        return _results;
      };
      _Class.prototype._parseEntry = function(lines) {
        var accumulator, entry, line, token, value, _i, _j, _len, _len2, _ref, _ref2;
        entry = {
          msgid: [],
          msgstr: [],
          tcomments: [],
          ecomments: [],
          scopes: [],
          references: [],
          flags: []
        };
        accumulator = [];
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          line = lines[_i];
          _ref = line.split(" "), token = _ref[0], value = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
          value = value.join(" ");
          switch (token) {
            case "msgstr":
              entry.msgstr.push(stripQuotes(value));
              accumulator = entry.msgstr;
              break;
            case "msgid":
              entry.msgid.push(stripQuotes(value));
              accumulator = entry.msgid;
              break;
            case "msgctxt":
              entry.msgctxt = stripQuotes(value);
              break;
            case "#":
              entry.tcomments.push(value);
              break;
            case "#.":
              entry.ecomments.push(value);
              break;
            case "#:":
              entry.references.push(value);
              break;
            case "#,":
              entry.flags.push(value);
              break;
            case "#|":
              null;
              break;
            default:
              accumulator.push(stripQuotes(line));
          }
        }
        entry.msgid = entry.msgid.join("");
        entry.msgstr = entry.msgstr.join("");
        _ref2 = entry.ecomments;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          line = _ref2[_j];
          if (line.match(/scope: /i)) {
            entry.scopes = entry.scopes.concat(line.slice(7).split(","));
          }
        }
        if (entry.msgid) {
          return entry;
        } else {
          return null;
        }
      };
      return _Class;
    })());
    return parser;
  }).call(this)
}
