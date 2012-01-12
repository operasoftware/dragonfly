"use strict";

/**
 * @constructor
 */
var CssRule = function(rule)
{
  this.declarations = [];
  this.origin = rule.origin;
  this.selector = rule.selector;
  this.specificity = rule.specificity;
  this.stylesheetID = rule.stylesheetID;
  this.ruleID = rule.ruleID;
  this.ruleType = rule.ruleType;
  this.lineNumber = rule.lineNumber;

  var index_map = cls.Stylesheets.get_css_index_map();
  var len = rule.indexList ? rule.indexList.length : 0;
  for (var i = 0; i < len; i++)
  {
    this.declarations.push(new CssDeclaration(
      index_map[rule.indexList[i]],
      rule.valueList[i],
      rule.priorityList[i],
      Boolean(rule.statusList[i]),
      false
    ));
  }
};

var CssDeclaration = function(property, value, priority, is_applied, is_disabled)
{
  this.property = property;
  this.value = value;
  this.priority = priority || 0;
  this.is_applied = is_applied || true; // TODO: Could be inverted and renamed to overwritten
  this.is_disabled = is_disabled || false;
};

