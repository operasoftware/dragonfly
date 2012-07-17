(function()
{
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

  var tokenizer = new cls.SimpleJSParser();
  var classes = {};

  classes[STRING] = "string";
  classes[NUMBER] = 'number';
  classes[COMMENT] = 'comment';
  classes[REG_EXP] = 'reg_exp';

  var js_types =
  {
    "false": "boolean",
    "true": "boolean",
    "null": "null",
    "undefined": "undefined",
  };

  var onjstoken = function(context, token_type, token)
  {
    var class_name = "";
    context.test_char_count += token.length;
    switch (token_type)
    {
      case LINETERMINATOR:
      {
        if (context.online)
        {
          context.online();
          if (context.test_char_count > context.max_char_count)
          {
            context.max_char_count = context.test_char_count;
          }
          context.test_char_count = 0;
        }
        break;
      }
      case IDENTIFIER:
      {
        if (js_types.hasOwnProperty(token))
        {
          class_name = js_types[token];
        }
        else if(js_keywords.hasOwnProperty(token))
        {
          class_name = 'js_keywords';
        }
        else if(js_builtins.hasOwnProperty(token))
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
        if (js_types.hasOwnProperty(token))
        {
          class_name = js_types[token];
        }
        else if(js_keywords.hasOwnProperty(token))
        {
          class_name = 'js_keywords';
        }
        else if(js_builtins.hasOwnProperty(token))
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

  this.highlight_js_source = function(script, online, start_state,
                                      ext_context, ignore_max_width)
  {
    if (typeof ignore_max_width != 'boolean')
    {
      ignore_max_width = false;
    }
    var context =
    {
      template: ext_context || ["pre"],
      text: "",
      online: online,
      test_char_count: 0,
      max_char_count: 0
    };
    // the js implementation of bind causes a noticable overhead here
    // when we get a native implementation we can adjust the code
    tokenizer.tokenize(script, function(token_type, token)
    {
      onjstoken(context, token_type, token);
    }, null, start_state);
    if (context.text)
    {
      context.template.push(context.text);
    }
    // Opera cannot handle elements properly with a width over 32767px.
    if (context.test_char_count > context.max_char_count)
    {
      context.max_char_count = context.test_char_count;
    }
    if (!ignore_max_width && window.defaults['js-source-char-width'] &&
        context.max_char_count * window.defaults['js-source-char-width'] > 32000)
    {
      context.template.push('style', 'white-space:pre-wrap; width: 32000px');
    }
    return context.template;
  };

  this.highlight_js_source_markup = function(script, online)
  {
    var markup = "";
    // the js implementation of bind causes a noticable overhead here
    // when we get a native implementation we can adjust the code
    tokenizer.tokenize(script, function(token_type, token)
    {
      markup += onjstokenmarkup(token_type, token, online);
    }, "html");
    return markup;
  };

}).apply(window.templates || (window.templates = {}));
