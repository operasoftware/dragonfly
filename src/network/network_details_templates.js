"use strict";

window.templates || (window.templates = {});
window.templates.network || (window.templates.network = {});

(function(templates) {

var HTTP_BOUNDARY_CLASS = "http-token-type-boundary";
var TEXT_TYPES = ["markup", "script", "css", "text"];
var LOCAL_URL_TYPES = [
  cls.ResourceManager["1.2"].UrlLoad.URLType.FILE,
  cls.ResourceManager["1.2"].UrlLoad.URLType.DATA
];
var HIGHLIGHTED_TYPES = [
  cls.HTTPHeaderTokenizer.types.NAME,
  cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART
];

var _TokenToTemplateContext = function(is_response)
{
  var spec_tokens;
  if (!is_response)
  {
    var firstline = { METHOD: 0, URI: 1, HTTP_VERSION: 2 };
    spec_tokens = [firstline.METHOD];
  }
  else
  {
    var firstline = { PROTOCOL: 0, RESPONSE_CODE: 1, RESPONSE_PHRASE: 2 };
    spec_tokens = [firstline.RESPONSE_CODE];
  }
  this.spec_tokens = spec_tokens;
  this.saw_firstline_tokens = 0;
  this.str_buffer = "";
  this.template = [];
};

templates._pre = function(content)
{
  return ["pre", content, "class", "mono"];
};

templates.details = function(entry)
{
  var settings = window.settings["network-detail-overlay"];
  var do_raw = !settings.get("view-parsed");
  var do_wrap = settings.get("wrap-detail-view");
  return (
    ["div",
      this._details_headline(entry),
      this._details_content(entry, do_raw),
      "class", "table" + (do_wrap ? " wrap" : "")
    ]
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
  var response_code = entry.current_responsecode;
  if (response_code && response_code in cls.ResourceUtil.http_status_codes)
     response_code = response_code + " " + cls.ResourceUtil.http_status_codes[response_code];

  var response_summary = [];
  if (entry.touched_network && response_code)
  {
    response_summary = [
      "p", String(response_code),
      "data-spec", "http#" + entry.current_responsecode,
      "class", (entry.error_in_current_response ? templates.ERROR_RESPONSE
                                                : "") + " response-summary"
    ];
  }
  else
  {
    response_summary = [
      "p", LOCAL_URL_TYPES.contains(entry.urltype) ?
        ui_strings.S_NETWORK_NOT_REQUESTED : ui_strings.S_NETWORK_SERVED_FROM_CACHE,
      "class", templates.NOT_REQUESTED
    ];
  }

  return [
    ["p",
      ["span",
        (entry.current_request && entry.current_request.method + " ") || ""
      ],
      ["span", entry.url,
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
  var settings = window.settings["network-detail-overlay"];
  var expanded = settings.get("expand-requests");
  var show_header = is_relevant;
  var show_content = is_relevant && expanded;

  return [
    "div",
      show_header ? templates._headline(false, expanded) : [],
      show_content ?
        ["div",
          templates._request_headers(request, do_raw),
          templates._request_body(request, do_raw),
          "class", "foldable"
        ] : [],
      "class", (expanded ? "unfolded" : "")
  ];
};

templates._response = function(response, is_last, do_raw)
{
  var settings = window.settings["network-detail-overlay"];
  var expanded = settings.get("expand-responses");
  var show_header = response.logger_entry_touched_network;
  var show_headers = expanded && response.logger_entry_touched_network;
  var show_body = !show_header || (show_header && expanded);
  var show_content = show_headers || show_body;

  return [
    "div",
      show_header ? this._headline(true, expanded) : [],
      show_content ?
        ["div",
          show_headers ? this._response_headers(response, do_raw) : [],
          show_body ? this._response_body(response, do_raw, is_last) : [],
          "class", "foldable"
        ] : [],
      "class", (show_header && expanded ? "unfolded" : "")
  ];
};

templates._headline = function(is_response, is_unfolded)
{
  var headline = [
    "div",
      ["input",
        "type", "button"
      ],
      is_response ? ui_strings.S_NETWORK_REQUEST_DETAIL_RESPONSE_TITLE
                  : ui_strings.S_NETWORK_REQUEST_DETAIL_REQUEST_TITLE,
      "handler", "toggle-expand-request-response",
      "class", "header"
  ];
  if (is_response)
    headline.push("data-is-response", "data-is-response");
  return headline;
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
      var header_tokens = [];
      var tokenizer = new cls.HTTPHeaderTokenizer();
      tokenizer.tokenize(req.request_headers_raw, this._token_receiver.bind(this, header_tokens));
      return this._pre(this.headers_tonkenized(header_tokens, false));
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
      var firstline_tokens = [];
      var tokenizer = new cls.HTTPHeaderTokenizer();
      tokenizer.tokenize(req.first_line, this._token_receiver.bind(this, firstline_tokens))
      if (firstline_tokens.length)
      {
        ret.unshift(this.headers_tonkenized(firstline_tokens, false));
      }
    }
  }
  return templates._pre(ret);
};

templates._reduce_tokens = function(context, token, index)
{
  var TYPE = 0;
  var STR = 1;
  if (HIGHLIGHTED_TYPES.contains(token[TYPE]))
  {
    var token_templ = ["span", token[STR],
                       "class", cls.HTTPHeaderTokenizer.classnames[token[TYPE]]];
    if (token[TYPE] === cls.HTTPHeaderTokenizer.types.NAME)
    {
      token_templ.push("data-spec", "http#" + token[STR].trim());
    }
    else if (token[TYPE] === cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART)
    {
      if (context.spec_tokens.contains(context.saw_firstline_tokens))
      {
        token_templ.push("data-spec", "http#" + (token[STR]).trim());
      }
      context.saw_firstline_tokens++;
    }

    if (context.str_buffer)
    {
      context.template.push(context.str_buffer);
      context.str_buffer = "";
    }
    context.template.push(token_templ);
  }
  else
    context.str_buffer += token[STR];

  return context;
};

templates.headers_tonkenized = function(tokens, is_response)
{
  var context = new _TokenToTemplateContext(is_response);
  var template = tokens.reduce(this._reduce_tokens, context).template;
  if (context.str_buffer)
    template.push(context.str_buffer);
  return template;
};

templates._response_headers = function(resp, do_raw)
{
  if (do_raw)
  {
    var header_tokens = [];
    if (resp.response_headers_raw)
    {
      var tokenizer = new cls.HTTPHeaderTokenizer();
      tokenizer.tokenize(resp.response_headers_raw, this._token_receiver.bind(this, header_tokens));
    }

    if (header_tokens.length)
    {
      return this._pre(this.headers_tonkenized(header_tokens, true));
    }
    return ["span", ui_strings.S_NETWORK_REQUEST_NO_HEADERS_LABEL,
            "class", templates.UI_CLASSNAME];
  }

  var ret = resp.response_headers && resp.response_headers.map(this._headers_pseudo_raw);
  if (resp.first_line)
  {
    var firstline_tokens = [];
    var tokenizer = new cls.HTTPHeaderTokenizer();
    tokenizer.tokenize(resp.first_line, this._token_receiver.bind(this, firstline_tokens))
    if (firstline_tokens.length)
      ret.unshift(this.headers_tonkenized(firstline_tokens, true));
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
  var HIGHLIGHTED_TYPES = [
    cls.HTTPHeaderTokenizer.types.NAME,
    cls.HTTPHeaderTokenizer.types.FIRST_LINE_PART
  ];
  */
  var template = [
    ["span", header.name,
      "data-spec", "http#" + header.name.trim(),
      "class", cls.HTTPHeaderTokenizer.classnames[cls.HTTPHeaderTokenizer.types.NAME],
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
  var BODY_SEPARATOR = "\n";
  return [this._pre(BODY_SEPARATOR), templates._pre(ret)];
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
