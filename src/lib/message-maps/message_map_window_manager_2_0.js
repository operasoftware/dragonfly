// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["window-manager"] || (window.message_maps["window-manager"] = {});

window.message_maps["window-manager"]["2.0"] = {
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
}
