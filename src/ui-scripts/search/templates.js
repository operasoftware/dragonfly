(function()
{
  this.searchbar_content = function(search)
  {
    return (
    [
      this.filters([search.search_field]),
      ['info'],
    ]);
  }
}).apply(window.templates || (window.templates = {}));
