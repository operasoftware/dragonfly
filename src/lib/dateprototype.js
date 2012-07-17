/**
 * Local ISO strings, currently needed as datetime-local input values
 * http://dev.w3.org/html5/markup/input.datetime-local.html#input.datetime-local.attrs.value
 */
Date.prototype.toLocaleISOString = function()
{
 return new Date(this.getTime() - this.getTimezoneOffset() * 1000 * 60).toISOString().replace('Z','');
};
