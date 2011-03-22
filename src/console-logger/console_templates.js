window.templates = window.templates || {};

window.templates.error_log_table = function(entries, allExpanded, expandedList, viewId)
{
  var rowClosure = function(e)
  {
    return window.templates.error_log_row(e, allExpanded, expandedList, viewId);
  };

  return [
    "table", [
      "tr", [
        ['th', ""],
        ['th', ""],
        ['th', ui_strings.S_COLUMN_LABEL_FILE],
        ['th', ui_strings.S_COLUMN_LABEL_LINE],
        ['th', ui_strings.S_COLUMN_LABEL_ERROR]
      ],
      "class", "header",
    ],
    entries.map(rowClosure),
    "class", "sortable-table",
  ];
};

window.templates.error_log_row = function(entry, allExpanded, toggledList, viewId)
{
  if (allExpanded)
  {
    var expanded = true;
    if (toggledList.indexOf(entry.id)!=-1)
    {
      expanded = false;
    }
  }
  else
  {
    var expanded = toggledList.indexOf(entry.id) != -1;
  }

  var severity = entry.severity || "information";
  var rows = [
    [
      "tr", [
      ["td", ["button", "",
                 "type", "button",
                 //"handler", "error-log-list-expand-collapse",
                 "data-logid", entry.id,
                 "data-viewid", viewId,
                 "unselectable", "on"
               ]
      ],
      ["td", ["span", "class", "severity " + severity, "title", severity]],
      ["td", entry.uri],
      ["td", (entry.line==null ? "?" : entry.line) ],
      ["td", entry.title]
     ],  "class", (expanded ? "expanded" : "collapsed"),
     "handler", "error-log-list-expand-collapse",
    "data-logid", entry.id,
    "data-viewid", viewId
    ]
  ];

  if (expanded)
  {
    rows.push(templates.error_log_detail_row(entry));
  }

  return rows;
};

window.templates.error_log_detail_row = function(entry)
{
  return [
    "tr", [
      ["td",
       [ "span", entry.uri,
         "handler", "open-resource-tab",
         "data-resource-url", entry.uri
       ],
       [ "pre", entry.description ],
                 "colspan", "5"
      ]
    ]
  ];
};

window.templates.error_log_settings_css_filter = function(setting)
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
      ],
      'class', 'error-console-setting',
    ]
  ]);
};