
A data model (with some primitive ui) for creating music algorithmically.

In the current stage of development, the software analyzes the json song file (such as Song/Example.json), creates the default song structure, runs all defined manipulators, and saves to the Midi format. The Midi format can be opened in apps such as GarageBand (Mac) or one of its free alternatives. The Midi format is useful for musicians, but will need to be converted to another format to be listened to in most music apps.

### Installation

Download or clone the repo; install via yarn or npm.
Run the index.mjs file using node. An output file is produced to public/outputMidi. (The usage instructions below will tell you what happens on running node.)

Node has at last gotten an early stage of js modules. For the dev branch, therefore, no transpile is necessary, but you may need to use the --experimental-modules option on running node. (It depends on your node version.)

After doing that you can use
```bash
npm run mon
```
or

```bash
yarn mon
```

Master needs significant catching up at the time of this writing. 

### Immediate Use

When you see that the server is running, navigate to `http://localhost:5000/songSystem`. You should see a link that allows you to download the generated midi.

The midi is being generated from a json file in the `/Songs` directory. If you have the ability to play Midi, you can play the downloaded song right away! (For MacOS users, open it in GarageBand, for example.)

To see where that music came from, check out json files--songs--in `/Songs`. The musical structure is described more, below; but some things are obvious. There should always be a chord dictionary and sequencing requirements; composer info, and so on.

At the moment, the default song that gets generated is the first that nodejs finds in `/Songs`. (A next task is to created an index that shows all the songs and allows the user to choose which to create.)

### Basic Examples
See songs named Basic Example for something like a tutorial. The basic examples are a short list, but growing. 
Right now, the only explanation is in a property named "remark" within the song file itself.

### A note on the flat directory structure of the codebase
Although the folder structure is flat, the code is not. There are two major kinds of class: the Segments, which are data models representing a song, and the manipulators, which are logical units for traversing and altering notes in the various Segments. Segments are the data model and submodel. They include the architectural sections of a song: Song, Phase (like a verse or chorus), and Frase (spelled that way to distinguish it visually against _Phase_). The major subclasses of Manipulator are SongManipulator, PhaseManipulator, and FraseManipulator. They correspond to the parts of a song.

Segments are in the project root and manipulators are in a folder thus named.

There is one controller, the SongController. It handles the song by means of a SongHandler class. The SongHandler is mostly a builder that applies algorithms. A SongFile (controlled by SongHandle) does the final save to .midi.

### The front end
You can immediately navigate to the `/songSystem` route. A link, there, will let you do a basic download. 

The project is at a great starting place for front-end development. A nice feature would be to generate any song in the fileList from a list of options (instead of automatically generating the first.)

### Overview of Processing

In the current version, the medium of input is a json file with notation from [tonal.js](https://github.com/danigb/tonal). The data format is intended to be creatively useful for musicians who also know how to code. Some json property names correspond to code classes; the code is meant to be easily extensible for someone who spends a little time with the project.

Primary json data is in two categories: (1) music-theoritical, such as chord names, note names, keys, and tonal increments; and (2) input for JavaScript algorithms that manipulate the notes defined by (1).

[Tonal.js](https://github.com/danigb/tonal) is a music theory library for JavaScript. An example of something tonal.js allows you to do is to generate chords and scales from musical terminology such as "C major", but the library has many other music-theoretical features. The other major feature of Songg is that it allows you to export Midi tracks via [jsmidgen](https://github.com/dingram/jsmidgen). Midi is a format popular with musicians, and you can drop ".midi" or ".mid" files into other music editing applications.


### Usage notes; the JSON file

The json song file contains the basic theoretical info about the song--key, scale, octaves--and it is up to your scripting to alter the song as you like. The SongHandle and the Manipulators contain the code that alter the notes in terms of musical composition. 

By placing manipulators in the "manipParams" of the song, you tell a manipulator to run against all phases of a song. (You can specify a subset.)
By placing manipulators in the "manipParams" of one of the phases, you tell a manipulator to run against all the frases in that phase. (Again, you can specify a subset.)
Manipulators in the phase can be designated to a fine level of control per note.

With Songg, the craft of the composition is in extending manipulators to characterize that raw song data. For example, one of the included classes is a manipulator called a "FraseArpeggiator". It has a note-changing algorithm for altering the timing of notes in the specified frase. This and other childmost classes are one step in the production of a song.

To compose music, make alterations directly to json. Checking out the tonal.js docs will be useful. Knowing how to do it will be based on your checking out the code, at this point. At least one example is present in the "Songs" directory.

After doing your composition in the json file, run node on the index file to produce a new Midi file (with ".midi" extension by default). The .midi file appears in public/outputMidi.

### Manipulators

Manipulators can be defined at the level of the song (to manipulate all the frases in a phase or in several phases). From the song-based definition like this, the user can specify certain phases, but within the specified phases, all of the frases will be altered.

Manipulators can be defined at the level of the phase in order to manipulate a specified subset of frases (the subset meeting certain range requirements that the user defines).

The Manipulators include
- FraseArpeggiator - Places notes in arpeggiation
- FraseNoteRepeater - Causes an nth note (for now, only from a frase's chord) to be repeated at a specified time.
- FraseRootChanger - Rotates the note order of a frase by pushing the first note to the end of the ordering, and raises that note's octave by a specified number of octaves. For example, [C4, E4, G4] becomes [E4, G4, C5]
- Snazzifier - Beginning from the last note by default, it splits that note up within its time frame and changes the pitches of the pieces that are left according to the scale or chord or custom scale (as specified).
- FraseChanger - Change the basic properties of a subset of frases, such as duration.
- Melody - Add a freeform series of notes to a phase as a customized frase.

Planned docs will indicate how to use each class of manipulator.
Tests for the Manipulators, SongHandler, and SongFile are scheduled to be completed by October 31, 2018.

### Why JSON instead of a database?
Using json is not a principled decision, but a convenient one. I have always planned to use a database. Those plans aren't definite yet.

songg is © robert d. roe 2016 - 2021
