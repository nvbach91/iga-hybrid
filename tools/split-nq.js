const fs = require('fs');
const chunk = require('lodash.chunk');
const quads = fs.readFileSync('lov.nq', 'utf8').split(/[\r\n]+/);

const chunks = chunk(quads, 100000);
const pad = (i) => {
    return i < 10 ? `0${i}` : i;
};
chunks.forEach((c, index) => {
    const part = c.join('\n');
    fs.writeFileSync(`lov-${pad(index)}.nq`, part);
});

