import { DependencyNotFoundError, NoDependenciesError, PackageJsonNotFoundError } from './errors';

import Fuse from 'fuse.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import glob from 'fast-glob';
import path from 'path';
import prompts from 'prompts';

class Ejector {
  constructor(injectedAnswers, testFs) {
    this.injectedAnswers = injectedAnswers || {};
    this.fs = testFs || fs;
  }

  getPackageDependencies() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) throw new PackageJsonNotFoundError('Can\'t find package.json in current directory. Ejector must be run from the root of your project.');
    const { dependencies, devDependencies } = fs.readJsonSync(packagePath);
    if (!dependencies && !devDependencies) throw new NoDependenciesError('No dependencies found in package.json.');
    let deps = [];
    if (dependencies) deps = Object.keys(dependencies);
    if (devDependencies) deps = [...deps, ...Object.keys(devDependencies)];
    this.dependencies = deps;
  }

  filterDependencies(filter) {
    if (!filter) return;
    this.dependencies = this.dependencies.filter(dep => dep.includes(filter));
    if (this.dependencies.length === 0) throw new DependencyNotFoundError(chalk`No dependency found using filter: "{yellow ${filter}}"`);
  }

  async promptForDependency() {
    if (this.dependencies.length === 1) {
      this.dependency = this.dependencies[0];
      return;
    }
    prompts._injected = null;
    if (this.injectedAnswers.dependency) prompts.inject(this.injectedAnswers.dependency);
    const { dependency } = await prompts({
      type: 'autocomplete',
      name: 'dependency',
      message: 'Which dependency would you like to eject?',
      choices: this.dependencies.map(title => ({ title })),
      suggest: (input, choices) => {
        const fuseOptions = {
          isCaseSensitive: false,
          ignoreLocation: true,
          keys: ['title'],
        };
        const fuse = new Fuse(choices, fuseOptions);
        const searchResults = fuse.search(input);
        if (searchResults.length === 0) return Promise.resolve(choices);
        return Promise.resolve(searchResults.map(({ item }) => item));
      },
      limit: 5,
    }, { onCancel: () => { process.exit(0); } });
    console.log(''); // aesthetics...
    this.dependency = dependency;
  }

  getDependencyPath() {
    const packageRoot = path.join(process.cwd(), 'node_modules', this.dependency);
    const srcPath = path.join(packageRoot, 'src');
    const libPath = path.join(packageRoot, 'lib');
    if (fs.existsSync(srcPath)) return srcPath;
    if (fs.existsSync(libPath)) return libPath;
    return packageRoot;
  }

  getEjectPath() {
    const srcJsPath = path.join(process.cwd(), 'src/js/');
    const libJsPath = path.join(process.cwd(), 'lib/js/');
    const srcPath = path.join(process.cwd(), 'src/');
    const libPath = path.join(process.cwd(), 'lib/');
    if (this.fs.existsSync(srcJsPath)) return srcJsPath;
    if (this.fs.existsSync(libJsPath)) return libJsPath;
    if (this.fs.existsSync(srcPath)) return srcPath;
    if (this.fs.existsSync(libPath)) return libPath;
    return process.cwd();
  }

  ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!this.fs.existsSync(dir)) this.fs.mkdirSync(dir, { recursive: true });
  }

  copyFiles() {
    const dependencyPath = this.getDependencyPath();
    const dependencyFiles = glob.sync([
      '**/*.{js,jsx,ts,tsx,mjs,es,esm,json}',
      '!dist/**/*',
      '!docs/**/*',
      '!package.json',
    ], { cwd: dependencyPath });
    const ejectDirectory = this.dependency.includes('/') ? this.dependency.split('/')[1] : this.dependency;
    const ejectPath = path.join(this.getEjectPath(), ejectDirectory);

    for (const dependencyFile of dependencyFiles) {
      const content = fs.readFileSync(path.join(dependencyPath, dependencyFile), 'utf-8');
      const writePath = path.join(ejectPath, dependencyFile);
      this.ensureDir(writePath);
      this.fs.writeFileSync(path.join(ejectPath, dependencyFile), content);
    }
    console.log(chalk`{cyan ${this.dependency}} --> {green ${path.relative(process.cwd(), ejectPath)}}`);
  }

  async eject(filter) {
    console.log(chalk`\n⏏️ {cyan EJECTOR}\n`);
    this.getPackageDependencies();
    this.filterDependencies(filter);
    await this.promptForDependency();
    this.copyFiles();
    console.log(chalk`\n🏁 {cyan Fin.}\n`);
  }
}

export default Ejector;
