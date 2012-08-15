// This test has dependencies. Example of running:
// sniper.html?testFile=stylesheets.js&testFile=element_style.js&testFile=css_rule.js&testFile=css_value_tokenizer.js&testFile=css_shorthand_resolver.js&testFile=css_shorthand_tests.js

addModule("CSS shorthands");

setServiceRequirements({
  "scope": "1.0-",
  "ecmascript-debugger": "6.9-",
  "window-manager": ""
});

var set_properties = function(props)
{
  for (var prop in props)
  {
    var value = props[prop];
    var priority = "";
    if (value.indexOf("!important") != -1)
    {
      value = value.replace("!important", "");
      priority = "important";
    }
    evalBasic("document.body.style.setProperty('" +
                prop + "', '" +
                value.replace(/'/g, "\\'") +  "', '" +
                priority +
              "');");
  }
};

var remove_properties = function(props)
{
  props.forEach(function(prop) {
    evalBasic("document.body.style.removeProperty('" + prop + "')");
  });
};

var clear_properties = function()
{
  evalBasic("document.body.style.cssText = '';");
};

var fix_rule = function(rule)
{
  var new_rule = {declarations: []};
  for (var i = 0, len = rule.properties.length; i < len; i++)
  {
    new_rule.declarations.push(
      new CssDeclaration(
        rule.properties[i],
        rule.values[i],
        rule.priorities && rule.priorities[i]
      )
    );
  }
  return new_rule;
};

var assert_rule = function(expected)
{
  var css_decls = ecmascript_debugger.CssGetStyleDeclarations({
    runtimeID: window.rt_id,
    objectID: window.body_el_id
  });

  var rule = new CssRule(css_decls.nodeStyleList[0].styleList[0], window.css_index_map.nameList);
  CssShorthandResolver.get_instance().resolve(rule.declarations);

  rule.declarations.forEach(function(decl) {
    delete decl.shorthand_tokens;
  });

  assertEquals(JSON.stringify(rule.declarations), JSON.stringify(fix_rule(expected).declarations));
};

addTest("Resolving CSS shorthands", function () {
  // Override some things not needed for the tests
  cls.TagManager.get_instance = function() {};
  StylesheetTemplates = function() {};
  if (!(window.services && window.services["ecmascript-debugger"]))
  {
    window.services["ecmascript-debugger"] = {
      satisfies_version: function() { return true; }
    };
  }

  window.css_index_map = ecmascript_debugger.CssGetIndexMap();
  window.element_style = new cls.ElementStyle();

  const html = [
    "<!doctype html><title>shorthands</title><p>"
  ];

  openURLWithConfig(dataURL(html), loadURLUntilRuntimeLoaded, STOP_DISABLED);

  window.rt_id = getCurrentRuntimeID();
  window.body_el_id = evalObjectID("document.body");
  set_properties(
    {
      "margin": "1px",
    }
  );

  assert_rule(
    {
      properties: [
        "margin",
      ],
      values: [
        "1px",
      ]
    }
  );

  set_properties(
    {
      "margin-right": "2px",
    }
  );

  assert_rule(
    {
      properties: [
        "margin",
      ],
      values: [
        "1px 2px 1px 1px",
      ]
    }
  );

  set_properties(
    {
      "margin-left": "2px",
    }
  );

  assert_rule(
    {
      properties: [
        "margin",
      ],
      values: [
        "1px 2px",
      ]
    }
  );

  clear_properties();

  set_properties(
    {
      "margin-top": "1px",
      "margin-bottom": "1px",
    }
  );

  assert_rule(
    {
      properties: [
        "margin-top",
        "margin-bottom",
      ],
      values: [
        "1px",
        "1px",
      ]
    }
  );

  clear_properties();

  set_properties(
    {
      "padding": "1px",
    }
  );

  assert_rule(
    {
      properties: [
        "padding",
      ],
      values: [
        "1px",
      ]
    }
  );

  set_properties(
    {
      "padding-right": "2px",
    }
  );

  assert_rule(
    {
      properties: [
        "padding",
      ],
      values: [
        "1px 2px 1px 1px",
      ]
    }
  );

  set_properties(
    {
      "padding-left": "2px",
    }
  );

  assert_rule(
    {
      properties: [
        "padding",
      ],
      values: [
        "1px 2px",
      ]
    }
  );

  clear_properties();

  set_properties(
    {
      "padding-top": "1px",
      "padding-bottom": "1px",
    }
  );

  assert_rule(
    {
      properties: [
        "padding-top",
        "padding-bottom",
      ],
      values: [
        "1px",
        "1px",
      ]
    }
  );

  clear_properties();

  set_properties(
    {
      "border": "1px solid rgb(255, 0, 0)",
      "border-top": "1px solid rgb(255, 0, 0)",
      "border-bottom-width": "1px",
    }
  );

  assert_rule(
    {
      properties: [
        "border",
      ],
      values: [
        "1px solid rgb(255, 0, 0)",
      ]
    }
  );

  set_properties(
    {
      "border-top-width": "2px",
    }
  );

  assert_rule(
    {
      properties: [
        "border-top",
        "border-left",
        "border-right",
        "border-bottom",
      ],
      values: [
        "2px solid rgb(255, 0, 0)",
        "1px solid rgb(255, 0, 0)",
        "1px solid rgb(255, 0, 0)",
        "1px solid rgb(255, 0, 0)",
      ]
    }
  );

  remove_properties(["border-left-style"]);

  assert_rule(
    {
      properties: [
        "border-left-color",
        "border-left-width",
        "border-top",
        "border-right",
        "border-bottom",
      ],
      values: [
        "rgb(255, 0, 0)",
        "1px",
        "2px solid rgb(255, 0, 0)",
        "1px solid rgb(255, 0, 0)",
        "1px solid rgb(255, 0, 0)",
      ]
    }
  );

  clear_properties();

  set_properties({"border-style": "solid"});

  assert_rule(
    {
      properties: [
        "border-top-style",
        "border-right-style",
        "border-bottom-style",
        "border-left-style",
      ],
      values: [
        "solid",
        "solid",
        "solid",
        "solid",
      ]
    }
  );

  clear_properties();

  set_properties({"list-style": "circle"});

  assert_rule(
    {
      properties: [
        "list-style",
      ],
      values: [
        "circle outside none",
      ]
    }
  );

  remove_properties(["list-style-type"]);

  assert_rule(
    {
      properties: [
        "list-style-position",
        "list-style-image",
      ],
      values: [
        "outside",
        "none",
      ]
    }
  );

  clear_properties();

  set_properties({"outline": "1px"});

  assert_rule(
    {
      properties: [
        "outline",
      ],
      values: [
        "1px none invert",
      ]
    }
  );

  remove_properties(["outline-width"]);

  assert_rule(
    {
      properties: [
        "outline-color",
        "outline-style",
      ],
      values: [
        "invert",
        "none",
      ]
    }
  );

  clear_properties();

  set_properties({"font": "16px/1 sans-serif"});

  assert_rule(
    {
      properties: [
        "font",
      ],
      values: [
        "16px/1 sans-serif",
      ]
    }
  );

  clear_properties();

  set_properties({"background": "rgb(255, 0, 0)"});

  assert_rule(
    {
      properties: [
        "background",
      ],
      values: [
        "rgb(255, 0, 0)",
      ]
    }
  );

  clear_properties();

  set_properties({"background": "none, rgb(255, 0, 0)"});

  assert_rule(
    {
      properties: [
        "background",
      ],
      values: [
        "none, rgb(255, 0, 0)",
      ]
    }
  );

  clear_properties();

  set_properties({
    "background-attachment": "scroll, scroll",
    "background-repeat": "repeat, repeat",
    "background-image": "url(\",\"), none",
    "background-position": "0% 0%, 0% 0%",
    "background-size": "auto, auto",
    "background-origin": "padding-box, padding-box",
    "background-clip": "border-box, border-box",
    "background-color": "rgb(255, 0, 0)",
  });

  assert_rule(
    {
      properties: [
        "background",
      ],
      values: [
        "url(\",\"), rgb(255, 0, 0)",
      ]
    }
  );

  clear_properties();

  set_properties({"-o-transition": "1s"});

  assert_rule(
    {
      properties: [
        "-o-transition",
      ],
      values: [
        "all 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0",
      ]
    }
  );

  clear_properties();

  set_properties({"-o-transition": "1s"});

  assert_rule(
    {
      properties: [
        "-o-transition",
      ],
      values: [
        "all 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0",
      ]
    }
  );

  clear_properties();

  set_properties({"-o-transition": "color 1s, opacity 2s"});

  assert_rule(
    {
      properties: [
        "-o-transition",
      ],
      values: [
        "color 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0, opacity 2s cubic-bezier(0.25, 0.1, 0.25, 1) 0",
      ]
    }
  );

  clear_properties();

  set_properties({"transition": "1s"});

  assert_rule(
    {
      properties: [
        "transition",
      ],
      values: [
        "all 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0",
      ]
    }
  );
  clear_properties();

  set_properties({"transition": "1s"});

  assert_rule(
    {
      properties: [
        "transition",
      ],
      values: [
        "all 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0",
      ]
    }
  );

  clear_properties();

  set_properties({"transition": "color 1s, opacity 2s"});

  assert_rule(
    {
      properties: [
        "transition",
      ],
      values: [
        "color 1s cubic-bezier(0.25, 0.1, 0.25, 1) 0, opacity 2s cubic-bezier(0.25, 0.1, 0.25, 1) 0",
      ]
    }
  );

  clear_properties();

  set_properties({"columns": "100px 3"});

  assert_rule(
    {
      properties: [
        "columns",
      ],
      values: [
        "100px 3",
      ]
    }
  );

  clear_properties();

  set_properties({"column-rule": "1px solid rgb(255, 0, 0)"});

  assert_rule(
    {
      properties: [
        "column-rule",
      ],
      values: [
        "1px solid rgb(255, 0, 0)",
      ]
    }
  );

  clear_properties();

  set_properties(
    {
      "margin": "1px",
      "margin-top": "1px !important",
    }
  );

  assert_rule(
    {
      properties: [
        "margin-right",
        "margin-bottom",
        "margin-left",
        "margin-top",
      ],
      values: [
        "1px",
        "1px",
        "1px",
        "1px",
      ],
      priorities: [
        false,
        false,
        false,
        true,
      ]
    }
  );

  set_properties(
    {
      "margin": "1px !important",
    }
  );

  assert_rule(
    {
      properties: [
        "margin",
      ],
      values: [
        "1px",
      ],
      priorities: [
        true,
      ]
    }
  );

  clear_properties();

  // One missing value in background-attachment has to be repeated
  set_properties(
    {
      "background": "-o-linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px), -o-linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px), -o-linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px)",
      "background-attachment": "fixed, scroll",
    }
  );

  assert_rule(
    {
      properties: [
        "background",
      ],
      values: [
        "-o-linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px) fixed, -o-linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px), -o-linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px) fixed transparent",
      ],
    }
  );

  clear_properties();

  // One missing value in background-attachment has to be repeated
  set_properties(
    {
      "background": "linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px), linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px), linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px)",
      "background-attachment": "fixed, scroll",
    }
  );

  assert_rule(
    {
      properties: [
        "background",
      ],
      values: [
        "linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px) fixed, linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px), linear-gradient(1deg, rgb(0, 0, 0) 1px, rgb(0, 0, 0) 1px) fixed transparent",
      ],
    }
  );

  clear_properties();

  set_properties(
    {
      "background": "url(\"data:image/png;1\")",
      "background-size": "1px",
    }
  );

  assert_rule(
    {
      properties: [
        "background",
      ],
      values: [
        "url(\"data:image/png;1\") 0% 0%/1px transparent",
      ],
    }
  );

  clear_properties();

  set_properties(
    {
      "overflow-x": "hidden",
      "overflow-y": "hidden",
    }
  );

  assert_rule(
    {
      properties: [
        "overflow",
      ],
      values: [
        "hidden",
      ],
    }
  );

  remove_properties(["overflow-x"]);

  assert_rule(
    {
      properties: [
        "overflow-y",
      ],
      values: [
        "hidden",
      ],
    }
  );

  clear_properties();

  set_properties(
    {
      "-o-animation": "1s, 2s",
    }
  );

  assert_rule(
    {
      properties: [
        "-o-animation",
      ],
      values: [
        "1s, 2s",
      ],
    }
  );

  set_properties(
    {
      "-o-animation": "1s, 2s",
    }
  );

  assert_rule(
    {
      properties: [
        "-o-animation",
      ],
      values: [
        "1s, 2s",
      ],
    }
  );

  set_properties(
    {
      "-o-animation": "0s 1s",
    }
  );

  assert_rule(
    {
      properties: [
        "-o-animation",
      ],
      values: [
        "0s 1s",
      ],
    }
  );

  set_properties(
    {
      "-o-animation": "none, none",
    }
  );

  assert_rule(
    {
      properties: [
        "-o-animation",
      ],
      values: [
        "none, none",
      ],
    }
  );

  clear_properties();

  set_properties(
    {
      "animation": "1s, 2s",
    }
  );

  assert_rule(
    {
      properties: [
        "animation",
      ],
      values: [
        "1s, 2s",
      ],
    }
  );

  set_properties(
    {
      "animation": "1s, 2s",
    }
  );

  assert_rule(
    {
      properties: [
        "animation",
      ],
      values: [
        "1s, 2s",
      ],
    }
  );

  set_properties(
    {
      "animation": "0s 1s",
    }
  );

  assert_rule(
    {
      properties: [
        "animation",
      ],
      values: [
        "0s 1s",
      ],
    }
  );

  set_properties(
    {
      "animation": "none, none",
    }
  );

  assert_rule(
    {
      properties: [
        "animation",
      ],
      values: [
        "none, none",
      ],
    }
  );
});

