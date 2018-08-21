(This code is in the process of being converted to use ES6 and ES7.)

The app "Songg" (working title) is a music composition library. Primary input is in the form of chord names, note names, keys, and tonal increments in traditional music theory. In the current (developmental) version, the medium of input is a json file. It's a notion far more semantic than MIDI. The data format is intended to be creatively useful for musicians who also know how to code. Some JSON key names correspond to code classes; and in a fashion meant to be complimentary to the data, the code is extensible.

This makes use of [tonal.js](https://github.com/danigb/tonal), a music theory library for NodeJS. An example of something tonal.js allows you to do is to generate chords and scales from musical terminology such as "C major." The other major feature of Songg is that it allows you to export midi tracks. These you can drag and drop into other music editing applications such as Garage Band.

To alter the song, directly manipulate the JSON of a song (for example, "Intro.json"). With Songg, the craft of the composition is in extending Manipulators to characterize that raw song data. For example, one of the included classes is a Manipulator called an "Arpeggiator." The Arpeggiator is a childmost class. It is also an instance class that actual has a music-specific algorhythm for processing notes. This and other childmost classes are a step in the production of a song; this particlar Manipulator (predictably) arpeggiates the notes of a chord across a bar. (A "bar," in the Songg codebase, is a timewise measurement.)

The JSON song file contains the basic theoretical info about the song--key, scale, ocatves of bars--and it is up to your scripting to alter the song as you like. The Inflator and the Manipulators contain the code that alter the notes in terms of musical composition.

A player is currently included ([MIDI.js](https://github.com/mudcube/MIDI.js/)) but is somewhat provisional; this version of the app is intended for musician-programmers who plan to export the Midi file for further refinement in another application. At a  later stage we might create an in-browser GUI.

For development, you can use "npm run mon".
### Manipulators
Manipulators alter the song that is composed by the basic fields.

Manipulators can be defined at the level of the song (to manipulate all the frases in a phase or in several phases). From the song-based definition like this, the user can specify certain phases, but within the specified phases, all of the frases will be altered.

Manipulators can be defined at the level of the Phase in order to manipulate a specified subset of frases (the subset meeting certain range requirements that the user defines).

The Manipulators include
- Arpeggiator - Places notes in arpeggiation
- NoteRepeater - Causes nth note (for now, only from a frase's chord) to be repeated at yth time
- RootChanger - Rotates the note order of a frase by pushing the first note to the end of the ordering, and raises that note's octave by n octaves. For example (virtual example) [C4, E4, G4] becomes [E4, G4, C5]
- Snazzifier - Beginning from the last note, it splits that note up within its time frame and changes the pitches of the pieces that are left according to the scale or chord or custom scale (as specified).



I will write about how to use each soon and add others.
Also, I plan to add tests soon

songg is © r. david roe 2016.
