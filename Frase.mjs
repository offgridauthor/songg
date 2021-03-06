import Segment from './Segment.mjs';

class Frase extends Segment {
  /**
   * Build instance
   * @param params params
   */
  constructor (params) {
    super();
    this.initialize(params);
  }

  /**
   * Initialize the object
   *
   * @param  {Object}   parameters  Primary params
   *
   * @return {Undefined}
   */
  initialize (attribs) {
    // @todo: implement getters and setters evenly for such prop defs as follow.
    this.notes = attribs.notes;
    this.set('name', attribs.name);
    this.setDuration(attribs.duration);
    this.set('noteDuration', attribs.noteDuration);
    this.set('originalIndex', attribs.originalIndex);

    if (!attribs.phaseDefaults) {
      throw new Error('Phase defaults are required.');
    }

    this.set('phaseDefaults', attribs.phaseDefaults);
    this.inflateNotes();
  }

  /**
   * Bring out the clone.
   *
   * @return {Frase}  Deep clone of this instance of Frase.
   */
  clone () {
    return new Frase(
      {
        notes: JSON.parse(
          JSON.stringify(this.notes)
        ),
        name: this.name,
        duration: this.duration,
        noteDuration: this.noteDuration,
        phaseDefaults: this.phaseDefaults
      }
    );
  }

  /**
   * Give the notes a default duration as defined in phase.
   */
  inflateNotes () {
    _.each(this.notes, (nt) => {
      nt.note.duration = this.getNoteDuration();
    });
  }

  /**
   * Return a reference to the Frase's notes.
   *
   * @return {Array}
   */
  referToNotes () {
    return this.get('notes');
  }

  /**
   * Getter
   *
   * @param  {String}   propName    Name of property to get
   * @return {mixed}                Value at property
   */
  get (propName) {
    if (this.allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name:' + propName);
    }
    return this[propName];
  }

  /**
     * Set specificed key to specified val
     * @todo: implement Es6 setters
     *
     * @param  {String} propName    Name of property to set
     * @param  {mixed}  propName    Val to set
     * @return {mixed}              Value at property
     */
  set (propName, propVal) {
    if (this.allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name:' + propName);
    }

    if (propVal === undefined) {
      this[propName] = null;
    }

    this[propName] = propVal;
  }

  /**
   * Run this passed func for each note
   *
   * @param  {Function} fn  Func to run
   * @return {Undefined}
   */
  forEachNote (fn) {
    _.each(this.get('notes'), fn);
  }

  /**
   * Get the first note
   * @return {Object}   Note object
   */
  getFirstNote () {
    var notes1 = this.get('notes');
    if (notes1.notes) {
      return notes1.notes[0].note;
    }
    return this.get('notes')[0].note;
  }

  /**
   * Get the note count
   * @return {Number}   Integral note count
   */
  getNoteCount () {
    return this.notes().length;
  }

  getDuration () {
    return this.duration || this.get('phaseDefaults').imposedLength;
  }

  getNoteDuration () {
    return this.noteDuration || this.get('phaseDefaults').noteDuration;
  }

  setDuration (dur) {
    this.duration = dur;
  }

  /**
   * Set the relative start time for the Frase.
   */
  setPhaseRelativeStartTime (st) {
    this.set('phaseRelativeStartTime', st);
    let fnt = this.getFirstNote();
    fnt['phaseRelativeStartTime'] = st;
  }

  setInNotes (key, val) {
    this.forEachNote((nt) => {
      nt.note[key] = val;
    });
  }

  get allowedProps () {
    return [
      'notes',
      'duration',
      'noteDuration',
      'phaseDefaults',
      'phaseRelativeStartTime',
      'startTime',
      'name',
      'originalIndex'
    ];
  }

  set allowedProps (x) {
    throw new Error('Read-only property');
  }

  get notes () {
    return this._notes;
  }

  set notes (nts) {
    _._.requireType(nts, 'Array');
    this._notes = nts;
  }
}

export default Frase;
