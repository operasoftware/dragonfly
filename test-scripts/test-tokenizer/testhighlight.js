
const NEXT_RUN_DELAY = 20;
const MAX_LINES = 2500;

var tokenizer = new window.cls.SimpleJSParser();
var labels = {};
var ts1 = null;
var ts2 = null;
var ts3 = null;
var method = "";

var dom_fragment = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var tok2dom = new JSTokens2DOM(script);
  var t1 = Date.now();
  document.getElementsByClassName('js-source')[0].appendChild(tok2dom.document_fragment);
  if (with_line_numbers)
  {
    document.getElementsByClassName('line-numbers')[0].textContent = tok2dom.lines.join('\n');
  }
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  // tokenize and create document fragment
  ts1.push(t1 - t0);
  // layout
  ts2.push(t2 - t1);
  // total
  ts3.push(t2 - t0);
  setTimeout(ontestcompleted, NEXT_RUN_DELAY);
};

labels["dom_fragment"] =
[
  "tokenize and create document fragment",
  "layout"
];

var template = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var line_count = 1;
  var lines = [];
  var online = with_line_numbers && function()
  {
    lines.push(line_count++);
  };
  var tmpl = window.templates.highlight_js_source(script, online);
  var t1 = Date.now();
  document.getElementsByClassName('js-source')[0].render(tmpl);
  if (with_line_numbers)
  {
    document.getElementsByClassName('line-numbers')[0].textContent = lines.join('\n');
  }
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  // tokenize and create template
  ts1.push(t1 - t0);
  // create DOM and layout
  ts2.push(t2 - t1);
  // total
  ts3.push(t2 - t0);
  setTimeout(ontestcompleted, NEXT_RUN_DELAY);
};

labels["template"] =
[
  "tokenize and create template",
  "create DOM and layout"
];

var markup = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var line_count = 1;
  var lines = [line_count++];
  var online = with_line_numbers && function()
  {
    lines.push(line_count++);
  };
  var markup = window.templates.highlight_js_source_markup(script, online);
  var t1 = Date.now();
  document.getElementsByClassName('js-source')[0].render(markup);
  if (with_line_numbers)
  {
    document.getElementsByClassName('line-numbers')[0].textContent = lines.join('\n');
  }
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  // tokenize and create template
  ts1.push(t1 - t0);
  // create DOM and layout
  ts2.push(t2 - t1);
  // total
  ts3.push(t2 - t0);
  setTimeout(ontestcompleted, NEXT_RUN_DELAY);
};

labels["markup"] =
[
  "tokenize and create template",
  "create DOM and layout"
];

var webworker = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var line_count = count_lines(script) || 1;
  if (with_line_numbers)
  {
    var lines = [], count = 1;
    line_count++;
    while (count <= line_count)
    {
      lines.push(count++);
    }
    document.getElementsByClassName('line-numbers')[0].textContent = lines.join('\n');
  }
  var chunk_count = ((line_count / MAX_LINES) >> 0) + 1;
  var chunk_count_back = chunk_count;
  var markup = "";
  while (chunk_count_back)
  {
    markup += "<div></div>";
    chunk_count_back--;
  }
  document.getElementsByClassName('js-source')[0].render(markup);
  var divs = document.getElementsByClassName('js-source')[0].getElementsByTagName('div');
  highlight_worker.highlight_script(script, function(markup)
  {
    divs[chunk_count_back++].render(markup);
    if (chunk_count_back == chunk_count)
    {
      var h = document.body.offsetHeight + document.body.offsetWidth;
      var t2 = Date.now();
      ts1.push(0);
      ts2.push(0);
      // total
      ts3.push(t2 - t0);
      setTimeout(ontestcompleted, NEXT_RUN_DELAY);
    }
  });
};

labels["webworker"] =
[
  "tokenize and create markup in web worker",
  "create DOM and layout"
];

var no_highlight = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var line_count = count_lines(script) || 1;
  if (with_line_numbers)
  {
    var lines = [], count = 1;
    line_count++;
    while (count <= line_count)
    {
      lines.push(count++);
    }
    document.getElementsByClassName('line-numbers')[0].textContent = lines.join('\n');
  }
  document.getElementsByClassName('js-source')[0].textContent = script;
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  // do nothing
  ts1.push(t0 - t0);
  // create DOM and layout
  ts2.push(t2 - t0);
  // total
  ts3.push(t2 - t0);
  setTimeout(ontestcompleted, NEXT_RUN_DELAY);
};

labels["no_highlight"] =
[
  "",
  "create DOM and layout"
];

var count_lines = function(script)
{
  var re_nl = /\n/g;
  var count = 0;
  while (re_nl.exec(script))
  {
    count++;
  }
  return count;
}

var JSTokens2DOM = function(script)
{
  this._init(script);
};

