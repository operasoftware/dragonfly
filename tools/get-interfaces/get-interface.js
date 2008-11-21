function()
{
  var submit_result = function(result)
  {
    var form_container = document.createElementNS("http://www.w3.org/1999/xhtml", 'div');
    form_container.innerHTML = '\
    <form method="POST" action="/" enctype="multipart/form-data">\
    <textarea name="file"></textarea>\
    <input name="file-name" value="' + location.pathname.replace(/^\//, '') + '">\
    </form>';
    var form = form_container.getElementsByTagName('form')[0];
    form_container.getElementsByTagName('textarea')[0].value = result;
    form.submit();
  }

  var get_type = function(obj)
  {
    var ret = '';
    switch (typeof obj)
    {
      case 'object':
      {
        if (obj === null)
        {
          ret = '' + null;
          break;
        }
      }
      case 'function':
      {
        ret = typeof obj;
        break;
      }
      case 'string':
      {
        if( /\n/.test(obj) || obj.length > 100 ) 
        {
          ret = '' + ( Math.random() * 100000 >> 0 ) + new Date().getTime();
          break;
        }
      }
      default:
      {
        ret = '' + obj;
      }
    
    }
    return ret;
  }

  var get_properties = function(obj, inherits_from)
  {
    var prop = '', ret = '';
    for( prop in obj )
    {
      ret += ( ret.length ? "," : "" ) + "(\"" + prop +"\",\""+ get_type(obj[prop]) + "\")";
    }
    submit_result
    (
      "{" +
          "\"interface\":\"" + obj.toString().replace(/^\[object |\]$/g, "") + "\"," +
          ( inherits_from ? ( "\"inherits-from\":\"" + inherits_from + "\",") : "" ) +
          "\"properties\":[" + ret + "]" +
      "}"
    );
  }
  get_properties(%s, "%s");
}