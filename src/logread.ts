import 'colorts/lib/string'
import { join } from 'path';
import {createReadStream} from "fs";
import {createInterface} from "readline";
import {once} from "events";

let warn = 0;
let failure = 0;
let info = 0;
let drivesErrors = new Array<string>;
let drivesInfo = new Array<string>;
let outWarn = new Array<string>;
let outError = new Array<string>;

export async function logRead(filePath: string) {
  try {
    const rl = createInterface({
      input: createReadStream(join(__dirname,filePath)),
      crlfDelay: Infinity
    });

    rl.on('line', (line) =>{
      if (line.includes('Predictive failure')
          || line.includes('3/11/0')
          || line.includes('BadLba')) {
        warn++
        // console.log(line.yellow);
        outWarn.push(line + '\n');
        let driveNum = line.match(/PD [0-9][0-9,A-F]/) ?? "";
        drivesErrors.push(String(driveNum));
      } else if (line.includes('Puncturing bad')) {
        failure++
        // console.log(line.red);
        outError.push(line + '\n');
        let driveNum = line.match(/PD [0-9][0-9,A-F]/) ?? "";
        drivesErrors.push(String(driveNum));
      } else if (line.includes('Consistency Check started')) {
        info++
        let vdNum = line.match(/VD [0-9][0-9,A-f]/) ?? "";
        drivesInfo.push(String(vdNum))
      }
    });
    await once(rl, 'close');
    let uniqueErrors = [...new Set(outError)];
    let uniqueWarn = [...new Set(outWarn)];
    let uniqueVirt = [...new Set(drivesInfo)]
    console.log(String(uniqueWarn).replace(',0', '0').yellow);
    console.log(String(uniqueErrors).replace(',0', '0').red);
    console.log('done'.green);
    console.log("Total: %s warnings and %s Errors",
        String(warn).replace('\\',"").yellow,
        String(failure).replace('\\',"").red);
    let uniqueDrives = [...new Set(drivesErrors)].sort();
    if (info >= 1 && warn === 0 && failure === 0) {
      console.log("Drives Healthy, Detected Consistency Checks running on Virtual Disks %s",
          String(uniqueVirt.filter(element => { return element !== '';})).cyan.bold);
    }
    if (warn >= 1 || failure >= 1) {
      console.log("Errors were found on drives %s", String(uniqueDrives.filter(element => { return element !== '';})).underline.cyan);
    }
    if (failure >= 1) {
      console.log('ADVISE REPLACING DRIVES IN ARRAY PUNCTURE DETECTED'.red.underline);
    }
  } catch (err: any) {
    console.error(err.red);
  }
}
