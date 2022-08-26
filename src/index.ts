import {logRead} from './logread';
import 'colorts/lib/string';
import * as readline from 'readline';
import {join} from "path";

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Which log file to open?', (answer) => {
    logRead(join('../', answer.toLowerCase())).then(() => process.exit(0));
})


