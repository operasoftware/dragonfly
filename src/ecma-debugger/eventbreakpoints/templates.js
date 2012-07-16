(function()
{
  /* extends window.templates interface */

  /* constants */

  const NAME = 0, CHECKED = 1, INDEX = 2;

  this.ev_brp_config = function(events)
  {
    return ['ul', events.map(this.ev_brp_section, this)];
  }

  this.ev_brp_section = function(section, index)
  {
    return (
    [
      'li',
        ['header',
          ['input', 'type', 'button', 'class', section.is_unfolded ? 'unfolded' : ''],
          section.title,
          'handler', 'ev-brp-expand-section',
        ],
        section.is_unfolded ?
        this.ev_brp_event_list(section) :
        [],
      'index', index.toString(),
      'class', section.is_search && !section.is_unfolded ? 'search-no-match' : ''
    ]);

  }

  this.ev_brp_event_list = function(section)
  {
    return (
    ['ul',
      section.events.map(this.ev_brp_event, this),
      section.editable ? this.ev_brp_edit() : [],
      'class', 'event-list'
    ]);
  }

  this.ev_brp_event = function(event)
  {
    return (
    ['li',
      ['label',
        ['input',
          'type', 'checkbox',
          'index', event[INDEX].toString(), // the index of the map callback is wrong with a search
          'handler', 'event-breakpoint',
        ].concat(event[CHECKED] ? ['checked', 'checked'] : []),
        event[NAME],
        'data-spec', "dom#" + event[NAME]
      ]
    ]);
  }

  this.ev_brp_edit = function()
  {
    return (
    ['li',
      ['span',
        ui_strings.S_BUTTON_EDIT_CUSTOM_EVENT,
        'handler', 'ev-brp-edit-custom-events',
        'class', 'ui-button',
        'tabindex', '1'
      ],
      'class', 'controls'
    ]);
  }

  this.ev_brp_edit_section = function(section)
  {
    var event_list = section.events.map(function(event){return event[NAME];}, this);
    return (
    ['ul',
      ['li',
        ['_auto_height_textarea',
          event_list.join('\r\n'),
          'data-placeholder', '<list of custom events>',
          'title', 'Comma, space or new line separated list of custom events'
        ]
      ],
      ['li',
        ['span',
          ui_strings.S_BUTTON_TEXT_APPLY,
          'handler', 'ev-brp-edit-custom-events-save',
          'class', 'ui-button',
          'tabindex', '1'
        ],
        ['span',
          ui_strings.S_BUTTON_CANCEL,
          'handler', 'ev-brp-edit-custom-events-cancel',
          'class', 'ui-button',
          'tabindex', '1'
        ],
        'class', 'controls'
      ],
      'class', 'event-list'
    ]);
  }

}).apply(window.templates || (window.templates = {}));
