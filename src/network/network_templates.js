window.templates || (window.templates = {});

templates.network_options_main = function()
{
  return ["div",
           ["button", "Clear cache", "handler", "network-options-clear-cache"],
           ["hr"],
           ["label", "Disable caching:", ["input", "", "type", "checkbox",
                                           "handler", "network-options-toggle-caching"]],
           ["hr"],
           ["fieldset", ["legend", "Global header rewrites"],
                        ["table", ["tr", ["th", "Name"], ["th", "Value"]]]
           ],
           "class", "padding network-options"
         ];
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