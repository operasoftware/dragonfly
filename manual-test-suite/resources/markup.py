INDEX = """\
<!doctype html>
<h1>Opera Dragonfly manual test suite</h1>
<ul>
    <li><a href="./test-form">new test form</a>
    <li><a href="./protocols">protocols</a>
</ul>
"""

PROTOCOL_LIST = """\
<!doctype html>
<h1>Opera Dragonfly test protocols</h1>
<ul>
    %s
</ul>
"""

LIST_LINK = """<li><a href="%s">%s</a>"""

TEST_FORM = """\
<!doctype html>
<script src="%s/resources/script.js"></script>
<link rel="stylesheet" href="%s/resources/style.css">
<h1>Integration Protocol</h1>
%s
%s
<table>
"""

FORM = """<form method="POST" action="./submit-form">"""

LEGEND_MISSING = """<p class="legend-missing"> missing entries"""

TR_TESTER_AND_CHANGESET_FORM = """
<tr><td><td>tester: <td colspan="2" class="input"><input name="tester"></tr>
<tr><td><td>changeset: <td colspan="2" class="input"><input name="changeset"></tr>
<tr><td><td>browser: <td colspan="2" class="input"><input name="browser"></tr>
"""

TR_TESTER_AND_CHANGESET = """
<tr><td><td>tester: <td colspan="2">%s</tr>
<tr><td><td>changeset: <td colspan="2">%s</tr>
<tr><td><td>browser: <td colspan="2">%s</tr>
"""

TR_VALUE_CHECK = """
<tr class="%s">
    <td>
    <td>%s: 
    <td colspan="2" class="input"><input name="%s"%s>%s
</tr>
"""

VALUE_DISABLED = """ value="%s" disabled"""

INPUT_HIDDEN = """<input type="hidden" name="%s" value="%s">"""

TEST_FORM_END = """
<tr><td colspan='4' class='submit'><input type='submit'></tr>
</table>
</form>
"""

TEST_END = """
</table>
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
<tr %sdata-desc="%s">
  <td class="item closed"><span></span></td>
  <td>%s</td>
  <td><label><input type="radio" value="PASS" name="%s"> PASS</label></td>
  <td><label><input type="radio" value="FAIL" name="%s"> FAIL</label></td>
</tr>
"""

TR_TEST_CHECK = """
<tr class="%s" data-desc="%s">
  <td class="item closed"><span></span></td>
  <td>%s</td>
  <td><label><input type="radio" value="PASS" name="%s"%s> PASS</label></td>
  <td><label><input type="radio" value="FAIL" name="%s"%s> FAIL</label>%s</td>
</tr>
"""

TR_TEST_PROTOCOL = """
<tr data-desc="%s" class="%s">
  <td class="item closed"><span></span></td>
  <td>%s</td>
  <td></td>
  <td>%s</td>
</tr>
"""
