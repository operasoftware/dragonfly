/**
 * Local ISO strings, currently needed as datetime-local input values
 * http://dev.w3.org/html5/markup/input.datetime-local.html#input.datetime-local.attrs.value
 */
Date.fromLocaleISOString = function(localeISOString)
{
  var is_local = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(localeISOString);
  if (!is_local)
    return NaN;

  var date = new Date(localeISOString);

  // Test if Date parsed the value as a UTC string.
  // If it does, add the current timezone offset to get the local time.
  // When the current timezone offset is 0, this will be a false positive,
  // but that doesn't matter since we correct the value by 0 then.
  var milliseconds = date.getTime();
  if (milliseconds === new Date(localeISOString + "Z").getTime())
  {
    var timezone_offset = date.getTimezoneOffset() * 1000 * 60;
    milliseconds += timezone_offset;
  }
  return milliseconds;
};
