window.templates = window.templates || {}

window.templates.error_log_messages = function(messages)
{
    var message = null, i = 0;
    var ret = ['div'];
    for( ; message = messages[i]; i++)
    {
        ret[ret.length] = window.templates.error_log_message(message);
    }
    return ret;//.concat(['class', 'padding']);
}

/**
 * See console.js for a dump of the structure of the xml we get from the
 * protocol
 */

window.templates.error_log_message = function(message)
{
    return ['div',
        ['date', new Date(parseInt( message.time )*1000).toString().replace(/GMT.*$/, '') ],
        ['h2', message.source, 'severity', message.severity],
        ['uri', (
            (message.uri && (message.uri.indexOf("http://") == 0 || message.uri.indexOf("https://") == 0 || message.uri.indexOf("file://")==0)) ? ["a", message.uri, "href", message.uri, "target", "_blank"] : message.uri
            )
        ],
        ['context', message.context],
        ['pre', message.description]
    ]
}
    /*

     <div id='dom-view-container'>

      <div id='toolbar'>
      <form>

      <label><input type='radio' id='radio-markup-view' checked='checked'> markup view</label>
      <label><input type='radio' id='radio-dom-view'> dom view</label>
      <label>
        <input type='checkbox' id='checkbox-show-attributes' checked='checked'>
       show attributes</label>

      <label>
        <input type='checkbox' id='checkbox-force-lower-case' checked='checked'>
      force lower case</label>

      <label>
        <input type='checkbox' id='checkbox-show-comments'>
       show comments</label>

      <label>
        <input type='checkbox' id='checkbox-show-white-space-nodes'>
       show white space nodes</label>

      </form>
      </div>

      <div id='content'>
        <div id='dom-view'></div>
      </div>

    </div>

    */