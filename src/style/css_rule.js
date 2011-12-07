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

  var index_map = cls.Stylesheets.get_instance().get_css_index_map();
  var len = rule.indexList ? rule.indexList.length : 0;
  for (var i = 0; i < len; i++)
  {
    this.declarations.push({
      property: index_map[rule.indexList[i]],
      value: rule.valueList[i],
      priority: rule.priorityList[i],
      is_applied: Boolean(rule.statusList[i]), // TODO: Could be inverted and renamed to overwritten
      is_disabled: false
    });
  }
};

