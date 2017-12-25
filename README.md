The app "Songg" (working title) is a music composition library. Primary input is in the form of chord names, note names, keys, and tonal increments in traditional music theory. In the current (developmental) version, the medium of input is a json file. It's a notion far more semantic than MIDI. The data format is intended to be creatively useful for musicians who also know how to code. Some JSON key names correspond to code classes; and in a fashion meant to be complimentary to the data, the code is extensible.

This makes use of [tonal.js](https://github.com/danigb/tonal), a music theory library for NodeJS. An example of something tonal.js allows you to do is to generate chords and scales from musical terminology such as "C major." The other major feature of Songg is that it allows you to export midi tracks. These you can drag and drop into other music editing applications such as Garage Band.

To alter the song, directly manipulate the JSON of a song (for example, "Intro.json"). With Songg, the craft of the composition is in extending Manipulators to characterize that raw song data. For example, one of the included classes is a Manipulator called an "Arpeggiator." The Arpeggiator is childmost class. It is also an instance class that actual has a music-specific algorhythm for processing notes. This and other childmost classes are a step in the production of a song; this particlar Manipulator (predictably) arpeggiates the notes of a chord across a bar. (A "bar," in the Songg codebase, is a timewise measurement.)

The JSON song file contains the basic theoretical info about the song--key, scale, ocatves of bars--and it is up to your scripting to alter the song as you like. The Inflator and the Manipulators contain the code that alter the notes in terms of musical composition.

A player is currently included ([MIDI.js](https://github.com/mudcube/MIDI.js/)) but is somewhat provisional; this version of the app is intended for musician-programmers who plan to export the Midi file for further refinement in another application. At a  later stage we might create an in-browser GUI.


