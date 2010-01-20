// created with hob 

status_map = {
    0: "OK",
    1: "Conflict",
    2: "Unsupported Type",
    3: "Bad Request",
    4: "Internal Error",
    5: "Command Not Found",
    6: "Service Not Found",
    7: "Out Of Memory",
    8: "Service Not Enabled",
    9: "Service Already Enabled",
    }

format_type_map = {
    0: "protocol-buffer",
    1: "json",
    2: "xml"
    }

message_type_map = {
    1: "command", 
    2: "response", 
    3: "event", 
    4: "error"
    }

package_map = {
  "com.opera.stp": {
    "Error":
    [
            {
                "name": "description",
                "q": "optional",
            },
            {
                "name": "line",
                "q": "optional",
            },
            {
                "name": "column",
                "q": "optional",
            },
            {
                "name": "offset",
                "q": "optional",
            },
        ],

  },
}

command_map = {
    "console-logger": {
        1: {
            "name": "OnConsoleMessage",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
                {
                    "name": "time",
                    "q": "required",
                },
                {
                    "name": "description",
                    "q": "required",
                },
                {
                    "name": "uri",
                    "q": "optional",
                },
                {
                    "name": "context",
                    "q": "optional",
                },
                {
                    "name": "source",
                    "q": "optional",
                },
                {
                    "name": "severity",
                    "q": "optional",
                },
            ],

        },
    },
    "exec": {
        1: {
            "name": "Exec",
            // command message
            1: [
                {
                    "name": "actionList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "name",
                            "q": "required",
                        },
                        {
                            "name": "value",
                            "q": "optional",
                        },
                        {
                            "name": "windowID",
                            "q": "optional",
                        },
                    ],

                },
            ],

            // response message
            2: [
            ],

        },
        2: {
            "name": "GetActionInfoList",
            // command message
            1: [
            ],

            // response message
            2: [
                {
                    "name": "actionInfoList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "name",
                            "q": "required",
                        },
                    ],

                },
            ],

        },
        3: {
            "name": "SetupScreenWatcher",
            // command message
            1: [
                {
                    "name": "timeOut",
                    "q": "required",
                },
                {
                    "name": "area",
                    "q": "required",
                    "message": [
                        {
                            "name": "x",
                            "q": "required",
                        },
                        {
                            "name": "y",
                            "q": "required",
                        },
                        {
                            "name": "w",
                            "q": "required",
                        },
                        {
                            "name": "h",
                            "q": "required",
                        },
                    ],

                },
                {
                    "name": "md5List",
                    "q": "repeated",
                },
                {
                    "name": "windowID",
                    "q": "optional",
                },
                {
                    "name": "colorSpecList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "id",
                            "q": "required",
                        },
                        {
                            "name": "redLow",
                            "q": "optional",
                        },
                        {
                            "name": "redHigh",
                            "q": "optional",
                        },
                        {
                            "name": "greenLow",
                            "q": "optional",
                        },
                        {
                            "name": "greenHigh",
                            "q": "optional",
                        },
                        {
                            "name": "blueLow",
                            "q": "optional",
                        },
                        {
                            "name": "blueHigh",
                            "q": "optional",
                        },
                    ],

                },
                {
                    "name": "includeImage",
                    "q": "optional",
                },
            ],

            // response message
            2: [
                {
                    "name": "windowID",
                    "q": "required",
                },
                {
                    "name": "md5",
                    "q": "required",
                },
                {
                    "name": "png",
                    "q": "optional",
                },
                {
                    "name": "colorMatchList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "id",
                            "q": "required",
                        },
                        {
                            "name": "count",
                            "q": "required",
                        },
                    ],

                },
            ],

        },
        5: {
            "name": "SendMouseAction",
            // command message
            1: [
                {
                    "name": "windowID",
                    "q": "required",
                },
                {
                    "name": "x",
                    "q": "required",
                },
                {
                    "name": "y",
                    "q": "required",
                },
                {
                    "name": "buttonAction",
                    "q": "required",
                },
            ],

            // response message
            2: [
            ],

        },
    },
    "window-manager": {
        1: {
            "name": "GetActiveWindow",
            // command message
            1: [
            ],

            // response message
            2: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
        2: {
            "name": "ListWindows",
            // command message
            1: [
            ],

            // response message
            2: [
                {
                    "name": "windowList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "windowID",
                            "q": "required",
                        },
                        {
                            "name": "title",
                            "q": "required",
                        },
                        {
                            "name": "windowType",
                            "q": "required",
                        },
                        {
                            "name": "openerID",
                            "q": "required",
                        },
                    ],

                },
            ],

        },
        3: {
            "name": "ModifyFilter",
            // command message
            1: [
                {
                    "name": "clearFilter",
                    "q": "required",
                },
                {
                    "name": "includeIDList",
                    "q": "repeated",
                },
                {
                    "name": "includePatternList",
                    "q": "repeated",
                },
                {
                    "name": "excludeIDList",
                    "q": "repeated",
                },
                {
                    "name": "excludePatternList",
                    "q": "repeated",
                },
            ],

            // response message
            2: [
            ],

        },
        4: {
            "name": "OnWindowUpdated",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
                {
                    "name": "title",
                    "q": "required",
                },
                {
                    "name": "windowType",
                    "q": "required",
                },
                {
                    "name": "openerID",
                    "q": "required",
                },
            ],

        },
        5: {
            "name": "OnWindowClosed",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
        6: {
            "name": "OnWindowActivated",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
        7: {
            "name": "OnWindowLoaded",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
    },
    "ecmascript-debugger": {
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
                            "name": "isFunction",
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
                            "name": "name",
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
            ],

            // response message
            2: [
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
                                    "name": "isFunction",
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
                                    "name": "name",
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
                                            "name": "isFunction",
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
                                            "name": "name",
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
                    "name": "type",
                    "q": "required",
                },
                {
                    "name": "scriptID",
                    "q": "optional",
                },
                {
                    "name": "lineNumber",
                    "q": "optional",
                },
                {
                    "name": "eventType",
                    "q": "optional",
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
                                    "name": "isFunction",
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
                                    "name": "name",
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
    },
    "http-logger": {
        1: {
            "name": "OnRequest",
            // event message
            3: [
                {
                    "name": "requestID",
                    "q": "required",
                },
                {
                    "name": "windowID",
                    "q": "required",
                },
                {
                    "name": "time",
                    "q": "required",
                },
                {
                    "name": "header",
                    "q": "required",
                },
            ],

        },
        2: {
            "name": "OnResponse",
            // event message
            3: [
                {
                    "name": "requestID",
                    "q": "required",
                },
                {
                    "name": "windowID",
                    "q": "required",
                },
                {
                    "name": "time",
                    "q": "required",
                },
                {
                    "name": "header",
                    "q": "required",
                },
            ],

        },
    },
    "scope": {
        3: {
            "name": "Connect",
            // command message
            1: [
                {
                    "name": "format",
                    "q": "required",
                },
            ],

            // response message
            2: [
            ],

        },
        4: {
            "name": "Disconnect",
            // command message
            1: [
            ],

            // response message
            2: [
            ],

        },
        5: {
            "name": "Enable",
            // command message
            1: [
                {
                    "name": "name",
                    "q": "required",
                },
            ],

            // response message
            2: [
                {
                    "name": "name",
                    "q": "required",
                },
            ],

        },
        6: {
            "name": "Disable",
            // command message
            1: [
                {
                    "name": "name",
                    "q": "required",
                },
            ],

            // response message
            2: [
                {
                    "name": "name",
                    "q": "required",
                },
            ],

        },
        7: {
            "name": "Info",
            // command message
            1: [
                {
                    "name": "name",
                    "q": "required",
                },
            ],

            // response message
            2: [
                {
                    "name": "commandList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "name",
                            "q": "required",
                        },
                        {
                            "name": "number",
                            "q": "required",
                        },
                        {
                            "name": "messageID",
                            "q": "required",
                        },
                        {
                            "name": "responseID",
                            "q": "required",
                        },
                    ],

                },
                {
                    "name": "eventList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "name",
                            "q": "required",
                        },
                        {
                            "name": "number",
                            "q": "required",
                        },
                        {
                            "name": "messageID",
                            "q": "required",
                        },
                    ],

                },
            ],

        },
        8: {
            "name": "Quit",
            // command message
            1: [
            ],

            // response message
            2: [
            ],

        },
        10: {
            "name": "HostInfo",
            // command message
            1: [
            ],

            // response message
            2: [
                {
                    "name": "stpVersion",
                    "q": "required",
                },
                {
                    "name": "coreVersion",
                    "q": "required",
                },
                {
                    "name": "platform",
                    "q": "required",
                },
                {
                    "name": "operatingSystem",
                    "q": "required",
                },
                {
                    "name": "userAgent",
                    "q": "required",
                },
                {
                    "name": "serviceList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "name",
                            "q": "required",
                        },
                        {
                            "name": "version",
                            "q": "required",
                        },
                    ],

                },
            ],

        },
        11: {
            "name": "MessageInfo",
            // command message
            1: [
                {
                    "name": "serviceName",
                    "q": "required",
                },
                {
                    "name": "idList",
                    "q": "repeated",
                },
                {
                    "name": "includeRelated",
                    "q": "optional",
                },
                {
                    "name": "includeAll",
                    "q": "optional",
                },
            ],

            // response message
            2: [
                {
                    "name": "messageList",
                    "q": "repeated",
                    "message": [
                        {
                            "name": "id",
                            "q": "required",
                        },
                        {
                            "name": "name",
                            "q": "required",
                        },
                        {
                            "name": "fieldList",
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
                                    "name": "number",
                                    "q": "required",
                                },
                                {
                                    "name": "quantifier",
                                    "q": "optional",
                                },
                                {
                                    "name": "messageID",
                                    "q": "optional",
                                },
                            ],

                        },
                        {
                            "name": "parentID",
                            "q": "optional",
                        },
                    ],

                },
            ],

        },
        0: {
            "name": "OnServices",
            // event message
            3: [
                {
                    "name": "serviceList",
                    "q": "repeated",
                },
            ],

        },
        1: {
            "name": "OnQuit",
            // event message
            3: [
            ],

        },
        2: {
            "name": "OnConnectionLost",
            // event message
            3: [
            ],

        },
        9: {
            "name": "OnError",
            // event message
            3: [
                {
                    "name": "description",
                    "q": "required",
                },
            ],

        },
    },
    "url-player": {
        1: {
            "name": "CreateWindows",
            // command message
            1: [
                {
                    "name": "windowCount",
                    "q": "required",
                },
            ],

            // response message
            2: [
                {
                    "name": "windowCount",
                    "q": "required",
                },
            ],

        },
        2: {
            "name": "LoadUrl",
            // command message
            1: [
                {
                    "name": "windowNumber",
                    "q": "required",
                },
                {
                    "name": "url",
                    "q": "required",
                },
            ],

            // response message
            2: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
        3: {
            "name": "OnUrlLoaded",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
        4: {
            "name": "OnConnectionFailed",
            // event message
            3: [
                {
                    "name": "windowID",
                    "q": "required",
                },
            ],

        },
    },
    "ecmascript-logger": {
        1: {
            "name": "Configure",
            // command message
            1: [
                {
                    "name": "reformat",
                    "q": "optional",
                },
            ],

            // response message
            2: [
            ],

        },
        2: {
            "name": "OnNewScript",
            // event message
            3: [
                {
                    "name": "context",
                    "q": "required",
                },
                {
                    "name": "url",
                    "q": "required",
                },
                {
                    "name": "source",
                    "q": "required",
                },
            ],

        },
    },
}
