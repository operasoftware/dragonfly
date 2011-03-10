<?
  // secure cookie
  setcookie("o", "secure", 0, "", "", true);
  // http-only cookie
  setcookie("p", "http-only", 0, "", "", "", true);
?>
<!doctype HTML>
<script>
(function()
{
  // to test fuzzy_dates, [2 years, 1 year, 2 months, 1 month, 2 week … (session)]
  var expires = [
  2 * 12*4*7*24*60*60, 
      12*4*7*24*60*60,
     2 * 4*7*24*60*60,
         4*7*24*60*60,
       2 * 7*24*60*60,
           7*24*60*60,
         2 * 24*60*60,
             24*60*60,
            2 * 60*60,
                60*60,
               2 * 60,
                   60,
                    5,
                    0
  ]; // in seconds
  for( var i = 97, char = ''; i < 107; i++)
  {
    char = String.fromCharCode(i);
    document.cookie = 
      char + "=" + char + "; expires=" + new Date(new Date().getTime() + expires.pop()*1000) + "; path=/";
    window.localStorage.setItem(char, char);
    window.sessionStorage.setItem(char, char);
  };
})();
</script>