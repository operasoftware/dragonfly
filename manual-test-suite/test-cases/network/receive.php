<?
  $res = "";
  function add($add)
  {
    global $res;
    $res .= $add;
  }

  function do_file($file)
  {
    add('<p>');
    add("file name: ".$file["name"]);
    add('</p><p>');
    add("file type: ".$file["type"]);
    add('</p><p>');
    add("file size: ".$file["size"]);
    add('</p><p>');
    if (substr($file["type"], 0, 5) == "image") // works for jpg, png, gif
    {
      $encoded = base64_encode(file_get_contents($file["tmp_name"]));
      add("<img src=\"data:".$file["type"].";base64,$encoded\">");
    }
    else // texttual
    {
      $file_arr = file($file["tmp_name"]);
      if ($file_arr)
      {
        foreach($file_arr as $value) {
          add(htmlspecialchars($value)."<br/>");
        }
      }
    }
    add('</p>');
  }

  if ($_GET["sleep"])
  {
    sleep($_GET["sleep"]);
  }

  if ($_GET["redirect"])
  {
    $host  = $_SERVER['HTTP_HOST'];
    preg_match('/redirect=(\d)/', $_SERVER[REQUEST_URI], $matches);
    if ($matches[0] && $matches[1])
    {
      $new_redir_val = "redirect=".($matches[1] - 1); // this leaves sth like receive.php?&otherparam=blabla
      if ($matches[1] - 1 == 0)
      {
        $new_redir_val = "";
      }
      $redirurl = str_replace($matches[0], $new_redir_val, $host.$_SERVER[REQUEST_URI]);
      header("Location: http://" . $redirurl);
      exit;
    }
  }

  add("<h3>form_submit_receiver</h3>");

  if ($_POST["textfield1"])
  {
    add("<p>textfield1: ".htmlspecialchars($_POST["textfield1"])."</p>");
    add("<hr>");
  }

  if ($_POST["textarea1"])
  {
    add("<p>textarea1: ".htmlspecialchars($_POST["textarea1"])."</p>");
    add("<hr>");
  }
  
  if ($_FILES["file1"]["size"])
  {
    do_file($_FILES["file1"]);
    add("<hr>");
  }

  if ($_FILES["file2"]["size"])
  {
    do_file($_FILES["file2"]);
    add("<hr>");
  }
  
  // or formelem via get
  if ($_GET["textfield1"])
  {
    add("<p>textarea1: ".htmlspecialchars($_GET["textfield1"])."</p>");
    add("<hr>");
  }

  $req_headers = getallheaders();
  $async = $req_headers["X-Requested-With"] || $_GET["async"];
  if ($async) //  == "XMLHttpRequest" for jqueries general case, need to check how jsonp is signalized if it is.
  {
    $callback = $_GET["callback"];
    if ($callback)
    {
      echo($callback . "('"); // would need to escape ' in $res
    }
    echo($res);
    if ($callback)
    {
      echo("')");
    }
  }
  else
  {
    echo("<!DOCTYPE html>
<html>
<head>
	<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\">
	<title>form_submit_receiver</title>
</head>
<body>$res</body>
</html>");
  }
?>