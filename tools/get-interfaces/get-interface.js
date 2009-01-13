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
        ret = 'object';
        break;
      }
      case 'string':
      {
        if( obj.length > 100 ) 
        {
          ret = '' + ( Math.random() * 100000 >> 0 ) + new Date().getTime();
          break;
        }
        if( /\n/.test(obj) ) 
        {
          ret = encodeURIComponent('' + obj);
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

  var get_properties = function(obj, inherits_from, check_list)
  {
    var prop = '', ret = '', check_list_checked = {}, i = 0;
    for( prop in obj )
    {
      ret += ( ret.length ? "," : "" ) + "(\"" + prop +"\",\""+ get_type(obj[prop]) + "\")";
      check_list_checked[prop] = 1;
    }
    if(check_list)
    {
      check_list.forEach(function(item)
      {
        if(!check_list_checked[item])
        {
          ret += ( ret.length ? "," : "" ) + "(\"" + item +"\",\""+ get_type(obj[item]) + "\")";
        }
      });
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
  get_properties(%s, "%s", %s);
}