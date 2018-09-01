/**
  * Model class for raw song data
  *
  **/
import Phase from './Segment.mjs';
import Phase from './Phase.mjs';


const div1 = .75,
  secondsDivisor = 256;

class Song extends Segment {
  /**
   * Backbone model defaults
   *
   * @type {Object}
   */
  constructor (initProps, songComp, trackNumber, manipParams) {

    this.trackNumber = trackNumber;
    this.initialize(initProps, manipParams);

  }

  /**
   * Get value of specified prop.
   *
   * @param {mixed} n Property to get
   */
  get (n) {
    return this[n];
  }

  /**
   * Set value at specified property key.
   *
   */
  set (n, val) {
    this[n] = val;
  }

  /**
   * Set up the instance
   *
   * @param  {Object} attribs Constructor attributes
   * @param  {Object} opts    Options (arguments, basically) for this function
   *
   * @return void
   */
  initialize (attribs, manipParams) {
    this.hist = [];
    this.phases = [];
    this.writeableEvents = null;
    this.outputDir = 'public/outputMidi';
    this.manipParams = manipParams;
  }

  /**
   * Add a phase to the song
   *
   * @param  {Object} phase  Phase data
   * @param  {String} nm     key name for phase
   * @param  {Number} idx    index at which to assign phase
   *
   * @return {undefined}
   */
  addPhase (phase, nm, opts) {
    if (typeof phase === 'object') {
      _._.verifySongOpts(opts);

      let idx = Object.keys(this.phases).length,
        newPhs = new Phase(phase, nm, idx, opts);
      this.phases.push(newPhs);
    } else {
      throw new Error('Argument should be an object (' + (typeof phase) + ') ');
    }
  }



  /**
   * Execute specified function per phase in song
   *
   * @param  {Function} fn Function to execute

   * @return {undefined}
   *
   */
  forEachPhase (fn) {
    _.each(this.phases, fn);
  }

  /**
   * Utility-type function for formatting a bar for consumption
   * by the client
   *
   * @param  {Array} bar  Array of notes
   *
   * @return {Object}     object wrapped how the client expects it
   */
  formatOutputBar (bar) {
    bar = {chord: bar};
  }

  timePhases () {
    let phasesRunning;
    // trigger "timePhase" on each phase
    this.forEachPhase(phs => phs.innerTiming());

    // with the duration set for each phase, do the rest,
    // make it relative to the song.
    phasesRunning = 0;
    this.forEachPhase(phs => {
      phs.set('startTime', phasesRunning);
      phs.setFraseStartTimes();
      phasesRunning += phs.get('duration');
    });
  }

  getTrack () {
    return this;
  }


  // - - - - - hooks funcs - - -
  /**
   * Run manipulators
   */
  runHooks () {
    this.songHooks();

    // if hookws (Meaning manipulators) always update their respective durations,
    // then timePhases should always respect that. No worrying about the phase times or
    // overall song time in manips.
    this.phaseHooks();
    this.timePhases();
    // Run bar hooks
  }

  /**
   * Run phase hooks
   */
  phaseHooks () {
    _.each(
      this.phases,
      (phase) => {
        phase.hooks();
      }
    );
  }

  songHooks () {
    const that = this;
    return;
    _.each(this.get('manipParams'), (manipDataList, manipName) => {
      that.runManipOnPhases(manipName, manipDataList);
    });
  }

  /**
   * Run manipulator on phases.
   */
  runManipOnPhases (manipName, manipDataList) {
    const that = this;

    // Right now, we have a property such as "Arpeggiator" from the song's
    // highest-level "manipParams" property; "Arpeggiator" (etc) is an Array
    // with multiple entries. (We are not running per-phase yet)
    _.each(
      manipDataList,
      (manipDatum) => {
        // Within this loop we now have recourse to the phases against which
        // to run this manipulator entry.
        let phaseList = typeof (manipDatum.phases) === 'string'
            ? [manipDatum.phases]
            : manipDatum.phases,
          phaseInstances = that.phaseMapForList(phaseList);

        // Run this one Arpeggiator.data config element against its listed
        // phases.
        _.each(phaseInstances, (phsInst) => {
          phsInst.runManip([manipDatum], manipName);
        });
      }
    );
  }

  phaseMapForList (phaseList) {
    let all =
      _.map(
        phaseList,
        (p) => {
          let nm,
            idx = null,
            byName;

          if (p.indexOf(':') !== -1) {
            let pDat = p.split(':');
            nm = pDat[0];
            idx = pDat[1];
          } else {
            nm = p;
          }

          byName = _.where(this.phases, {name: nm});

          if (byName.length === 0) {
            throw new Error(`Could not find any phase by name ${nm} (${phaseList})`);
          }

          if (idx === null) {
            if (byName.length > 1) {
              throw new Error('More than one phases exists for ' + nm + '; please specify index (eg)');
            } else {
              return byName[0];
            }
          } else {
            if (undefined === byName[idx - 1]) {
              throw new Error(`No phase at index ${idx - 1} (zero-indexed version of your entry, ${idx}) for phase name ${nm}`);
            }
            return byName[idx - 1];
          }
        }
      );

    return all;
  }
}

export default Song;
