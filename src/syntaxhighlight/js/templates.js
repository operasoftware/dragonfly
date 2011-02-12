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

  var onjstoken = function(context, token_type, token)
  {
    var class_name = "";
    switch (token_type)
    {
      case LINETERMINATOR:
      {
        if (context.online)
        {
          context.online();
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

  this.highlight_js_source = function(script, online, start_state, context)
  {
    var context =
    {
      template: context || [pre],
      text: "",
      online: online
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
