/**
 * HTTP logger view code.
 * Defines views for request list, header info etc.
 *
 */


cls.HTTPLoggerView = function(id, name, container_class)
{
    var self = this;

    this.isPaused = false;

    this.createView = function(container)
    {
        var log = HTTPLoggerData.getLog();
        container.innerHTML = "<div class='padding'>" +
           this._createTable(log) +
           "<button type='button' handler='clear-http-log'>Clear log</button>" +
           "<button type='button' handler='clear-http-221log'>Clear log" + (this.isPaused ? "resume" : "pause") +"</button>" +
            "</div>";
    }
    
    this._createTable = function(log)
    {
        var strings = [];
        strings.push("<th>#</th><th>url</th><th>method</th><th>status</th><th>time</th>");
        if (log.length)
        {
            for (var n=0, entry; entry=log[n]; n++)
            {
                strings.push(
                    "<th>" + (n+1) + "</th>" +
                    "<td><a target=\"_blank\" href=\"http://" + entry.request.url + "\">" + entry.request.url + "</a></td>" +
                    "<td>" + entry.request.method + "</td>" +
                    "<td>" + (entry.response ? entry.response.status : "-") + "</td>" +
                    "<td>" + (entry.response ? entry.response.time - entry.request.time : "-") + "</td>"
                )
            }
        }
        else
        {
            strings.push("<th>0</th><td colspan='4'>No logged requests yet</td>");
        }
        return "<table>\n<tr>" + strings.join("</tr>\n<tr>") + "</tr>\n</table>"
    }
    
    this.init(id, name, container_class);
}

//cls.HTTPLoggerView.prototype = ViewBase;
//new cls.HTTPLoggerView('http_logger', 'HTTP logger', 'scroll');


eventHandlers.click['clear-http-log'] = function(event, target)
{
    HTTPLoggerData.clearLog();
    views["http_logger"].update();
}









/**
  * @constructor 
  * @extends ViewBase
  */

cls.RequestListView = function(id, name, container_class)
{
    var self = this;

    this.isPaused = false;

    this.createView = function(container)
    {
        var log = HTTPLoggerData.getLog();
        container.innerHTML = "<div class='padding'>" +
           this._createTable(log) +
           "<button type='button' handler='clear-http-log'>Clear log</button>" +
           "<button type='button' handler='clear-http-221log'>Clear log" + (this.isPaused ? "resume" : "pause") +"</button>" +
            "</div>";
    }
    
    this._createTable = function(log)
    {
        var strings = [];
        strings.push("<th>#</th><th>url</th><th>method</th><th>status</th><th>time</th>");
        if (log.length)
        {
            for (var n=0, entry; entry=log[n]; n++)
            {
                strings.push(
                    "<th>" + (n+1) + "</th>" +
                    "<td><a target=\"_blank\" href=\"http://" + entry.request.url + "\">" + entry.request.url + "</a></td>" +
                    "<td>" + entry.request.method + "</td>" +
                    "<td>" + (entry.response ? entry.response.status : "-") + "</td>" +
                    "<td>" + (entry.response ? entry.response.time - entry.request.time : "-") + "</td>"
                )
            }
        }
        else
        {
            strings.push("<th>0</th><td colspan='4'>No logged requests yet</td>");
        }
        return "<table>\n<tr>" + strings.join("</tr>\n<tr>") + "</tr>\n</table>"
    }

    this.init(id, name, container_class);

}

cls.RequestListView.prototype = ViewBase;
new cls.RequestListView('request_list', ui_strings.M_VIEW_LABEL_NETWORK, 'scroll');


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







