StyleSheetList.prototype.getDeclaration = function(selector)
{
  var sheet = null, i = 0, j = 0, rules = null, rule = null;
  for ( ; sheet = this[i]; i++)
  {
    rules = sheet.cssRules;
    // does not take into account import rules
    for (j = 0; (rule = rules[j]) && !(rule.type == 1 && rule.selectorText == selector); j++);
    if (rule)
    {
      return rule.style;
    }
  }
  return null;
};

StyleSheetList.prototype.getPropertyValue = function(selector, property)
{
  var style = this.getDeclaration(selector);
  return style && style.getPropertyValue(property) || '';
};

if (!(function(){}).bind)
{
  Function.prototype.bind = function (context)
  {
    var method = this, args = Array.prototype.slice.call(arguments, 1);
    return function()
    {
      return method.apply(context, args.concat(Array.prototype.slice.call(arguments)));
    }
  };
};
