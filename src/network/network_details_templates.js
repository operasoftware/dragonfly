window.templates || (window.templates = {});

(function(templates) {

templates.network_detail_row = function(wrap)
{
  return ["tr", ["td", wrap, "colspan", "2"]];
}

templates.network_log_details = function(ctx, selected, left_val)
{
  return [
    [
      "div", templates.network_log_detail(ctx, selected),
      "class", "network-details-container",
      "style", "left:" + left_val + "px"
    ]
  ];
};

templates.network_log_detail = function(ctx, selected)
{
  var entry = ctx.get_entry(selected);
  if (entry)
  {
    var responsecode = entry.responses.length && entry.responses.last.responsecode;
    if (responsecode in cls.ResourceUtil.http_status_codes)
       responsecode = "" + responsecode + " " + cls.ResourceUtil.http_status_codes[responsecode];

    return ["div",
      ["span",
        "class", "resize-request-detail",
        "handler", "resize-request-detail"
      ],
      ["span",
        "class", "close-request-detail",
        "handler", "close-request-detail",
        "tabindex", "1"
      ],
      ["table",
        ["tbody",
          ["tr", ["th", ui_strings.S_HTTP_LABEL_URL + ":"], ["td", entry.human_url]],
          ["tr", ["th", ui_strings.S_HTTP_LABEL_METHOD + ":"], ["td", entry.touched_network ? entry.method : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
           "data-spec", "http#" + entry.method
          ],
          ["tr", ["th", ui_strings.M_NETWORK_REQUEST_DETAIL_STATUS + ":"], ["td", entry.touched_network && responsecode ? String(responsecode) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
           "data-spec", "http#" + entry.responsecode
          ]
        ],
        templates.request_details(entry),
        templates.network_request_body(entry),
        entry.touched_network ? entry.responses.map(templates.network_response) : []
      ],
      "data-object-id", String(entry.id),
      "class", "request-details"
    ];
  }
};

templates.network_response = function(response)
{
  return [
    templates.network_detail_row(["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE]),
    templates.response_details(response),
    templates.network_response_body(response)
  ]
}

templates.request_details = function(req)
{
  var ret = []

  if (req.requestbody && req.requestbody.partList && req.requestbody.partList.length)
    ret.push(templates.network_detail_row(["h2", ui_strings.S_NETWORK_MULTIPART_REQUEST_TITLE]));
  else
    ret.push(templates.network_detail_row(["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE]));

  var tbody = ["tbody"];
  if (req.is_finnished && !req.touched_network)
  {
    tbody.push(templates.network_detail_row(ui_strings.S_NETWORK_SERVED_FROM_CACHE));
  }
  else if (!req.request_headers)
  {
    tbody.push(templates.network_detail_row(ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL));
  }
  else
  {
    var firstline = req.request_raw.split("\n")[0];
    var parts = firstline.split(" ");
    if (parts.length == 3)
    {
      firstline = [
        ["span", parts[0] + " ", "data-spec", "http#" + parts[0]],
        ["span", parts[1] + " "],
        ["span", parts[2] + " "]
      ];
    }
    tbody = tbody.concat(templates.network_headers_list(req.request_headers, firstline));
  }
  ret.push(tbody);
  return ret;
};

templates.response_details = function(resp)
{
  if (!resp.response_headers) { return []; }
  var firstline = resp.response_raw.split("\n")[0];
  var parts = firstline.split(" ", 2);
  if (parts.length == 2)
  {
    firstline = [
      ["span", parts[0] + " "],
      ["span", parts[1], "data-spec", "http#" + parts[1]],
      ["span", firstline.slice(parts[0].length + parts[1].length + 1)]
    ];
  }
  return ["tbody", templates.network_headers_list(resp.response_headers, firstline)];
};

templates.network_headers_list = function(headers, firstline)
{
  var lis = headers.map(function(header) {
      return ["tr", [["th", header.name], ["td", header.value]], "data-spec", "http#" + header.name];
  });

  if (firstline)
  {
    lis.unshift(["tr", ["td", firstline, "colspan", "2"], "class", "network-details-header-list mono"]);
  }
  return lis;
};

templates.network_body_seperator = function()
{
  return ["pre", " ", "class", "mono"];
};

templates.network_request_body = function(req)
{
  if (!req.requestbody)
  {
    return [];
  }
  var ret = [templates.network_detail_row(templates.network_body_seperator())];
  // when this is undefined/null the request was one that did not send data
  if (req.requestbody.partList.length)
  {
    for (var n = 0, part; part = req.requestbody.partList[n]; n++)
    {
      ret.push(templates.network_headers_list(part.headerList));
      if (part.content && part.content.stringData)
        ret.push(templates.network_detail_row(["pre", part.content.stringData]));
      else
        ret.push(templates.network_detail_row(["pre", ui_strings.S_NETWORK_N_BYTE_BODY.replace("%s", part.contentLength)]));

      if (n < req.requestbody.partList.length - 1)
        ret.push(templates.network_detail_row(["hr"]));
    }
  }
  else if (req.requestbody.mimeType === "application/x-www-form-urlencoded")
  {
    // todo: hard to support for example "application/x-www-form-urlencoded; charset=windows-1252" -
    // req.requestbody.content.characterEncoding is properly set to iso-8859-1 then, but its hard to get
    // content.stringData into utf-8
    var parts = req.requestbody.content.stringData.split("&");
    var tab = [
                ["tr",
                  ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_NAME],
                  ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_VALUE]
                ]
              ].concat(parts.map(function(e) {
                  e = e.replace(/\+/g, "%20").split("=");
                  return ["tr",
                      ["td", decodeURIComponent(e[0])],
                      ["td", decodeURIComponent(e[1])]
                  ];
    }));
    ret.push(tab);
  }
  // else // There is content, but we're not tracking // todo: really?
  // {
  //   ret.push(["p", ui_strings.S_NETWORK_ENABLE_CONTENT_TRACKING_FOR_REQUEST]);
  // }
  else // not multipart or form.
  {
    var tpl = [];
    var type = cls.ResourceUtil.mime_to_type(req.requestbody.mimeType);
    if (type == "markup")
    {
      tpl = window.templates.highlight_markup(req.requestbody.content.stringData);
    }
    else if (type == "script")
    {
      tpl = window.templates.highlight_js_source(req.requestbody.content.stringData);
    }
    else if (type == "css")
    {
      tpl = window.templates.highlight_css(req.requestbody.content.stringData);
    }
    else if (type == "text")
    {
      tpl = ["p", req.requestbody.content ? 
                  req.requestbody.content.stringData :
                  ""];
    }
    else
    {
      if (req.requestbody.mimeType)
      {
        ret.push(["p", ui_strings.S_NETWORK_CANT_DISPLAY_TYPE.replace("%s", req.requestbody.mimeType)]);
      }
      else
      {
        ret.push(["p", ui_strings.S_NETWORK_UNKNOWN_MIME_TYPE]);
      }
    }
    ret.push(tpl);
  }
  return ret;
};


templates.network_response_body = function(resp)
{
  var ret = [];
  ret.push(templates.network_detail_row(templates.network_body_seperator()));
  var classname = "";
  if (resp.body_unavailable)
  {
    classname = "network_info";
    ret.push(templates.network_detail_row(ui_strings.S_NETWORK_REQUEST_DETAIL_NO_RESPONSE_BODY));
  }
  else
  {
    if (!resp.responsebody && !resp.entry.is_finished)
    {
      classname = "network_info";
      ret.push(templates.network_detail_row(ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_UNFINISHED));
    }
    else if (!resp.responsebody) // todo: ideally this would only be on the last response, since that will always be retunred.
    {
      classname = "network_info";
      ret.push(templates.network_detail_row(
        ["p",
          ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_DESC,
          ["p", ["span",
              ui_strings.M_NETWORK_REQUEST_DETAIL_GET_RESPONSE_BODY_LABEL,
              "data-object-id", String(resp.entry.id),
              // unselectable attribute works around bug CORE-35118
              "unselectable", "on",
              "handler", "get-response-body",
              "class", "container-button ui-button",
              "tabindex", "1"
          ]],
          "class", "response-view-body-container info-box"
        ]));
    }
    else
    {
      if (["script", "markup", "css", "text"].contains(resp.entry.type)) // todo: aren't mimes aren't always avalable here? maybe they are? because there are lists of textual mimes, wonder if they should be used here.
      {
        ret.push(templates.network_detail_row(["pre", resp.responsebody.content.stringData, "class", "network-body mono"]));
      }
      else if (resp.entry.type == "image")
      {
        ret.push(templates.network_detail_row(["img", "src", resp.responsebody.content.stringData, "class", "network-body"]));
      }
      else // todo: font display
      {
        ret.push(templates.network_detail_row(["span", ui_strings.S_NETWORK_REQUEST_DETAIL_UNDISPLAYABLE_BODY_LABEL.replace("%s", resp.entry.mime), "class", "network-body"]));
      }
    }
  }
  return ["tbody", ret, "class", classname];
};

})(window.templates);