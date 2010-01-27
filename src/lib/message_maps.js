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

window.message_maps || (window.message_maps = {});
