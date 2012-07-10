"use strict";

window.templates || (window.templates = {});
window.templates.network || (window.templates.network = {});

(function(templates) {

templates._wrap_col_or_row = function(wrap)
{
  // Wraps either ["elem", "text"] in a column
  // or [["elem", "text"], ["elem", "text"]] in a row.
  if (Array.isArray(wrap[0]) && wrap[1])
  {
    return ["tr", wrap[0], wrap[1]];
  }
  return ["tr", ["td", wrap, "colspan", "2"]];
};

templates._wrap_pre = function(str)
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
        this._details_content(entry, do_raw),
        "data-object-id", String(entry.id),
        "class", "entry-details"
      ],
    "class", "network-details-container",
    "style", "left:" + left_val + "px"]
  );
};

templates._details_content = function(entry, do_raw)
{  
  var responsecode = entry.current_responsecode;
  if (responsecode && responsecode in cls.ResourceUtil.http_status_codes)
     responsecode = responsecode + " " + cls.ResourceUtil.http_status_codes[responsecode];

  // todo: not really pretty
  if (!this["_requests_responses_" + do_raw])
    this["_requests_responses_" + do_raw] = this.requests_responses.bind(this, do_raw);

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
         "data-spec", "http#" + entry.current_responsecode
        ]
      ],
      entry.touched_network ? [] : this.did_not_touch_network(entry),
      requests_responses
    ]
  );
};

templates.did_not_touch_network = function(entry)
{
  var data = cls.ResourceManager["1.2"].UrlLoad.URLType.DATA;
  return (
    ["tbody", 
      this._wrap_col_or_row( // Todo: Alternatively put into a headline, as these otherwise say "Request" here.
        ["p", entry.urltype === data ? ui_strings.S_NETWORK_NOT_REQUESTED
                                   : ui_strings.S_NETWORK_SERVED_FROM_CACHE])
    ]);
};

templates.requests_responses = function(do_raw, request_response, index, requests_responses)
{
  var is_last = index == requests_responses.length - 1;
  var template_func = this._response;
  if (request_response instanceof cls.NetworkLoggerRequest)
    template_func = this._request;

  return template_func.call(this, request_response, is_last, do_raw);
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
    this._response_headers(response, do_raw),
    this._response_body(response, do_raw, is_last)
  ]
};

templates._make_header_template_func = function(is_request_headers)
{
  // add data-spec attributes on certain firstline tokens, depending on if it's request_headers.
  // todo: while this has firstline_tokens, it can't be reused.
  var firstline_tokens = 0;
  var add_data_spec;
  if (is_request_headers)
  {
    add_data_spec = {
      0: true
    };
  }
  else
  {
    add_data_spec = {
      1: true
    };
  }

  return function(token)
  {
    var TYPE = 0;
    var STR = 1;
    var attrs = ["class", "header-token-type-" + cls.HTTPHeaderTokenizer.classnames[token[TYPE]]];
    if (token[TYPE] === cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART)
    {
      if (firstline_tokens in add_data_spec)
      {
        attrs.extend(["data-spec", "http#" + token[STR]])
      }
      firstline_tokens++;
    }
    return ["span", token[STR]].concat(attrs);
  }
}

templates._token_receiver = function(tokens, token_type, token)
{
  tokens.push([token_type, token]);
};

templates._request_headers = function(req, do_raw)
{
  if (do_raw)
  {
    if (req.request_headers_raw) // todo: we explicitely mention missing request headers in parsed. this check here is a bit ugly.
    {
      if (!req.header_tokens)
      {
        var tokens = [];
        var tokenizer = new cls.HTTPHeaderTokenizer();
        tokenizer.tokenize(req.request_headers_raw, this._token_receiver.bind(this, tokens));
        req.header_tokens = tokens;
      }
      if (req.header_tokens.length)
      {
        var map_func = this._make_header_template_func(true);
        return [
          ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE],
          ["pre", req.header_tokens.map(map_func), "class", "mono"]
        ];
      }
    }
    return [];
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
      ret.extend(this.headers_list(req.request_headers, firstline));
    }
  }
  return ["tbody", ret.map(this._wrap_col_or_row)];
};

templates._response_headers = function(resp, do_raw)
{
  if (!resp.response_headers) // todo: we explicitely mention missing request headers but not missing response headers // ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL
    return [];

  if (do_raw)
  {
    if (!resp.header_tokens)
    {
      var tokens = [];
      var tokenizer = new cls.HTTPHeaderTokenizer();
      tokenizer.tokenize(resp.response_headers_raw, this._token_receiver.bind(this, tokens));
      resp.header_tokens = tokens;
    }
    if (resp.header_tokens.length)
    {
      var map_func = this._make_header_template_func(false);
      return [
        ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE],
        ["pre", resp.header_tokens.map(map_func), "class", "mono"]
      ];
    }
    return [];
  }

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

  ret.extend(this.headers_list(resp.response_headers, firstline));
  return ["tbody", ret.map(this._wrap_col_or_row)];
};

templates.headers_list = function(headers, firstline, do_raw)
{
  var map_func;
  if (do_raw) // this is currently just for headers of parts in multipart. todo: in regular request/response headers we'll have a tokenized list to gain speclinks.
  {
    map_func = function(header)
    {
      return this._wrap_pre([["span", header.name + ":", "data-spec", "http#" + header.name], ["span", " " + header.value]]);
    };
  }
  else
  {
    map_func = function(header)
    {
      return [["th", header.name + ":", "data-spec", "http#" + header.name], ["td", header.value]];
    };
  }

  var lis = headers.map(map_func);
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

  var ret = [this._wrap_pre("\n")];
  if (req.requestbody.partList.length) // multipart
  {
    var use_raw_boundary = false;
    if (do_raw && req.boundary)
      use_raw_boundary = true;

    for (var n = 0, part; part = req.requestbody.partList[n]; n++)
    {
      if (use_raw_boundary && n === 0)
        ret.push(this._wrap_pre(req.boundary));

      ret.extend(this.headers_list(part.headerList, null, do_raw));
      ret.push(this._wrap_pre("\n"));
      if (part.content && part.content.stringData)
        ret.push(["pre", part.content.stringData, "class", "mono network-body"]);
      else
        ret.push(["p", ui_strings.S_NETWORK_N_BYTE_BODY.replace("%s", part.contentLength)]);

      if (n < req.requestbody.partList.length - 1)
        ret.push(use_raw_boundary ? this._wrap_pre(req.boundary) : ["hr"]);
      else if (use_raw_boundary)
        ret.push(this._wrap_pre(req.boundary + "--\n"));
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
    return ["tbody", ret.map(this._wrap_col_or_row)];
};


templates._response_body = function(resp, do_raw, is_last)
{
  var ret = [this._wrap_pre("\n")]; // todo: no, then it's (really) empty there shouldn't be a separator either.

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
    return ["tbody", ret.map(this._wrap_col_or_row), "class", classname];
};

})(window.templates.network);