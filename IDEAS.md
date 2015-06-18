## Injection comment module install spec possibility thing. 

While ensuring the injection argument parser could take a beating,<br />

```javascript
objective( '...',
  function(
    recurse, //nasty arg ar //rangemt
    /*****//******

          sh//ou//ld st/i/ll find `['recurse','plugins']`

    ***/ plugins /*realnasty*/){ //, /*io*/, thing, injector) {
    console.log(plugins);
  }
);
```

And in the back of my mind, ?<b>how to inject `js.varname-unfriendly` modules by name</b>?<br />

Aside from aliasing in the config - this occurred to me as a possible solution:

```javascript
objective( '...',
  function(
    client // socket.io-client
    ) {

  }
);

```

Then, since the injector is async, a just-in-time module install is...<br />
<br />
<br />
doable.<br />
And since there are also other ways to install modules:

```javascript
objective( '...',
  function(
    express,  // shell npm install express@v
    happn    // shell hub smc/happn branch1
  ){

     /* goto one */

  }
);

```

### Or even!

```javascript
objective( '...',
  function(
    data,     // $get psql db -c '.. OUTER JOIN .. INNER PEACE .. WHERE .. WHY ..' | makeJson
    express, // $do npm install express@v
    even    // $get wget -q -O - "$@" https://raw.githubusercontent.com/joyent/node/master/doc/api/readline.markdown
  ){

     /* goto one */

  }
);
```
