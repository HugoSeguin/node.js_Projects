const fs = require('fs');
const csv = require('csv-parser');
const results = [];
const uniqueRows = new Set();

fs.createReadStream('test100.csv')
  .pipe(csv())
  .on('data', (data) => {
    const row = JSON.stringify(data);
    if (!uniqueRows.has(row)) {
      uniqueRows.add(row);
      results.push(data);
    }
  })
  .on('end', () => {
    const csvHeaders = Object.keys(results[0]).join(',');
    const csvRows = results.map(row => Object.values(row).join(',')).join('\n');
    const outputCsv = `${csvHeaders}\n${csvRows}`;

    fs.writeFile('test100.csv', outputCsv, (err) => {
      if (err) {
        console.error('Error writing to file', err);
      } else {
        console.log('File has been written successfully');
      }
    });
  });
