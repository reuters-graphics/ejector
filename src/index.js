import { DependencyNotFoundError, NoDependenciesError, NoEjectableFilesFoundError, PackageJsonNotFoundError } from './errors';

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
    this.dependencyFiles = {};
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

  getDependencyPath(pathParts) {
    const packageRoot = path.join(process.cwd(), 'node_modules', this.dependency);
    for (const pathPart of pathParts) {
      const dependencyPath = path.join(packageRoot, pathPart);
      if (fs.existsSync(dependencyPath)) return dependencyPath;
    }
    return packageRoot;
  }

  getEjectPath(pathParts) {
    for (const pathPart of pathParts) {
      const ejectPath = path.join(process.cwd(), pathPart);
      if (this.fs.existsSync(ejectPath)) return ejectPath;
    }
    return process.cwd();
  }

  ensureDir(filePath) {
    const dir = path.dirname(filePath);
    if (!this.fs.existsSync(dir)) this.fs.mkdirSync(dir, { recursive: true });
  }

  copyFiles(dependencyFiles, fileType) {
    const dependencyPath = this.getDependencyPath(['src/', 'lib/']);
    const ejectDirectory = this.dependency.includes('/') ? this.dependency.split('/')[1] : this.dependency;
    const ejectPath = path.join(
      this.getEjectPath([`src/${fileType}/`, `lib/${fileType}/`, 'src/', 'lib/']),
      ejectDirectory
    );

    for (const dependencyFile of dependencyFiles) {
      const readPath = path.join(dependencyPath, dependencyFile);
      const content = fs.readFileSync(readPath, 'utf-8');
      const writePath = path.join(ejectPath, dependencyFile)
        .replace(`${fileType}/${ejectDirectory}/${fileType}`, `${fileType}/${ejectDirectory}`);
      this.ensureDir(writePath);
      this.fs.writeFileSync(writePath, content);
    }
    console.log(chalk`{cyan ${this.dependency}} --> {green ${path.relative(process.cwd(), ejectPath)}}`);
  }

  findFiles(pathPartSets) {
    const dependencyPath = this.getDependencyPath(['src/', 'lib/']);
    for (const pathPartSet of pathPartSets) {
      const dependencyFiles = glob.sync(pathPartSet, { cwd: dependencyPath });
      if (dependencyFiles.length > 0) return dependencyFiles;
    }
    return null;
  }

  getJsFiles() {
    this.dependencyFiles.js = this.findFiles([
      ['js/**/*.{js,jsx,ts,tsx,mjs,es,esm,json}'],
      ['**/*.{js,jsx,ts,tsx,mjs,es,esm,json}', '!dist/**/*', '!docs/**/*', '!package.json'],
    ]);
  }

  getCssFiles() {
    this.dependencyFiles.css = this.findFiles([
      ['css/**/*.css'],
      ['**/*.css', '!dist/**/*', '!docs/**/*'],
    ]);
  }

  getScssFiles() {
    this.dependencyFiles.scss = this.findFiles([
      ['{scss,sass}/**/*.{scss,sass}'],
      ['**/*.{scss,sass}'],
    ]);
  }

  getLessFiles() {
    this.dependencyFiles.less = this.findFiles([
      ['less/**/*.less'],
      ['**/*.less'],
    ]);
  }

  getFontFiles() {
    this.dependencyFiles.fonts = this.findFiles([
      ['*font*/**/*.{eot,ttf,woff,woff2,svg}'],
      ['**/*.{eot,ttf,woff,woff2,svg}', '!dist/**/*', '!docs/**/*'],
    ]);
  }

  getDependencyFiles() {
    this.getJsFiles();
    this.getCssFiles();
    this.getScssFiles();
    this.getLessFiles();
    this.getFontFiles();
  }

  async promptForTypes() {
    this.getDependencyFiles();
    const { js, css, scss, less, fonts } = this.dependencyFiles;
    prompts._injected = null;
    if (this.injectedAnswers.types) prompts.inject(this.injectedAnswers.types);
    const choices = [
      { title: 'JS', value: 'js', disabled: !js },
      { title: 'CSS', value: 'css', disabled: !css },
      { title: 'SCSS', value: 'scss', disabled: !scss },
      { title: 'LESS', value: 'less', disabled: !less },
      { title: 'Webfonts', value: 'fonts', disabled: !fonts },
    ].filter(c => !c.disabled);
    if (choices.length === 0) throw new NoEjectableFilesFoundError(chalk`Didn't find any file types to eject in {yellow ${this.dependency}}`);
    if (choices.length === 1) return choices.map(c => c.value);
    const { types } = await prompts({
      type: 'multiselect',
      name: 'types',
      message: 'Which files do you want to eject into your working directory?',
      hint: chalk`\n{green ←/→ or space to select}`,
      instructions: false,
      choices,
    }, { onCancel: () => { process.exit(0); } });
    return types;
  }

  ejectFiles(types) {
    if (types.includes('js')) this.copyFiles(this.dependencyFiles.js, 'js');
    if (types.includes('css')) this.copyFiles(this.dependencyFiles.css, 'css');
    if (types.includes('scss')) this.copyFiles(this.dependencyFiles.scss, 'scss');
    if (types.includes('less')) this.copyFiles(this.dependencyFiles.less, 'less');
    if (types.includes('fonts')) this.copyFiles(this.dependencyFiles.fonts, 'fonts');
  }

  async eject(filter) {
    console.log(chalk`\n⏏️ {cyan EJECTOR}\n`);
    this.getPackageDependencies();
    this.filterDependencies(filter);
    await this.promptForDependency();
    const types = await this.promptForTypes();
    this.ejectFiles(types);
    console.log(chalk`\n🏁 {cyan Fin.}\n`);
  }
}

export default Ejector;
