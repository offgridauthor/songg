A musical data model for applying coded algorithms to music.

(This code is in the process of being converted to demonstrate ES6 and ES7.)

In the current stage of development, the software analyzes the json song file (such as Song/Example.json), creates the default song structure, runs all indicated manipulators, and saves to Midi format. The midi format can be opened in apps such as GarageBand (Mac) or one of its free alternatives. The midi format is useful for musicians, but will need to be converted to another format to be listened to in most music apps.

### A note on the flat directory structure of the codebase
Although the folder structure is flat, the code is not. The two major kinds of class: the Segments, which are data models representing a song, and the manipulators, which are logical units for traversing and altering notes in the various segments. The major subclasses of Manipulator are SongManipulator, PhaseManipulator, and FraseManipulator.

Segments are in the project root and Manipulators are in a folder thus named.

Segments are the data model and submodel. They include the architectural sections of a song: Song, Phase (like a verse or chorus), and Frase (this last of which I intentionally misspelled for visual distinctiveness between _phase_ and _frase_).

### The front end
This is not a front end; the front-end code is provisional, and just a starting place for futher front-end development. In the provided code, you can download the midi file of the song you're creating. You should hear it played in the browser, as well.

### Music composition via scripting
The codebase "Songg" (working title) is a music composition library. Primary input is in the form of chord names, note names, keys, and tonal increments in traditional music theory. Focus is overwhelmingly on the backend, so far.  

In the current (developmental) version, the medium of input is a json file. It's a notion far more semantic than MIDI, and is enabled by [tonal.js](https://github.com/danigb/tonal). The data format is intended to be creatively useful for musicians who also know how to code. Some json key names correspond to code classes; and in a fashion meant to be complimentary to the data, the code is extensible.

Songg makes use of [tonal.js](https://github.com/danigb/tonal), a music theory library for JavaScript. An example of something tonal.js allows you to do is to generate chords and scales from musical terminology such as "C major", but there are many other music-theoretical features. The other major feature of Songg is that it allows you to export midi tracks. These you can drag and drop into other music editing applications.

### Dev backend in browser
The client side is barely present, and really just intended as a stub for future development. I am still deciding between a few different architectures; the client-side is only a single file, but should be pretty readable, as it's short and clear.

In fact, two different methods are provided for in-browser players. As a dev, you can switch between them with a simple code change. In music.ejs, you will see remarks as to how to effect this change. Experiment between ([Tone.js](https://github.com/Tonejs/Tone.js)) and ([soundfont-player](https://github.com/danigb/soundfont-player)). You'll notice that the Tone.js player is a synthesizer utilizing WebAudio in HTML5, whereas the soundfont-player uses a recorded sample played at the various pitches.

### Installation

Download or clone the repo; install via yarn or npm.
Run the index.js file or (index.mjs in dev) using NodeJS. An output file is produced to public/outputMidi. (The usage instructions below will tell you what happens on running node.)

Node JS has at last gotten an early stage of ES6 modules. For the dev branch, therefore, no transpile is necessary, but you will need to use the --experimental-modules option on running node.

For the master branch, run
```bash
npm run build
```

After doing that you can use
```bash
npm run mon
```

Master is not production ready, but it does disallow NodeJS modules.

### Usage notes; the JSON file

The json song file contains the basic theoretical info about the song--key, scale, octaves of bars--and it is up to your scripting to alter the song as you like. The Inflator and the Manipulators contain the code that alter the notes in terms of musical composition.

With Songg, the craft of the composition is in extending Manipulators to characterize that raw song data. For example, one of the included classes is a Manipulator called a "FraseArpeggiator". It has a note-changing algorithm for the timing of notes in that phrase (rather "frase" in songg). This and other childmost classes are one step in the production of a song; this particlar Manipulator (predictably) arpeggiates the notes of a chord across a bar or melody.

To compose music, make alterations directly to json. Checking out the tonal JS docs will be useful. Knowing how to do it will be based on your checking out the code, at this point. At least one example is present in the "Songs" directory.

After doing your composition in the json file, run node on the index file to produce a new .midi file. The .midi output appears in public/outputMidi.

### Manipulators
Manipulators alter the song that is composed by the basic fields.

Manipulators can be defined at the level of the song (to manipulate all the frases in a phase or in several phases). From the song-based definition like this, the user can specify certain phases, but within the specified phases, all of the frases will be altered.

Manipulators can be defined at the level of the Phase in order to manipulate a specified subset of frases (the subset meeting certain range requirements that the user defines).

The Manipulators include
- FraseArpeggiator - Places notes in arpeggiation
- FraseNoteRepeater - Causes nth note (for now, only from a frase's chord) to be repeated at yth time
- FraseRootChanger - Rotates the note order of a frase by pushing the first note to the end of the ordering, and raises that note's octave by n octaves. For example (virtual example) [C4, E4, G4] becomes [E4, G4, C5]
- Snazzifier - Beginning from the last note by default, it splits that note up within its time frame and changes the pitches of the pieces that are left according to the scale or chord or custom scale (as specified).

Planned docs will indicate how to use each class of manipulator.
Also, I plan to add tests soon

### Why JSON instead of a database?
Using json is not a principled decision, but a convenient one. I have always planned to install a better data layer. Those plans aren't definite yet. I will probably always maintain a json driver/adapter as one option.

songg is © r. david roe 2016 - 18.
