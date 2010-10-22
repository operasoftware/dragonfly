window.templates || (window.templates = {});

templates.network_options_main = function(headers)
{
  return ["div",
           ["button", "Clear cache", "handler", "network-options-clear-cache"],
           ["hr"],
           ["label", "Disable caching:", ["input", "", "type", "checkbox",
                                           "handler", "network-options-toggle-caching"]],
           ["hr"],
           ["fieldset", ["legend", "Global header rewrites"],
               templates.network_options_header_table(headers)
           ],
           "class", "padding network-options"
         ];
};

templates.network_options_header_table = function(headers)
{
  var fun = function(header) {
      return ["tr",
               ["td", "DEL"],
               ["td", "ON"],
               ["td", ["input", "", "value", header.name]],
               ["td", ["input", "", "value", header.value]]
             ];
  };

  var tpl = ["table",
              ["tr",
                ["th", "X"], ["th", "Y"], ["th", "Name"], ["th", "Value"]],
                headers.map(fun)
            ];
  return tpl;
};

templates.network_request_crafter_main = function(prev_request, prev_response)
{
  return ["div",
           ["div", ["textarea", prev_request]],
           ["button", "Send request", "handler", "request-crafter-send"],
           ["hr"],
           ["div", ["pre", ["code", prev_response]]],
           "class", "padding request-crafter"
         ];
};