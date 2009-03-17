window.templates || ( window.templates = {} );

templates.navigation = function()
{
  return \
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
      ]
    ]
  ]
}

templates.empty = function()
{
  return [];
}