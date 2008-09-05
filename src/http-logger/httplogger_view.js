/**
 * @fileoverview
 * HTTP logger view code.
 * Defines views for request list, header info etc.
 */

/**
  * @constructor 
  * @extends ViewBase
  */

cls.RequestListView = function(id, name, container_class)
{
    var self = this;
    this.isPaused = false;
    this.tableBodyEle = null;
    this.lastIndex = null;
    this.tbody = null;
    var filter = null;

    this.createView = function(container)
    {
        var log = HTTPLoggerData.getLog();
        if (this.lastIndex == null || log.length==0)
        {
            container.clearAndRender(
                ['table',
                    ['thead',
                        ['tr',
                            ['th', "#"],
                            ['th', "Host"],
                            ['th', "Path"],
                            ['th', "Method"],
                            ['th', "Status"],
                            ['th', "Time"]
                        ]
                    ],
                    ['tbody'],
                 'class', 'request-table'
                ]
            );
            this.tableBodyEle = container.getElementsByTagName('tbody')[0];
            this.lastIndex = 0;
        }

        if (!log.length) { return }
        
        var i = this.lastIndex;
        var sel = HTTPLoggerData.getSelectedRequestId();
        var req;
        var tpls = [];
        while (req=log[i++])
        {
            tpls.push(window.templates.request_list_row(i-1, req, sel));
        }
        this.tableBodyEle.render(tpls);
        
        this.lastIndex = i-1;

        var last = HTTPLoggerData.getLastModifiedRequestId();
        
        for (var n=0, e; e=this.tableBodyEle.childNodes[n]; n++)
        {
            var rid = e.getAttribute('data-requestid');
            if (rid == sel)
            {
                e.addClass('selected-request');
            }
            else
            {
                e.removeClass('selected-request');
            }
            
            if (last == rid)
            {
                req = HTTPLoggerData.getRequestById(rid);
                if (req.response)
                {
                    e.getElementsByClassName('status-cell')[0].textContent = req.response.status;
                    e.getElementsByClassName('time-cell')[0].textContent = req.response.time - req.request.time;
                }
            }
        }
        if (filter)
        {
            applyFilter()
        }
    }

    var clearFilter = function()
    {
        if (!self.tableBodyEle) { return }
        var rows = self.tableBodyEle.childNodes;
        for (var n=0, e; e=rows[n]; n++)
        {
            if (e.style.display == "none") { e.style.display = "" }
        }
    }

    var applyFilter = function()
    {
        if (!self.tableBodyEle) { return }
        var rows = self.tableBodyEle.childNodes;
        for (var n=0, e; e=rows[n]; n++)
        {
            var r = HTTPLoggerData.getRequestById(e.getAttribute("data-requestid"));
            var filtered = r.request.path.indexOf(filter)==-1 ;  //  fixme: last part should be enabled as soon as the duplicate IDs bug is fixed. &&  (r.request.headers["Host"] || "" ).indexOf(filter)==-1;
            if (filtered)
            {
                e.style.display = "none";
            }
            else
            {
                e.style.display = "";
            }
        }
        
    }

    this.setFilter = function(s)
    {
        if (filter && filter==s)
        {
            return;
        } 
        if (s=="")
        {
            filter = null;    
            clearFilter()
        }
        else
        {
            filter = s;
            applyFilter();
        }
    }

    this.ondestroy = function()
    {
        this.lastIndex = null;
    }

    this.updateView = function(cont)
    {
        this.createView(cont);
    }

    this.init(id, name, container_class);

}

cls.RequestListView.prototype = ViewBase;
new cls.RequestListView('request_list', ui_strings.M_VIEW_LABEL_REQUEST_LOG, 'scroll');


eventHandlers.click['request-list-select'] = function(event, target)
{
    var sel = HTTPLoggerData.getSelectedRequestId();
    var id = target.getAttribute("data-requestid");

    if (sel && sel==id)
    {
        HTTPLoggerData.clearSelectedRequest();
    }
    else
    {
        HTTPLoggerData.setSelectedRequestId(id);
    }
}


