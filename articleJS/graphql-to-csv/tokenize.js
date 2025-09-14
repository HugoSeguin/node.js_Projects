const fs = require('fs');
const csv = require('csv-parser');

const inputFile = 'test100.csv';
const outputFile = 'output.json';

const results = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (data) => {
    // Split research.researchAge by commas
    if (data['research.researchAge']) {
      data['research.researchAge'] = data['research.researchAge'].split(',');
    }

    // Split research.researchAuthors by commas
    if (data['research.researchAuthors']) {
      data['research.researchAuthors'] = data['research.researchAuthors'].split(',');
    }

    // Tokenize research.researchActualArticleTitle by words
    if (data['research.researchActualArticleTitle']) {
      data['research.researchActualArticleTitle'] = data['research.researchActualArticleTitle'].split(/\s+/);
    }

    results.push(data);
  })
  .on('end', () => {
    // Write the output to a JSON file
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log('CSV file successfully processed and output saved to', outputFile);
  });
