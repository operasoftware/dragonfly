// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["console-logger"] || (window.message_maps["console-logger"] = {});

window.message_maps["console-logger"]["2.0"] = {
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
}
