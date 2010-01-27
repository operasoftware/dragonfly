// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["http-logger"] || (window.message_maps["http-logger"] = {});

window.message_maps["http-logger"]["2.0"] = {
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
}
