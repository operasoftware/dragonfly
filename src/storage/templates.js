window.templates = window.templates || {};

window.templates.local_storage = function(local_storages)
{
  /*
  local_storages
  {
    "<rt-id>":
    {
      "host_storage": <object-id>,
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

  var 
  rt_id = '', 
  storage = null, 
  rt = null,
  ret = [];

  for (rt_id in local_storages)
  {
    storage = local_storages[rt_id];
    if(storage)
    {
      rt = window.runtimes.getRuntime(storage.rt_id);
      ret.push(
      ['div',
        ['table',
          window.templates.storage_domain_header(rt),
          ['tr', 
            ['td', 'Key'], 
            ['td', 'Value'], 
            ['th',
              window.templates.storage_button({label: 'Delete all', handler: 'storage-delete-all'})
            ]
          ],
          storage.storage.map(window.templates.storage_item),
          ['tr', 
            ['th',
              window.templates.storage_button({label: 'Add', handler: 'storage-add-key'}),
              'colspan', '3',
              'class', 'add-key'
            ]
          ],
          'data-rt-id', rt_id,
          'class', 'storage-table'
        ],
        'class', 'storage-domain'
      ]);
    }
  }
  
  return (
  ['div',
    ['h2', 'Local Storage'],
    ret,
    'class', 'padding'
  ]);
}

window.templates.storage_domain_header = function(rt)
{
  return (
  ['tr', 
    ['th', rt.title || window.helpers.shortenURI(rt.uri), 'colspan', '3']
  ]);
}

window.templates.storage_item = function(entry, index, storage_arr)
{
  const MAX_LENGTH = 15;
  return (
  ['tr',
    ['td', entry.key],
    ['td', entry.value.length > MAX_LENGTH ? entry.value.slice(0, MAX_LENGTH) + '...' : entry.value],
    ['td', 
      window.templates.storage_button({label: 'Edit', handler: 'storage-edit'}),
      window.templates.storage_button({label: 'Delete', handler: 'storage-delete'})
    ],
    'data-storage-key', entry.key
  ]);
}

window.templates.storage_item_edit = function(item, index)
{
  return (
  ['tr',
    ['td',
      ['h4', item.key],
      ['textarea', item.value],
      ['p',
        window.templates.storage_button({label: 'Save', handler: 'storage-save'}),
        window.templates.storage_button({label: 'Cancel', handler: 'storage-edit-cancel'}),
      ],
      'class', 'storage-edit',
      'colspan', '4'
    ],
    'data-storage-key', item.key,
  ]);
}

window.templates.storage_item_add = function()
{
  return (
  ['tr',
    ['td',
      ['input', 'class', 'new-key'],
      ['textarea'],
      ['p',
        window.templates.storage_button({label: 'Save', handler: 'storage-save'}),
        window.templates.storage_button({label: 'Cancel', handler: 'storage-edit-cancel'}),
      ],
      'class', 'storage-edit',
      'colspan', '4'
    ],
  ]);
}

window.templates.storage_button = function(action)
{
  return (
  ['input', 
    'type', 'button',
    'value', action.label,
    'handler', action.handler
  ]);
}
