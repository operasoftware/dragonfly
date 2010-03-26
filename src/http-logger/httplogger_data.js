/**
 * @fileoverview
 * Data objects and classes for the http logger
 *
 */


/**
 * @class
 * Data class for http logger
 */
window.HTTPLoggerData = new function()
{
    var requestList = [];
    var requestMap = {};
    var selectedRequestId = null;
    var lastModifiedRequestId = null;
    var activeRuntime = null;


    var _views = [ "request_info_raw",
               "response_info_raw",
               "request_info_headers",
               "response_info_headers",
               "request_overview",
               "response_info_body",
               "request_list"
             ];

    /**
     * Get the log as a list
     */
    this.getLog = function()
    {
        return requestList;
    };

    /**
     * Get a specific request
     * @argument {string} id the id of the request
     * @returns {object} data object for the request or null if not found
     */
    this.getRequestById = function(id)
    {
        if (id in requestMap) { return requestMap[id] }
        else { return null }
    };

    /**
     * Clear the log data
     *
     */
    this.clearLog = function()
    {
        requestList = [];
        requestMap = {};
        selectedRequestId = null;
        _updateViews();
    };

    this.clearLogAllButLast = function()
    {
        if (requestList.length) {
            var r = requestList.pop();
            requestList = [r];
            requestMap = {};
            requestMap[r.id] = r;
        }
        _updateViews();
    };

    /**
     * Add a request to the log
     */
    this.addRequest = function(request)
    {
        var r = { id:request["request-id"],
                  "request": request,
                  response:null, duration: null
                };

        requestList.push(r);
        requestMap[r.id] = r;
        lastModifiedRequestId = r.id;
        _updateViews();
    };

    /**
     * Add a response object to an existing request
     * fixme: now we silently ignore repsonses to non-exstant requests
     */
    this.addResponse = function(response)
    {
        var r = requestMap[response["request-id"]];
        if (r)
        {
            r.response = response;
            if (r.request.time && r.response.time)
            {
                r.duration = r.response.time-r.request.time;
            }
            else
            {
                r.duration = 0;
            }
            lastModifiedRequestId = r.id;
            _updateViews();
        }
    };

    /**
     * Set the currently selected request, that is, the request that is being
     * inspected
     */
    this.setSelectedRequestId = function(id)
    {
        selectedRequestId = id;
        _updateViews();
    };

    /**
     * Clear the selected request
     */
    this.clearSelectedRequest = function()
    {
        selectedRequestId = null;
        _updateViews();
    };

    /**
     * Get the selected request
     */
    this.getSelectedRequest = function()
    {
        if (selectedRequestId && selectedRequestId in requestMap)
        {
            return requestMap[selectedRequestId];
        }
        else
        {
            return null;
        }
    };

    /**
     * Get the ID of the selected request
     */
    this.getSelectedRequestId = function()
    {
        return selectedRequestId;
    };

    this.getLastModifiedRequestId = function()
    {
        return lastModifiedRequestId;
    };

    /**
     * Event listener for the active-tab msg. If the the top runtime id
     * changes, it means our context is different and we should clear the
     * log and tell the view
     */
    this.onActiveTab = function(msg) {
        var id = msg.activeTab[0];
        if (activeRuntime==null) {
            activeRuntime=id;
        } else if (id != activeRuntime) {
            this.clearLogAllButLast();
            activeRuntime=id;
        } else {
            //All is well
        }
    };

    /**
     * Update all views that use this as a data source
     */
    var _updateViews = function()
    {
        for (var n=0, e; e=_views[n]; n++)
        {
            if (e in window.views) { window.views[e].update() }
        }
    };

}

messages.addListener("active-tab", function(msg) { HTTPLoggerData.onActiveTab(msg) });
