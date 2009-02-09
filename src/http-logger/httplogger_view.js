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

    // The list will never be updated more often than this:
    this.minUpdateInterval = 500; // in milliseconds.

    var filter = null;
    var lastUpdateTime = null;
    var updateTimer = null;
    var nextRenderedIndex = null;
    var keyEntryId = null;
    var expandedItems = [];
    
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
        if (log.length && log[0].id==keyEntryId) {
            return true;
        } else {
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
        
        // partial function invocation that closes over expandedItems
        var fun = function(e) {
            return window.templates.request_list_row(e, expandedItems);
        }
        
        var tpls = log.slice(nextRenderedIndex).map(fun);

        tableBodyEle.render(tpls);
        nextRenderedIndex = log.length;
    }
    
    this.toggleDetails = function(id)
    {
        // fixme: this, and doCreateView should just wile all entries after
        // the one we want to expand and set nextRenderedIndex to the one
        // that got expanded.
        if (expandedItems.indexOf(id)==-1) {
            expandedItems.push(id);
        } else {
            expandedItems.splice(expandedItems.indexOf(id), 1);
        }
        keyEntryId = null;
        lastUpdateTime = 0;
    }

    this.ondestroy = function()
    {
        keyEntryId = null;
    }

    this.init(id, name, container_class);
}

cls.RequestListView.prototype = ViewBase;
new cls.RequestListView('request_list', ui_strings.M_VIEW_LABEL_REQUEST_LOG, 'scroll');

eventHandlers.click['request-list-expand-collapse'] = function(event, target)
{
    window.views['request_list'].toggleDetails(target.getAttribute("data-requestid"));
    window.views['request_list'].update();
}

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

new ToolbarConfig
(
    'request_list',
    [
      {
        handler: 'clear-request-list',
        title: ui_strings.S_BUTTON_CLEAR_REQUEST_LOG
      }
    ]
);

eventHandlers.click['clear-request-list'] = function(event, target)
{
    HTTPLoggerData.clearLog();
}
