import 'colorts/lib/string'
import { join } from 'path';
import {createReadStream} from "fs";
import {createInterface} from "readline";
import {once} from "events";
import {LinkedList} from "typescript-collections";

let warn = 0;
let failure = 0;
let drives = new Array<string>;
export async function logRead(filePath: string) {
  try {
    const rl = createInterface({
      input: createReadStream(join(__dirname,filePath)),
      crlfDelay: Infinity
    });

    rl.on('line', (line) =>{
      if (line.includes('Predictive failure') || line.includes('3/11/0') || line.includes('BadLba')) {
        warn++
        console.log(line.yellow);
        let driveNum = line.match(/PD [0-9][0-9,A-F]/) ?? "";
        drives.push(String(driveNum));
      } else if (line.includes('Puncturing bad')) {
        failure++
        console.log(line.red);
        let driveNum = line.match(/DevId[[0-9,A-F]]/) ?? "";
        drives.concat(String(driveNum));
      }
    });
    await once(rl, 'close');
    console.log('done'.green);
    console.log("Total: %s warnings and %s Errors",
        String(warn).replace('\\',"").yellow,
        String(failure).replace('\\',"").red);
    let uniqueDrives = [...new Set(drives)];
    console.log("Errors were found on drives %s", String(uniqueDrives.filter(element => { return element !== '';})).underline.cyan);
    if (failure >= 1) {
      console.log('ADVISE REPLACING DRIVES IN ARRAY PUNCTURE DETECTED'.red.underline);
    }
  } catch (err: any) {
    console.error(err.red);
  }
}
