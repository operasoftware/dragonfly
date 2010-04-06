window.templates || (window.templates = {});

window.templates.storage = function(storages, storage_id, storage_title)
{
  /*
  storages
  {
    "storage_id": <storage id>,
    "<rt-id>":
    {
      "rt_id": <rt-id>,
      "storage":
      [
        {
          "key": <key>,
          "value": <value>,
          "type": <type>
        },
        ...
      ]
    },
    ...
  }

  window.runtimes.getRuntime(<rt-id>)
  {
    "runtime_id": <rt-id>,
    "html_frame_path": <frame-path>,
    "window_id": <window-id>,
    "object_id": <object-id>,
    "uri": <uri>,
    "is_top": <is-top-runtime>,
    "title": <title>,
  }
  */

  var rt_id = '', storage = null, rt = null, ret = [];
  for (rt_id in storages)
  {
    if((storage = storages[rt_id]) && (rt = window.runtimes.getRuntime(storage.rt_id)))
    {
      ret.push(
      ['div',
        ['table',
          this.storage_domain_header(rt),
          storage.storage.map(this.storage_item, this),
          ['tr',
            ['th',
              this.storage_button({title: ui_strings.S_LABEL_STORAGE_ADD, handler: 'storage-add-key'}),
              this.storage_button({title: ui_strings.S_LABEL_STORAGE_UPDATE, handler: 'storage-update'}),
              this.storage_button({label: ui_strings.S_BUTTON_STORAGE_DELETE_ALL, handler: 'storage-delete-all'}),
              'colspan', '3',
              'class', 'single-control'
            ]
          ],
          'data-rt-id', rt_id,
          'data-storage-id', storage_id,
          'class', 'storage-table'
        ],
        'class', 'storage-domain'
      ]);
    }
  }
  return  ['div', ret, 'class', 'padding'];
}

window.templates.storage_domain_header = function(rt)
{
  return ['caption', rt.title || window.helpers.shortenURI(rt.uri).uri];
};

window.templates.storage_item = function(entry, index, storage_arr)
{
  var value = entry.value, pos = value.indexOf('\n');
  if(pos > -1)
  {
    value = value.slice(0, pos).replace(/\r$/, '') + ' ...';
  }
  return (
  ['tr',
    ['td', entry.key, 'class', 'key'],
    ['td',
      value,
      'edit-handler', 'storage-edit',
      'title', ui_strings.S_LABEL_STORAGE_DOUBLE_CLICK_TO_EDIT,
      'class', 'value'],
    ['td',
      this.storage_button({title: ui_strings.S_LABEL_STORAGE_DELETE, handler: 'storage-delete'}),
      'class', 'control'
    ],
    'data-storage-key', entry.key
  ]);
};

window.templates.storage_item_edit = function(item, index)
{
  return (
  ['tr',
    ['td',
      ['h4', item.key],
      ['_auto_height_textarea', item.value],
      ['p',
        this.storage_button({label: ui_strings.S_BUTTON_SAVE, handler: 'storage-save'}),
        this.storage_button({label: ui_strings.S_BUTTON_CANCEL, handler: 'storage-edit-cancel'}),
      ],
      'class', 'storage-edit',
      'colspan', '3'
    ],
    'data-storage-key', item.key,
  ]);
};

window.templates.storage_item_add = function()
{
  return (
  ['tr',
    ['td',
      ['h4', ['_html5_input', 'data-placeholder', '<new key>', 'class', 'new-key']],
      ['_auto_height_textarea', 'data-placeholder', '<new value>'],
      ['p',
        this.storage_button({label: ui_strings.S_BUTTON_SAVE, handler: 'storage-save'}),
        this.storage_button({label: ui_strings.S_BUTTON_CANCEL, handler: 'storage-edit-cancel'}),
      ],
      'class', 'storage-edit',
      'colspan', '3'
    ],
  ]);
};

window.templates.storage_button = function(action)
{
  var templ =
  ['input',
    'type', 'button',
    'handler', action.handler
  ];
  if (action.label)
    templ.push('value', action.label);
  if (action.title)
    templ.push('title', action.title);
  return templ;
};

window.templates.storage_not_existing = function(storage_id)
{
  return (
  ['div',
    ['div',
      ui_strings.S_INFO_STORAGE_TYPE_DOES_NOT_EXIST.replace("%s", 'window.' + storage_id),
      'class', 'info-box'
    ],
    'class', 'padding'
  ]);
};
