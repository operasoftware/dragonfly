// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["exec"] || (window.message_maps["exec"] = {});

window.message_maps["exec"]["2.0"] = {
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
}