JSTokens2DOM.prototype = new function()
{
  const
  WHITESPACE = window.cls.SimpleJSParser.WHITESPACE,
  LINETERMINATOR = window.cls.SimpleJSParser.LINETERMINATOR,
  IDENTIFIER = window.cls.SimpleJSParser.IDENTIFIER,
  NUMBER = window.cls.SimpleJSParser.NUMBER,
  STRING = window.cls.SimpleJSParser.STRING,
  PUNCTUATOR = window.cls.SimpleJSParser.PUNCTUATOR,
  DIV_PUNCTUATOR = window.cls.SimpleJSParser.DIV_PUNCTUATOR,
  REG_EXP = window.cls.SimpleJSParser.REG_EXP,
  COMMENT = window.cls.SimpleJSParser.COMMENT;

  this._classes = {};
  this._classes[STRING] = "string";
  this._classes[NUMBER] ='number';
  this._classes[COMMENT] ='comment';
  this._classes[REG_EXP] ='reg_exp';
 
  this._ontoken = function(token_type, token)
  {
    var class_name = "";
    switch (token_type)
    {
      case LINETERMINATOR:
      {
        this._lines.push(this._line_counter++);
      }
      case IDENTIFIER:
      {
        if(token in js_keywords)
        {
          class_name = 'js_keywords';
        }
        else if(token in js_builtins)
        {
          class_name = 'js_builtins';
        }
        else
        {
          break;
        }
      }
      case STRING:
      case NUMBER:
      case COMMENT:
      case REG_EXP:
      {
        if (this._text)
        {
          this._doc_frag.appendChild(document.createTextNode(this._text));
          this._text = "";
        }
        var span = this._doc_frag.appendChild(document.createElement('span'));
        span.appendChild(document.createTextNode(token));
        span.className = class_name || this._classes[token_type];
        return;
      }
    }
    this._text += token;
  };

  this._tokenizer = new window.cls.SimpleJSParser();

  this._init = function(script)
  {
    this._doc_frag = document.createDocumentFragment();
    this._line_counter = 1;
    this._lines = [this._line_counter++];
    this._text = "";
    var self = this;
    // the js implementation of bind causes a noticable overhead here
    this._tokenizer.tokenize(script, function(token_type, token)
    {
      self._ontoken(token_type, token);
    });
  }

  this.__defineGetter__("document_fragment", function()
  {
    return this._doc_frag;
  });

  this.__defineSetter__("document_fragment", function(){});

  this.__defineGetter__("lines", function()
  {
    return this._lines;
  });

  this.__defineSetter__("lines", function(){});

};

var HighlightWorker = function()
{

  this._onerror = function(event)
  {
    throw event.message;
  };

  this._onmessage = function(event)
  {

    if (event.data.log)
    {
      opera.postError(event.data.log);
    }
    else
    {
      var self = this;
      //self._onmarkup(event.data.script);
      setTimeout(function(){self._onmarkup(event.data.script);}, 0);
    }
  };

  this._init = function()
  {
    this._worker = new Worker('highlightworker.js');
    var self = this;
    this._worker.onerror = function(event)
    {
      self._onerror(event);
    };
    this._worker.onmessage = function(event)
    {
      self._onmessage(event);
    };
  };

  this.highlight_script = function(script, onmarkup)
  {
    this._onmarkup = onmarkup;
    this._worker.postMessage({script: script});
  };

  this._init();
};

var highlight_worker = new HighlightWorker();

var enable_stylesheets = function(do_enable)
{
  var links = document.getElementsByTagName('link'), i = 0, link = null;
  for (; link = links[i]; i++) 
  {
    if (/^alt/i.test(link.getAttribute('rel'))) 
    {
      link.disabled = !do_enable;
    }
  }
};

var test = function(method)
{
  window.ts1 = [];
  window.ts2 = [];
  window.ts3 = [];
  window.method = method;
  window.test_runs = parseInt(document.forms[0]['test-runs'].value);
  ontestcompleted();
}

var ontestcompleted = function()
{
  const TOTAL = "-----------------------------------------";
  if (window.test_runs)
  {
    window.test_runs--;
    document.getElementsByClassName('js-source')[0].innerHTML = "";
    document.getElementsByClassName('line-numbers')[0].innerHTML = "";
    document.getElementById('output').value = "";
    setTimeout(function(){
      window[window.method](document.forms[0]['file-size'][0].checked ?
                            window.small_script_source :
                            window.script_source, 
                            document.getElementById('make-line-numbers').checked);
    }, NEXT_RUN_DELAY);
  }
  else
  {
    document.getElementById('output').value = [ts1, ts2, ts3].reduce(function(list, ts, index)
    {
      list.push((window.labels[window.method][index] || "total") + ": " +
                ((ts.reduce(function(sum, t){return sum + t;}, 0))/ts.length));
      if (index == 1)
      {
        list.push(TOTAL);
      }
      return list;
    }, []).join("\n");
  }
}

window.onload = function()
{
  window.helpers = new cls.Helpers();
  var xhr = new XMLHttpRequest();
  xhr.onload = function()
  {
    window.script_source = this.responseText;
    window.small_script_source = window.script_source.slice(0, 250000);
    document.getElementById('controls').innerHTML = 
      "<p>" + ['dom_fragment',
               'template',
               'markup',
               'webworker',
               'no_highlight'].map(function(method)
               {
                  return "<input type='button' value='" + method + 
                         "' onclick='test(this.value)'>";
               }).join('');
  }
  xhr.open("GET", "./testhighlight.js");
  xhr.send(null);
};
