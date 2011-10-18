function a1()
{
  b1();
};

function b1()
{
  c1();
};

function c1()
{
  d();
}

a1(); // causes the error in error.js after some callstack-entries in error.js