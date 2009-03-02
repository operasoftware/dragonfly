window.templates = window.templates || {}

window.templates.error_log_table = function(entries, allExpanded, expandedList, viewId)
{
    var rowClosure = function(e)
    {
        return window.templates.error_log_row(e, allExpanded, expandedList, viewId);
    }
    
    return ["table", [
        "tr", [
               
               ['th', " "],
               //['th', "TT"],
               ['th', "File"],
               ['th', "Line"],
               ['th', "Error"]
              ]
        ],
        entries.map(rowClosure)
    ]
}

window.templates.error_log_row = function(entry, allExpanded, toggledList, viewId)
{
    if (allExpanded) {
        var expanded = true;
        if (toggledList.indexOf(entry.id)!=-1) {
            expanded = false;
        }
    }
    else {
        var expanded = toggledList.indexOf(entry.id)!=-1
    }
 
    var rows = [
        [ "tr", [
                ["td", ["button", "",
                        "type", "button",
                        "handler", "error-log-list-expand-collapse",
                        "data-logid", entry.id,
                        "data-viewid", viewId
                        ]
                ],
                //["td", "T"],
                ["td", entry.uri],
                ["td", (entry.line==null ? "?" : entry.line) ],
                ["td", entry.title]
            ],  "class", (expanded ? "expanded" : "collapsed"),
                "handler", "error-log-list-expand-collapse",
                "data-logid", entry.id,
                "data-viewid", viewId
        ] 
    ]

    if (expanded) {
        rows.push(
        [
            "tr", [
                ["td",
                    [ "a", entry.uri, "href", entry.uri, "target", "_blank" ],
                    [ "pre", entry.description ],
                 "colspan", "4"
                ]
            ]
        ])
    }
    
    return rows;
}
