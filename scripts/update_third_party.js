/* eslint-disable import/no-extraneous-dependencies */
const https = require('follow-redirects').https;
const fs = require('fs');
const AdmZip = require('adm-zip');
const fetch = require('node-fetch');
const rimraf = require('rimraf');
const { rawTimeZones } = require('@vvo/tzdb');

// Update timezone list
console.log('Update timezone list:\n - Rebuilding list...');
const tzList = [];
for (const item of rawTimeZones) {
    tzList.push({
        name: item.name,
        countryName: item.countryName,
        mainCity: item.mainCities[0],
    });
}
fs.unlinkSync('./src/tools/tzList.json');
fs.writeFileSync('./src/tools/tzList.json', JSON.stringify(tzList, null, 4));
console.log(` - ${tzList.length} items rebuilt.`);

// Update PDF.js
console.log('Update PDF.js:\n - Checking version...');
fetch('https://api.github.com/repos/mozilla/pdf.js/releases/latest')
    .then((res) => res.json())
    .then((data) => {
        for (const item of data.assets) {
            if (item.name.includes('-es5-')) {
                console.log(` - Found file ${item.name}`);
                return item.url;
            }
        }
        return data.assets[1].url;
    })
    .then((url) => {
        console.log(' - Downloading...');

        const file = fs.createWriteStream('./pdfjs.zip');
        https.get({
            hostname: 'api.github.com',
            path: url.replace('https://api.github.com', ''),
            headers: {
                Accept: 'application/octet-stream',
                'User-Agent': 'UOMA/DEV-UPDATER',
            },
        }, (response) => {
            file.on('finish', () => {
                file.close();

                console.log(' - File saved.');

                rimraf('./pdfjs_viewer', () => {
                    const zipFile = new AdmZip('./pdfjs.zip');
                    zipFile.extractAllTo('./pdfjs_viewer', true);

                    fs.unlinkSync('./pdfjs.zip');

                    console.log(' - Done.');
                });
            });

            response.pipe(file);
        });
    });
