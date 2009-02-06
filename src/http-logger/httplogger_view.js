/**
 * @fileoverview
 * HTTP logger view code.
 * Defines views for request list, header info etc.
 */

/**
  * @constructor 
  * @extends ViewBase
  * This view implements update chocking. It will not do the update more often
  * than every minUpdateInterval milliseconds
  */

cls.RequestListView = function(id, name, container_class)
{
    var self = this;
    this.isPaused = false;

    // The list will never be updated more often than this:
    this.minUpdateInterval = 500; // in milliseconds.

    var filter = null;
    var lastUpdateTime = null;
    var updateTimer = null;
    var nextRenderedIndex = null;
    var keyEntryId = null;
    
    this.createView = function(container)
    {
        if (lastUpdateTime &&
            (new Date().getTime() - lastUpdateTime) < this.minUpdateInterval) {
            // Haven't waited long enough, so do nothing, but queue it for
            // later if it isn't allready so.
            if (!updateTimer) {
                updateTimer = window.setTimeout(
                        function() { self.createView(container)},
                        this.minUpdateInterval);
            }
            return;
        }
        
        if (updateTimer) {
            window.clearTimeout(updateTimer);
            updateTimer = null;
        }
        lastUpdateTime = new Date().getTime();
        
        this.doCreateView(container);
    }

    /**
     * Check if the current view represents reality. This is
     * done by checking the first element in the log. Its id needs to be the
     * same as keyEntryId
     *
     */
    this.viewIsValid = function(log)
    {
        if (log.length && log[0].id==keyEntryId)
        {
            return true;
        }
        else
        {
            if (log.length) { keyEntryId = log[0].id }
            return false;
        }
        
    }

    this.doCreateView = function(container)
    {
        var log = HTTPLoggerData.getLog();
        if (!this.viewIsValid(log)) {
            container.clearAndRender(window.templates.request_list_header());
            nextRenderedIndex = 0;
        }
        var tableBodyEle = container.getElementsByTagName('tbody')[0];
        var tpls = log.slice(nextRenderedIndex).map(window.templates.request_list_row);
        tableBodyEle.render(tpls);
        nextRenderedIndex = log.length;
    }

    this.ondestroy = function()
    {
        keyEntryId = null;
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
            container.clearAndRender(['div', [
                                               ['h1', this.name],
                                               window.templates.request_summary(req)
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
                                               "Request body inspection not supported yet."
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


