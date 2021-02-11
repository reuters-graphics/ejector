![](badge.svg)

# ⏏️ EJECTOR

Eject a dependency's source files from your `node_modules` directly into your working directory.

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Fejector.svg)](https://badge.fury.io/js/%40reuters-graphics%2Fejector) [![Reuters open source software](https://badgen.net/badge/Reuters/open%20source/?color=ff8000)](https://github.com/reuters-graphics/)

## Why this?

Sometimes at Reuters we need to yank things out of node_modules.

For example, we write [reusable charts](https://github.com/reuters-graphics/awesome-charts) as npm-installable packages. BUT when a prefab graphic doesn't quite do what we need it to do, we want to start from the prewritten code and add a few changes directly in whatever project we're working in.

Ejector is a quick CLI to pull a package's source files into our working directory. It'll snag JS, CSS, SCSS, LESS and font files and stick them directly into your development directory.

Handy.

## Quickstart

```bash
yarn global add @reuters-graphics/ejector
```

### CLI

Run ejector from the root of your project, and it will ask you which dependency you'd like to eject.

```bash
ejector
```

You can also supply a filter to limit the dependency options.

```bash
ejector -f @reuters-graphics
```

### Module

```javascript
import Ejector from '@reuters-graphics/ejector';

const ejector = new Ejector();

await ejector.eject();

// ... or with a filter
await ejector.eject('@reuters-graphics');
```

## Testing

```bash
yarn build && yarn test
```
