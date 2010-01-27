// created with hob 

window.message_maps || (window.message_maps = {});
window.message_maps["ecmascript-logger"] || (window.message_maps["ecmascript-logger"] = {});

window.message_maps["ecmascript-logger"]["2.0"] = {
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
}
