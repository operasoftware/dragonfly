(function()
{
  // ML_ prefixes to avoid name clashes with other highlighters
  const
  ML_UNKNOWN               = cls.MarkupTokenizer.types.UNKNOWN,
  ML_TAG_OPEN              = cls.MarkupTokenizer.types.TAG_OPEN,
  ML_TAG_CLOSE             = cls.MarkupTokenizer.types.TAG_CLOSE,
  ML_TAG_NAME              = cls.MarkupTokenizer.types.TAG_NAME,
  ML_TAG_WHITESPACE        = cls.MarkupTokenizer.types.TAG_WHITESPACE,
  ML_ATTRIBUTE_NAME        = cls.MarkupTokenizer.types.ATTRIBUTE_NAME,
  ML_ATTRIBUTE_ASSIGNMENT  = cls.MarkupTokenizer.types.ATTRIBUTE_ASSIGNMENT,
  ML_ATTRIBUTE_VALUE       = cls.MarkupTokenizer.types.ATTRIBUTE_VALUE,
  ML_COMMENT               = cls.MarkupTokenizer.types.COMMENT,
  ML_DATA                  = cls.MarkupTokenizer.types.DATA,
  ML_SCRIPT_DATA           = cls.MarkupTokenizer.types.SCRIPT_DATA,
  ML_STYLE_DATA            = cls.MarkupTokenizer.types.STYLE_DATA,
  ML_BOGUS_COMMENT         = cls.MarkupTokenizer.types.BOGUS_COMMENT,
  ML_BOGUS_DATA            = cls.MarkupTokenizer.types.BOGUS_DATA,
  ML_DOCTYPE               = cls.MarkupTokenizer.types.DOCTYPE,
  ML_EOL_DATA              = cls.MarkupTokenizer.types.EOL_DATA,
  ML_EOF                   = cls.MarkupTokenizer.types.EOF;

  var markup_classes = {}

  markup_classes[ML_TAG_OPEN] = "markup-tag";
  markup_classes[ML_ATTRIBUTE_NAME] = "markup-attribute";
  markup_classes[ML_ATTRIBUTE_VALUE] = "markup-attribute-value";
  markup_classes[ML_COMMENT] = "markup-comment";
  markup_classes[ML_SCRIPT_DATA] = "";
  markup_classes[ML_STYLE_DATA] = "";
  markup_classes[ML_BOGUS_COMMENT] = "markup-bogus-comment";
  markup_classes[ML_BOGUS_DATA] = "markup-bogus-comment";
  markup_classes[ML_DOCTYPE] = "markup-doctype";


  var root_markup_handler = function(context, token_type, token)
  {
    if (context.onnewline && (token_type == ML_EOL_DATA))
    {
      context.onnewline();
    }

    if (token_type == ML_COMMENT)
    {
       context.template.push(context.text);
       context.text = "";
       context.template.push( ["span", token, "class",markup_classes[ML_COMMENT]] );
       return;
    }

    if (token_type == ML_BOGUS_COMMENT)
    {
       context.template.push(context.text);
       context.text = "";
       context.template.push( ["span", token, "class",markup_classes[ML_BOGUS_COMMENT]] );
       return;
    }

    if (token_type == ML_TAG_OPEN)
    {
       context.template.push(context.text);
       context.text = token;
       context.tag_template = ["span"];
       next_markup_handler = element_markup_handler;
       return;
    }
    context.text += token;
    return;
  }

  var script_markup_handler = function(context, token_type, token)
  {

    if (  (token_type == ML_EOL_DATA)
        ||(token_type == ML_SCRIPT_DATA)
       )
    {
      context.text+=token;

      return;
    }
    var script_template = this.templates.highlight_js_source(context.text,context.onnewline,null,["span"]);
    script_template.push("class","js-inline-resource");
    context.template.push(script_template) //context.text);
    context.tag_template = ["span"];
    context.text = token;
    next_markup_handler = element_markup_handler;
    return;
  }

  var element_markup_handler = function(context, token_type, token)
  {
    if (context.onnewline && (token_type == ML_EOL_DATA))
    {
      context.onnewline();
    }

    if (token_type == ML_TAG_CLOSE)
    {
       context.text += token;
       context.tag_template.push( context.text, "class", markup_classes[ML_TAG_OPEN]);
       context.text = "";
       context.template.push(context.tag_template);
       context.tag_template = [];
       next_markup_handler = root_markup_handler;
       return;
    }

    if (token_type == ML_TAG_OPEN)
    {
       context.template.push(context.tag_template);
       context.tag_template = ["span"];
       context.text = token;
       return;
    }

    if (  (token_type == ML_ATTRIBUTE_NAME)
       || (token_type == ML_ATTRIBUTE_VALUE)
       )
    {
       context.tag_template.push(context.text);
       context.text = "";
       context.tag_template.push(["span", token, "class", markup_classes[token_type]]);
       return;
    }


    if (token_type == ML_EOF)
    {
       context.template.push(["span", context.text, "class", markup_classes[ML_TAG_OPEN]]);
       context.text = "";
       context_tag_template = null;
       next_markup_handler = root_markup_handler;
       return;
    }

    context.text += token;
    return;
  }

  var next_markup_handler = root_markup_handler;

  this.highlight_markup = function(script, onnewline)
  {
    var markup_tokenizer = new cls.MarkupTokenizer();
    next_markup_handler = root_markup_handler;
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
    markup_tokenizer.tokenize(script, function(token_type, token)
    {
        next_markup_handler(context, token_type, token);
    });


    if (context.text)
    {
      context.template.push(context.text);
    }

    return context.template;
  };

}).apply(window.templates || (window.templates = {}));

