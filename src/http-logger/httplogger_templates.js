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
window.templates.request_list_row = function(n, r, sel)
{
    var a = [ 'tr',
        ['th', ["label", "",
                "class", http_map_mime_to_type(http_get_mime_from_extension(r.request.path))]
        ],
        ['td', r.request.headers["Host" || "?" ] ],
        ['td', r.request.path],
        ['td', r.request.method],
        ['td', (r.response ? r.response.status : "-"), 'class', 'status-cell'],
        ['td', (r.duration != null ? r.duration : "-"), 'class', 'time-cell'],
        'data-requestid', r.id,
        'handler', 'request-list-select',
        'class', 'typeicon mime-' + http_map_mime_to_type(http_get_mime_from_extension(r.request.path))
        //,
        //'class', (r.id==sel ? 'request-list-select' : '')
    ];
    return a;
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