window.app.builders.Profiler || ( window.app.builders.Profiler = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.Profiler["1.0"] = function(service)
{
  var namespace = cls.Profiler && cls.Profiler["1.0"];

  new ProfilerView('profiler_all',
                   'Profiler',
                   'scroll',
                   '',
                   '');
  ProfilerView.create_ui_widgets();

  return true;
}
