(function()
{
  const
  UNKNOWN               = cls.MarkupTokenizer.types.UNKNOWN,
  TAG_OPEN              = cls.MarkupTokenizer.types.TAG_OPEN,
  TAG_CLOSE             = cls.MarkupTokenizer.types.TAG_CLOSE,
  TAG_NAME              = cls.MarkupTokenizer.types.TAG_NAME,
  TAG_WHITESPACE        = cls.MarkupTokenizer.types.TAG_WHITESPACE,
  ATTRIBUTE_NAME        = cls.MarkupTokenizer.types.ATTRIBUTE_NAME,
  ATTRIBUTE_ASSIGNMENT  = cls.MarkupTokenizer.types.ATTRIBUTE_ASSIGNMENT,
  ATTRIBUTE_VALUE       = cls.MarkupTokenizer.types.ATTRIBUTE_VALUE,
  COMMENT               = cls.MarkupTokenizer.types.COMMENT,
  DATA                  = cls.MarkupTokenizer.types.DATA,
  SCRIPT_DATA           = cls.MarkupTokenizer.types.SCRIPT_DATA,
  STYLE_DATA            = cls.MarkupTokenizer.types.STYLE_DATA,
  BOGUS_COMMENT         = cls.MarkupTokenizer.types.BOGUS_COMMENT,
  BOGUS_DATA            = cls.MarkupTokenizer.types.BOGUS_DATA,
  DOCTYPE               = cls.MarkupTokenizer.types.DOCTYPE,
  EOL_DATA              = cls.MarkupTokenizer.types.EOL_DATA,
  EOF                   = cls.MarkupTokenizer.types.EOF;
  
  var classes = {}
  
//  classes[UNKNOWN]= "";
  classes[TAG_OPEN] = "dom-element tag-delimeter";
//   classes[TAG_CLOSE] = "dom-element tag-delimeter";
//   classes[TAG_NAME] = "dom-element";
//  classes[TAG_WHITESPACE] = "";
  classes[ATTRIBUTE_NAME] = "dom-attribute";
//  classes[ATTRIBUTE_ASSIGNMENT] = "dom-attribute";
  classes[ATTRIBUTE_VALUE] = "dom-attribute-value";
  classes[COMMENT] = "comment";
//  classes[DATA] = "";
  classes[SCRIPT_DATA] = "";
  classes[STYLE_DATA] = "";
  classes[BOGUS_COMMENT] = "bogus-comment";
  classes[BOGUS_DATA] = "bogus-comment";
  classes[DOCTYPE] = "doctype";
//  classes[EOL_DATA] = "";
//  classes[EOF] = ""

  var tokenizer = new cls.MarkupTokenizer();
  
  onmarkuptoken = function(context, token_type, token)
  {
    var spacer = " "
    if (token)
    {
      if (token_type == EOL_DATA)
      {
        token = "(EOL)";
        spacer = "\n";
      }
      else
      {
        spacer = " ";
      }
    }
    context.template.push(["span", "[\""+token_type+"\",", ["span", "\""+token+"\"],", "class", "comment"], spacer ,"class", "dom-element"]);

  }
  
  this.highlight_markup = function(script, onnewline, c)
  {
    var context =
    {
      template: ["pre"],
      text: "",
      onnewline: onnewline,
      tag_template: null
    };
    // the js implementation of bind causes a noticable overhead here
    // when we get a native implementation we can adjust the code
    tokenizer.tokenize(script, function(token_type, token)
    {
      onmarkuptoken(context, token_type, token);
    });
    if (context.text)
    {
      context.template.push(context.text);
    }
    
    return context.template;
  };

}).apply(window.templates || (window.templates = {}));

