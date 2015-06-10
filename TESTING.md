### Testing This

#### continuous

```bash
node_modules/.bin/mocha \
    --watch \
    --full-trace \
    --require should \
    --compilers coffee:coffee-script/register \
    test/**/*_spec.* test/*_spec.coffee
```

#### once

```bash
npm test
```
