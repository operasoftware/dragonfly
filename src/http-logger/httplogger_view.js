/**
 * HTTP logger view
 *
 */


cls.HTTPLoggerView = function(id, name, container_class)
{
    var self = this;
    this.createView = function(container)
    {
        container.innerHTML = "<div class='padding'>" +
           "<table><tr><th>URL</th><th>Met</th><th>Dur</th></tr></table>" +
           "<button type='button' handler='clear-http-log'>Clear log</button>" +
            "</div>";

    }
    this.init(id, name, container_class);
}

cls.HTTPLoggerView.prototype = ViewBase;
new cls.HTTPLoggerView('http_logger', 'HTTP logger', 'scroll');


eventHandlers.click['clear-http-log'] = function(event, target)
{
    alert("yay")
    views["http_logger"].clearLog();
}

