// &---------------------------------------------------------------------------
// * Load From DEV_ROOT
import { loadJson } from 'jnu-abc';

const devRoot = process.env.DEV_ROOT || './config';
const settingFile = devRoot + '/jd-environments/Apis/notion/monblue_0.json';

const setting = loadJson(settingFile);

console.log(setting);

//---------------------------------------------
// * Load From .env.{{PLATFORM}}
import { test } from "../esm/index.js";
import dotenv from "dotenv";
import { PLATFORM } from "jnu-abc";
dotenv.config({path: `../.env.${PLATFORM}`});

const {GOOGLE_SCOPE_DIR, GOOGLE_AUTH_DIR } = process.env;

test();


