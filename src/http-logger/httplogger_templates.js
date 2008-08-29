window.templates = window.templates || ( window.templates = {} );


window.templates.header_definition_list = function(headers)
{
    var alphaheaders = [];
    for (name in headers) {alphaheaders.push(name)}
    alphaheaders = alphaheaders.sort();
    
    var dlbody = [];
    
    for (var i=0, name; name=alphaheaders[i]; i++)
    {
        var value = headers[name];
        var dt = ['dt', name + ": "]
        if (name in header_specification_urls)
        {
            dt.push(['a', '(spec)',
                          'href', header_specification_urls[name],
                          'target', '_blank']);
        }
        
        dlbody.push(dt);
        
        if (typeof value == "string")
        {
            var dd = ['dd', value]
        }
        else
        {
            var dd = [];
            for (var n=0, e; e=value[n]; n++)
            {
                dd.push(['dd', e]);
            }
        }
        dlbody.push(dd);
    }
    var dl = ['dl', dlbody,
              'class', 'headerlist'
             ];
    
    return dl;
}