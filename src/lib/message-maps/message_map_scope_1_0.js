// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["scope"] || (window.message_maps["scope"] = {});

window.message_maps["scope"]["1.0"] = {
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
}
