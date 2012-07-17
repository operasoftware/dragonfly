(function()
{
  // ML_ prefixes to avoid name clashes with other highlighters
  const
  CSS_AT_RULE                 = cls.CSSTokenizer.types.AT_RULE,
  CSS_SELECTOR                = cls.CSSTokenizer.types.SELECTOR,
  CSS_WHITESPACE              = cls.CSSTokenizer.types.WHITESPACE,
  CSS_PROPERTY                = cls.CSSTokenizer.types.PROPERTY,
  CSS_PROPERTY_SEPARATOR      = cls.CSSTokenizer.types.PROPERTY_SEPARATOR,
  CSS_PROPERTY_VALUE          = cls.CSSTokenizer.types.PROPERTY_VALUE,
  CSS_DECLARATION_TERMINATOR  = cls.CSSTokenizer.types.DECLARATION_TERMINATOR,
  CSS_DECLARATION_BLOCK_START = cls.CSSTokenizer.types.DECLARATION_BLOCK_START,
  CSS_DECLARATION_BLOCK_END   = cls.CSSTokenizer.types.DECLARATION_BLOCK_END,
  CSS_EOL_DATA                = cls.CSSTokenizer.types.EOL_DATA,
  CSS_COMMENT                 = cls.CSSTokenizer.types.COMMENT,
  CSS_EOF                     = cls.CSSTokenizer.types.EOF;

  var css_classes = [];

  css_classes[CSS_AT_RULE] = "css-at-rule";
  css_classes[CSS_SELECTOR] = "css-selector";
  css_classes[CSS_PROPERTY] = "css-property";
  css_classes[CSS_PROPERTY_SEPARATOR] = "css-property-separator";
  css_classes[CSS_PROPERTY_VALUE] = "css-property-value";
  css_classes[CSS_DECLARATION_BLOCK_START] = "css-declaration";
  css_classes[CSS_DECLARATION_BLOCK_END] = "css-declaration";
  css_classes[CSS_DECLARATION_TERMINATOR] = "declaration-terminator";
  css_classes[CSS_COMMENT] = "comment";

  const _escapes_re = /\\[0-9a-f]{1,6}/i;

  var normalize_token = function(token)
  {
    // check dom.js and helpers.js for trim.
    // There are some inherent limitations in fromCharCode wrt
    // multibyte sequences, but this should work for all CSS keywords.
    return token.replace(_escapes_re, function(s,p1,p2){
      return String.fromCharCode(parseInt(p1,16))
    });
  }

  // root handler, declaration handler

  var highlight_token = function(context, token_type, token)
  {
    if (!token) return;
    if (context.onnewline && (token_type == CSS_EOL_DATA))
    {
      context.onnewline();
    }

    switch (token_type)
    {
      case CSS_AT_RULE:
      case CSS_PROPERTY:
      case CSS_PROPERTY_VALUE:
      case CSS_SELECTOR:
      case CSS_COMMENT:
        context.template.push(context.text)
        context.text ="";
        context.template.push(["span",token,"class",css_classes[token_type]]);
        break;
      default:
        context.text += token;
        break;
    }
    return;
  }

  this.highlight_css = function(stylesheet, onnewline)
  {
    var css_tokenizer = new cls.CSSTokenizer();
    var context =
    {
      template: ["pre"],
      text: "",
      onnewline: onnewline,
      tag_template: null,
      self: this
    };

    // the js implementation of bind causes a noticable overhead here
    // when we get a native implementation we can adjust the code
    css_tokenizer.tokenize(stylesheet, function(token_type, token)
    {
        highlight_token(context, token_type, token);
    });


    if (context.text)
    {
      context.template.push(context.text);
    }

    return context.template;
  };

}).apply(window.templates || (window.templates = {}));

