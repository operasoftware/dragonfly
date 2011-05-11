if (!(function(){}).bind)
{
  Function.prototype.bind = function(context)
  {
    var method = this, args = Array.prototype.slice.call(arguments, 1);
    return function()
    {
      return method.apply(context, args.concat(Array.prototype.slice.call(arguments)));
    }
  };
};

const DELAY_NEXT_RUN = 15;
const DELAY_NEW_TEST = 90;

var TestRunner = function(config)
{
  this._before_test_run = config.before_test_run;
  this._prepare_test_run = config.prepare_test_run;
  /* 
    must return an object with test, description
  */
  this._get_next_test = config.get_next_test;
  this._test_runs = config.test_runs;
  this._onresults = config.onresults;

  this._start = function()
  {
    this._before_test_run();
    this._current_test_count = 0;
    this._current_times = [];
    this._current_test = this._get_next_test();
    setTimeout(this._run_next_test, DELAY_NEW_TEST);
  };

  this._prepare_next_test = function()
  {
    this._prepare_test_run();
    setTimeout(this._run_next_test, DELAY_NEXT_RUN);
  }.bind(this);

  this._run_next_test = function()
  {
    if (this._current_test) 
    {
      if (this._current_test_count < this._test_runs)
      {
        this._current_times.push(Date.now());
        this._current_test_count++;
        this._current_test.test();
        setTimeout(this._prepare_next_test, DELAY_NEXT_RUN);
      }
      else
      {
        this._current_times.push(Date.now());
        var time = this._current_times[this._current_times.length - 1] -
                      this._current_times[0];
        var times = this._current_times.reduce(function(list, time, index, array)
        {
          if (index)
            list.push(time - array[index - 1]);
          return list;
        }, []);
        var min = Math.min.apply(Math, times);
        var max = Math.max.apply(Math, times);
        var average = time / this._test_runs;
        var deviation = Math.round(((Math.max(average - min, max - average) / average) * 100));
        this._results.push({description: this._current_test.description,
                            time: time,
                            runs: this._test_runs,
                            times: this._current_times,
                            deviation: deviation,
                            average: average});
        this._current_test_count = 0;
        this._current_test = this._get_next_test();
        this._current_times = [];
        setTimeout(this._prepare_next_test, DELAY_NEW_TEST);
      }
      
    }
    else
    {
      this._onresults(this._results);
    }
  }.bind(this);

  this._current_test_count = 0;
  this._current_test = null;
  this._current_start_time = 0;
  this._current_times = [];
  this._results = [];

  this._start();

}