/**
 * @fileoverview
 * Templates used by the http logger views
 */

window.templates = window.templates || ( window.templates = {} );

/**
 * Render the a definition list with a dt for each header and the dd with
 * the value. Add link to the relevant header spec if we have the URL
 */
 window.templates.header_definition_list = function(headers)
{
    var alphaheaders = [];
    for (name in headers) {alphaheaders.push(name)}
    alphaheaders = alphaheaders.sort();
    
    var dlbody = [];
    
    for (var i=0, name; name=alphaheaders[i]; i++)
    {
        var value = headers[name];e
        var dt = ['dt', name + ": "]
        if (name in http_header_specification_urls)
        {
            dt.push(['a', '(spec)',
                          'href', http_header_specification_urls[name],
                          'target', '_blank']);
        }
        
        dlbody.push(dt);
        
        if (typeof value == "string")
        {
            var dd = ['dd', value]
        }
        else
        {
            var dd = [];
            for (var n=0, e; e=value[n]; n++)
            {
                dd.push(['dd', e]);
            }
        }
        dlbody.push(dd);
    }
    var dl = ['dl', dlbody,
              'class', 'headerlist'
             ];
    
    return dl;
}

/**
 * Renders a single row of request data in the request list
 */
window.templates.request_list_row = function(r, expandList)
{
    var expanded = expandList.indexOf(r.id) != -1;

    // fixme: this needs to move somewhere.
    var basename = function(s) {
        if (s=="") {
            return "domain here"
        }
        var pos = s.lastIndexOf("/");
        if (pos == s.length-1) {
        
            return basename(s.slice(0, pos));
        }
        else {
            var cur = s.slice(pos+1);
            if (cur.length>24) {
                return cur
            } else {
                return cur;
            }
        }
    }

    var a = [
        [ 'tr',
            ['td', ["button", "", "type", "button",
                                  "handler", "request-list-expand-collapse",
                                  'data-requestid', r.id,
                                  "class", "expand-collapse"]],
            ['td', ["label", "",
                    "class", http_map_mime_to_type(http_get_mime_from_extension(r.request.path))]
            ],
            ['td', r.request.method],
            ['td', basename(r.request.path) ],
            ['td', (r.response ? r.response.status : "-"), 'class', 'status-cell'],
            ['td', (r.response ? r.response.reason: "-"), 'class', 'reason-cell'],
            'data-requestid', r.id,
            'class', 'typeicon mime-' + 
                    http_map_mime_to_type(http_get_mime_from_extension(r.request.path)) +
                    (expanded ? " expanded" : " collapsed")
        ],
    ];
    
    if (expanded) // meaning "is expanded"
    {
        a.push(window.templates.request_details_box(r));
    }
    
    return a;
}

window.templates.request_details_box = function(r)
{
     return [ 'tr',
              ['td',
               ["div", 
                    ["h2", "Request summary"],
                    window.templates.request_summary(r),
                    ["hr"],
                    ['h2', "Request headers"],
                    window.templates.parsed_request_headers(r),
                    ["hr"],
                    ['h2', "Response headers"],
                    window.templates.parsed_response_headers(r),
                    ["hr"],
                    ['h2', "Raw response"],
                    window.templates.response_raw(r)
               ], "colspan", "7"]
            ]
}

window.templates.response_raw = function(req)
{
    return [
            ['code',
                ['pre',
                    (req.response ? req.response.raw : "Request in progress")
                ]
            ]
    ]
}

window.templates.parsed_request_headers = function(req)
{
    return [
             window.templates.header_definition_list(req.request.headers)
    ]
}

window.templates.parsed_response_headers = function(req)
{
    return [
            ['h2', this.name],
            req.response ? window.templates.header_definition_list(req.response.headers) : ["span", "Request in progress"]
    ]    
}


window.templates.request_summary = function(req)
{
    pairs = [];
    for (key in req.request.queryDict) { pairs.push([key, req.request.queryDict[key]]) }

    ret = [
              ["dl", [
                      ["dt", "Full url"],
                      ["dd", (req.request.url + req.request.query)],
                      ["dt", "Response"],
                      ["dd", (req.response ? req.response.status + ": " + req.response.reason : "-")],
                      ["dt", "Method"],
                      ["dd", window.templates.method_spec_link(req) || req.request.method ], 
                      ["dt", "Host"],
                      ["dd", req.request.headers["Host" || "?" ]],
                      ["dt", "Path:"],
                      ["dd", req.request.path],
                      ["dt", "Query arguments"],
                      ["dd", (pairs.length ? ["ul", pairs.sort().map(function(e) { return ["li", e.join(" = ")] } )] : "None" ) ]
                    ]
               ],
               
          ]
    return ret;
}

window.templates.method_spec_link = function(req)
{
    if (req && req.request.method)
    {
        var m = req.request.method.toLowerCase();
        if (m in http_method_specification_urls)
        {
            return ["a", req.request.method + " (spec)", "target", "_blank", "href", http_method_specification_urls[m]]
        }
    }
    return ""
}

window.templates.request_list_header = function()
{
    return ['table',
                ['thead',
                    ['tr',
                        ['th', ""],
                        ['th', ""],
                        ['th', "Host"],
                        ['th', "Path"],
                        ['th', "Method"],
                        ['th', "Status"],
                        ['th', "Time"]
                    ]
                ],
                ['tbody'],
             'class', 'request-table'
            ];
}
