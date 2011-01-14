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

var classes = {};
classes[STRING] = "string";
classes[NUMBER] ='number';
classes[COMMENT] ='comment';
classes[REG_EXP] ='reg_exp';

const TOATL = "-----------------------------------------\n";

var tokenizer = new window.cls.SimpleJSParser();

var builtin_highlighter = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var markup_lines = tokenizer.format_source(script);
  var markup = markup_lines.join('\n');
  var t1 = Date.now();
  document.getElementsByClassName('js-source')[0].innerHTML = markup;
  if (with_line_numbers)
  {
    markup = "";
    for (var i = 0, length = markup_lines.length; i < length; )
    {
      markup += ++i + "\n";
    }
    document.getElementsByClassName('line-numbers')[0].textContent = markup;
  }
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  document.getElementById('output').value =
    "tokenize and create markup string: " + (t1 - t0) + "\n" +
    "layout: " + (t2 - t1) + "\n" +
    TOATL +
    "total: " + (t2 - t0);
};

var JSTokens2DOM = function()
{
  this._init();
}

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

  this._init = function()
  {
    this._doc_frag = document.createDocumentFragment();
    this._line_counter = 1;
    this._lines = [this._line_counter++];
    this._text = "";
    this.ontoken = this._ontoken.bind(this);
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

}



var callback_dom = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var tok2dom = new JSTokens2DOM();
  tokenizer.tokenize(script, tok2dom.ontoken);
  var t1 = Date.now();
  document.getElementsByClassName('js-source')[0].appendChild(tok2dom.document_fragment);
  if (with_line_numbers)
  {
    document.getElementsByClassName('line-numbers')[0].textContent = tok2dom.lines.join('\n');
  }
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  document.getElementById('output').value =
    "tokenize and create document fragment: " + (t1 - t0) + "\n" +
    "layout: " + (t2 - t1) + "\n" +
    TOATL +
    "total: " + (t2 - t0);
}

var test = function(method)
{
  document.getElementsByClassName('js-source')[0].innerHTML = "";
  document.getElementsByClassName('line-numbers')[0].innerHTML = "";
  document.getElementById('output').value = "";
  var with_line_numbers = document.getElementById('make-line-numbers').checked;
  setTimeout(function(){method(document.forms[0]['file-size'][0].checked ?
                               window.small_script_source :
                               window.script_source, 
                               with_line_numbers)}, 10);
  /*
  var t0 = Date.now();
  var line_count = script.split('\n').map(function(t, i){return ' ' + (i + 1);}).join('\n');


  document.getElementsByClassName('js-source')[0].textContent = script;
  document.getElementsByClassName('line-numbers')[0].textContent = line_count;
    var h = document.body.offsetHeight + document.body.offsetWidth;
    var t2 = Date.now();
    
    alert("total: " + (t2 - t0));
  */
}

var callback_template = function(script, with_line_numbers)
{
  var t0 = Date.now();
  var tmpl = window.templates.highlight_js_source(script);
  var t1 = Date.now();
  document.getElementsByClassName('js-source')[0].render(tmpl);
  var h = document.body.offsetHeight + document.body.offsetWidth;
  var t2 = Date.now();
  document.getElementById('output').value =
    "create the template: " + (t1 - t0) + "\n" +
    "create the DOM and layout: " + (t2 - t1) + "\n" +
    TOATL +
    "total: " + (t2 - t0);
};

(function()
{

  this._onjstoken = function(context, token_type, token)
  {
    var class_name = "";
    switch (token_type)
    {
      /*
      case LINETERMINATOR:
      {
        if (context.with_line_numbers)
        {
          context.lines += (context.line_count++) + "\n";
        }
      }
      */
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
        if (context.text)
        {
          context.template.push(context.text);
          context.text = "";
        }
        context.template.push(['span', token, 
                               'class', class_name || classes[token_type]]);
        return;
      }
    }
    context.text += token;
  };

  this.highlight_js_source = function(script)
  {
    var context =
    {
      template: [],
      text: "",
      lines: "",
      line_count: ""
    };
    tokenizer.tokenize(script, this._onjstoken.bind(this, context));
    return context.template;
  }

}).apply(window.templates || (window.templates = {}));


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
      "<p>" +
        "<input type='button' value='builtin highlighter' onclick='test(builtin_highlighter)'>" +
        "<input type='button' value='callback with DOM' onclick='test(callback_dom)'>" +
        "<input type='button' value='callback with template' onclick='test(callback_template)'>";
      ;
  }
  xhr.open("GET", "./dragonfly.js");
  xhr.send(null);
}