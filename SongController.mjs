
import url from 'url';
import fileList, { links } from './fileList.mjs';
import fs from 'fs';
import SongHandle from './SongHandle.mjs';

const MESSAGE_DEV = `<br><br>
<div>Songs are generated from the json currently in /Songs/</div>
<div>Generated copies are in /outputMidi/</div>`

/**
 * Handle requests related to songs.
 */
class SongController {
    /**
     * Ensure the filename (fn) is in the list.
     * 
     * @param {string} fn Filename
     * @throws {Error}  Bad filename if it isn't in list. 
     */
    static requireExistentFile(fn) {
        if (fileList.indexOf(fn) === -1) {
            throw new Error('Bad filename');
        }
    }

    /**
     * Given an express request, do work based on the specified params (inside the request; see parseRequest and song handle class).
     * 
     * @param {object} request  Express request data
     * @param {object} response Express response
     */
    static respond(request, response) {
        let data = SongController.parseRequest(request),
            sh = new SongHandle(data);

        sh.processSong();
        let augmentedResponse = _.extend(sh.browserResponse, { files: fileList, composer: data.composer });
        response.write(`<div>You just generated <a href="${augmentedResponse.midiLink}">${augmentedResponse.midiLink.split('/')[2]}</a></div>`)
        response.write(`<div><h3>Compositions</h3>`)
        response.write(links.map((link) => `<div>${link}</div>`).join(''))
        response.write(JSON.stringify(augmentedResponse))
        response.write(MESSAGE_DEV)
        response.send()
    }

    /**
     * Deduce user instructions from the Express request
     * 
     * @param {object} request Express request 
     * @returns {object} Data about the completed work 
     */
    static parseRequest(request) {
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
