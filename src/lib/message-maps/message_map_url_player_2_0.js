// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["url-player"] || (window.message_maps["url-player"] = {});

window.message_maps["url-player"]["2.0"] = {
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
}
