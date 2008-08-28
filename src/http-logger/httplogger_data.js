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

    var view = "request_list";

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
        opera.postError(this.requestList.join(", "))
        
        this.requestList = [];
        this.requestMap = {};
        this.selectedRequestId = null;
        
        views[view].update();
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
        views[view].update();
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
        views[view].update();
    }
    
    /**
     * Set the currently selected request, that is, the request that is being
     * inspected
     */
    this.setSelectedRequestId = function(id)
    {
        this.selectedRequestId = id;
        views[view].update();
    }
    
    /**
     * Clear the selected request
     */
    this.clearSelectedRequest = function()
    {
        this.selectedRequestId = null;
        views[view].update();
    }
    
    /**
     * Get the selected request
     */
    this.getSelectedRequest = function()
    {
        if (this.selectedRequestId && this.selectedRequestId in this.requestList)
        {
            return this.requestList[this.selectedRequestId];
        }
        else
        {
            return this.selectedRequestId;
        }
    }    

    /**
     * Get the ID of the selected request
     */
    this.getSelectedRequestId = function()
    {
        return this.selectedRequestId;
    }    

}
