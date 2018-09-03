import Manipulator from './Manipulators/Manipulator.mjs';
import FraseManipulator from './Manipulators/FraseManipulator.mjs';
import PhaseManipulator from './Manipulators/PhaseManipulator.mjs';
import FraseArpeggiator from './Manipulators/FraseArpeggiator.mjs';
import FraseChanger from './Manipulators/FraseChanger.mjs';
import FraseRootChanger from './Manipulators/FraseRootChanger.mjs';
import FraseNoteChanger from './Manipulators/FraseNoteChanger.mjs';
import FraseNoteRepeater from './Manipulators/FraseNoteRepeater.mjs';
import Melody from './Manipulators/Melody.mjs';
import Snazzifier from './Manipulators/Snazzifier.mjs';
import SongManipulator from './Manipulators/SongManipulator.mjs';

function manipulatorFactory (className, fraseManipulatorName) {
  switch (className) {
  case 'Manipulator':
    return new Manipulator();

  case 'FraseManipulator':
    return new FraseManipulator();

  case 'PhaseManipulator':
    return new PhaseManipulator(fraseManipulatorName);

  case 'FraseArpeggiator':
    return new FraseArpeggiator();

  case 'FraseChanger':
    return new FraseChanger();

  case 'FraseRootChanger':
    return new FraseRootChanger();

  case 'FraseNoteChanger':
    return new FraseNoteChanger();

  case 'FraseNoteRepeater':
    return new FraseNoteRepeater();

  case 'Melody':
    return new Melody();

  case 'Snazzifier':
    return new Snazzifier();

  case 'SongManipulator':
    return new SongManipulator();

  default:
    throw new Error(`Can't find class "${className}"`);
  }
}

export default manipulatorFactory;
