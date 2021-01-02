![](badge.svg)

# ⏏️ EJECTOR

Eject a dependency's source files from your `node_modules` directly into your working directory.

[![npm version](https://badge.fury.io/js/%40reuters-graphics%2Fejector.svg)](https://badge.fury.io/js/%40reuters-graphics%2Fejector) [![Reuters open source software](https://badgen.net/badge/Reuters/open%20source/?color=ff8000)](https://github.com/reuters-graphics/)

## Why this?

TK.

## Quickstart

```
$ yarn global add @reuters-graphics/ejector
```

### CLI

Run ejector from the root of your project, and it will ask you which dependency you'd like to eject.

```
$ ejector
```

You can also supply a filter to limit the dependency options.

```
$ ejector -f @reuters-graphics
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

```
$ yarn build && yarn test
```
