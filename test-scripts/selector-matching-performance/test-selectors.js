
var enable_stylesheets = function(bool)
{
  [].forEach.call(document.getElementsByTagName('link'), function(link)
  {
    if (/stylesheet/i.test(link.getAttribute('rel'))) 
    {
      link.disabled = !bool;
    }
  });
};

var escapeTextHtml = (function()
{
  var re_amp = /&/g, re_lt = /</g;
  return function(str)
  {
    return str.replace(re_amp, "&amp;").replace(re_lt, "&lt;");
  }
})();

var GetUniqueToken = function()
{ 
  this._base_token = '';
  this._modulo_count = 0;
  this._count = 0;
  this._i = 0;
};

GetUniqueToken.prototype = new function()
{
  this._chars = "abcdefghijklmnopqrstuvwxyz";

  this.next = function()
  {
    if (this._count++ % this._chars.length == 0)
    {
      this._i = 0;
      this._base_token = '';
      var y = this._modulo_count;
      while (y)
      {
        this._base_token += this._chars.slice(0, y);
        y -= this._chars.length;
        if (y < 0)
        {
          break;
        }
      }
      this._modulo_count += 1;
    }
    return this._base_token + this._chars[this._i++];
  };

};


var SelectorGenerator = new function()
{
  this._init = function(match)
  {
    this._match = match;
    this._prefix = match[1];
    this._iter_value = match[2];
  };

  this.get_pattern =function()
  {
    return (
    escapeTextHtml(this._prefix) + 
    "<span class=\"pattern\">&lt;"+ this.type + "&gt;</span>");
  };

  this.iter = function()
  {
    return this._prefix + this._unique_tokens.next();
  };

  this.reset_unique_tokens = function()
  {
    this._unique_tokens = new GetUniqueToken();
  };

};

TagSelectorGenerator = function(match)
{
  this._init(match);
};

TagSelectorGeneratorPrototype = function()
{
 this._init = function(match)
 {
   SelectorGenerator._init.call(this, match);
   this.type = 'tag';
 }
};
TagSelectorGeneratorPrototype.prototype = SelectorGenerator;
TagSelectorGenerator.prototype = new TagSelectorGeneratorPrototype();

ClassSelectorGenerator = function(match)
{
  this._init(match);
};

ClassSelectorGeneratorPrototype = function()
{
 
 this._init = function(match)
 {
   SelectorGenerator._init.call(this, match);
   this.type = 'class';
 }
};
ClassSelectorGeneratorPrototype.prototype = SelectorGenerator;
ClassSelectorGenerator.prototype = new ClassSelectorGeneratorPrototype();

IdSelectorGenerator = function(match)
{
  this._init(match);
};

IdSelectorGeneratorPrototype = function()
{
 
 this._init = function(match)
 {
   SelectorGenerator._init.call(this, match);
   this.type = 'id';
 }
};
IdSelectorGeneratorPrototype.prototype = SelectorGenerator;
IdSelectorGenerator.prototype = new IdSelectorGeneratorPrototype();

AttrSelectorGenerator = function(match)
{
  this._init(match);
};

AttrSelectorGeneratorPrototype = function()
{
 
  this._init = function(match)
  {
    SelectorGenerator._init.call(this, match);
    this.type = 'attr';
    this._before = match[1];
    this._arr_key = match[2];
    this._attr_before_val = match[3];
    this._attr_val = match[4];
    this._attr_after_val = match[5];
    this._after = match[6];
  };

  this.get_pattern =function()
  {
    return (
    escapeTextHtml(this._before) + 
    "<span class=\"pattern\">&lt;attr-key&gt;</span>" +
    (this._attr_val ? 
      escapeTextHtml(this._attr_before_val) + 
      "<span class=\"pattern\">&lt;attr-val&gt;</span>" + 
      escapeTextHtml(this._attr_after_val) : "") + 
    escapeTextHtml(this._after));
  };

  this.iter = function()
  {
    if (this._attr_val)
    {
      return (
      this._before + this._arr_key +
      this._attr_before_val + this._unique_tokens.next() + this._attr_after_val + 
      this._after);
    }
    return this._before + this._unique_tokens.next() + this._after;
  };

};
AttrSelectorGeneratorPrototype.prototype = SelectorGenerator;
AttrSelectorGenerator.prototype = new AttrSelectorGeneratorPrototype();

FunctionSelectorGenerator = function(match)
{
  this._init(match);
};

FunctionSelectorGeneratorPrototype = function()
{
 
 this._init = function(match)
 {
   SelectorGenerator._init.call(this, match);
   this.type = 'fun';
   this._str = match[0];
 };

 this.get_pattern = function()
 {
   return escapeTextHtml(this._str);
 };

  this.iter = function()
  {
    return this._str;
  };

};
FunctionSelectorGeneratorPrototype.prototype = SelectorGenerator;
FunctionSelectorGenerator.prototype = new FunctionSelectorGeneratorPrototype();


