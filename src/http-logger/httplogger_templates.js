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
        var value = headers[name];
        var dt = ['dt', name + ": "]
        if (name in http_header_specification_urls)
        {
            dt.push(templates.reference_link(http_header_specification_urls[name]));
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

window.templates.sanitize_url = function(req)
{
    var s = req.request.path;

    if (s=="" || s=="/") {
        return req.request.host;
    }

    var pos = s.lastIndexOf("/");
    if (pos == s.length-1) { //  only query part
        return s

    }
    else {
        return s.slice(pos+1);
    }
}

/**
 * Renders a single row of request data in the request list
 */
window.templates.request_list_row = function(r, expandList, firstTime, lastTime, viewMap, isFirst)
{
    var expanded = expandList.indexOf(r.id) != -1;
    var range = lastTime - firstTime;
    rangeP = 100/range;
    var cur = r.request.time - firstTime;
    curP = cur*rangeP;


    dur = r.response ? Math.floor((r.response.time - r.request.time)*rangeP) : null
    var a = [
        [ 'tr',
            ['td', ["button", "", "type", "button",
                                  'data-requestid', r.id.toString(),
                                  "class", "expand-collapse"]],
            ['td', ["label", "",
                    "class", http_map_mime_to_type(http_get_mime_from_extension(r.request.path))]
            ],
            ['td', r.request.method],
            ['td', templates.sanitize_url(r) ],
            ['td', (r.response ? r.response.status : "-"), 'class', 'status-cell'],
            ['td', (r.response ? r.response.reason: "-"), 'class', 'reason-cell'],
            ['td', (r.duration!=undefined ? ["span", "" + r.duration + "ms", "style", "margin-left: " + Math.floor(curP) + "%; width: " + (dur!=null ? dur : 50 ) + "%", "class", "graph-box"] : ""),
                        (isFirst ? ["span", "" + (lastTime-firstTime) + "ms", "class", "totaltime"] : []),
                  , 'class', 'time-cell'],
            'data-requestid', r.id.toString(),
            "handler", "request-list-expand-collapse",
            'class', 'typeicon mime-' +
                    http_map_mime_to_type(http_get_mime_from_extension(r.request.path)) +
                    (expanded ? " expanded" : " collapsed") +
                    (r.duration==undefined ? " in-progress" : "") +
                    (r.response ? " http-status-"+r.response.statusClass : "")
        ],
    ];
    if (expanded) // meaning "is expanded"
    {
        a.push(window.templates.request_details_box(r, viewMap[r.id]));
    }

    return a;
}

window.templates.request_details_box = function(r, aw)
{
    aw = aw || "summary";

    var content = {"summary": window.templates.request_summary,
                   "headers": window.templates.headers_view,
                   "raw": window.templates.response_raw}[aw]||window.templates.request_summary;

    return [ 'tr',
              ['td',
               ['button', ui_strings.S_BUTTON_SHOW_REQUEST_SUMMARY, "type", "button", "data-viewname", "summary", "data-requestid", r.id.toString(), "handler", "select-http-detail-view"],
               ['button', ui_strings.S_BUTTON_SHOW_REQUEST_HEADERS, "type", "button", "data-viewname", "headers", "data-requestid", r.id.toString(), "handler", "select-http-detail-view"],
               ['button', ui_strings.S_BUTTON_SHOW_REQUEST_RAW, "type", "button", "data-viewname", "raw", "data-requestid", r.id.toString(), "handler", "select-http-detail-view"],
                 ["div", content(r)],
                "colspan", "7"]
           ]
}

window.templates.response_raw = function(req)
{
    return [
            ["h2", ui_strings.M_VIEW_LABEL_RAW_REQUEST_INFO],
            ['code',
                ['pre',
                    (req.request ? req.request.raw : ui_strings.S_HTTP_REQUEST_IN_PROGRESS)
                ]
            ],
            ["h2", ui_strings.M_VIEW_LABEL_RAW_RESPONSE_INFO],
            ['code',
                ['pre',
                    (req.response ? req.response.raw : ui_strings.S_HTTP_REQUEST_IN_PROGRESS)
                ]
            ]
    ]
}

window.templates.headers_view = function(req) {
    return [
        window.templates.parsed_request_headers(req),
        window.templates.parsed_response_headers(req)
    ]
}

window.templates.parsed_request_headers = function(req)
{
    return [
            ["h2", ui_strings.M_VIEW_LABEL_REQUEST_HEADERS],
             window.templates.header_definition_list(req.request.headers)
           ]
}

window.templates.parsed_response_headers = function(req)
{
    return [
            ["h2", ui_strings.M_VIEW_LABEL_RESPONSE_HEADERS],
            req.response ? window.templates.header_definition_list(req.response.headers) : ["span", ui_strings.S_HTTP_REQUEST_IN_PROGRESS]
    ]
}

window.templates.request_summary = function(req)
{
    pairs = [];
    for (key in req.request.queryDict) { pairs.push([key, req.request.queryDict[key]]) }

    ret = [
              ["h2", ui_strings.M_VIEW_LABEL_REQUEST_SUMMARY],
              ["dl", [
                      ["dt", ui_strings.S_HTTP_LABEL_URL],
                      ["dd", (req.request.url + req.request.query)],
                      ["dt", ui_strings.S_HTTP_LABEL_RESPONSE],
                      ["dd", (req.response ? req.response.status + ": " + req.response.reason : "-")],
                      ["dt", ui_strings.S_HTTP_LABEL_METHOD],
                      ["dd",  req.request.method + " ", [window.templates.method_spec_link(req) || ""]],
                      ["dt", ui_strings.S_HTTP_LABEL_HOST],
                      ["dd", req.request.headers["Host" || "?" ]],
                      ["dt", ui_strings.S_HTTP_LABEL_PATH],
                      ["dd", req.request.path],
                      ["dt", ui_strings.S_HTTP_LABEL_QUERY_ARGS],
                      ["dd", (pairs.length ? ["ul", pairs.sort().map(function(e) { return ["li", e.join(" = ")] } )] : ui_strings.S_NONE ) ]
                    ]
               ]
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
            return window.templates.reference_link(http_method_specification_urls[m]);
        }
    }
    return ""
}

window.templates.reference_link = function(href, title)
{
    return ["a", " ",
            "target", "_blank",
            "alt", "Reference link",
            "href", href,
            "class", "reference-link",
            "title", title||""
            ]
}
