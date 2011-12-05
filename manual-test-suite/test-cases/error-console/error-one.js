function a()
{
  b();
};

function b()
{
  c();
};

function c()
{
  d();
}

function d()
{
  document.getElementById("fo0").textContent = "Kaboom";
}

a();