new Settings
(
  // id
  'request_list', 
  // kel-value map
  {
    'pause-resume-request-list-update': true
  }, 
  // key-label map
  {
    'pause-resume-request-list-update':  "#STR Pause/resume"
  },
  // settings map
  {
  }
);

new ToolbarConfig
(
    'request_list',
    [
      {
        handler: 'clear-request-list',
        title: ui_strings.S_BUTTON_CLEAR_REQUEST_LOG
      }
    ],
    [
      {
        handler: 'request-list-filter',
        title: "#STR filter request"
      }
    ]
);

new Switches
(
  'request_list',
  [
    'pause-resume-request-list-update'
  ]
)

eventHandlers.click['clear-request-list'] = function(event, target)
{
    HTTPLoggerData.clearLog();
}

eventHandlers.keyup['request-list-filter'] = function(event, target)
{
    if( event.keyCode == 13 )
    {
        window.views['request_list'].setFilter(target.value);
    }
    // fixme: Add delayed filtering here, so it'll work while typing
}

cls.RequestOverviewView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();
        if (req)
        {
            container.innerHTML = "<div class='padding'><h1>" + this.name + "</h1>This is the request info for " + req.request.headers["Host"] + req.request.path + "</div>";





        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
            
        }
    }
    
    this.init(id, name, container_class);

}

cls.RequestOverviewView .prototype = ViewBase;
new cls.RequestOverviewView ('request_overview', ui_strings.M_VIEW_LABEL_REQUEST_INFO, 'scroll');

cls.RequestRawView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();
        if (req)
        {
            container.clearAndRender(['div', [
                                                ['h1', this.name],
                                                ['code',
                                                    ['pre',
                                                        req.request.raw
                                                    ]
                                                ]
                                            ],
                                     'class', 'padding'
                                    ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}

cls.RequestRawView.prototype = ViewBase;
new cls.RequestRawView('request_info_raw', ui_strings.M_VIEW_LABEL_RAW_REQUEST_INFO, 'scroll');


cls.ResponseRawView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();
        if (req)
        {
            container.clearAndRender(['div', [
                                                ['h1', this.name],
                                                ['code',
                                                    ['pre',
                                                        req.response.raw
                                                    ]
                                                ]
                                            ],
                                     'class', 'padding'
                                    ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.ResponseRawView.prototype = ViewBase;
new cls.ResponseRawView('response_info_raw', ui_strings.M_VIEW_LABEL_RAW_RESPONSE_INFO, 'scroll');


cls.RequestHeadersView = function(id, name, container_class)
{
    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();

        if (req)
        {
            container.clearAndRender(['div', [
                                               ['h1', this.name],
                                               window.templates.header_definition_list(req.request.headers),
                                            ],
                                      'class', 'padding'
                                     ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.RequestHeadersView.prototype = ViewBase;
new cls.RequestHeadersView('request_info_headers', ui_strings.M_VIEW_LABEL_REQUEST_HEADERS, 'scroll');

cls.ResponseHeadersView = function(id, name, container_class)
{
    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();

        if (req && req.response)
        {
            container.clearAndRender(['div', [
                                               ['h1', this.name],
                                               window.templates.header_definition_list(req.response.headers),
                                            ],
                                      'class', 'padding'
                                     ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.ResponseHeadersView.prototype = ViewBase;
new cls.ResponseHeadersView('response_info_headers', ui_strings.M_VIEW_LABEL_RESPONSE_HEADERS, 'scroll');


cls.ResponseBodyView = function(id, name, container_class)
{
    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();

        if (req && req.response)
        {
            container.clearAndRender(['div', [
                                               ['h1', this.name],
                                               "Not implemented yet, but it appears that we downloaded " + req.response.headers["Content-Length"] + " bytes."
                                            ],
                                      'class', 'padding'
                                     ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.ResponseBodyView.prototype = ViewBase;
new cls.ResponseBodyView('response_info_body', ui_strings.M_VIEW_LABEL_RESPONSE_BODY, 'scroll');


