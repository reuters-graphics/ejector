import { name, version } from '../package.json';

import Ejector from '@reuters-graphics/ejector';
import { hideBin } from 'yargs/helpers';
import updateNotifier from 'update-notifier';
import yargs from 'yargs';

updateNotifier({ pkg: { name, version } }).notify();

const argv = yargs(hideBin(process.argv))
  .options({
    f: {
      alias: 'filter',
      describe: 'filter the dependencies you\'d like to eject',
      type: 'string',
    },
  })
  .help()
  .argv;

const ejector = new Ejector();

ejector.eject(argv.filter);
