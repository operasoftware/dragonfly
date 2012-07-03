"use strict";

window.templates || (window.templates = {});
window.templates.network || (window.templates.network = {});

(function(templates) {

templates._detail_row = function(wrap)
{
  // Todo: this may be too hacky..
  if (Array.isArray(wrap[0]) && wrap[1])
  {
    return ["tr", wrap[0], wrap[1]];
  }
  return ["tr", ["td", wrap, "colspan", "2"]];
};

templates.wrap_pre = function(str)
{
  return ["pre", str, "class", "mono"];
};

templates.details = function(entry, left_val, do_raw)
{
  return (
    ["div",
      ["span",
        ["span",
          "class", "close-request-detail",
          "handler", "close-request-detail",
          "tabindex", "1"
        ],
        "class", "resize-request-detail",
        "handler", "resize-request-detail"
      ],
      ["div",
        templates._details_content(entry, do_raw),
        "data-object-id", String(entry.id),
        "class", "entry-details"
      ],
    "class", "network-details-container",
    "style", "left:" + left_val + "px"]
  );
};

templates._details_content = function(entry, do_raw)
{  
  var responsecode = entry.last_responsecode;
  if (responsecode && responsecode in cls.ResourceUtil.http_status_codes)
     responsecode = responsecode + " " + cls.ResourceUtil.http_status_codes[responsecode];

  // todo: not really pretty
  if (!this["_requests_responses_" + do_raw])
    this["_requests_responses_" + do_raw] = templates.requests_responses.bind(this, do_raw);

  var requests_responses = entry.requests_responses.map(this["_requests_responses_" + do_raw])

  if (do_raw)
  {
    return requests_responses;
  }

  return (
    ["table",
      ["tbody",
        ["tr",
          ["th", ui_strings.S_HTTP_LABEL_URL + ":"], ["td", entry.url]
        ],
        ["tr",
          ["th", ui_strings.S_HTTP_LABEL_METHOD + ":"],
          ["td", entry.touched_network ? entry.last_method : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE],
          "data-spec", "http#" + entry.last_method
        ],
        ["tr",
          ["th", ui_strings.M_NETWORK_REQUEST_DETAIL_STATUS + ":"],
          ["td",
            entry.touched_network && responsecode ? String(responsecode) : ui_strings.S_RESOURCE_ALL_NOT_APPLICABLE
          ],
         "data-spec", "http#" + entry.last_responsecode
        ]
      ],
      entry.touched_network ? [] : templates.did_not_touch_network(entry),
      requests_responses
    ]
  );
};

templates.did_not_touch_network = function(entry)
{
  var data = cls.ResourceManager["1.2"].UrlLoad.URLType.DATA;
  return (
    ["tbody", 
      templates._detail_row( // Todo: Alternatively put into a headline, as these otherwise say "Request" here.
        ["p", entry.urltype === data ? ui_strings.S_NETWORK_NOT_REQUESTED
                                   : ui_strings.S_NETWORK_SERVED_FROM_CACHE])
    ]);
};

templates.requests_responses = function(do_raw, request_response, index, requests_responses)
{
  var is_last = index == requests_responses.length - 1;
  var template_func = templates._response;
  if (request_response instanceof cls.NetworkLoggerRequest)
    template_func = templates._request;

  return template_func(request_response, is_last, do_raw);
};

templates._request = function(request, is_last, do_raw)
{
  return [
    templates._request_headers(request, do_raw),
    templates._request_body(request, do_raw)
  ]
};

templates._response = function(response, is_last, do_raw)
{
  return [
    templates._response_headers(response, do_raw),
    templates._response_body(response, do_raw, is_last)
  ]
};

templates._request_headers = function(req, do_raw)
{
  if (do_raw)
  {
    return [
      ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE],
      ["pre", req.request_headers_raw, "class", "mono"]
    ];
  }

  var ret = [];

  if (req.requestbody && req.requestbody.partList && req.requestbody.partList.length)
    ret.push(["h2", ui_strings.S_NETWORK_MULTIPART_REQUEST_TITLE]);
  else
    ret.push(["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE]);

  if (!req.request_headers)
  {
    ret.push(ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL);
  }
  else
  {
    if (req.firstline)
    {
      var parts = req.firstline.split(" ");
      var firstline;
      if (parts.length == 3)
      {
        firstline = [
          ["span", parts[0] + " ", "data-spec", "http#" + parts[0]],
          ["span", parts[1] + " "],
          ["span", parts[2] + " "]
        ];
      }
      ret.extend(templates.headers_list(req.request_headers, firstline));
    }
  }
  return ["tbody", ret.map(templates._detail_row)];
};

templates._response_headers = function(resp, do_raw)
{
  if (do_raw)
  {
    return [
      ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE],
      ["pre", resp.response_headers_raw, "class", "mono"]
    ];
  }

  if (!resp.response_headers) // todo: we explicitely mention missing request headers but not missing response headers // ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL
    return [];

  var ret = [];

  var firstline;
  var parts = resp.firstline.split(" ", 2);
  if (parts.length == 2)
  {
    firstline = [
      ["span", parts[0] + " "],
      ["span", parts[1], "data-spec", "http#" + parts[1]],
      ["span", resp.firstline.slice(parts[0].length + parts[1].length + 1)]
    ];
  }

  if (resp.logger_entry_touched_network)
    ret.push(["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE]);

  ret.extend(templates.headers_list(resp.response_headers, firstline));
  return ["tbody", ret.map(templates._detail_row)];
};

templates.headers_list = function(headers, firstline, do_raw)
{
  var map;
  if (do_raw) // todo: when raw, this is currently just for headers of parts in mutipart. should be used for others too, to gain the speclinks.
  {
    map = function(header)
    {
      return templates.wrap_pre([["span", header.name + ":", "data-spec", "http#" + header.name], ["span", " " + header.value]]);
    };
  }
  else
  {
    map = function(header)
    {
      return [["th", header.name + ":", "data-spec", "http#" + header.name], ["td", header.value]];
    };
  }

  var lis = headers.map(map);

  if (firstline)
  {
    lis.unshift(["pre", firstline, "class", "mono"]);
  }
  return lis;
};

templates._request_body = function(req, do_raw)
{
  if (req.requestbody == null)
    return [];

  var ret = [templates.wrap_pre("\n")];
  if (req.requestbody.partList.length) // multipart
  {
    var use_raw_boundary = false;
    if (do_raw && req.boundary)
      use_raw_boundary = true;

    for (var n = 0, part; part = req.requestbody.partList[n]; n++)
    {
      if (use_raw_boundary && n === 0)
        ret.push(this.wrap_pre(req.boundary));

      ret.extend(templates.headers_list(part.headerList, null, do_raw));
      ret.push(this.wrap_pre("\n"));
      if (part.content && part.content.stringData)
        ret.push(["pre", part.content.stringData, "class", "mono network-body"]);
      else
        ret.push(["p", ui_strings.S_NETWORK_N_BYTE_BODY.replace("%s", part.contentLength)]);

      if (n < req.requestbody.partList.length - 1)
        ret.push(use_raw_boundary ? this.wrap_pre(req.boundary) : ["hr"]);
      else if (use_raw_boundary)
        ret.push(this.wrap_pre(req.boundary + "--\n"));
    }
  }
  else if (req.requestbody.mimeType.startswith("application/x-www-form-urlencoded"))
  {
    if (do_raw)
    {
      ret.push(["pre", req.requestbody.content.stringData, "class", "mono network-body"]);
    }
    else
    {
      var parts = req.requestbody.content.stringData.split("&");
      ret.push([
                  ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_NAME],
                  ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_VALUE]
                ]); // it's necesary to just push the outer array, because each entry will be wrapped in a row.
      
      ret.extend(parts.map(function(e) {
                    e = e.replace(/\+/g, "%20").split("=");
                    return [
                        ["td", decodeURIComponent(e[0])],
                        ["td", decodeURIComponent(e[1])]
                    ];
                  }));
    }
  }
  else // not multipart or form.
  {
    if (req.requestbody.content)
    {
      var type = cls.ResourceUtil.mime_to_type(req.requestbody.mimeType);
      if (["markup", "script", "css", "text"].contains(type))
      {
        ret.push(["pre", req.requestbody.content.stringData]);
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
    }
  }

  if (do_raw)
    return ret;
  else
    return ["tbody", ret.map(templates._detail_row)];
};


templates._response_body = function(resp, do_raw, is_last)
{
  var ret = [templates.wrap_pre("\n")]; // todo: no, then it's (really) empty there shouldn't be a separator either.

  var classname = "";
  if (resp.body_unavailable ||
      !resp.responsebody && resp.is_unloaded)
  {
    classname = "network_info";
    ret.push(ui_strings.S_NETWORK_REQUEST_DETAIL_NO_RESPONSE_BODY);
  }
  else
  {
    if (!resp.responsebody)
    {
      if (is_last && !resp.logger_entry_is_finished)
      {
        classname = "network_info";
        ret.push(ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_UNFINISHED);
      }
      // else we're in the middle of getting it via GetResource, or there is in fact no responsebody.
    }
    else
    {
      if (["script", "markup", "css", "text"].contains(resp.logger_entry_type))
      {
        ret.push(
          ["pre", resp.responsebody.content.stringData, "class", "network-body mono"]
        );
      }
      else if (resp.logger_entry_type == "image")
      {
        ret.push(
          ["img", "src", resp.responsebody.content.stringData, "class", "network-body"]
        );
      }
      else
      {
        ret.push(
          ["span", ui_strings.S_NETWORK_REQUEST_DETAIL_UNDISPLAYABLE_BODY_LABEL.replace("%s", resp.logger_entry_mime),
           "class", "network-body"]
        );
      }
    }
  }
  if (do_raw)
    return ret;
  else
    return ["tbody", ret.map(templates._detail_row), "class", classname];
};

})(window.templates.network);