window.templates || ( window.templates = {} );

templates.navigation = function()
{
  return \
  [
    ['p', 'ctrl-d or click here to get a source snapshot', 'handler', 'source-view'],
    ['div',
      ['ul',
        ['li', 
          ['h2', 'Views'],
          ['ul',
            ['li', 
              ['a', 'Home', 'href', '../home/application.xml']
            ],
            ['li', 
              ['a', 'Top Tabs', 'href', '../views-top-tabs/application.xml']
            ],
            ['li', 
              ['a', 'Second Level Tabs', 'href', '../views-second-level-tabs/application.xml']
            ],
            ['li', 
              ['a', 'Split View', 'href', '../views-split-view/application.xml']
            ],
            ['li', 
              ['a', 'Combinations', 'href', '../views-combinations/application.xml']
            ]
          ]
        ],
        ['li', 
          ['h2', 'Widgets'],
          ['ul',
            ['li', 
              ['a', 'Toolbar Buttons', 'href', '../widgets-toolbar-buttons/application.xml']
            ],
            ['li', 
              ['a', 'Toolbar Switch', 'href', '../widgets-toolbar-switch/application.xml']
            ],
            ['li', 
              ['a', 'Custom Select', 'href', '../widgets-custom-selects/application.xml']
            ],
            ['li', 
              ['a', 'Search', 'href', '../widgets-toolbar-search/application.xml']
            ]
          ]
        ],
        ['li', 
          ['h2', 'Utils'],
          ['ul',
            ['li', 
              ['a', 'Templates', 'href', '../utils-templates/application.xml']
            ],
            ['li', 
              ['a', 'Actions, Keyhandlers and Filters', 'href', '../utils-filters/application.xml']
            ]
          ]
        ]
      ]
    ]
  ]
}

templates.empty = function()
{
  return [];
}