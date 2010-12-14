window.templates || (window.templates = {});

templates.cookie_manager = {
  add_cookie_form: function(runtimes) {
    return [
      ["h2", "Add Cookie", "style", "padding: 20px; padding-bottom: 3px;"],
      ["form",
        [
          ["div",
            [
              ["label", "Domain"],
              ["br"],
              (function(){
                // depending on amount of domains, return selection list or text and hidden input field
                var domains = {};
                var domain_count = 0;
                var domain;
                for (var runtime_id in runtimes) {
                  domain = runtimes[runtime_id].hostname;
                  if(!domains[domain])
                  {
                    domains[domain] = { runtimes: [runtime_id] };
                    domain_count++;
                  }
                  else
                  {
                    domains[domain].runtimes.push(runtime_id);
                  }
                };
                if(domain_count <= 1) {
                  // 'domain' is left on the first and only value. maybe not the best way to do it.
                  return [
                    ["input", "type", "hidden", "name", "add_cookie_runtime", "value", domains[domain].runtimes.toString()],
                    ["span", runtimes[first_runtime_id].hostname]
                  ]
                }
                else {
                  var option_arr = [];
                  for (var id in domains) {
                    option_arr.push(["option", id, "value", domains[id].runtimes.toString()]);
                  };
                  return ["select", option_arr, "name", "add_cookie_runtime_select", "handler", "cookiemanager-add-cookie-domain-select", "class", "add_cookie_dropdown"];
                }
              })()
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Name"],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookiename"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Value"],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookievalue"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Path"],
              ["br"],
              ["input",
                "type", "text",
                "name", "cookiepath",
                "list", "cookiepathlist",
                "value", "/"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["label", "Expires"],
              ["br"],
              ["input",
                "type", "datetime",
                "name", "cookieexpires"
              ]
            ],
          "class", "container"],
          ["div",
            [
              ["br"],
              ["button", "Add",
               "handler", "add-cookie-handler"]
            ],
          "class", "container"]
        ],
      "class", "add-cookie-form"]
    ]
  }
}