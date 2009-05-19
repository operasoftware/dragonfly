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
    var lastUpdateTime = null;
    var updateTimer = null; // timer id so we can cancel a timeout
    var nextToRendereIndex = null;  // index in log of the next element to render
    var keyEntryId = null; // first entry of log. If log[0] is different, view is invalid
    var expandedItems = []; // IDs of items that are expanded
    var tableBodyEle = null;
    var viewMap = {}; // mapping between ID and active part of detail view

    new ToolbarConfig
    (
      id,
      [],
      [
        {
          handler: 'http-text-search',
          title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
        }
    ]

    );

    /**
     *  Called by the framework through update()
     *  Check if we should redraw the view or not. If we shall, call
     *  doCreateView. The reason for not doing so is if there is less
     *  than minUpdateInterval millis since the last time we did.
     **/
    this.createView = function(container)
    {
        if (lastUpdateTime &&
            (new Date().getTime() - lastUpdateTime) < this.minUpdateInterval) {
            // Haven't waited long enough, so do nothing, but queue it for
            // later if it isn't allready so.
            if (!updateTimer) {
                updateTimer = window.setTimeout(
                        function() { self.createView(container) },
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
     */
    this.viewIsValid = function(log)
    {
        return false;

        // The invalidation code is currently disabled because there is now
        // no chance of a ginourmous list of requests. Hence this optimization
        // is probably not needed

        if (log.length && log[0].id==keyEntryId) {
            return true;
        } else {
            if (log.length) { keyEntryId = log[0].id }
            return false;
        }
    }

    /**
     * Do the actual rendering of the request table, including expanded and
     * collapsed details pages.
     */
    this.doCreateView = function(container)
    {
        var log = HTTPLoggerData.getLog();

        if (!this.viewIsValid(log)) {
            container.clearAndRender(['table',['tbody'], 'class', 'request-table']);
            nextToRendereIndex = 0;
        }
        tableBodyEle = container.getElementsByTagName('tbody')[0];
       
        if (log.length) {
            var times = log.map(function(e) {
                return e.response ? e.response.time : e.request.time
            })
            var times = times.sort();
            lastTime = times[times.length-1];
        } else {
            lastTime = new Date().getTime();
        }
        
        var firstTime = log.length ? log[0].request.time : lastTime;
        
        // partial function invocation that closes over expandedItems
        var fun = function(e) {
            return window.templates.request_list_row(e, expandedItems, firstTime, lastTime, viewMap);
        }

        var tpls = log.slice(nextToRendereIndex).map(fun);
        tableBodyEle.render(tpls);
        nextToRendereIndex = log.length;
    }

    this._getRowForId = function(id) {
        if (!tableBodyEle) { return null }
        for (var n=0,e; e=tableBodyEle.childNodes[n]; n++)
        {
            if (e.getAttribute('data-requestid') == id)
            {
                return e;
            }
        }
        return null;
    }
    
    /**
     * Collapse the detail view of an entry in the log.
     * Does not invalidate the view and re-render the table.
     * It's fairly slow if the entry is far down in the log though.
     */
    this.collapseEntry = function(id)
    {
        if (!tableBodyEle) { return }
        for (var n=0,e; e=tableBodyEle.childNodes[n]; n++)
        {
            if (e.getAttribute('data-requestid') == id)
            {
                e.className = e.className.replace("expanded", "collapsed");
                tableBodyEle.removeChild(e.nextSibling);
                return
            }
        }
    }
    
    /**
     * Show the detail view of an entry in the log.
     * Does not invalidate the view and re-render the table.
     * It's fairly slow if the entry is far down in the log though.
     */
    this.expandEntry = function(id) {
        if (!tableBodyEle) { return }
        for (var n=0,e; e=tableBodyEle.childNodes[n]; n++)
        {
            if (e.getAttribute('data-requestid') == id)
            {
                var req = HTTPLoggerData.getRequestById(id);
                var tpl = window.templates.request_details_box(req);
                var ele = document.render(tpl);
                if (e.nextSibling) {
                    tableBodyEle.insertBefore(ele, e.nextSibling);
                }
                else {
                    tableBodyEle.appendChild(ele);
                }
                e.className = e.className.replace("collapsed", "expanded");
                return; // or loop forever since you just made list longer.
            }
        }
    }
    
    /**
     * Called to toggle request with id. If it's expanded it gets collapsed
     * and vice-versa
     */
    this.toggleDetails = function(id)
    {
        var dirty = false;
        if (expandedItems.indexOf(id)==-1) {
            expandedItems.push(id);
            dirty = true;
        } else {
            expandedItems.splice(expandedItems.indexOf(id), 1);
        }
        this.update();
        if (dirty) {
            var row = this._getRowForId(id).nextSibling
            row.scrollSoftIntoContainerView();
        }
        
    }

    this.selectDetailView = function(id, name) {
        viewMap[id] = name;
        this.update();
        return;
        
         //the bits under here could be used if we decide to do something
         //smarter than just invalidating the view and redrawing.

        var row = this._getRowForId(id);
        if (!row) { return }

        row = row.nextSibling;
        var req = HTTPLoggerData.getRequestById(id);
        var div = row.getElementsByTagName("div")[0];
        div.clearAndRender(window.templates.parsed_request_headers(req, "headers"));
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
};

eventHandlers.click['select-http-detail-view'] = function(event, target)
{
    window.views['request_list'].selectDetailView(target.getAttribute("data-requestid"), target.getAttribute("data-viewname"));
};



/**
 * This sets up the handlers for the search box
 */

(function()
{
    var textSearch = new TextSearch();

    var onViewCreated = function(msg)
    {
        if (msg.id == 'request_list') {
            textSearch.setContainer(msg.container);
            textSearch.setFormInput(views.request_list.getToolbarControl(msg.container, 'http-text-search'));
        }
    }

    var onViewDestroyed = function(msg)
    {
        if (msg.id == 'request_list') {
            textSearch.cleanup();
            topCell.statusbar.updateInfo();
        }
    }

    messages.addListener('view-created', onViewCreated);
    messages.addListener('view-destroyed', onViewDestroyed);

    eventHandlers.input['http-text-search'] = function(event, target)
    {
        textSearch.searchDelayed(target.value);
    }

    eventHandlers.keyup['http-text-search'] = function(event, target)
    {
        if (event.keyCode == 13) {
            textSearch.highlight();
        }
    }

})();

