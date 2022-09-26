//
// This script replaces type="module" with defer in the generated index.html file
//

var fs = require('fs');
var filePath = '../Backend/wwwroot/index.html';
var fileContentsArray = fs.readFileSync(filePath, 'utf8').split('\n');
console.log('Removing script tags with module and replacing them with defer');

for (let i = 0; i < fileContentsArray.length; i++) {
  fileContentsArray[i] = replaceText(fileContentsArray[i]);
}

const file = fs.createWriteStream(filePath);
file.on('error', (err) => {
  console.log("Encounter error " + JSON.stringify(err));
});

fileContentsArray.forEach((v) => {
  file.write(v + '\n');
});

file.end();
console.log(filePath + ' updated');

function replaceText(str) {
  const result = str.replace(/type="module"/gi, 'defer');
  return result;
}