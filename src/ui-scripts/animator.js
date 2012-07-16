﻿/**
 * @fileoverview
 * Three-state animated button class
 */


/**
 * @constructor
 * @argument target {Object} animation definition dictionary
 *
 *
 * @class
 *
 * <div class="sidenote">Note: the classname "Animator" is a bit of a misnomer. It's more of a
 * three-state-button-o-matic. Might be renamed at a later date (runeh)</div>
 *
 * Handle a two or three state button with support for animaton. The button
 * has an initial state, an active state (possibly animated), and optionally
 * a final state. An example is a "connect" button. It starts out passive.
 * When pressed it animates a progress indicator, and when connected, it turns
 * green.
 *
 * The initial state is always the first in the image, that is, positioned
 * at 0px from the top. Hence, one does not need to pass an argument to
 * the constructor to set up the initial state.
 *
 * The animation is configured by passing a dictionary with settings. The
 * dictionary contains the following:
 *
 * <dl>
 *  <dt>id (required)<dd>The id of the element to operate as a string
 *  <dt>delta (required)<dd>The height of a frame of animation in pixels as an int
 *  <dt>iterations (required)<dd>The number of frames in the active state as in int
 *  <dt>active (optional)<dd>The offset of the first active state frame in the image in pixels as an int. Default: 0
 *  <dt>final (optional)<dd>The offset of the final state frame in the image in pixels as an int. Default: 0
 *  <dt>x_position (optional)<dd>The vertial offset of the strip of frames in the image in pixels as an int. Default: 0px
 *  <dt>time_delta (optional)<dd>The time between each frame in ms as an int. FPS is then equal to 1000/time_delta. Default: 30ms
 * </dl>
 *
 *
 */
var Animator = function(target)
{
  var id = target.id;
  var delta = target.delta;
  var iterations = target.iterations;
  var active = target.active || 0;
  var finalState = target.ready || 0;
  var x_position = target.x_position || '0px ';
  var time_delta = target.time_delta || 30;
  var current_count = 0;
  var interval = 0;

  /**
   * Tick function, called every time_delta to update state of animation
   * @private
   */
  var spin = function()
  {
    var ele = document.getElementById(id);
    if( ele )
    {
      ele.style.backgroundPosition = x_position + ( active + ( current_count++ ) * delta ) + 'px';
      if( current_count >= iterations )
      {
        current_count = 0;
      }
    }
  }

  /**
   * Start the animation
   */
  this.setActive = function()
  {
    interval = interval ? interval : setInterval( spin, time_delta );
  }

  /**
   * Stop the animation and place it in its final state. If there is not
   * final state, default to initial state.
   */
  this.setFinal = function()
  {
    interval = interval ? clearInterval(interval) : 0;
    var ele = document.getElementById(id);
    if( ele )
    {
      ele.style.backgroundPosition = x_position + ( finalState ) + 'px';
      current_count = 0;
    }
  }

  /**
   * Stop the animation and place the animation in its initial state
   */
  this.setInitial = function()
  {
    interval = interval ? clearInterval(interval) : 0;
    if( ele = document.getElementById(id) )
    {
      ele.style.backgroundPosition = x_position + ( 0 ) + 'px';
      current_count = 0;
    }
  }

  /**
   * Return the ID of the element the animator is handling
   * @returns {String} the id
   *
   */
  this.getId = function()
  {
    return id;
  }

  this.getState = function()
  {
    var ele = document.getElementById(id);
    return ( interval && 'active'
      || ele && ele.style.backgroundPosition.indexOf(' ' + finalState + 'px') != -1 && 'final'
      || 'initial' );
  }

}
