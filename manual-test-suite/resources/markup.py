INDEX = """
<!doctype html>
<h1>Opera Dragonfly manual test suite</h1>
<ul>
    <li><a href="./test-form">new test form</a>
    <li><a href="./protocols">protocols</a>
</ul>
"""

TEST_FORM = """
<!doctype html>
<script src="./resources/script.js"></script>
<link rel="stylesheet" href="./resources/style.css">
<h1>Integration Protocol</h1>
<form method="POST" action="./submit-form">
<table>
<tr><td><td>tester: <td colspan="2" class="input"><input></tr>
<tr><td><td>ichangeset: <td colspan="2" class="input"><input></tr>
"""

TEST_FORM_END = """
<tr><td colspan='4' class='submit'><input type='submit'></tr>
</table>
</form>
"""

TR_TD_COLS_4 = """
<tr>
  <th colspan="4">%s
</tr>
"""

TR_TD_URL = """
<tr>
  <td colspan="4" class="url">
    test url: <a href="%s" target="blank">%s</a>
  </td>
</tr>
"""

TR_TEST = """
<tr data-desc="%s">
  <td class="item closed"><span></span></td>
  <td>%s</td>
  <td><label><input type="radio" value="PASS" name="%s"> PASS</label></td>
  <td><label><input type="radio" value="FAIL" name="%s"> FAIL</label></td>
</tr>
"""
