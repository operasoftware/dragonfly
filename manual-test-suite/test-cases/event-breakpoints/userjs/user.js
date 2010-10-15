window.opera.addEventListener("BeforeEvent", function(event)
{
  if (event.event.type == 'click')
    opera.postError(event.event.type);
}, false);