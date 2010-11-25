(function()
{
  var info_item = function(item)
  {
    return "<li>" + item.replace(/</g, "&lt;").
                         replace(/@pre/g, '<pre>').
                         replace(/@\/pre/g, '</pre>').
                         replace(/\\n/g, '\n');
  };
  
  document.onclick = function(event)
  {
    var ele = event.target, td = null, re = / *\r?\n */;
    while (ele && ele.nodeName.toLowerCase() != "td")
    {
      ele = ele.parentNode;
    };
    if (ele && /item/.test(ele.className))
    {
      if (/closed/.test(ele.className))
      {
        ele.className = "item open";
        ele = ele.parentNode;
        td = ele.parentNode;      
        td = ele.nextElementSibling ? 
            td.insertBefore(document.createElement('tr'), ele.nextElementSibling):
            td.appendChild(document.createElement('tr'));
        td = td.appendChild(document.createElement('td'));
        td.setAttribute('colspan', '4');
        td.className = "info";
        td.innerHTML = 
            "<ol>" + ele.getAttribute('data-desc').split(re).filter(Boolean).map(info_item).join("") + "</ol>";
      }
      else
      {
        ele.className = "item closed";
        ele = ele.parentNode.nextElementSibling;
        ele.parentNode.removeChild(ele);
      };
    };
  };
})();
