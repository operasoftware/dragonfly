/**
 * HTTP logger view code.
 * Defines views for request list, header info etc.
 *
 */

/**
  * @constructor 
  * @extends ViewBase
  */

cls.RequestListView = function(id, name, container_class)
{
    var self = this;
    

    this.isPaused = false;
    this.selectedRequestId = null;

    this.createView = function(container)
    {
        var log = HTTPLoggerData.getLog();
        container.innerHTML = "" +
           this._createTable(log) +
            "";
    }
    
    this._createTable = function(log)
    {
        var strings = [];
        var sel = HTTPLoggerData.getSelectedRequestId();
        strings.push("<tr><th>#</th><th>host</th><th>path</th><th>method</th><th>status</th><th>time</th></tr>");
        if (log.length)
        {
            for (var n=0, entry; entry=log[n]; n++)
            {
                var current = (sel && sel==entry.id)
                strings.push(
                   "<tr handler='request-list-select' data-requestid=\"" + entry.id + "\" class='" +(current ? "selected-request" : "") + "' >" +
                        "<th>" + (n+1) + "</th>" +
                        "<td>" + entry.request.headers.Host + "</td>" +
                        "<td>" + entry.request.path + "</td>" +
                        "<td>" + entry.request.method + "</td>" +
                        "<td>" + (entry.response ? entry.response.status : "-") + "</td>" +
                        "<td>" + (entry.response ? entry.response.time - entry.request.time : "-") + "</td>" +
                    "</tr>"
                )
            }
        }
        else
        {
            strings.push("<tr><th>0</th><td colspan='5'>No logged requests yet</td></tr>");
        }
        return "<table id='request-table'>\n" + strings.join("") + "</table>";
    }

    this.init(id, name, container_class);

}

cls.RequestListView.prototype = ViewBase;
new cls.RequestListView('request_list', ui_strings.M_VIEW_LABEL_NETWORK, 'scroll');


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
    //opera.postError("REQ ID: " + id)
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
        title: '#STR Clear'
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

cls.RequestInfoRequestView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        container.innerHTML = "<div class='padding'>This is the request info for the request</div>";
    }
    
    this.init(id, name, container_class);

}

cls.RequestInfoRequestView.prototype = ViewBase;
new cls.RequestInfoRequestView('request_info_request', "#req-info-req", 'scroll');

cls.RequestInfoResponseView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        container.innerHTML = "<div class='padding'>This is the request info for the response</div>";
    }
    
    this.init(id, name, container_class);

}

cls.RequestInfoResponseView.prototype = ViewBase;
new cls.RequestInfoResponseView('request_info_response', "#req-info-resp", 'scroll');


