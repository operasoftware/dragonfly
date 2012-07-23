window.templates = window.templates || {};
window.templates.errors = window.templates.errors || {};

window.templates.errors._source_map = {
  "svg": {
    icon: "markup",
    title: "SVG"
  },
  "html": {
    icon: "markup",
    title: "HTML"
  },
  "xml": {
    icon: "markup",
    title: "XML"
  },
  "css": {
    icon: "css",
    title: "CSS"
  },
  "ecmascript": {
    icon: "script",
    title: "Ecmascript"
  },
  "persistent_storage": {
    icon: "storage",
    title: "Persistent Storage"
  }
};

window.templates.errors.log_table = function(entries, allExpanded, expandedList, viewId)
{
  var rowClosure = function(e)
  {
    return window.templates.errors.log_row(e, allExpanded, expandedList, viewId);
  };

  return [
    "table", entries.map(rowClosure),
    "class", "sortable-table errors-table",
  ];
};

window.templates.errors.log_row = function(entry, allExpanded, toggledList, viewId)
{
  var expanded;
  if (allExpanded)
  {
    expanded = true;
    if (toggledList.indexOf(entry.id) != -1)
    {
      expanded = false;
    }
  }
  else
  {
    expanded = toggledList.indexOf(entry.id) != -1;
  }
  if (entry.requires_expansion)
  {
    expanded = true;
  }

  var location_title = entry.context;
  if (entry.line && entry.uri)
  {
    location_title = ui_strings.M_VIEW_LABEL_ERROR_LOCATION_TITLE
                                        .replace("%(LINE)s", entry.line)
                                        .replace("%(URI)s", entry.uri)
  }

  var expandable = true;
  if (entry.title === entry.description)
  {
    expandable = false;
  }

  var expand_button = [
    "span", "",
       "data-logid", entry.id,
       "data-viewid", viewId,
       "unselectable", "on",
       "class", "expander",
       "tabindex", "1"
  ];

  var severity = entry.severity || "information";
  var icon_cell = [
    "span",
    "class", "severity " + severity,
    "title", severity
  ];

  if (viewId == "console-all")
  {
    var source = templates.errors._source_map[entry.source];
    icon_cell = ["span",
      "class", "resource-icon resource-type-" + (source && source.icon),
      "title", (source && source.title) || entry.source
    ];
  }

  return [
    "tr", [
      ["td", icon_cell, "class", "icon_cell"],
      ["td", (expandable ? expand_button : ""), "class", "expand_cell"],
      ["td",
        [
          ["pre", entry.title.trim(), "class", "mono title"],
          ["pre", entry.details, "class", "mono details"]
        ],
        "class", "main"
      ],
      ["td", entry.context, "class", "context"],
      ["td",
         entry.location_string,
         "title", location_title,
         "class", "location " + (entry.uri ? "internal-link" : ""),
         "handler", "open-resource-tab",
         "data-resource-url", entry.uri,
         "data-resource-line-number", entry.line ? entry.line : ""
      ]
    ],
    "class", (expandable ? "expandable" : "") + (expanded ? " expanded" : " collapsed"),
    "handler", expandable ? "error-log-list-expand-collapse" : "",
    "data-logid", entry.id,
    "data-viewid", viewId
  ];
};

window.templates.errors.exceeds_max = function(limit, org_length)
{
  return [
    "div", ui_strings.S_ERRORS_MAXIMUM_REACHED.replace('%(COUNT)s', org_length).replace('%(MAX)s', limit),
    "class", "max_exceeded_warning"
  ];
};

window.templates.errors.log_settings_css_filter = function(setting)
{
  return (
  [
    ['setting-composite',
      window.templates.settingCheckbox('console',
                                       'use-css-filter',
                                       setting.get('use-css-filter'),
                                       ui_strings.S_ERROR_LOG_CSS_FILTER),
      ['label',
        ['_auto_height_textarea',
          setting.get('css-filter'),
          'handler', 'error-console-css-filter',
          'id', 'error-console-css-filter',
        ],
      ]
    ]
  ]);
};
