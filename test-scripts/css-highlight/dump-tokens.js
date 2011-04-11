(function()
{
  var classes = {}
  const EOL_DATA = cls.CSSTokenizer.types.EOL_DATA;

  var tokenizer = new cls.CSSTokenizer();
  onCSStoken = function(context, token_type, token)
  {
    var spacer = " "
    if (token)
    {
      output += token;
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
  
  this.highlight_css = function(script, onnewline, c)
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
      onCSStoken(context, token_type, token);
    });

    if (context.text)
    {
      context.template.push(context.text);
    }
    
    return context.template;
  };

}).apply(window.templates || (window.templates = {}));

