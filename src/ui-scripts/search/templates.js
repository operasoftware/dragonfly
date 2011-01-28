(function()
{
  this.searchbar_content = function(search)
  {
    return (
    [
      this.filters(search.controls),
      ['info'],
    ]);
  }
}).apply(window.templates || (window.templates = {}));