var analyze_selector = function(selector)
{
  var re_str_d_q = "\"(?:[^\"]|\\.)*\"";
  var re_str_s_q = "'(?:[^']|\\.)*'";
  var re_attr_val = re_str_d_q; // attribute values are normailzed in Opera
  var combinators = "[\\s>+~]*";
  var ident = "(?:[^() \\[:\\.\\\\]|\\\\\\.)+";
  var types = 
  [
    {
      name: 'class',
      re: new RegExp("^(" + combinators + "\\.)(" + ident + ")"),
      generator: ClassSelectorGenerator
    },
    {
      name: 'id',
      re: new RegExp("^(" + combinators + "#)(" + ident + ")"),
      generator: IdSelectorGenerator
    },
    {
      name: 'tag',
      re: new RegExp("^(" + combinators + ")(" + ident + ")"),
      generator: TagSelectorGenerator
    },
    {
      name: 'attr',
      re: new RegExp("^(" + combinators + "\\[s*)([^=\\] :]+)" +
                     "(?:(s*=s*\")((?:[^\"\\\\]|\\\\\\.)*)(\"s*))?" + 
                     "(\\])"),
      generator: AttrSelectorGenerator
    },
    {
      name: 'function',
      re: new RegExp("^" + combinators + "(?::*" + ident + ")+\\("),
      generator: FunctionSelectorGenerator

    },
  ]
  var match = null;
  var ret = [];
  var str = selector;
  while (str)
  {
    for (var i = 0, type; type = types[i]; i++)
    {
      if (match = type.re.exec(str))
      {
        ret.push(new type.generator(match))
        str = str.slice(match[0].length);
        i = types.length;
      }
    }
    if (!match)
    {
      ret.push(str);
      str = '';
    }
  } 
  return {selector: selector, parts: ret};
}

var check_tests = function(selectors)
{
  var out = "";
  selectors = selectors.slice(0);
  while (selectors.length)
  {
    SelectorGenerator.reset_unique_tokens();
    var selector = analyze_selector(selectors.pop());
    out += selector.selector + '\n  <span>';
    out += selector.parts.map(function(part)
    {
      return typeof part == 'string' ? part : part.get_pattern();
    }).join('') + '</span>';
    
    for (var i = 0; i < 5; i++)
    {
      out += '\n  ' + selector.parts.map(function(part)
      {
        return (typeof part == 'string' ? part : part.iter());
      }).join('');
    }
    out += '\n\n';
  };
  document.getElementsByTagName('pre')[0].innerHTML = out;
};

const DIV_COUNT = 1000;
const SPAN_COUNT = 3;

var test_tmpl = function()
{
  var ret = "";
  for (var i = 0; i < DIV_COUNT; i++)
  {
    ret += "<div>" + i;
    for (var j = 0; j < SPAN_COUNT; j++)
    {
      ret += "<span>" + i + "</span>" + i;
    }
    ret += "</div>";
  }
  return ret;
};

var single_test_run = function()
{
  document.getElementById('out').innerHTML = test_tmpl();
  var a = document.body.offsetHeight + document.body.offsetWidth;
};

var tests = [];


const SELECTOR_COUNT = 500;


var create_styles = function(selector)
{
  SelectorGenerator.reset_unique_tokens();
  var decs = [];

  while (decs.length < SELECTOR_COUNT)
  {
    decs.push(
    selector.parts.map(function(part)
    {
      return (typeof part == 'string' ? part : part.iter());
    }).join('') + 
    " {padding: 1px;}\n");
  }

  document.getElementsByTagName('style')[0].textContent = decs.join('');

};

var test_config = 
{
  before_test_run: function()
  {
    enable_stylesheets(false);
    var selectors = [].reduce.call(document.styleSheets[4].cssRules, function(list, rule)
    {
      var selectors = rule.selectorText.split(',').map(function(s){ return s.trim()});
      list.push.apply(list, selectors);
      return list;
    }, []);
    this.tests_count = selectors.length;
    while (selectors.length)
    {
      var selector = analyze_selector(selectors.pop());
      selector.index = selectors.length;
      selector.description = 
          selector.selector + "\n<span class=\"selector\">" + 
          selector.parts.map(function(part)
          {
           return typeof part == 'string' ? part : part.get_pattern();
          }).join("") + "</span>";
      selector.setup = function()
      {
        create_styles(this);
      };
      tests.push(selector);
    }
  },
  prepare_test_run: function()
  {
    document.getElementById('out').innerHTML = "";
  },
  // must return an object with test, description
  get_next_test: function()
  {
    this.current_test = tests.pop();
    if (this.current_test)
    {
      document.getElementById('info').textContent = 
        "Running test number " + (this.current_test.index + 1) + 
        " of " + this.tests_count +  " tests ...";
      this.current_test.setup();
      return {test: single_test_run, description: this.current_test.description};
    }
    return null;
  },
  test_runs: 10,
  onresults: function(results)
  {
    enable_stylesheets(false);
    results.sort(function(a,b){ return a.average > b.average ? -1 : a.average < b.average ? 1 : 0});
    var min = Math.min.apply(Math, results.map(function(entry) { return entry.average; }));
    var max = Math.max.apply(Math, results.map(function(entry) { return entry.average; }));
    var markup = "";
    markup += "<h1>Measuring performance of css selector matching</h1>";
    markup += "Two test runs, one with and one without the Dragonfly stylesheet.";
    markup += "<table><tr><th>average per test run<th>in % of the best<th>description</tr>" +
              results.map(function(entry)
              {
                return (
                "<tr>" +
                  "<td>" + entry.average.toFixed(1) + 
                  "<td>" + (entry.average / min * 100 >> 0) + "%" +
                  "<td style='background-color: hsl(" + 
                      (120 - (120 * (entry.average - min)/(max - min) >> 0)) + 
                      ", 100%, 50%);'>" + 
                  "<td>" + entry.description +
                  "<td>±" + entry.deviation + '%' +
                "</tr>");
              }).join('\n') + "</table>";
    document.getElementById('out').innerHTML = markup;
    document.body.removeChild(document.getElementById('info'));    
  }
};


window.onload = function()
{
  new TestRunner(test_config);
  /*
  enable_stylesheets(false);
  var selectors = [].reduce.call(document.styleSheets[1].cssRules, function(list, rule)
  {
    var selectors = rule.selectorText.split(',').map(function(s){ return s.trim()});
    list.push.apply(list, selectors);
    return list;
  }, []);

  check_test(selectors);
  */

};
