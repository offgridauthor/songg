
import url from 'url';
import fileList from './fileList.mjs';
import fs from 'fs';
import SongHandle from './SongHandle.mjs';

class SongController {
  static requireExistentFile (fn) {
    if (fileList.indexOf(fn) === -1) {
      throw new Error('Bad filename');
    }
  }

  static respond (request, response) {
    let data = SongController.parseRequest(request),
      sh = new SongHandle(data);

    sh.processSong();
    let augmentedResponse = _.extend(sh.browserResponse, {files: fileList, composer: data.composer});
    response.write(JSON.stringify(augmentedResponse));
    response.send();
  }

  static parseRequest (request) {
    let urlParts = url.parse(
        request.url, true
      ),
      fileName,
      query,
      dat,
      parsed;

    query = urlParts.query;
    fileName = query.fileName;

    if (query.fileName !== undefined) {
      fileName = query.fileName;
    } else {
      fileName = fileList[0];
    }

    SongController.requireExistentFile(fileName);

    dat = fs.readFileSync(`./Songs/${fileName}`).toString();
    parsed = JSON.parse(dat);

    return {
      name: fileName,
      contents: parsed,
      composer: parsed.composer || '',
      files: JSON.parse(JSON.stringify(fileList))
    };
  }
}
export default SongController;
