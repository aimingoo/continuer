continuer [![npm version](https://badge.fury.io/js/continuer.svg)](https://www.npmjs.com/package/continuer)
=========

continue sequence of functions.

## Installation
download continuer.js as a file module. or install continuer package by npm:

```bash
$ npm install continuer
```

## Usage
for sample, you need a http client sequence:

  1. get http://www.google.com/
  2. get http://www.yahoo.com/
  3. get http://www.facebook.com/

by default, use a global singleton continuer:

```javascript
// npm install request
var httpcli = require('request');
var getter = httpcli.get.bind(httpcli);
var callback = function(err, response, body) {
  console.log("Got response: " + response.statusCode, "Length: " + body.length);
}

require('continuer')
  .next(getter, ['http://www.google.com/', callback])
  .next(getter, ['http://www.yahoo.com/', callback])
  .next(getter, ['http://www.facebook.com/', callback])
  .do();
```

or new a continuer instance:

```javascript
...
require('continuer')()
  .next(getter, [...])
  .next(...)
  // more and more...
  .do();
```

## Interace and paraments

```javascript
// get global singleton
var c = require('continuer')
// a new instance
var c = require('continuer')()

/** next() 
 *  - func: a function, put into continue sequence
 *  - args: arguments for <func>, Optional
 *     - instane of Array/Arguments: func's arguments
 *     - false value(undefined/null/0/...): arguments is lazyed, or none
 *  - continuator: a object with .do() method, Optional.
**/
c.next(func, args, continuator)

/** isCallback() 
 *  - func: a function, will callback by host
 *  - args: see also c.next(), Optional
 *  - continuator: see also c.next(), Optional
 *    - true value: force skip callback-warp when last_arg isnt callback function of <args>
**/
c.isCallback(func, args, continuator)

/** do() 
 * execute continue sequence now
**/
c.do()
```

## Exception or Error report

if got exception/error, will break the sequence and report with un-executed items of queue. output example:

```javascript
[Error: error at here, break now]
[Queue]: 
 [ [ [Function] ],
   [ [Function], [ [Function], 1000 ] ],
   [ [Function] ] ]
```

## Advanced: isCallback()

for randomized calls:

```javascript
var i, funcs = []
for (i=0; i<10; i++) {
  funcs[i] = [new Function("console.log(" + i + ")"), Math.floor(Math.random()*2000)]
}
```

asynchronous call these:

```javascript
funcs.forEach(function(item){
  setTimeout(item[0], item[1])
})
```

got output(or anythings):

```
1
8
4
2
9
5
3
6
0
7
```

use continuer to got Synchronous calls:

```javascript
var c = require('continuer')();
funcs.forEach(function(item) {
  c.next(setTimeout, [c.isCallback(item[0]), item[1]])
})
c.do()
```

now, got output:

```
0
1
2
3
4
5
6
7
8
9
```


## Advanced: with no-callback functions

use continuer instance as a Continuator, you can continue anythings.

```
function cb() {
  console.log('ding...')
}

function normal() {
  console.log('dong...')
}

var c = require('continuer')();

c.next(setTimeout, [c.isCallback(cb), 2000])   // 2s
 .next(normal, [], c)                          // immediately, c as Continuator
 .next(setTimeout, [c.isCallback(cb), 1000])   // 1s
 .next(normal, [], c)                          // immediately, c as Continuator
 .do();
```

output:

```
ding...
dong...
ding...
dong...
```

but, what's Continuator?

It's simple, very simple. a Continuator is a object with a 'do' function member, ex:

```
aContinuator = {
  'do': function() { ... }
}
```

so, A continuer instance is Array/Queue type, Continuer type, and Continuator type.

and, global singleton continuer is Function type.


## Advanced: powerful continuator, pass/lazyed arguments

for this case, how to say hello?

```
function a() {
  return 'hello'
}

function b(msg) {
  console.log('say: ' + msg)
}
```

Ok, for sequential programming:

```
b(a())
```

but, Asynchronous?

```
setTimeout(function() {
  result = a();
  setTimeout(function() {
    b(result)
  }, 1000)
}, 1000)

```

God!

now, use a continuator:

```
// put arguments at top of continued queue, the next(b) is normal function
//  - if args is lazyed, pass false/null/undefined/0/"" on next()
var c = require('continuer')();
var continuedArgs = function(continuer) {
  return {
    'do': function() { continuer.do(continuer[0][1] = arguments) }
  }
}(c)

c.next(a, [], continuedArgs)
 .next(b) // <-- lazyed
 .do()

// or

c.next(setTimeout, [c.isCallback(a, [], continuedArgs), 1000])
 .next(b) // <-- lazyed
 .do()
```

or

```
// put custom/lazyed arguments for next setTimeout()
var c = require('continuer')();
var continuedArgs2 = function(continuer) {
  return {
    'do': function() { continuer.do(continuer[0][1] = [continuer.isCallback(b, arguments), 1000]) }
  }
}(c)

// if args is lazyed, pass false/null/undefined/0/"" on next()
c.next(setTimeout, [c.isCallback(a, [], continuedArgs2), 1000])
 .next(setTimeout)  // <-- lazyed
 .next(function() {
        console.log('continue...')
  })
 .do()
 ```

## Advanced: powerful continuator, use continuer as callback

method continuer.do() is continuer binded, so you can use it as normal callback function. ex:

```
function ding() {
  console.log('ding...')
}

function dong() {
  console.log('dong...')
}

c = require('continuer')();
c.next(ding, [], c)
 .next(dong, [], c)
 .next(ding, [], c)
 .next(dong, [], c);

setTimeout(c.do, 2000);
```

so, you can do more:

```
function step1(resp) {
  resp.on('data', function() { ... })
  return 'ok, step1 completed.'
}

function step2(msg) {
  console.log(msg)
  resp.on('end', function() { ... })
}

var options = {url: 'http://www.google.com/'}
var c = require('continuer')()
var continuedArgs = function(continuer) {
  return {
    'do': function() { continuer.do(continuer[0][1] = arguments) }
  }
}(c)

// 1. build a continued sequence, but dont do() it
//   - on next(), if args is lazyed, pass false/null/undefined/0/""
c.next(step1, false, continuedArgs)    // 4. pass step1 result as arguments of step2
 .next(step2, false, c);               // 5. next, or no more

// 2. continuedArgs.do will bind arguments(response and more) at top of continued queue, and
// 3. call c.do
require('http').request(options, continuedArgs.do)
```
