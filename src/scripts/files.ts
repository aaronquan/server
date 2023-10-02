import fs from 'fs';

export function testFile(){
    fs.writeFile('data/test.txt', 'hi', () => {console.log('err')});
}