window.HTTPLoggerData = new function()
{
    this.requestList = [];
    this.requestMap = {};


    var view = "request_list";

    this.getLog = function()
    {
        return this.requestList;
    }
    
    this.clearLog = function()
    {
        this.requestList = [];
        this.requestMap = {};
    }

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
    
    this.addResponse = function(response)
    {
        var r = this.requestMap[response["request-id"]];
        if (r) {
            r.response = response;
        }
        views[view].update();
        // fixme: now we silently ignore repsonses to non-exstant requests
    }
}


//  this.set_active_window = function(win_id)
//  {
//    this.active_window = win_id;
//    views[view].update();
//  }
//
//  this.set_window_list = function(window_list)
//  {
//    this.window_list = window_list;
//    views[view].update();
//  }
//
//  this.update_list = function(win_obj)
//  {
//    var 
//    id = win_obj["window-id"],
//    win = null, 
//    i = 0;
//
//    if( this.window_list )
//    {
//      for( ; ( win = this.window_list[i] ) && !( id == win["window-id"] ); i++ ) {}
//    }
//    this.window_list[i] = win_obj;
//    views[view].update();
//  }
//
//  this.remove_window = function(win_id)
//  {
//    var 
//    win = null, 
//    i = 0;
//
//    if( this.window_list )
//    {
//      for( ; win = this.window_list[i]; i++ )
//      {
//        if( win_id == win["window-id"] )
//        {
//          this.window_list.splice(i, 1);
//          break;
//        }
//      }
//    }
//    views[view].update();
//  }
//}
