importScripts("../../src/syntaxhighlight/js/tokenizer.js",
              "../../src/syntaxhighlight/js/syntax.js");

var tokenizer = new cls.SimpleJSParser();

const
WHITESPACE = cls.SimpleJSParser.WHITESPACE,
LINETERMINATOR = cls.SimpleJSParser.LINETERMINATOR,
IDENTIFIER = cls.SimpleJSParser.IDENTIFIER,
NUMBER = cls.SimpleJSParser.NUMBER,
STRING = cls.SimpleJSParser.STRING,
PUNCTUATOR = cls.SimpleJSParser.PUNCTUATOR,
DIV_PUNCTUATOR = cls.SimpleJSParser.DIV_PUNCTUATOR,
REG_EXP = cls.SimpleJSParser.REG_EXP,
COMMENT = cls.SimpleJSParser.COMMENT;

var classes = {};

classes[STRING] = "string";
classes[NUMBER] ='number';
classes[COMMENT] ='comment';
classes[REG_EXP] ='reg_exp';

var onjstokenmarkup = function(token_type, token, online)
{
  var class_name = "";
  switch (token_type)
  {
    case LINETERMINATOR:
    {
      if (online)
      {
        online();
      }
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
      return ('<span class="' + (class_name || classes[token_type]) + '">' +
              token + '</span>');
    }
  }
  return token;
};

const MAX_LINES = 2500;

onmessage = function(event) 
{
  var markup = "";
  var count = 0;
  var is_chunk_ready = false;
  var online = function()
  {
    is_chunk_ready = ++count >= MAX_LINES;
  };
  tokenizer.tokenize(event.data.script, function(token_type, token)
  {
    markup += onjstokenmarkup(token_type, token, online);
    if (is_chunk_ready)
    {
      postMessage({script: markup});
      markup = "";
      count = 0;
      is_chunk_ready = false;
    }
  }, "html");
  postMessage({script: markup});
};
