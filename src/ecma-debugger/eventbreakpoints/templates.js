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
          ['a', 'spec', 'href', section.spec, 'target', '_blank', 'class', 'spec-link'],
          'handler', 'ev-brp-expand-section',
        ],
        section.is_unfolded ?
        ['ul', this.ev_brp_event_list(section.events)] :
        [],
      'index', index.toString(),
      'class', section.is_search && !section.is_unfolded ? 'search-no-match' : ''
    ]);

  }

  this.ev_brp_event_list = function(event_list)
  {
    return ['ul', event_list.map(this.ev_brp_event, this), 'class', 'event-list'];
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
        event[NAME]
      ]
    ]);
  }

}).apply(window.templates || (window.templates = {}));
