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
    this.requestList = [];
    this.requestMap = {};
    this.selectedRequestId = null;

    this._views = ["request_list",
                 "request_info_raw"];

    /**
     * Get the log as a list
     */
    this.getLog = function()
    {
        return this.requestList;
    }
    
    /**
     * Get a specific request
     * @argument {string} id the id of the request
     * @returns {object} data object for the request or null if not found
     */
    this.getRequestById = function(id)
    {
        if (id in requestMap) { return requestMap[id] }
        else { return null }
    }
    
    /**
     * Clear the log data
     *
     */
    this.clearLog = function()
    {
        this.requestList = [];
        this.requestMap = {};
        this.selectedRequestId = null;
        this._updateViews();
    }

    /**
     * Add a request to the log
     */
    this.addRequest = function(request)
    {
        var r = { id:request["request-id"],
                  "request": request,
                  response:null
                }

        this.requestList.push(r);
        this.requestMap[r.id] = r;
        this._updateViews();
    }
    
    /**
     * Add a response object to an existing request
     * fixme: now we silently ignore repsonses to non-exstant requests
     */
    this.addResponse = function(response)
    {
        var r = this.requestMap[response["request-id"]];
        if (r) {
            r.response = response;
        }
        this._updateViews();
    }
    
    /**
     * Set the currently selected request, that is, the request that is being
     * inspected
     */
    this.setSelectedRequestId = function(id)
    {
        this.selectedRequestId = id;
        this._updateViews();
    }
    
    /**
     * Clear the selected request
     */
    this.clearSelectedRequest = function()
    {
        this.selectedRequestId = null;
        this._updateViews();
    }
    
    /**
     * Get the selected request
     */
    this.getSelectedRequest = function()
    {
        if (this.selectedRequestId && this.selectedRequestId in this.requestMap)
        {
            return this.requestMap[this.selectedRequestId];
        }
        else
        {
            return null;
        }
    }    

    /**
     * Get the ID of the selected request
     */
    this.getSelectedRequestId = function()
    {
        return this.selectedRequestId;
    }
    
    /**
     * Update all views that use this as a data source
     */
    this._updateViews = function()
    {
        for (var n=0, e; e=this._views[n]; n++)
        {
            if (e in window.views) { window.views[e].update() }
        }
    }

}
