<?
  // secure cookie
  setcookie("w", "secure", 0, "/", "", true);
  // http-only cookie
  setcookie("x", "http-only", 0, "/", "", "", true);
?>
<!doctype HTML>

<script>
(function()
{
  for ( var i = 97, char = ''; i < 110; i++)
  {
    char = String.fromCharCode(i);
    document.cookie = char + "=" + char + "; path=/";
    window.localStorage.setItem(char, char);
    window.sessionStorage.setItem(char, char);
  };

  var make_leading_zero_string = function(nr, digits)
  {
    digits = digits || 2;
    nr = String(nr);
    while(nr.length < digits)
    {
      nr = "0" + nr;
    }
    return nr;
  };

  var pathname = location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);

  // create cookie with path values out of location.pathname, working in all browsers
  var last_found_index = 0;
  var l = 0;
  while(pathname.indexOf("/", last_found_index) != -1)
  {
    var last_found_index = pathname.indexOf("/", last_found_index);
    var path = pathname.slice(0, last_found_index + 1);
    document.cookie = "y" + make_leading_zero_string(l) + " = Path%20val: " + path + "; path=" + path;
    last_found_index++; // compensating the "/"
    l++;
  }

  // create cookie with pathes that only work in opera (and apparently ie)
  var path = location.pathname;
  var j = 0;
  while (path)
  {
    document.cookie = "z" + make_leading_zero_string(j) + " = Path%20val:" + path + "; path=" + path;
    path = path.slice(0, path.length - 1);
    j++;
  };

})();
</script>