// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["ecmascript-debugger"] || (window.message_maps["ecmascript-debugger"] = {});

window.message_maps["ecmascript-debugger"]["6.0"] = {
  1: {
    "name": "ListRuntimes",
    // command message
    1: [
      {
        "name": "runtimeList",
        "q": "repeated",
      },
      {
        "name": "allRuntimes",
        "q": "optional",
      },
    ],
    // response message
    2: [
      {
        "name": "runtimeList",
        "q": "repeated",
        "message": [
          {
            "name": "runtimeID",
            "q": "required",
          },
          {
            "name": "htmlFramePath",
            "q": "required",
          },
          {
            "name": "windowID",
            "q": "required",
          },
          {
            "name": "objectID",
            "q": "required",
          },
          {
            "name": "uri",
            "q": "required",
          },
        ],
      },
    ],
  },
  2: {
    "name": "ContinueThread",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
      {
        "name": "mode",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  3: {
    "name": "Eval",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
      {
        "name": "frameIndex",
        "q": "required",
      },
      {
        "name": "scriptData",
        "q": "required",
      },
      {
        "name": "variableList",
        "q": "repeated",
        "message": [
          {
            "name": "name",
            "q": "required",
          },
          {
            "name": "objectID",
            "q": "required",
          },
        ],
      },
    ],
    // response message
    2: [
      {
        "name": "status",
        "q": "required",
      },
      {
        "name": "type",
        "q": "required",
      },
      {
        "name": "value",
        "q": "optional",
      },
      {
        "name": "objectValue",
        "q": "optional",
        "message": [
          {
            "name": "objectID",
            "q": "required",
          },
          {
            "name": "isCallable",
            "q": "required",
          },
          {
            "name": "type",
            "q": "required",
          },
          {
            "name": "prototypeID",
            "q": "optional",
          },
          {
            "name": "className",
            "q": "optional",
          },
          {
            "name": "functionName",
            "q": "optional",
          },
        ],
      },
    ],
  },
  4: {
    "name": "ExamineObjects",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "objectList",
        "q": "repeated",
      },
      {
        "name": "examinePrototypes",
        "q": "optional",
      },
      {
        "name": "skipNonenumerables",
        "q": "optional",
      },
      {
        "name": "filterProperties",
        "q": "optional",
      },
    ],
    // response message
    2: [
      {
        "name": "objectChainList",
        "q": "repeated",
        "message": [
          {
            "name": "objectList",
            "q": "repeated",
            "message": [
              {
                "name": "value",
                "q": "required",
                "message": [
                  {
                    "name": "objectID",
                    "q": "required",
                  },
                  {
                    "name": "isCallable",
                    "q": "required",
                  },
                  {
                    "name": "type",
                    "q": "required",
                  },
                  {
                    "name": "prototypeID",
                    "q": "optional",
                  },
                  {
                    "name": "className",
                    "q": "optional",
                  },
                  {
                    "name": "functionName",
                    "q": "optional",
                  },
                ],
              },
              {
                "name": "propertyList",
                "q": "repeated",
                "message": [
                  {
                    "name": "name",
                    "q": "required",
                  },
                  {
                    "name": "type",
                    "q": "required",
                  },
                  {
                    "name": "value",
                    "q": "optional",
                  },
                  {
                    "name": "objectValue",
                    "q": "optional",
                    "message": [
                      {
                        "name": "objectID",
                        "q": "required",
                      },
                      {
                        "name": "isCallable",
                        "q": "required",
                      },
                      {
                        "name": "type",
                        "q": "required",
                      },
                      {
                        "name": "prototypeID",
                        "q": "optional",
                      },
                      {
                        "name": "className",
                        "q": "optional",
                      },
                      {
                        "name": "functionName",
                        "q": "optional",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  5: {
    "name": "SpotlightObject",
    // command message
    1: [
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "scrollIntoView",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  6: {
    "name": "AddBreakpoint",
    // command message
    1: [
      {
        "name": "breakpointID",
        "q": "required",
      },
      {
        "name": "scriptID",
        "q": "required",
      },
      {
        "name": "lineNumber",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  7: {
    "name": "RemoveBreakpoint",
    // command message
    1: [
      {
        "name": "breakpointID",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  8: {
    "name": "AddEventHandler",
    // command message
    1: [
      {
        "name": "handlerID",
        "q": "required",
      },
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "namespace",
        "q": "required",
      },
      {
        "name": "eventType",
        "q": "required",
      },
      {
        "name": "preventDefaultHandler",
        "q": "required",
      },
      {
        "name": "stopPropagation",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  9: {
    "name": "RemoveEventHandler",
    // command message
    1: [
      {
        "name": "handlerID",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  10: {
    "name": "SetConfiguration",
    // command message
    1: [
      {
        "name": "stopAtScript",
        "q": "optional",
      },
      {
        "name": "stopAtException",
        "q": "optional",
      },
      {
        "name": "stopAtError",
        "q": "optional",
      },
      {
        "name": "stopAtAbort",
        "q": "optional",
      },
      {
        "name": "stopAtGc",
        "q": "optional",
      },
      {
        "name": "stopAtDebuggerStatement",
        "q": "optional",
      },
    ],
    // response message
    2: [
    ],
  },
  11: {
    "name": "GetBacktrace",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
      {
        "name": "maxFrames",
        "q": "optional",
      },
    ],
    // response message
    2: [
      {
        "name": "frameList",
        "q": "repeated",
        "message": [
          {
            "name": "functionID",
            "q": "required",
          },
          {
            "name": "argumentObject",
            "q": "required",
          },
          {
            "name": "variableObject",
            "q": "required",
          },
          {
            "name": "thisObject",
            "q": "required",
          },
          {
            "name": "objectValue",
            "q": "optional",
            "message": [
              {
                "name": "objectID",
                "q": "required",
              },
              {
                "name": "isCallable",
                "q": "required",
              },
              {
                "name": "type",
                "q": "required",
              },
              {
                "name": "prototypeID",
                "q": "optional",
              },
              {
                "name": "className",
                "q": "optional",
              },
              {
                "name": "functionName",
                "q": "optional",
              },
            ],
          },
          {
            "name": "scriptID",
            "q": "optional",
          },
          {
            "name": "lineNumber",
            "q": "optional",
          },
        ],
      },
    ],
  },
  12: {
    "name": "Break",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
    ],
    // response message
    2: [
    ],
  },
  13: {
    "name": "InspectDom",
    // command message
    1: [
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "traversal",
        "q": "required",
      },
    ],
    // response message
    2: [
      {
        "name": "nodeList",
        "q": "repeated",
        "message": [
          {
            "name": "objectID",
            "q": "required",
          },
          {
            "name": "type",
            "q": "required",
          },
          {
            "name": "name",
            "q": "required",
          },
          {
            "name": "depth",
            "q": "required",
          },
          {
            "name": "namespacePrefix",
            "q": "optional",
          },
          {
            "name": "attributeList",
            "q": "repeated",
            "message": [
              {
                "name": "namePrefix",
                "q": "required",
              },
              {
                "name": "name",
                "q": "required",
              },
              {
                "name": "value",
                "q": "required",
              },
            ],
          },
          {
            "name": "childrenLength",
            "q": "optional",
          },
          {
            "name": "value",
            "q": "optional",
          },
          {
            "name": "publicID",
            "q": "optional",
          },
          {
            "name": "systemID",
            "q": "optional",
          },
        ],
      },
    ],
  },
  22: {
    "name": "CssGetIndexMap",
    // command message
    1: [
    ],
    // response message
    2: [
      {
        "name": "nameList",
        "q": "repeated",
      },
    ],
  },
  23: {
    "name": "CssGetAllStylesheets",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
    ],
    // response message
    2: [
      {
        "name": "stylesheetList",
        "q": "repeated",
        "message": [
          {
            "name": "objectID",
            "q": "required",
          },
          {
            "name": "isDisabled",
            "q": "required",
          },
          {
            "name": "href",
            "q": "required",
          },
          {
            "name": "title",
            "q": "required",
          },
          {
            "name": "type",
            "q": "required",
          },
          {
            "name": "mediaList",
            "q": "repeated",
          },
          {
            "name": "ownerNodeID",
            "q": "optional",
          },
          {
            "name": "ownerRuleID",
            "q": "optional",
          },
          {
            "name": "parentStylesheetID",
            "q": "optional",
          },
        ],
      },
    ],
  },
  24: {
    "name": "CssGetStylesheet",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "stylesheetID",
        "q": "required",
      },
    ],
    // response message
    2: [
      {
        "name": "ruleList",
        "q": "repeated",
        "message": [
          {
            "name": "type",
            "q": "required",
          },
          {
            "name": "stylesheetID",
            "q": "required",
          },
          {
            "name": "ruleID",
            "q": "required",
          },
          {
            "name": "indexList",
            "q": "repeated",
          },
          {
            "name": "valueList",
            "q": "repeated",
          },
          {
            "name": "priorityList",
            "q": "repeated",
          },
          {
            "name": "selectorList",
            "q": "repeated",
          },
          {
            "name": "specificityList",
            "q": "repeated",
          },
          {
            "name": "mediaList",
            "q": "repeated",
          },
          {
            "name": "ruleList",
            "q": "repeated",
            "message": "self" 
          },
          {
            "name": "href",
            "q": "optional",
          },
          {
            "name": "importStylesheetID",
            "q": "optional",
          },
          {
            "name": "pseudoClass",
            "q": "optional",
          },
          {
            "name": "charset",
            "q": "optional",
          },
        ],
      },
    ],
  },
  25: {
    "name": "CssGetStyleDeclarations",
    // command message
    1: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "objectID",
        "q": "required",
      },
    ],
    // response message
    2: [
      {
        "name": "computedStyleList",
        "q": "repeated",
      },
      {
        "name": "nodeStyleList",
        "q": "repeated",
        "message": [
          {
            "name": "objectID",
            "q": "required",
          },
          {
            "name": "elementName",
            "q": "required",
          },
          {
            "name": "styleList",
            "q": "repeated",
            "message": [
              {
                "name": "origin",
                "q": "required",
              },
              {
                "name": "indexList",
                "q": "repeated",
              },
              {
                "name": "valueList",
                "q": "repeated",
              },
              {
                "name": "priorityList",
                "q": "repeated",
              },
              {
                "name": "statusList",
                "q": "repeated",
              },
              {
                "name": "selector",
                "q": "optional",
              },
              {
                "name": "specificity",
                "q": "optional",
              },
              {
                "name": "stylesheetID",
                "q": "optional",
              },
              {
                "name": "ruleID",
                "q": "optional",
              },
              {
                "name": "ruleType",
                "q": "optional",
              },
            ],
          },
        ],
      },
    ],
  },
  26: {
    "name": "GetSelectedObject",
    // command message
    1: [
    ],
    // response message
    2: [
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "windowID",
        "q": "required",
      },
      {
        "name": "runtimeID",
        "q": "optional",
      },
    ],
  },
  27: {
    "name": "SpotlightObjects",
    // command message
    1: [
      {
        "name": "spotlightObjectList",
        "q": "repeated",
        "message": [
          {
            "name": "objectID",
            "q": "required",
          },
          {
            "name": "scrollIntoView",
            "q": "required",
          },
          {
            "name": "boxList",
            "q": "repeated",
            "message": [
              {
                "name": "boxType",
                "q": "required",
              },
              {
                "name": "fillColor",
                "q": "optional",
              },
              {
                "name": "frameColor",
                "q": "optional",
              },
              {
                "name": "gridColor",
                "q": "optional",
              },
            ],
          },
        ],
      },
    ],
    // response message
    2: [
    ],
  },
  29: {
    "name": "ReleaseObjects",
    // command message
    1: [
    ],
    // response message
    2: [
    ],
  },
  30: {
    "name": "SetPropertyFilter",
    // command message
    1: [
      {
        "name": "propertyFilter",
        "q": "required",
        "message": [
          {
            "name": "classMaskList",
            "q": "repeated",
            "message": [
              {
                "name": "className",
                "q": "required",
              },
              {
                "name": "propertyMaskList",
                "q": "repeated",
                "message": [
                  {
                    "name": "name",
                    "q": "required",
                  },
                  {
                    "name": "type",
                    "q": "optional",
                  },
                  {
                    "name": "boolean",
                    "q": "optional",
                  },
                  {
                    "name": "number",
                    "q": "optional",
                  },
                  {
                    "name": "string",
                    "q": "optional",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    // response message
    2: [
    ],
  },
  38: {
    "name": "AddEventBreakpoint",
    // command message
    1: [
      {
        "name": "breakpointID",
        "q": "required",
      },
      {
        "name": "eventType",
        "q": "required",
      },
      {
        "name": "windowID",
        "q": "optional",
      },
    ],
    // response message
    2: [
    ],
  },
  14: {
    "name": "OnRuntimeStarted",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "htmlFramePath",
        "q": "required",
      },
      {
        "name": "windowID",
        "q": "required",
      },
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "uri",
        "q": "required",
      },
    ],
  },
  15: {
    "name": "OnRuntimeStopped",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
    ],
  },
  16: {
    "name": "OnNewScript",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "scriptID",
        "q": "required",
      },
      {
        "name": "scriptType",
        "q": "required",
      },
      {
        "name": "scriptData",
        "q": "required",
      },
      {
        "name": "uri",
        "q": "optional",
      },
    ],
  },
  17: {
    "name": "OnThreadStarted",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
      {
        "name": "parentThreadID",
        "q": "required",
      },
      {
        "name": "threadType",
        "q": "required",
      },
      {
        "name": "eventNamespace",
        "q": "optional",
      },
      {
        "name": "eventType",
        "q": "optional",
      },
    ],
  },
  18: {
    "name": "OnThreadFinished",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
      {
        "name": "status",
        "q": "required",
      },
    ],
  },
  19: {
    "name": "OnThreadStoppedAt",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "threadID",
        "q": "required",
      },
      {
        "name": "scriptID",
        "q": "required",
      },
      {
        "name": "lineNumber",
        "q": "required",
      },
      {
        "name": "stoppedReason",
        "q": "required",
      },
      {
        "name": "breakpointID",
        "q": "optional",
      },
    ],
  },
  20: {
    "name": "OnHandleEvent",
    // event message
    3: [
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "handlerID",
        "q": "required",
      },
      {
        "name": "eventType",
        "q": "required",
      },
    ],
  },
  21: {
    "name": "OnObjectSelected",
    // event message
    3: [
      {
        "name": "objectID",
        "q": "required",
      },
      {
        "name": "windowID",
        "q": "required",
      },
      {
        "name": "runtimeID",
        "q": "optional",
      },
    ],
  },
  28: {
    "name": "OnParseError",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "scriptID",
        "q": "required",
      },
      {
        "name": "lineNumber",
        "q": "required",
      },
      {
        "name": "offset",
        "q": "required",
      },
      {
        "name": "context",
        "q": "required",
      },
      {
        "name": "description",
        "q": "required",
      },
    ],
  },
  31: {
    "name": "OnReadyStateChanged",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "state",
        "q": "required",
      },
    ],
  },
  32: {
    "name": "OnConsoleLog",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "type",
        "q": "required",
      },
      {
        "name": "valueList",
        "q": "repeated",
        "message": [
          {
            "name": "value",
            "q": "optional",
          },
          {
            "name": "objectValue",
            "q": "optional",
            "message": [
              {
                "name": "objectID",
                "q": "required",
              },
              {
                "name": "isCallable",
                "q": "required",
              },
              {
                "name": "type",
                "q": "required",
              },
              {
                "name": "prototypeID",
                "q": "optional",
              },
              {
                "name": "className",
                "q": "optional",
              },
              {
                "name": "functionName",
                "q": "optional",
              },
            ],
          },
        ],
      },
      {
        "name": "position",
        "q": "optional",
        "message": [
          {
            "name": "scriptID",
            "q": "required",
          },
          {
            "name": "lineNumber",
            "q": "required",
          },
        ],
      },
    ],
  },
  33: {
    "name": "OnConsoleTime",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "title",
        "q": "required",
      },
    ],
  },
  34: {
    "name": "OnConsoleTimeEnd",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "title",
        "q": "required",
      },
      {
        "name": "elapsed",
        "q": "required",
      },
    ],
  },
  35: {
    "name": "OnConsoleTrace",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
      {
        "name": "frameList",
        "q": "repeated",
        "message": [
          {
            "name": "functionID",
            "q": "required",
          },
          {
            "name": "argumentObject",
            "q": "required",
          },
          {
            "name": "variableObject",
            "q": "required",
          },
          {
            "name": "thisObject",
            "q": "required",
          },
          {
            "name": "objectValue",
            "q": "optional",
            "message": [
              {
                "name": "objectID",
                "q": "required",
              },
              {
                "name": "isCallable",
                "q": "required",
              },
              {
                "name": "type",
                "q": "required",
              },
              {
                "name": "prototypeID",
                "q": "optional",
              },
              {
                "name": "className",
                "q": "optional",
              },
              {
                "name": "functionName",
                "q": "optional",
              },
            ],
          },
          {
            "name": "scriptID",
            "q": "optional",
          },
          {
            "name": "lineNumber",
            "q": "optional",
          },
        ],
      },
    ],
  },
  36: {
    "name": "OnConsoleProfile",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
    ],
  },
  37: {
    "name": "OnConsoleProfileEnd",
    // event message
    3: [
      {
        "name": "runtimeID",
        "q": "required",
      },
    ],
  },
}
