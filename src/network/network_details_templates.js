"use strict";

window.templates || (window.templates = {});
window.templates.network || (window.templates.network = {});

(function(templates) {

var HTTP_BOUNDARY_CLASS = "http-token-type-boundary";
var TEXT_TYPES = ["markup", "script", "css", "text"];

templates._col_or_row = function(template)
{
  // template is either ["elem", "text"], which will be wrapped in a column
  // or [["elem", "text"], ["elem", "text"]] which will be wrapped in a row.
  if (Array.isArray(template[0]) && template[1])
  {
    return ["tr", template[0], template[1]];
  }
  return ["tr", ["td", template, "colspan", "2"]];
};

templates._pre = function(str, additional_classname)
{
  var classname = "mono";
  if (additional_classname)
    classname += " " + additional_classname;

  return ["pre", str, "class", classname];
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
  var requests_responses = entry.requests_responses.map(do_raw ? this._requests_responses_raw_bound
                                                               : this._requests_responses_parsed_bound);
  if (do_raw)
    return requests_responses;

  var responsecode = entry.current_responsecode;
  if (responsecode && responsecode in cls.ResourceUtil.http_status_codes)
     responsecode = responsecode + " " + cls.ResourceUtil.http_status_codes[responsecode];

  return (
    ["table",
      ["tbody",
        this._col_or_row(
          ["h1",
            [
              ["span",
                entry.touched_network && responsecode ? String(responsecode) + " – " : "",
                "data-spec", "http#" + entry.current_responsecode
              ],
              ["span", entry.url]
            ]
          ]
        )
      ],
      entry.touched_network ? [] : this.did_not_touch_network(entry),
      requests_responses
    ]
  );
};

templates.did_not_touch_network = function(entry)
{
  var local_url_types = [
    cls.ResourceManager["1.2"].UrlLoad.URLType.FILE,
    cls.ResourceManager["1.2"].UrlLoad.URLType.DATA
  ];
  return (
    ["tbody",
      this._col_or_row(
        ["p", local_url_types.contains(entry.urltype) ? ui_strings.S_NETWORK_NOT_REQUESTED
                                                      : ui_strings.S_NETWORK_SERVED_FROM_CACHE])
    ]);
};

templates.requests_responses = function(do_raw, request_response, index, requests_responses)
{
  var is_last_of_type = true;
  for (var i = index + 1, req_res; req_res = requests_responses[i]; i++)
  {
    if (request_response.is_response == req_res.is_response)
    {
      is_last_of_type = false;
      break;
    }
  }
  return (
    request_response.is_response ? this._response(request_response, is_last_of_type, do_raw)
                                 : this._request(request_response, is_last_of_type, do_raw)
  );
};

templates._requests_responses_raw_bound = templates.requests_responses.bind(templates, true);
templates._requests_responses_parsed_bound = templates.requests_responses.bind(templates, false);

templates._request = function(request, is_last, do_raw)
{
  // A request that's followed by another one, without a response in between,
  // is not shown in network-details. It will mostly mean it was retried internally
  // and didn't go on the network.
  // That can't be determined only by looking at RequestRetry events, because a
  // request with for example a 401 Authorization Required response should still
  // be shown.
  if (!is_last && !request.was_responded_to)
    return [];

  return [
    templates._request_headers(request, do_raw),
    templates._request_body(request, do_raw)
  ];
};

templates._response = function(response, is_last, do_raw)
{
  return [
    this._response_headers(response, do_raw),
    this._response_body(response, do_raw, is_last)
  ];
};

templates._header_token_templ = function(state, token)
{
  var TYPE = 0;
  var STR = 1;
  var attrs = ["class", "header-token-type-" + cls.HTTPHeaderTokenizer.classnames[token[TYPE]]];

  if (token[TYPE] === cls.HTTPHeaderTokenizer.types.NAME)
  {
    attrs.extend(["data-spec", "http#" + token[STR].trim()]);
  }
  else if (token[TYPE] === cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART)
  {
    if (state.data_spec_firstline_tokens.contains(state.firstline_tokens))
    {
      // Add data-spec attributes on certain firstline tokens, tracked in state
      attrs.extend(["data-spec", "http#" + (token[STR]).trim()]);
    }
    state.firstline_tokens++;
  }
  return ["span", token[STR]].concat(attrs);
};

templates._token_receiver = function(tokens, token_type, token)
{
  tokens.push([token_type, token]);
};

templates._request_headers = function(req, do_raw)
{
  if (do_raw)
  {
    if (req.request_headers_raw)
    {
      if (!req.header_tokens)
      {
        req.header_tokens = [];
        var tokenizer = new cls.HTTPHeaderTokenizer();
        tokenizer.tokenize(req.request_headers_raw, this._token_receiver.bind(this, req.header_tokens));
      }

      if (req.header_tokens.length)
      {
        var data_spec_firstline_tokens = [0];
        var state_holder = new cls.HTTPHeaderTokenizer.TokenStateholder(data_spec_firstline_tokens);
        var map_func = this._header_token_templ.bind(this, state_holder);
        return [
          ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE],
          this._pre(req.header_tokens.map(map_func))
        ];
      }
    }
    return [];
  }

  var ret = [];
  var method_str = req.method || "";
  if (method_str)
    method_str = " – " + method_str;

  if (req.request_body && req.request_body.partList && req.request_body.partList.length)
    ret.push(["h2", ui_strings.S_NETWORK_MULTIPART_REQUEST_TITLE + method_str]);
  else
    ret.push(["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE + method_str]);

  if (!req.request_headers)
    ret.push(ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL);
  else
    ret.extend(this.headers_list(req.request_headers));

  return ["tbody", ret.map(this._col_or_row)];
};

templates._response_headers = function(resp, do_raw)
{
  // Missing response headers aren't mentioned explicitely
  if (!resp.response_headers)
    return [];

  if (do_raw)
  {
    if (!resp.header_tokens)
    {
      resp.header_tokens = [];
      var tokenizer = new cls.HTTPHeaderTokenizer();
      tokenizer.tokenize(resp.response_headers_raw, this._token_receiver.bind(this, resp.header_tokens));
    }

    if (resp.header_tokens.length)
    {
      var data_spec_firstline_tokens = [1];
      var state_holder = new cls.HTTPHeaderTokenizer.TokenStateholder(data_spec_firstline_tokens);
      var map_func = this._header_token_templ.bind(this, state_holder);
      return [
        ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE],
        this._pre(resp.header_tokens.map(map_func))
      ];
    }
    return [];
  }

  var ret = [];

  var responsecode = resp.responsecode || "";
  var status_code = cls.ResourceUtil.http_status_codes[responsecode];
  if (status_code)
    responsecode = responsecode + " " + status_code;

  if (responsecode)
    responsecode = " – " + responsecode;

  if (resp.logger_entry_touched_network)
  {
    var head = ["h2", ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE + responsecode];
    if (responsecode)
    {
      head.extend(["data-spec", "http#" + resp.responsecode]);
    }
    ret.push(head);
  }

  ret.extend(this.headers_list(resp.response_headers));
  return ["tbody", ret.map(this._col_or_row)];
};

templates._headers_pseudo_raw = function(header)
{
  var template = [
      ["span", header.name + ":",
        "data-spec", "http#" + header.name.trim()
      ],
      ["span", " " + header.value]
    ];
  return this._pre(template);
};

templates._headers = function(header) {
  return [
    ["th", header.name + ":",
      "data-spec", "http#" + (header.name).trim()
    ],
    ["td", header.value]
  ];
};

templates.headers_list = function(headers, do_raw)
{
  return headers.map(do_raw ? this._headers_pseudo_raw : this._headers, this);
};

templates.param_cells = function(name_value)
{
  var parts = name_value.replace(/\+/g, " ").split("=");
  return [
      ["td", decodeURIComponent(parts[0])],
      ["td", decodeURIComponent(parts[1])]
  ];
};

templates._request_body = function(req, do_raw)
{
  if (req.request_body == null)
    return [];

  var ret = [this._pre("\n")];
  if (req.request_body.partList.length) // Multipart
  {
    var use_raw_boundary = Boolean(do_raw && req.boundary);
    for (var n = 0, part; part = req.request_body.partList[n]; n++)
    {
      if (use_raw_boundary && n === 0)
        ret.push(this._pre(req.boundary, HTTP_BOUNDARY_CLASS));

      ret.extend(this.headers_list(part.headerList, do_raw));
      ret.push(this._pre("\n"));
      if (part.content && part.content.stringData)
        ret.push(this._pre(part.content.stringData, "mono network-body"));
      else
        ret.push(["p", ui_strings.S_NETWORK_N_BYTE_BODY.replace("%s", part.contentLength)]);

      var boundary = use_raw_boundary ? req.boundary : ["hr"];
      if (use_raw_boundary && part === req.request_body.partList.last)
        boundary += "--\n";

      ret.push(this._pre(boundary, HTTP_BOUNDARY_CLASS));
    }
  }
  else if (req.request_body.mimeType.startswith("application/x-www-form-urlencoded"))
  {
    if (do_raw)
    {
      ret.push(this._pre(req.request_body.content.stringData, "network-body"));
    }
    else
    {
      var parts = req.request_body.content.stringData.split("&");
      ret.push([
        ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_NAME],
        ["th", ui_strings.S_LABEL_NETWORK_POST_DATA_VALUE]
      ]); // It's necesary to just push the outer array, because each entry will be wrapped in a row.
      ret.extend(parts.map(this.param_cells));
    }
  }
  else // not multipart or form.
  {
    if (req.request_body.content)
    {
      var type = cls.ResourceUtil.mime_to_type(req.request_body.mimeType);
      if (TEXT_TYPES.contains(type))
      {
        ret.push(this._pre(req.request_body.content.stringData, "network-body"));
      }
      else
      {
        if (req.request_body.mimeType)
        {
          ret.push(["p", ui_strings.S_NETWORK_CANT_DISPLAY_TYPE.replace("%s", req.request_body.mimeType)]);
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
    return ["tbody", ret.map(this._col_or_row)];
};


templates._response_body = function(resp, do_raw, is_last_response)
{
  var ret = [];
  var classname = "";

  var should_track_content =
    resp.saw_responsefinished &&
    (!resp.responsebody || !resp.responsebody.content) &&
    (!resp.logger_entry_called_get_body || resp.logger_entry_get_body_unsuccessful);

  if (should_track_content)
  {
    // Ask to enable content-tracking.
    classname = "network_info";
    ret.push(ui_strings.S_NETWORK_REQUEST_DETAIL_NO_RESPONSE_BODY);
  }
  else
  {
    if (!resp.responsebody)
    {
      if (is_last_response && !resp.logger_entry_is_finished)
      {
        // Unfinished.
        classname = "network_info";
        ret.push(ui_strings.S_NETWORK_REQUEST_DETAIL_BODY_UNFINISHED);
      }
      // else
        // We're in the middle of getting it via GetResource, or there is in fact no responsebody.
    }
    else
    {
      // Attempt to display the responsebody.
      if (TEXT_TYPES.contains(resp.logger_entry_type))
      {
        ret.push(
          this._pre(resp.responsebody.content.stringData, "network-body")
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
  if (ret.length)
    ret.unshift(this._pre("\n"));

  if (do_raw)
    return ret;
  else
    return ["tbody", ret.map(this._col_or_row), "class", classname];
};

})(window.templates.network);
