var c = function()
{
  var x = 0;
  for (var i = 0; i < 10; i++)
  {
    // to prevent Carakan to optimise the loop away
    log(i);
    x = i;
  }
  d();
};
