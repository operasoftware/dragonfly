"use strict";

window.templates || (window.templates = {});
window.templates.network || (window.templates.network = {});

(function(templates) {

var HTTP_BOUNDARY_CLASS = "http-token-type-boundary";
var TEXT_TYPES = ["markup", "script", "css", "text"];

templates._pre = function(content)
{
  return ["pre", content, "class", "mono"];
};

templates.details = function(entry, left_val, do_raw, do_wrap)
{
  return (
    ["div",
      [
        ["span",
          "class", "resize-request-detail",
          "handler", "resize-request-detail"
        ],
        ["div",
          ["div",
            this._details_headline(entry),
            this._details_content(entry, do_raw),
            "class", "table-cell"
          ],
          "data-object-id", String(entry.id),
          "class", "entry-details"
        ]
      ],
    "class", "network-details-container" + 
             (do_wrap ? " network-details-container-wrap" : ""),
    "style", "left:" + left_val + "px"]
  );
};

templates._details_content = function(entry, do_raw)
{
  return [
    entry.requests_responses.map(do_raw ? this._requests_responses_raw_bound
                                        : this._requests_responses_parsed_bound)
  ];
};

templates._details_headline = function(entry)
{
  var responsecode = entry.current_responsecode;
  if (responsecode && responsecode in cls.ResourceUtil.http_status_codes)
     responsecode = responsecode + " " + cls.ResourceUtil.http_status_codes[responsecode];

  var response_summary = [];
  if (entry.touched_network && responsecode)
  {
    response_summary = [
      "p", String(responsecode),
      "data-spec", "http#" + entry.current_responsecode,
      "class", (entry.error_in_current_response ? templates.ERROR_RESPONSE
                                                : "") + " response-summary"
    ];
  }
  else
  {
    var local_url_types = [
      cls.ResourceManager["1.2"].UrlLoad.URLType.FILE,
      cls.ResourceManager["1.2"].UrlLoad.URLType.DATA
    ];
    response_summary = [
      "p", local_url_types.contains(entry.urltype) ? ui_strings.S_NETWORK_NOT_REQUESTED
                                                   : ui_strings.S_NETWORK_SERVED_FROM_CACHE,
      "class", templates.NOT_REQUESTED
    ];
  }

  return [
    ["p",
      [
        "span", (entry.current_request && entry.current_request.method + " ") || ""
      ],
      [
        "span", entry.url,
        "class", "url"
      ],
      "class", "method-and-url"
    ],
    response_summary
  ];
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
  var is_relevant = is_last && request.was_responded_to;

  var expanded = window.settings.network_logger.get("expand-requests");
  var show_headline = is_relevant;
  var show_headers = is_relevant && expanded;
  var show_body = show_headers;

  return [
    show_headline ? this._headline(false, expanded) : [],
    show_headers ? templates._request_headers(request, do_raw) : [],
    show_body ? templates._request_body(request, do_raw) : []
  ];
};

templates._response = function(response, is_last, do_raw)
{
  var expanded = window.settings.network_logger.get("expand-responses");
  var show_headline = response.logger_entry_touched_network;
  var show_headers = expanded && response.logger_entry_touched_network;
  var show_body = expanded;

  return [
    show_headline ? this._headline(true, expanded) : [],
    show_headers ? this._response_headers(response, do_raw) : [],
    show_body ? this._response_body(response, do_raw, is_last) : []
  ];
};

templates._headline = function(is_response, is_unfolded)
{
  return [
    "div",
      ["input",
        "type", "button",
        "class", is_unfolded ? "unfolded" : ""
      ],
      is_response ? ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE
                  : ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE,
      "handler", "toggle-expand-request-response",
      "class", "header"
  ].concat(is_response ? ["data-is-response", "data-is-response"] : []);
};

templates._header_token_templ = function(state, token)
{
  var TYPE = 0;
  var STR = 1;
  var highlighted_types = [
    cls.HTTPHeaderTokenizer.types.NAME,
    cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART
  ];
  var attrs = ["class", cls.HTTPHeaderTokenizer.classnames[token[TYPE]]];

  if (highlighted_types.indexOf(token[TYPE]) != -1)
  {
    if (token[TYPE] === cls.HTTPHeaderTokenizer.types.NAME)
    {
      attrs.extend(["data-spec", "http#" + token[STR].trim(), "data-tooltip", "network-header-tooltip"]);
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
    var buffer = state.str_buffer;
    var ret = [["span", token[STR]].concat(attrs)];
    if (buffer)
    {
      ret.unshift(buffer);
      state.str_buffer = "";
    }
    return ret;
  }
  state.str_buffer += token[STR];
  return [];
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
      var METHOD = 0;
      return this._pre(this.headers_tonkenized(req.header_tokens, [METHOD]));
    }
    return ["span", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL,
            "class", templates.UI_CLASSNAME];
  }

  var ret = [];
  if (!req.request_headers)
  {
    ret.push(["span", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL,
              "class", templates.UI_CLASSNAME]);
  }
  else
  {
    ret.extend(req.request_headers.map(this._headers_pseudo_raw));
    if (req.first_line)
    {
      var firstline = [];
      if (!req.firstline_tokens)
      {
        req.firstline_tokens = [];
        var tokenizer = new cls.HTTPHeaderTokenizer();
        tokenizer.tokenize(req.first_line, this._token_receiver.bind(this, req.firstline_tokens))
      }

      if (req.firstline_tokens.length)
      {
        var METHOD = 0;
        ret.unshift(this.headers_tonkenized(req.firstline_tokens, [METHOD]));
      }
    }
  }
  return templates._pre(ret);
};

templates._reduce_tokens = function(map_func, previous_val, current_val, index){
  if (index == 1)
    previous_val = map_func(previous_val);
  return previous_val.concat(map_func(current_val));
};

templates.headers_tonkenized = function(tokens, data_spec_firstline_tokens)
{
  var state_holder = new cls.HTTPHeaderTokenizer.TokenStateholder(data_spec_firstline_tokens);
  var map_func = this._header_token_templ.bind(this, state_holder);
  var token_templates = tokens.reduce(this._reduce_tokens.bind(this, map_func));
  token_templates.push(state_holder.str_buffer);
  return token_templates;
};

templates._response_headers = function(resp, do_raw)
{
  if (do_raw)
  {
    if (!resp.header_tokens)
    {
      resp.header_tokens = [];
      if (resp.response_headers_raw)
      {
        var tokenizer = new cls.HTTPHeaderTokenizer();
        tokenizer.tokenize(resp.response_headers_raw, this._token_receiver.bind(this, resp.header_tokens));
      }
    }

    if (resp.header_tokens.length)
    {
      var RESPONSECODE = 1;
      return this._pre(this.headers_tonkenized(resp.header_tokens, [RESPONSECODE]));
    }
    return ["span", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL,
            "class", templates.UI_CLASSNAME];
  }

  var ret = resp.response_headers && resp.response_headers.map(this._headers_pseudo_raw);
  if (resp.first_line)
  {
    var firstline = [];
    if (!resp.firstline_tokens)
    {
      resp.firstline_tokens = [];
      var tokenizer = new cls.HTTPHeaderTokenizer();
      tokenizer.tokenize(resp.first_line, this._token_receiver.bind(this, resp.firstline_tokens))
    }

    if (resp.firstline_tokens.length)
    {
      ret.unshift(this.headers_tonkenized(resp.firstline_tokens, [RESPONSECODE]));
    }
  }
  if (!ret)
  {
    ret = ["span", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL,
           "class", templates.UI_CLASSNAME];
  }
  return templates._pre(ret);
};

templates._headers_pseudo_raw = function(header)
{
  /* Shortcutting. For raw headers, highlighted types are defined like this:
  var highlighted_types = [
    cls.HTTPHeaderTokenizer.types.NAME,
    cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART
  ];
  */
  var template = [
    ["span", header.name,
      "data-spec", "http#" + header.name.trim(),
      "class", cls.HTTPHeaderTokenizer.classnames[cls.HTTPHeaderTokenizer.types.NAME],
      "data-tooltip", "network-header-tooltip",
      "data-header-name", header.name.trim().toLowerCase()
    ],
    ": " + header.value + "\n"
  ];
  return template;
};

templates.param_cells = function(name_value)
{
  var parts = name_value.replace(/\+/g, " ").split("=");
  return [
    "tr",
      ["td", decodeURIComponent(parts[0]), "class", "mono"],
      ["td", decodeURIComponent(parts[1]), "class", "mono"]
  ];
};

templates._request_body = function(req, do_raw)
{
  if (req.request_body == null)
    return [];

  var ret;
  if (req.request_body.partList.length) // Multipart
  {
    ret = [];
    var use_raw_boundary = Boolean(do_raw && req.boundary);
    var raw_boundary = req.boundary;
    for (var n = 0, part; part = req.request_body.partList[n]; n++)
    {
      if (n === 0)
      {
        if (use_raw_boundary)
          ret.push(["span", raw_boundary, "class", HTTP_BOUNDARY_CLASS]);
        else
          ret.push(["hr"]);
      }

      ret.push(["span", "\n"]);
      ret.extend(part.headerList.map(this._headers_pseudo_raw));
      ret.push(["span", "\n"]);
      if (part.content && part.content.stringData)
        ret.push(part.content.stringData);
      else
        ret.push(["span", ui_strings.S_NETWORK_N_BYTE_BODY.replace("%s", part.contentLength),
                               "class", templates.UI_CLASSNAME]);

      if (use_raw_boundary && part === req.request_body.partList.last)
        raw_boundary += "--";

      if (use_raw_boundary)
        ret.push(["span", "\n" + raw_boundary, "class", HTTP_BOUNDARY_CLASS]);
      else
        ret.push(["hr"]);
    }
  }
  else if (req.request_body.mimeType.startswith("application/x-www-form-urlencoded"))
  {
    var ret;
    if (do_raw)
    {
      ret = req.request_body.content.stringData;
    }
    else
    {
      var parts = req.request_body.content.stringData.split("&");
      var rows = [];
      rows.push([
        "tr",
          ["th", ["span", ui_strings.S_LABEL_NETWORK_POST_DATA_NAME, "class", templates.UI_CLASSNAME]],
          ["th", ["span", ui_strings.S_LABEL_NETWORK_POST_DATA_VALUE, "class", templates.UI_CLASSNAME]]
        ]
      );
      rows.extend(parts.map(this.param_cells));
      var table = ["table", rows];
      ret = table;
    }
  }
  else // not multipart or form.
  {
    if (req.request_body.content)
    {
      var type = cls.ResourceUtil.mime_to_type(req.request_body.mimeType);
      if (TEXT_TYPES.contains(type))
      {
        ret = req.request_body.content.stringData;
      }
      else
      {
        if (req.request_body.mimeType)
        {
          ret = ["span", ui_strings.S_NETWORK_CANT_DISPLAY_TYPE.replace("%s", req.request_body.mimeType),
                 "class", templates.UI_CLASSNAME];
        }
        else
        {
          ret = ["span", ui_strings.S_NETWORK_UNKNOWN_MIME_TYPE,
                 "class", templates.UI_CLASSNAME];
        }
      }
    }
  }
  return [this._pre("\n"), templates._pre(ret)];
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
        ret.push(this._pre(resp.responsebody.content.stringData));
      }
      else if (resp.logger_entry_type == "image")
      {
        ret.push(["img", "src", resp.responsebody.content.stringData]);
      }
      else
      {
        ret.push(
          ["span", ui_strings.S_NETWORK_REQUEST_DETAIL_UNDISPLAYABLE_BODY_LABEL.replace("%s", resp.logger_entry_mime),
           "class", templates.UI_CLASSNAME]
        );
      }
    }
  }
  if (ret.length)
    ret.unshift(this._pre("\n"));

  return ret;
};

})(window.templates.network);
