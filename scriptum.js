/* 
 __   __   __     __  ___            
/__` /  ` |__) | |__)  |  |  |  |\/| 
.__/ \__, |  \ | |     |  \__/  |  | 


lib: natural language processing using functional programming

Focus on functional idioms, asynchronicity, iterators, arrays, strings, linear
algebra, and regular expressions for effective natural language processing in
Javascript. */


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DEPS █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


import Child from "node:child_process";
import Crypto from "node:crypto";
import FS from "node:fs";
import Path from "node:path";
import Stream from "node:stream";
//import * as I from "immutable";


const scheduler = queueMicrotask ? queueMicrotask
  : process?.nextTick ? process.nextTick
  : null;


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ ASPECTS ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// cross-cutting concernes


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ CONSTANTS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const $ = Symbol.toStringTag;


export const $$ = Symbol("constructor");


export const Err = Error;


export const noop = null;


export const notFound = -1;


export const posInf = Number.POSITIVE_INFINITY;


export const negInf = Number.NEGATIVE_INFINITY;


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ DEBUGGING ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const log = (...args) => {
  console.log(...args);
  return args[0];
};


export const intro = x =>
  Object.prototype.toString.call(x).slice(8, -1);


export const debug = expr => {
  debugger;
  return expr;
};


export const debugf = f => (...args) => {
  debugger;
  return f(...args);
};


export const debugIf = p => expr => {
  if (p(expr)) debugger;
  return expr;
};


//█████ Type Signatures ███████████████████████████████████████████████████████


// intercept type signatures

export const trace = x => {
  console.log(JSON.stringify(Sign.get(x)));
  return x;
};


export const Sign = {};

Sign.retrieve = x => {
  if (typeof x === "function") {
    if (x[$] === "Visor") return x.toString();
    return x.name || "λ";
  }

  else if (x === null) return "Nul";
  else if (x === undefined) return "Und";

  else if (typeof x === "object") {
    const tag = Object.prototype.toString.call(x).slice(8, -1);

    switch (tag) {
      case "Array": return `[${Sign.arr(x)}]`;
      case "ArrayBuffer": return "ArrayBuffer[]";
      case "BigInt64Array": return "BigInt64Array[]";
      case "BigUInt64Array": return "BigUInt64Array[]";
      case "Boolean": return "Bol{}";
      case "Buffer": return "Buffer[]";
      case "DataView": return "DataView{}";
      case "Date": return "Dat{}";
      case "Duplex": return "Duplex{}";
      case "Error": return "Err{}";
      case "EventEmitter": return "EventEmitter{}";
      case "Float32Array": return "Float32Array[]";
      case "Float64Array": return "Float64Array[]";
      case "Int8Array": return "Int8Array[]";
      case "Int16Array": return "Int16Array[]";
      case "Int32Array": return "Int32Array[]";
      case "Map": return `Map<${Sign.map(x)}>`;
      case "Number": return "Num{}";
      case "Promise": return "Promise{}";
      case "RegExp": return "Rex{}";
      case "Set": return `Set<${Sign.set(x)}>`;
      case "SharedArrayBuffer": return "SharedArrayBuffer[]";
      case "String": return "Str{}";
      case "Symbol": return "Sym{}";
      case "Transform": return "Transform{}";
      case "Uint8Array": return "Uint8Array[]";
      case "Uint8ClampedArray": return "Uint8ClampedArray[]";
      case "Uint16Array": return "Uint16Array[]";
      case "Uint32Array": return "Uint32Array[]";
      case "WeakMap": return `Wap<${Sign.map(x)}>`;
      case "WeakRef": return "Ref{}";
      case "WeakSet": return `Wet<${Sign.set(x)}>`;
      case "Writable": return "Writable{}";

      case "Object": {
        const name = x?.constructor?.name === "Object"
          ? "" : x.constructor.name;

        return `${name}{${Sign.obj(x)}}`;
      }

      default: {

        // use constructor instead of tag

        if (x?.[$$]) return `${x[$$]}{${Sign.obj(x)}}`;
        else return `${tag}{${Sign.obj(x)}}`;
      };
    }
  }

  else switch (Object.prototype.toString.call(x).slice(8, -1)) {
    case "Boolean": return "Boo";
    case "BigInt": return "Big";
    case "NaN": return "NaN";
    case "Number": return "Num";
    case "String": return "Str";
    case "Symbol": return "Sym";
    default: throw new Err(`unknown primitive tag "${tag}`);
  }
};


Sign.arr = xs => {
  const s = xs.reduce((acc, x) => {
    return acc.add(Sign.retrieve(x))
  }, new Set());

  return Array.from(s).join(", ");
};


Sign.set = s => {
  const s2 = Array.from(s).reduce((acc, x) => {
    return acc.add(Sign.retrieve(x))
  }, new Set());

  return Array.from(s2).join(", ");
};


Sign.map = m => {
  const s2 = Array.from(m).reduce((acc, pair) => {
    return acc.add(`${Sign.retrieve(pair[0])}: ${Sign.retrieve(pair[1])}`);
  }, new Set());

  return Array.from(s2).join(", ");
};


Sign.obj = o => {
  const s2 = Object.entries(o).reduce((acc, pair) => {
    return acc.add(`${pair[0]}: ${Sign.retrieve(pair[1])}`);
  }, new Set());

  return Array.from(s2).join(", ");
};


//█████ Visualization █████████████████████████████████████████████████████████


/* Instead of static typing, scriptum tries to visualize the nested intermediate
function call tree that is build by the computation. It does so by logging all
intermediate results. This profoundly assists the programmer during development.
Evaluating `comp(comp) (comp) (sqr) (add) (3) (4)`, for instance, yields the
following log:

  ➡️ comp(comp(f) (g) (x))
  ✅ comp(comp(f) (g) (x)) 🠲  comp(comp(f) (g) (x)) (g) (x)
  ➡️ comp(comp(f) (g) (x)) (comp(f) (g) (x))
  ✅ comp(comp(f) (g) (x)) (comp(f) (g) (x)) 🠲  comp(comp(f) (g) (x)) (comp(f) (g) (x)) (x)
  ➡️ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x))
  ➡️ comp(sqr(x))
  ✅ comp(sqr(x)) 🠲  comp(sqr(x)) (g) (x)
  ➡️ comp(comp(sqr(x)) (g) (x))
  ✅ comp(comp(sqr(x)) (g) (x)) 🠲  comp(comp(sqr(x)) (g) (x)) (g) (x)
  ➡️ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x)) (add(x) (y))
  ➡️ comp(comp(sqr(x)) (g) (x)) (add(x) (y))
  ✅ comp(comp(sqr(x)) (g) (x)) (add(x) (y)) 🠲  comp(comp(sqr(x)) (g) (x)) (add(x) (y)) (x)
  ✅ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x)) (add(x) (y)) 🠲  comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x))
  ➡️ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x)) (Num)
  ➡️ comp(comp(sqr(x)) (g) (x)) (add(x) (y)) (Num)
  ➡️ add(Num)
  ✅ add(Num) 🠲  add(Num) (y)
  ➡️ comp(sqr(x)) (add(Num) (y))
  ✅ comp(sqr(x)) (add(Num) (y)) 🠲  comp(sqr(x)) (add(Num) (y)) (x)
  ✅ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x)) (Num) 🠲  comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x))
  ➡️ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x)) (Num)
  ➡️ comp(comp(sqr(x)) (g) (x)) (add(x) (y)) (Num) (Num)
  ➡️ comp(sqr(x)) (add(Num) (y)) (Num)
  ➡️ add(Num) (Num)
  ✅ add(Num) (Num) 🠲  Num
  ➡️ sqr(Num)
  ✅ sqr(Num) 🠲  Num
  ✅ comp(sqr(x)) (add(Num) (y)) (Num) 🠲  Num
  ✅ comp(comp(sqr(x)) (g) (x)) (add(x) (y)) (Num) (Num) 🠲  Num
  ✅ comp(comp(f) (g) (x)) (comp(f) (g) (x)) (sqr(x)) (Num) 🠲  Num

For first and higher order function curried or uncurried, the visualizer doesn't
need to alter the augmented function but just serves as a wrapper. Recursive
functions must invoke the wrapper in each recursive call, though:

  const fib_ = Visor.augmentRec("fib");

  const fib = (n) => {
    if (n <= 1) {
      return n;
    }

    else {
      return fib_(fib, n - 1) + fib_(fib, n - 2);
    }
  };

  fib(4); // 3 and logs:

  ➡️  fib(Num)
    ➡️  fib(Num)
      ➡️  fib(Num)
      ✅ fib(Num) => Num
      ➡️  fib(Num)
      ✅ fib(Num) => Num
    ✅ fib(Num) => Num
    ➡️  fib(Num)
    ✅ fib(Num) => Num
  ✅ fib(Num) => Num
  ➡️  fib(Num)
    ➡️  fib(Num)
    ✅ fib(Num) => Num
    ➡️  fib(Num)
    ✅ fib(Num) => Num
  ✅ fib(Num) => Num */


export const Visor = {};


Visor.serialize = x => {
  if (x?.[$] === "Visor") return x.toString();
  return Sign.retrieve(x);
};


Visor.visualize = o => {
  if (!o) return "?";

  let s = o.baseName, xs = [...o.baseParams];

  for (let i = 0; i < o.appliedArgs.length && i < xs.length; i++) {
    const argValue = o.appliedArgs[i];
    s += `(${Visor.serialize(argValue)})`;
  }

  const ys = xs.slice(o.appliedArgs.length);
  for (const param of ys) s += `(${param})`;
  return s;
};


Visor.createWrapper = (f, o) => {
  const wrapper = function(...newArgs) {
    const xs = o.appliedArgs,
      ys = [...xs, ...newArgs];

    let s = o.baseName;

    for(let i = 0; i < o.baseParams.length; i++) {
      if (i < xs.length) s += `(${Visor.serialize(xs[i])})`;
      else break;
    }

    s += newArgs.map(arg => `(${Visor.serialize(arg)})`).join("");

    const callStr = s.replaceAll(/\)(?=\()/g, ") ");
    console.log(`➡️  ${callStr}`);

    let r;
    let resultToLog;
    let finalReturnValue;

    try {
      r = f.apply(this, newArgs);

      if (typeof r === "function") {
        const p = {...o, appliedArgs: ys};
        finalReturnValue = Visor.createWrapper(r, p);
        resultToLog = finalReturnValue;
      } else {
        finalReturnValue = r;
        resultToLog = r;
      }

      let resultStr = Visor.serialize(resultToLog);

      if (callStr.replaceAll(/ /g, "") !== resultStr.replaceAll(/ /g, "")) {
        let s3 = `✅ ${callStr} 🠲  ${resultStr}`;
        console.log(s3.replaceAll(/\)(?=\()/g, ") "));
      }
    }

    catch (e) {
      const s2 = s.replaceAll(/\)(?=\()/g, ") ");

      console.error(`💥 error during: ${s2}`);
      console.error(`   function: ${f.name || "λ"}`);
      console.error(`   wrapper: ${Visor.visualize(o)}`);
      console.error(`   applying ${newArgs.map(Visor.serialize).join(", ")}`)
      console.error(`   message: ${e.message}`);
      if (e.stack) console.error(`   Stack: ${e.stack.split('\n').slice(1).join('\n')}`);
      throw e;
    }

    return finalReturnValue;
  };

  wrapper[$] = "Visor";
  wrapper[$$] = "Visor";
  wrapper.toString = () => Visor.visualize(o);
  return wrapper;
};


// visualize first- and higher-order functions in curried/uncurried form

Visor.augment = (f, name, params = []) => {
  const o = {
    baseName: name,
    baseParams: params,
    appliedArgs: [],
  };

  return Visor.createWrapper(f, o);
};


// not stack-safe (for development only)

Visor.augmentRec = name => {
  let depth = 0;

  return (f, ...args) => {
    let indent, r;
    
    indent = "  ".repeat(depth);
    console.log(`${indent}➡️  ${name}(${args.map(Sign.retrieve).join(", ")})`);
    depth++;

    try {r = f(...args)}

    catch (e) {
      depth--;
      
      console.error(
        `💥 error during ${name}(${args.map(Sign.retrieve).join(", ")}) at depth ${depth + 1}`);
      
      throw e;
    }

    depth--;
    indent = "  ".repeat(depth);
    console.log(`${indent}✅ ${name}(${args.map(Sign.retrieve).join(", ")}) => ${Sign.retrieve(r)}`);
    return r;
  };
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ TESTING ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Take a unit test title, several predicates and the result, apply each
predicate to the result and log every case where the result doesn't satisfy a
predicate. Splitting predicates in several simple ones allow for greater
reusability. */

export const assert = ({title, tests: [...os]}) => result => {
  const log = [];

  os.forEach((o, i) => {
    const k = Object.keys(o) [0], p = o[k],
      name = p.name === "" ? "" : p.name + " ";
    
    try {
      if (!p(result)) log.push(`with ${name}predicate at iteration ${i}`)
    }

    catch (e) {
      log.push(`💥 error with ${name}predicate at iteration ${i}`);
      log.push(e.stack);
    }
  });

  if (log.length) {
    console.warn(`⚠️  test ${title} has failed`);
    console.log(log.join("\n"));
  }

  else console.log(`✅ ${title} has succeeded`);
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TAGGED TYPES █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const tag = (tag, cons = tag) => o => {
  o[$] = tag;
  o[$$] = cons;
  return o;
};


// immutable version

export const make = (tag, cons = tag) => o => ({
  [$]: tag,
  [$$]: cons,
  ...o
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ GENERIC COMBINATORS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const id = x => x;


export const comp = f => g => x => f(g(x));


export const comp2 = f => g => x => y => f(g(x) (y));


export const pipe = g => f => x => f(g(x));


export const compn = (...fs) => fs.reduce((acc, f) => comp(f) (acc), id);


export const pipen = (...fs) => fs.reduce((acc, f) => pipe(f) (acc), id);


export const lift = f => g => x => y => f(g(x)) (g(y));


export const liftl = f => g => x => f(g(x)) (x);


export const liftr = f => g => x => f(x) (g(x));


export const join = f => x => f(x) (x);


export const constl = x => y => x;


export const constr = x => y => y;


export const curry = f => x => y => f(x, y);


export const uncurry = f => (x, y) => f(x) (y);


export const partial = (f, ...args) => (...args2) => f(...args, ...args2);


export const flip = f => y => x => f(x) (y);


export const app = f => x => f(x);


export const appr = x => f => f(x);


// take x that represents a state and return a styteful function

export const fstate = appr;


// flipped arguments

export const appf = (f, y) => x => f(x) (y);


// object notation with self-reference like `this`

export const reify = f => f({});


export const appObj = f => o => 
  Object.values(o).reduce((acc, v) => acc(v), f);


export const appTuple = f => xs =>
  xs.reduce((acc, x) => acc(x), f);


export const chain2 = dict => o => p => f =>
  dict.chain(o) (x => dict.chain(p) (y => f(x) (y)));


// mimic let bindings

export const _let = (...args) => ({in: f => f(...args)});


// explicit scope

export const scope = f => f();


export const notEmpty = x => !!x;


/* Avoid function call nesting by simulating infix operator use. The combinator
works in two modes:

  (x, f, y, g, z) => g(f(x) (y)) (z) // left
  (x, f, y, g, z) => g(z) (f(x) (y)) // right

Function composition and applicative computations build a function call tree in
their left argument. Functorial computations build it in their right arrgument. */

const infix = left => (...args) => {
  if (args.length === 0) throw new Err("no argument found");
  else if (args.length % 2 === 0) throw new Err("invalid number of arguments");

  let i = 1, x = args[0];

  while (i < args.length) {
    if (i === 1) x = args[i++] (x) (args[i++]);
    else if (left) x = args[i++] (x) (args[i++]);
    else x = args[i++] (args[i++]) (x);
  }

  return x;
};


export const infixl = infix(true);


export const infixr = infix(false);


// explicit receiver

export const This = t => ({
  app: x => This(t(x)),
  map: f => This(f(t)),
  unref: t,
});


export const _throw = e => {throw e};


export const _try = f => x => ({
  catch: handler => {
    try {return f(x)}
    catch(e) {return handler(x) (e)};
  }
});


export const eff = f => x => (f(x), x);


// list effectful expressions and return all results

export const effs = (...exps) => exps;


/* Create objects with safe property access if performed via the enum property.
Intended for mimicking enumerations. */

export const _enum = (...ks) => {
  const o = {};

  o.enum = k => {
    if (!(k in o)) throw new Error(`not within enum "${k}"`);
    else return o[k];
  };

  return ks.reduce((acc, k) => {
    acc[k] = k;
    return acc;
  }, o);
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ PATTERN MATCHING ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Pattern matching using destructuring assignment and validation with the full
expressive power of the language. Destructuring assignments are wrapped in try-
catch blocks to silently catch mismatches. Please note that this approach also
swallows actual errors in the match process. It's an unavoidable trade-off.
After a match downstream matchers are skipped. The default methods terminates
the chain. You can pass a default to avoid final mismatch.

pattern({foo: [1, 2], bar: 3})
  .match(({bat: [x, y]}) => x % 2 === 1 ? undefined : x + y)
  .match(({foo: [,x], bar: [,y]}) => x % 2 === 1 ? undefined : x + y)
  .match(({foo: x, bar: [,y]}) => x % 2 === 1 ? undefined : x + y)
  .match(({foo: [,x], bar: y}) => x % 2 === 1 ? undefined : x + y)
  .default("nothing"); // yields 5

pattern({foo: [2, 3], bar: 4})
  .match(({bat: [x, y]}) => x % 2 === 1 ? undefined : x + y)
  .match(({foo: [,x], bar: [,y]}) => x % 2 === 1 ? undefined : x + y)
  .match(({foo: x, bar: [,y]}) => x % 2 === 1 ? undefined : x + y)
  .match(({foo: [,x], bar: y}) => x % 2 === 1 ? undefined : x + y)
  .default("nothing"); // yields "nothing" */


class PatternMatch {
  constructor(o) {
    this.o = o;
    this.r = PatternMatch.mismatch;
    this.skip = false;
  }

  static mismatch = Symbol();

  match(f) {
    if (this.skip) return this;

    try {
      const r = f(this.o);

      if (r !== undefined && r === r) {
        this.r = r;
        this.skip = true;
      }
    }

    catch (e) {}
    return this;
  }

  default(x) {
    if (!this.skip || this.r === PatternMatch.mismatch) {
      if (x !== undefined) return x;
      else throw new Err("mismatch");
    }
    
    else return this.r;
  }
};


export const pattern = o => new PatternMatch(o);


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ MEMOIZATION █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Memoization of recursive functions with a single argument. You can transform
them into CPS form in order to derive memoized and a non-memoized versions from
them:

  const app = f => x => f(x);

  const cpsFib = k => {
    const rec = k(n => n <= 1 ? n : rec(n - 1) + rec(n - 2));
    return rec;
  };

  const fibMemo = cpsFib(memo)
    fib = cpsFib(app);

  fib(40); // yields 102334155
  fibMemo(40); // yields 102334155 much faster

Or simply rely on reference mutation of the original recursive function with
`let fib = n => {...}; fib = memo(fib)` */


export const memoize = f => {
  const m = new Map();

  return x => {
    if (m.has(x)) return m.get(x);
    
    else {
      const r = f(x);
      m.set(x, r);
      return r;
    }
  };
};


// more general version where the key is derived from the value

export const memoize_ = f => g => {
  const m = new Map();

  return x => {
    const k = f(x);

    if (m.has(k)) return m.get(k);
    
    else {
      const y = g(x), k2 = f(y);
      m.set(k2, y);
      return y;
    }
  };
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ STACK-SAFETY █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// trampoline mechanism to achieve stack-safety in Javascript


//█████ Tail Recursion Modulo Cons ████████████████████████████████████████████


export const Loop = f => x => {
  const stack = [];
  let o = f(x);

  while (true) {
    switch (o?.[$$]) {
      case "Loop.Rec": {
        o = f(o.x);
        break;
      }

      case "Loop.Cons": {
        stack.push(o.f);
        o = f(o.x);
        break;
      }

      case "Loop.Base": {
        if (stack.length === 0) return o.x;
        
        else {
          const g = stack.pop();
          o = Loop.Base(g(o.x));
        }

        break;
      }

      default: {
        if (stack.length === 0) {
          console.warn("unexpected raw value");
          return o;
        }

        else {
          console.warn("unexpected stack");
          const g = stack.pop();
          o = Loop.Base(g(o));
        }
      }
    }
  }
};


export const Loop2 = f => (x, y) => {
  const stack = [];
  let o = f(x, y);

  while (true) {
    switch (o?.[$$]) {
      case "Loop2.Rec": {
        o = f(o.x, o.y);
        break;
      }

      case "Loop2.Cons": {
        stack.push(o.f);
        o = f(o.x, o.y);
        break;
      }

      case "Loop2.Base": {
        if (stack.length === 0) return o.x;
        
        else {
          const g = stack.pop();
          o = Loop2.Base(g(o.x, o.y));
        }

        break;
      }

      default: {
        if (stack.length === 0) {
          console.warn("unexpected raw value");
          return o;
        }

        else throw new Err("unexpected stack");
      }
    }
  }
};


Loop.Base = function Base(x) {
  return {[$]: "Loop", [$$]: "Loop.Base", x};
};


Loop.Rec = function Rec(x) {
  return {[$]: "Loop", [$$]: "Loop.Rec", x};
};


Loop.Cons = function Cons(f, x) {
  return {[$]: "Loop", [$$]: "Loop.Cons", f, x};
};


Loop2.Base = function Base2(x) {
  return {[$]: "Loop2", [$$]: "Loop2.Base", x};
};


Loop2.Rec = function Rec2(x, y) {
  return {[$]: "Loop2", [$$]: "Loop2.Rec", x, y};
};


Loop2.Cons = function Cons2(f, x, y) {
  return {[$]: "Loop2", [$$]: "Loop2.Cons", f, x, y};
};


//█████ Virtual Stack █████████████████████████████████████████████████████████


/* Create a virtual stack and make even recursive calls in non-tail position
stack-safe using a trampoline. This goes way beyond tail-recursion modulo cons
et al.:

The Fibonacci sequence in its naive recursive implementation

  const fib_ = n =>
    n <= 1 ? n
      : fib_(n - 1) + fib_(n - 2);

is transoformed into a stack-safe variant

  const add = x => y => x + y,
    add_ = (x, y) => x + y;

  const fib = Stack(n => n <= 1
      ? Stack.Base(n)
      : Stack.Call2(
          add,
          Stack.Rec(n - 1),
          Stack.Rec(n - 2)));

  fib(10) // 55

or into the uncurried variant
  
  const fib = Stack(n => n <= 1
    ? Stack.Base(n)
    : Stack.Calln(
        add_,
        Stack.Rec(n - 1),
        Stack.Rec(n - 2)
      ));

Here is the stack-safe factorial number:

  const fact = Stack(n => n <= 1
    ? Stack.Base(1)
    : Stack.Call(
        x => n * x,
        Stack.Rec(n - 1)));

  fact(20) // 2432902008176640000 */


export const Stack = f => args => {
  const stack = [f(args)];

  while (stack.length > 1 || (stack.length === 1 && stack[0]?.[$$] !== "Stack.Base")) {
    let o = stack[stack.length - 1];

    // handle raw value edge case (disabled for the time being)

    /*if (!o?.[$$]) {
      if (stack.length > 1) {
         const raw = stack.pop(), p = stack.pop();

         switch (p?.[$$]) {
            case "Stack.Call": {
              stack.push(Stack.Base(p.f(raw)));
              break;
            }

            case "Stack.Call2": {
               stack.push(Stack.Call(p.f(raw), p.y));
               break;
            }

            case "Stack.Calln": {
              p.r = p.r || [];
              p.i = p.i !== undefined ? p.i : 0;

              p.r[p.i] = raw;
              p.i++;

              if (p.i < p.args.length) {
                stack.push(p);
                stack.push(p.args[p.i]);
              }

              else {
                const r = p.f(...p.r);
                delete p.i;
                delete p.r;
                stack.push(Stack.Base(r));
              }

              break;
            }

            default: throw new Err("unexpected raw value");
         }

         continue;
      }

      else {
        console.warn("finished with a raw value");
        return stack[0];
      }
    }*/

    switch (o[$$]) {
      case "Stack.Rec": {
        const r = o.x;
        stack.pop();
        stack.push(f(r));
        break;
      }

      case "Stack.Call":
      case "Stack.Call2": {
        stack.push(o.x);
        break;
      }

      case "Stack.Calln": {
        if (o.i === undefined) {
          o.i = 0;
          o.r = [];
        }

        if (o.i < o.args.length) stack.push(o.args[o.i]);

        else {
           const r = o.f(...o.r);
           delete o.i;
           delete o.r;
           stack.pop();
           stack.push(Stack.Base(r));
           console.warn("unexpected variadic call");
        }

        break;
      }

      case "Stack.Base": {
        if (stack.length === 1) break;

        const r = stack.pop().x, p = stack.pop();

        switch (p[$$]) {
          case "Stack.Call": {
            stack.push(Stack.Base(p.f(r)));
            break;
          }

          case "Stack.Call2": {
            const partiallyAppliedFn = p.f(r);
            stack.push(Stack.Call(partiallyAppliedFn, p.y));
            break;
          }

          case "Stack.Calln": {
            p.r[p.i] = r;
            p.i++;

            if (p.i < p.args.length) {
              stack.push(p);
              stack.push(p.args[p.i]);
            }

            else {
              const r2 = p.f(...p.r);
              delete p.i;
              delete p.r;
              stack.push(Stack.Base(r2));
            }

            break;
          }

          default: throw new Err("unexpected stack after base case");
        }

        break;
      }

      default:
        throw new Err("trampoline constructor expected");
    }
  }

  if (stack.length === 1 && stack[0]?.[$$] === "Stack.Base")
    return stack[0].x;
  
  else throw new Err("unexpected stack after completion");
};


// constructors


Stack.Call = function Call(f, x) {
  return {[$]: "Stack", [$$]: "Stack.Call", f, x};
};


Stack.Call2 = function Call2(f, x, y) {
  return {[$]: "Stack", [$$]: "Stack.Call2", f, x, y};
};


Stack.Calln = function Calln(f, ...args) {
  return {[$]: "Stack", [$$]: "Stack.Calln", f, args};
};


Stack.Rec = function Rec(x) {
  return {[$]: "Stack", [$$]: "Stack.Rec", x};
};


Stack.Base = function Base(x) {
  return {[$]: "Stack", [$$]: "Stack.Base", x};
};


//█████ Layz Evaluation ███████████████████████████████████████████████████████


/* Experimental lazy evaluation by mimicking expressions in weak head normal
form using thunks. The latter are basically abstracted away in most cases but
not all:

  * typeof always yields "function" from the underlying proxy
  * equality checks reference of the underlying proxy, not the inner value
  * logical operators don't enforce evaluation but short circuit non-intuitively

These represent major flaws, hence expressions in WHNF should be only used with
great caution. */

export const Lazy = ({tag, cons = tag}) => thunk => {
  let state = {
    thunk: thunk,
    evaluated: false,
    value: undefined,
    evaluating: false
  };

  class LazyError extends Error {
    constructor(message) {
      super(message);
      this.name = "LazyError";
    }
  };

  const forceEval = target => {
    if (target.evaluating) throw new LazyError("cyclic lazy evaluation");

    else if (!target.evaluated) {
      try {
        target.evaluating = true;
        target.value = target.thunk();
        target.evaluated = true;
        target.thunk = null; // allow GC
      } finally {
        target.evaluating = false;
      }
    }

    if (target.value === undefined)
      throw new LazyError("undefined received");

    return target.value;
  };

  const handler = {
    get(target, prop, _this) {

      // enable introspection without forcing evaluation
      
      if (prop === $) return tag;
      else if (prop === $$) return tag;
      else if (prop === Lazy.thunk) return true;

      const value = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      if (value === null || value === undefined) return value[prop];

      else if (typeof value !== "object" && typeof value !== "function") {
        const value2 = value[prop];

        if (typeof value2 === "function")
          return (...args) => value2.apply(value, args);

        else return value2;
      }

      else if (prop === Symbol.isConcatSpreadable && Array.isArray(value))
        return true;

      else return Reflect.get(value, prop, _this);
    },

    has(target, prop) {

      // enable introspection without forcing evaluation

      if (prop === $) return true;
      else if (prop === $$) return true;
      else if (prop === Lazy.thunk) return true;

      const value = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      if (value === null || value === undefined) return false;

      else if (typeof value !== "object" && typeof value !== "function")
        return prop in Object(value);

      else return Reflect.has(value, prop);
    },

    set(target, prop, newValue, _this) {
      const value = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      if (value === null || value === undefined) return false;
      
      else if (typeof value !== "object" && typeof value !== "function")
        return false;
      
      else return Reflect.set(value, prop, newValue, _this);
    },

    apply(target, thisArg, args) {
      const f = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      // allow explicit thunk calls

      if (args.length === 0) return f;

      else if (typeof f !== "function")
        throw new LazyError("cannot apply non-function");

      else return Reflect.apply(f, thisArg, args);
    },

    getPrototypeOf(target) {
      const value = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      if (value === null || value === undefined) return null;

      else if (typeof value !== "object" && typeof value !== "function") {
        return Reflect.getPrototypeOf(Object(value));
      }

      else return Reflect.getPrototypeOf(value);
    },

    ownKeys(target) {
      const value = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      if (value === null || value === undefined) return [];
      else if (typeof value !== "object" && typeof value !== "function") return [];
      else return Reflect.ownKeys(value);
    },

    getOwnPropertyDescriptor(target, prop) {
      const value = target.state.evaluated
        ? target.state.value
        : forceEval(target.state);

      if (value === null || value === undefined)
        return Reflect.getOwnPropertyDescriptor(Object(value), prop);

      else if (typeof value !== "object" && typeof value !== "function")
        return Reflect.getOwnPropertyDescriptor(Object(value), prop);

      else return Reflect.getOwnPropertyDescriptor(value, prop);
    },
  };

  const proxyTarget = function thunk() {};
  proxyTarget.state = state;
  return new Proxy(proxyTarget, handler);
};


export const lazy = Lazy("Thunk");


Lazy.thunk = Symbol("thunk");


Lazy.eager = thunk => {
  if (typeof thunk !== "function") return thunk;
  while (thunk[Lazy.thunk]) thunk = thunk();
  return thunk;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* scriptum favors immutable data types over their mutable counterparts. The
following lists comprise persistent data types and their effective uses cases
and derived data structures, respectively.

Per use case:

  • consing: List, IJS* Stack
  • unconsing: Array (A.focus), IJS Stack, List
  • appending: IJS List, Diff
  • splitting: IJS List
  • searching: Tree, IJS Map
  • uniqueness: IJS Set
  • index access: Array

Per data structure:

  • record: Object (O.update), IJS* Record
  • value object: IJS ValueObject
  • bag/collection: List, IJS List
  • map: IJS Map/OrderedMap
  • set: IJS Set/OrderedSet
  • multimap: MultiMap
  • queue: IJS List, realtime queue (TODO)
  • stack: List, IJS Stack
  • deque: IJS List, Deque (TODO)
  • heap/priority queue: Tree

*immutable.js */


export const A = {};


A.singleton = x => [x];


A.last = xs => xs.length === 0 ? null : xs[xs.length - 1];


A.push = x => xs => (xs.push(x), xs);


A.pushr = xs => x => (xs.push(x), xs);


A.pushn = ys => xs => (xs.push.apply(xs, ys), xs);


A.pushnr = xs => ys => (xs.push.apply(xs, ys), xs);


A.unshift = x => xs => (xs.unshift(x), xs);


A.unshiftr = xs => x => (xs.unshift(x), xs);


A.unshiftn = ys => xs => (xs.unshift.apply(xs, ys), xs);


A.unshiftnr = xs => ys => (xs.unshift.apply(xs, ys), xs);


A.pop = xs => [xs.length === 0 ? null : xs.pop(), xs];


A.shift = xs => [xs.length === 0 ? null : xs.shift(), xs];


A.cons = x => xs => [x].concat(xs);


A.consr = xs => x => [x].concat(xs);


A.snoc = x => xs => xs.concat([x]);


A.snocr = xs => x => xs.concat([x]);


A.uncons = xs => [xs.length === 0 ? null : xs[0], xs.slice(1)];


A.unsnoc = xs => [
  xs.length === 0 ? null : xs[xs.length - 1],
  xs.slice(-1)
];


A.init = xs => xs.length === 0 ? null : xs.slice(0, -1);


A.inits = xs => {
  const n = xs.length, ys = [];
  for (let i = n - 1; i >= 1; i--) ys.push(xs.slice(0, i));
  return ys;
};


A.tail = xs => xs.length === 0 ? null : xs.slice(1);


A.tails = xs => {
  const n = xs.length, ys = [];
  for (let i = 1; i <= n - 1; i++) ys.push(xs.slice(i));
  return ys;
};


// filter all indices that contain x

A.filterIndices = x => xs => {
  const is = [];

  for (let i = xs.indexOf(x); i !== -1; i = xs.indexOf(x, i + 1))
    is.push(i);

  return is;
};


A.filterIndicesWith = p => xs => xs.reduce((acc, x, i) => {
  if (p(x, i)) acc.push(i);
  return acc;
}, []);


// use native slice for take

A.takeWhile = p => xs => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.Base(acc);
  else return p(xs[i]) ? Loop2.Rec((acc.push(xs[i]), acc), i + 1) : Loop2.Base(acc);
}) ([], 0);


// use native slice for drop

A.dropWhile = p => xs => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.Base(acc);
  else return p(xs[i]) ? Loop2.Rec(acc, i + 1) : Loop2.Base(xs.slice(i));
}) ([], 0);


// entries is the default iterable


A.keys = function* (m) {
  for (let [k] of m) {
    yield k;
  }
};


A.values = function* (m) {
  for (let [, v] in m) {
    yield v;
  }
};


// set a focus on an array without altering the underlying array

A.focus = ({from, to}) => xs => {
  const focusLen = Math.max(0, to - from + 1);

  return new Proxy(xs, {
    get: (ys, prop, _this) => {
      if (prop === "length") return focusLen;

      let i = -1;

      if (typeof prop === "number" && prop >= 0 && Number.isInteger(prop)) i = prop;
      else if (A.isIndex(prop)) i = Number(prop);

      if (i !== -1 && i < focusLen) return ys[i + from];
      return Reflect.get(ys, prop, _this);
    },

    has: (ys, prop) => {
      if (prop === "length") return true;

      let i = -1;

      if (typeof prop === "number" && prop >= 0 && Number.isInteger(prop)) i = prop;
      else if (A.isIndex(prop)) i = Number(prop);

      if (i !== -1 && i < focusLen) return Reflect.has(ys, i + from);
      return Reflect.has(ys, prop);
    },

    ownKeys: (ys) => {
      const keys = ["length"];
      for (let i = 0; i < focusLen; i++) keys.push(String(i));
      return keys;
    },

    getOwnPropertyDescriptor: (ys, prop) => {
      if (prop === "length") return length_desc(focusLen);

      let i = -1;

      if (typeof prop === "number" && prop >= 0 && Number.isInteger(prop)) i = prop;
      else if (A.isIndex(prop)) i = Number(prop);

      if (i !== -1) {
        if (i < focusLen) {
          const desc = Reflect.getOwnPropertyDescriptor(ys, i + from);

          if (desc) {
             desc.writable = false;
             return desc;
          }

          else return undefined;
        }

        else return undefined;
      }

      return Reflect.getOwnPropertyDescriptor(ys, prop);
    },

    set: (ys, prop, value) => false,
    defineProperty: (ys, prop, descriptor) => false,
    deleteProperty: (ys, prop) => false,
  });
};


//█████ Type Classes ██████████████████████████████████████████████████████████


A.filter = p => xs => xs.filter(x => p(x));


A.foldl = f => acc => xs => {
  for (let i = 0; i < xs.length; i++)
    acc = f(acc, xs[i]);

  return acc;
};


// stack-safe right-associative

A.foldr = f => acc => xs => Stack(i => {
  if (i === xs.length) return Stack.Base(acc);

  else {
    const g = nextAcc => {
      return f(xs[i], nextAcc);
    };

    const acc2 = Stack.Rec(i + 1);
    return Stack.Call(g, acc2);
  }
}) (0);


// left associative, strict unfold due to non-recursive array data type

A.unfold = f => seed => {
  let acc = [], x = seed;

  while (true) {
    const r = f(x);

    if (r === null) break;

    else {
      const [y, z] = r;

      x = z;
      acc.push(y);
    }
  }

  return acc;
};


A.map = f => xs => xs.map(f);


// should be used with immutable.js

A.ap = fs => xs => {
  return fs.reduce((acc, f) =>
    acc.concat(xs.map(x => f(x))), []);
};


// should be used with immutable.js

A.liftA = f => xs => ys => A.ap(A.map(f) (xs)) (ys);


A.of = A.singleton;


A.chain = xs => f => xs.flatMap(f);


// Applicative f => (a -> f b) -> [a] -> f ([b])
// should be used with immutable.js

A.mapA = dict => f => xs => {
  return xs.reduce((acc, x) =>
    dict.ap(dict.map(A.snoc) (f(x))) (acc), dict.of([]));
};


// Applicative f => [f a] -> f ([a])
// should be used with immutable.js

A.seqA = dict => xs => {
  return xs.reduce((acc, x) =>
    dict.ap(dict.map(A.snoc) (x)) (acc), dict.of([]));
};


A.append = (xs, ys) => xs.concat(ys);


A.empty = () => [];


A.alt = A.append;


A.zero = A.empty;


//█████ Special Folds █████████████████████████████████████████████████████████


// fold while using the index

A.foldi = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc, xs[i], i);

  return acc;
};


/* Fold with context each overlapping pair, i.e. elements will be passed to the
folding twice. */

A.foldPair = f => acc => xs => {
  for (let i = 0; i < xs.length; i++) {
    const next = i + 1 < xs.length ? xs[i + 1] : null;
    acc = f(acc, xs[i], next);
  }

  return acc;
};


/* Fold with context each overlapping triple, i.e. elements will be passed to
the folding three times. */

A.foldTriple = f => acc => xs => {
  for (let i = 0; i < xs.length; i++) {
    const prev = i - 1 >= 0 ? xs[i - 1] : null,
      next = i + 1 < xs.length ? xs[i + 1] : null;

    acc = f(acc, prev, xs[i], next);
  }

  return acc;
};


// monoidal fold

A.foldMap = dict => f => xs => {
  let acc = dict.empty;

  for (let i = 0; i < xs.length; i++)
    acc = dict.append(acc, f(xs[i]));

  return acc;
};


A.sum = xs => {
  let sum = 0;
  for (const n of xs) sum += n;
  return sum;
};


A.any = p => xs => {
  for (const x of xs) if (p(x) === true) return true;
  return false;
};


A.all = p => xs => {
  for (const x of xs) if (p(x) === false) return false;
  return true;
};


A.min = xs => {
  let m = posInf;
  for (const n of xs) if (n < m) m = n;
  return m;
};


A.max = xs => {
  let m = negInf;
  for (const n of xs) if (n > m) m = n;
  return m;
};


// should be used with immutable.js

A.scanl = f => init => A.foldl(acc => x =>
  acc.concat([f(acc[acc.length - 1], x)]))
    ([init]);


// should be used with immutable.js

A.scanr = f => init => A.foldr(x => acc =>
  acc.concat([f(x, acc[0])]))
    ([init]);


//█████ Conversion ████████████████████████████████████████████████████████████


A.It = {};


A.It.fromEntries = ix => {
  const xs = [];
  for (const pair of ix) xs.push(pair);
  return xs;
};


A.It.fromKeys = ix => {
  const xs = [];
  for (const [k] of ix) xs.push(k);
  return xs;
};


A.It.fromValues = ix => {
  const xs = [];
  for (const [, v] of ix) xs.push(v);
  return xs;
};


A.Ait = {};


A.Ait.fromEntries = () => comp(Cont.fromPromise) (async function (ix) {
  const xs = [];
  for await (const pair of ix) xs.push(pair);
  return xs;
});


A.Ait.fromKeys = () => comp(Cont.fromPromise) (async function (ix) {
  const xs = [];
  for await (const [k] of ix) xs.push(k);
  return xs;
});


A.Ait.fromValues = () => comp(Cont.fromPromise) (async function (ix) {
  const xs = [];
  for await (const [, v] of ix) xs.push(v);
  return xs;
});


/* Parse csv data with and without headings. Consider an optional header for
additional, file-wide meta data. Consecutive double or triple delimiters are
considered as escaped and thus part of the content, not the syntax. Separators
within delimiters are alos considered as part of the content, not the syntax. */

A.fromCsv = ({
  sep = ";",
  delim = '"',
  header = false,
  headings = false,
  replace = [/* [RegExp, String] */],
  strict = false
}) => csv => {
  const o = {};

  /* Sanitize csv as follows:

    * '""' => ''
    * '"""' => '<delim/>'
    * '"foo;bar"' => '"foo<sep/>bar' */

  const csv2 = csv
    .trim()
    .replaceAll(R(`(?<=${sep}|^)${delim}{2}(?=${sep}|$)`, "gmv"), "") 
    .replaceAll(R.gv(`${delim}{3}`), "<delim/>") 
    .replaceAll(R(
      `((?:${sep}|^)${delim})([^${delim}\n]+)(${delim}(?:${sep}|$))`, "gmv"), (...args) => {
        let s = args[2].replaceAll(R.g(sep), "<sep/>");
        if (args[1].startsWith(sep)) s = sep + s;
        if (args[3].endsWith(sep)) s += sep;
        return s;
      });

  if (R.g(delim).test(csv2)) throw new Err("malformed delimiter")

  o.table = csv2
    .replaceAll(/<delim\/>/g, delim)
    .split(/\r?\n/)
    .map(row => row.split(sep)
      .map(col => col.replaceAll(/<sep\/>/g, sep))
      .map(col => replace.reduce((acc, pair) =>
        acc.replaceAll(pair[0], pair[1]), col)));

  if (header) o.header = o.table.shift();

  if (headings) {
    o.headings = o.table.shift();

    o.table.forEach((cols, i) => {
      if (strict) {
        if (cols.length < o.headings.length)
          throw new Err(`missing separator @${i}`);

        else if (strict && cols.length > o.headings.length)
          throw new Err(`redundant separator @${i}`);
      }

      cols = cols.reduce((acc, col, i) => (acc[o.headings[i]] = col, acc), {});
    });
  }

  else if (strict) {
    o.table.forEach((cols, i) => {
      if (cols.length !== o.table[0].length)
        throw new Err(`missing separator @${i}`);

      else if (cols.length !== o.table[0].length)
        throw new Err(`missing separator @${i}`);
    });
  }

  return o;
};


A.fromStr = s => s.split("");


A.fromTable = xss => xss.flat();


A.fromTableBy = f => xs => xs.reduce((acc, x) => f(acc) (x), []);


//█████ Set Operations ████████████████████████████████████████████████████████


A.dedupe = xs => Array.from(new Set(xs));


// ignore duplicates 

A.diff = xs => ys => {
  const s = new Set(xs),
    s2 = new Set(ys),
    acc = new Set();

  for (const x of s)
    if (!s2.has(x)) acc.add(x);

  for (const y of s2)
    if (!s.has(y)) acc.add(y);

  return Array.from(acc);
};


// left biased difference (ignores duplicates)

A.diffl = xs => ys => {
  const s = new Set(xs),
    s2 = new Set(ys),
    acc = [];

  for (const x of s)
    if (!s2.has(x)) acc.push(x);

  return acc;
};


// ignores duplicates 

A.intersect = xs => ys => {
  const s = new Set(ys);

  return Array.from(xs.reduce(
    (acc, x) => s.has(x) ? acc.add(x) : acc, new Set()));
};


// ignores duplicates 

A.union = xs => ys => Array.from(new Set(xs.concat(ys)));


//█████ Subarrays █████████████████████████████████████████████████████████████


// binary parition function

A.partition = p => xs => xs.reduce((pair, x)=> {
  if (p(x)) return (pair[0].push(x), pair);
  else return (pair[1].push(x), pair);
}, [[], []]);


/* A more general partition function that allows dynamic key generation and
value combination. */

A.partitionBy = f => g => xs => xs.reduce((acc, x) => {
  const k = f(x);
  return acc.set(k, g(acc.has(k) ? acc.get(k) : null) (x));
}, new Map());


/* Starting from the beginning, split a string at the first position where the
predicate is unmet. */

A.span = p => xs => {
  const ys = [];

  for (let i = 0; i < xs.length; i++) {
    if (p(xs[i])) ys.push(xs[i]);
    else break;
  }

  return [ys, xs.slice(ys.length)];
};


/* Variant that takes the current and next element into account. You can also
apply span with a stateful predicate: `A.span(fstate("") (state => x => ..))`. */

A.span2 = p => xs => {
  if (xs.length === 0) return [[], []];

  else {
    const ys = [xs[0]];

    for (let i = 1; i < xs.length - 1; i++) {
      if (p(xs[i - 1], xs[i])) ys.push(xs[i]);
      else break;
    }

    return [ys, xs.slice(ys.length)];
  }
};


// split at each position where the binary predicate is unmet

A.splitAt = p => xs => {
  const yss = [];
  let ys = [xs[0]];

  for (let i = 1; i < xs.length; i++) {
    const curr = xs[i], prev = xs[i - 1];

    if (p(prev, curr)) ys.push(curr);
    
    else {
      yss.push(ys);
      ys = [curr];
    }
  }

  if (ys.length > 0) yss.push(ys);
  return yss;
};


A.tuplewise = ({size, padding = null, overlap = false}) => xs => {
  const ys = [];

  for (let i = 0; i < xs.length; overlap ? i++ : i += size) {
    if (i + size > xs.length) {
      if (!overlap) {
        const clipping = i + size - xs.length;

        ys.push(xs.slice(i, i + size - clipping)
          .concat(Array(clipping).fill(padding)));
      }
    }
    
    else ys.push(xs.slice(i, i + size));
  }

  return ys;
};


A.bigram = A.tuplewise({size: 2, overlap: true});


A.trigram = A.tuplewise({size: 3, overlap: true});


//█████ Combinations, Subsets, Subsequences ███████████████████████████████████


/* Group all overlapping, consecutive elements of a predefined length
(subsequencing)*/

A.consec = len => xs => {
  const ys = [];

  if (len > xs.length) return ys;

  else for (let i = 0; i + len <= xs.length; i++)
    ys.push(xs.slice(i, i + len));

  return ys;
};


/* Group all overlapping, consecutive elements within a predefined range
(subsequencing). */

A.consecs = ({min, max}) => xs => {
  let ys = [];
  for (let i = min; i <= max; i++) ys = ys.concat(A.consec(i) (xs));
  return ys;
};


A.powerset = ({min, max}) => xs => {
  let xss = [[]];

  for (const x of xs) {
    const yss = [];

    for (const ys of xss) yss.push(ys.concat(x));
    xss.push.apply(xss, yss);
    xss = xss.filter(s => s.length <= max);
  }

  return xss.filter(ys => ys.length >= min && ys.length <= max);
};


// powerset with pruning for numbers

A.powersetNum = ({ min, max, sumThreshold }) => xs => {
  let os = [{subset: [], sum: 0}],
    ys = [];

  if (min <= 0 && max >= 0 && 0 <= sumThreshold) ys.push([]);

  for (const x of xs) {
    const bound = os.length;

    for (let i = 0; i < bound; i++) {
      const o = os[i],
        {subset, sum} = o,
        len = subset.length + 1,
        sum2 = sum + x;

      if (len > max) continue; // prune
      else if (sum2 > sumThreshold) continue; // prune

      const subset2 = subset.concat(x);

      os.push({subset: subset2, sum: sum2});
      if (len >= min) ys.push(subset2);
    }
  }

  return ys;
};


// cartesian product

A.cartesian = xss => {
  const acc = [[]];

  return xss.reduce((acc2, xs) => {
    if (xs.length === 0) return [];

    const yss = [];

    for (const ys of acc2) {
      for (const element of xs) {
        yss.push([...ys, element]);
      }
    }

    return yss;
  }, acc);
};


// permutations

A.perms = xs => {
  if (xs.length === 0) return [[]];
  
  else return xs.flatMap((x, i) =>
    A.perms(xs.filter((y, j) => i !== j))
      .map(ys => [x, ...ys]));
};


// transposition

A.transpose = xss => {
  return xss.reduce((acc, xs) => {
    return xs.map((x, i) => {
      const ys = acc[i] || [];
      return (ys.push(x), ys);
    });
  }, []);
};


//█████ Zipping ███████████████████████████████████████████████████████████████

A.zip = xs => ys => {
  const len = Math.min(xs.length, ys.length), acc = [];
  for (let i = 0; i < len; i++) acc.push([xs[i], ys[i]]);
  return acc;
};


A.zipWith = f => xs => ys => {
  const len = Math.min(xs.length, ys.length), acc = [];
  for (let i = 0; i < len; i++) acc.push(f(xs[i], ys[i]));
  return acc;
};


A.unzip = A.foldl(([xs, ys], [x, y]) =>
  [(xs.push(x), xs), (ys.push(y), ys)]) ([[], []]);


A.unzipWith = f => A.foldl((acc, [x, y]) => (acc.push(f(x, y)), acc)) ([]);


//█████ Recursion Schemes █████████████████████████████████████████████████████


/* Paramorphism: fold by holding a reference to the respective rest of the
array. Usage:

  const createTail = ({x, rest, acc}) => {
    const suffix = [x, ...rest];
    return [suffix, ...acc];
  };

  const tails = (xs) => A.para(createTail) ([[]]) (xs);

  tails([1, 2, 3]); // [[1, 2, 3], [2, 3], [3], []] */

A.para = f => init => xs => {
  const cache = new Map(),
    stack = [{i: 0}];

  cache.set(xs.length, init);

  while (stack.length > 0) {
    const task = stack[stack.length - 1],
      i = task.i;

    if (cache.has(i)) {
      stack.pop();
      continue;
    }

    const i2 = i + 1;
    if (cache.has(i2)) {
      stack.pop();

      const acc = cache.get(i2), x = xs[i],
        rest = A.focus({from: i2, to: xs.length - 1}) (xs),
        r = f({x, rest, acc});

      cache.set(i, r);
    }

    else if (i2 <= xs.length) stack.push({i: i2});
    else stack.pop();
  }

  if (xs.length === 0) return init;
  else return cache.get(0);
};


/* Apomorhism: fold with an extra short circuit mechanism. Usage:

  const unfolder = end => curr => {
    if (curr > end) return null;
    return [curr, curr + 1];
  };

  const range = (start, end) => A.apo(unfolder(end)) (start);
  
  range(1, 5); // [1, 2, 3, 4, 5]
  range(5, 1); // [] */

A.apo = f => seed => {
  const xs = [];
  let x = seed;

  while (true) {
    const pair = f(x);

    if (pair === null) break;
    
    else {
      const [y, z] = pair;
      xs.push(y);

      if (z?.constructor?.name === "Error") break;
      else x = z;
    }
  }
  return xs;
};


/* Hylomorphism: unfold and then fold without any intermediate structure.
Usage:

  const unfolder = max => n => {
    if (n > max) return null;
    return [n, n + 1];
  };

  const mul = (acc, x) => acc * x;

  const fact = n => {
    if (n < 0) return NaN;
    
    if (n === 0) return 1;
    
    return A.hylo({
      f: unfolder(n),
      g: mul,
      init: 1
    }) (1);
  };

  fact(5); // 120 */

A.hylo = ({ f, g, init }) => seed => {
  let acc = init, state = seed;

  while (true) {
    const o = f(state);

    if (o === null) break;
    
    else {
      const [x, state2] = o;
      acc = g(acc, x);
      state = state2;
    }
  }
  return acc;
};


/* zygomorphism: fold while depending on another fold. Usage:

  const sum = (x, main, acc) => [x + main[0], acc];
    len = (x, acc) => 1 + acc;

  const sumLen = xs => {
    return A.zygo({
      f: sum,
      g: len,
      init: [0],
      acc: 1
    }) (xs);
  };

  sumLen([1, 2, 3, 4, 5])); // [15, 5] */

A.zygo = ({f, g, init, acc}) => xs => {
  const cache = new Map(), stack = [];

  cache.set(xs.length, [init, acc]);

  if (xs.length > 0) stack.push({ i: 0 });
  else return init;

  while (stack.length > 0) {
    const task = stack[stack.length - 1],
      i = task.i;

    if (cache.has(i)) {
      stack.pop();
      continue;
    }

    const j = i + 1;

    if (cache.has(j)) {
      stack.pop();

      const [main2, acc2] = cache.get(j),
        x = xs[i],
        acc3 = g(x, acc2),
        main3 = f(x, main2, acc2),
        pair = [main3, acc3];
      
      cache.set(i, pair);
    }

    else if (j <= xs.length) stack.push({i: j});
  }

  const [r, _] = cache.get(0);
  return r;
};


/* Histomorphism: fold by holding a reference to the respective intermediate
result. Usage:

  const fib = (i, history) => {
    const m = history[0], n = history[1];

    if (m === undefined) return 1;
    else if (n === undefined) return 1;

    return m + n;
  };

  A.histo(fib) (0) ([1,2,3,4,5,6,7,8,9,10]); // 55 */

A.histo = f => init => xs => {
  const n = xs.length;

  if (n === 0) return init;

  const ys = new Array(n + 1);
  
  ys[n] = init;

  for (let i = n - 1; i >= 0; i--) {
    const history = A.focus({from: i + 1, to: ys.length - 1}) (ys),
      x = xs[i];
    
    ys[i] = f(x, history);
  }

  return ys[0];
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ BOOLEAN ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Bool = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Bool.imply = ({t, f}) => x => y => {
  if (x) {
    if (y) return t;
    else return f;
  }

  else return t;
};


Bool.nand = ({t, f}) => x => y => !(x && y) ? t : f;


Bool.nor = ({t, f}) => x => y => !(x || y) ? t : f;


Bool.xor = ({t, f}) => x => y => {
  if (x && !y) return t;
  else if (!x && y) return t;
  else return f;
};


Bool.xnor = ({t, f}) => x => y => // aka iff
  (x && y) || (!x && !y) ? t : f;


Bool.notp = p => x => !p(x);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████ CONTINUATION █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// stack-safe continuations for asynchronous computations

export const Cont = resume => ({
  [$]: "Cont",
  [$$]: "Cont",
  resume
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Cont.reject = e => Cont((_res, rej) => {
  try {rej(e)}
  catch(e2) {log("rejection handler failed")}
});


//█████ Type Classes ██████████████████████████████████████████████████████████


Cont.map = f => o => Cont.chain(o) (x => Cont.of(f(x)));


Cont.mapEff = x => Cont.map(_ => x);


Cont.ap = o => p => Cont.chain(o) (f => Cont.map(f) (p));


Cont.apEffl = o => p => Cont.ap(Cont.map(constl) (o)) (p);


Cont.apEffr = o => p => Cont.ap(Cont.map(constr) (o)) (p);


Cont.liftA = f => o => p => Cont.ap(Cont.map(f) (o)) (p);


Cont.chain = o => f => Cont((res, rej) => {
  scheduler(() => {
    o.resume(
      x => {
        try {
          const p = f(x);

          scheduler(() => {
            try {p.resume(res, rej)}
            catch (e) {rej(e)}
          });
        }

        catch (e) {rej(e)}
      },

      rej
    )
  });
});


Cont.of = x => Cont((res, rej) => {
  try {res(x)}
  catch (e) {rej(e)}
});


// Applicative f => (a -> f b) -> (Cont a) -> f (Cont b)

Cont.mapA = dict => f => o => Cont((res, rej) => {
  scheduler(() => {
    ca.resume(
      x => {
        try {res(dict.map(Cont.of) (f(x)))}
        catch (e) {rej(e)}
      },

      e => {
        try {res(dict.of(Cont.reject(e)))}
        catch (e2) {rej(e2)}
      }
    );
  });
});


// kleisli composition

Cont.komp = f => g => x => Cont.chain(g(x)) (f);


Cont.append = dict => o => p => Cont.chain(o) (x =>
  Cont.chain(p) (y =>
    dict.append(x, y)));


Cont.empty = dict => () => Cont((res, rej) => {
  try {res(dict.empty)}
  catch (e) {rej(e)}
});


//█████ Serial Evaluation █████████████████████████████████████████████████████


Cont.Ser = {};


Cont.Ser.and = o => p => Cont.chain(o) (x =>
  Cont.chain(p) (y =>
    Cont.of([x, y])));


Cont.Ser.All = {};


Cont.Ser.All.arr = xs => {
  return xs.reduce((acc, o) => {
    return Cont.chain(acc) (ys => {
      return Cont.chain(o) (x => {
        ys.push(x);
        return Cont.of(ys);
      });
    });
  }, Cont.of([]));
};


Cont.Ser.All.obj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return Cont.chain(acc) (p => {
      return Cont.chain(o[key]) (x => {
        p[key] = x;
        return Cont.of(p);
      });
    });
  }, Cont.of({}));
};


//█████ Parallel Evaluation ███████████████████████████████████████████████████


Cont.Par = {};


Cont.Par.and = o => p => Cont((res, rej) => {
  const pair = Array(2);
  let i = 0;

  scheduler(() => {
    [o, p].map((q, j) => {
      q.resume(
        x => {
          if (i < 2) {
            if (pair[j] === undefined) {
              pair[j] = x;
              i++;
            }

            if (i === 2) {
              try {res(pair)}
              catch (e) {rej(e)}
            }
          }

          else {
            try {res(pair)}
            catch (e) {rej(e)}
          }
        },

        rej
      )
    });
  });
});


Cont.Par.andRace = o => p => Cont((res, rej) => {
  let done = false;

  scheduler(() => {
    [o, p].map((q, j) => {
      q.resume(
        x => {
          if (!done) {
            done = true;
            try {res(x)}
            catch (e) {rej(e)}
          }
        },

        rej
      )
    });
  });
});


Cont.Par.all = xs => xs.reduce((acc, o) =>
  Cont.map(pair => pair.flat()) (Cont.Par.and(acc) (o)), Cont.of([]));


Cont.Par.never = Cont((res, rej) => null);


Cont.Par.race = xs => xs.reduce((acc, o) =>
  Cont.Par.andRace(acc) (o), Cont.Par.never);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const D = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATA █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


D.secInMs = 1000;


D.minInMs = 60000;


D.hourInMs = 3600000;


D.dayInMs = 86400000;


D.weekInMs = 604800000;


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


D.calcMonthInMs = y => m => new Date(y, m, 0).getDate() * D.dayInMs;


D.calcYearInMs = y =>
  ((year % 4 === 0 && y % 100 > 0) || y %400 == 0)
    ? 366 * D.dayInMs : 365 * D.dayInMs;


// daylight saving time

D.isDst = d => {
  const jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset(),
    jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();

  return Math.max(jan, jul) !== d.getTimezoneOffset();    
};


D.lastDayOfMonth = y => m => {
  const d = new Date(y, m, 1);
  return new Date(d - 1).getDate();
};


//█████ Serialization █████████████████████████████████████████████████████████


D.format = sep => (...fs) => d =>
  fs.map(f => f(d))
    .join(sep);


D.formatDay = digits => d => {
  switch (digits) {
    case 1: return String(d.getDate());
    case 2: return String(d.getDate()).padStart(2, "0");
    default: throw new Err("invalid number of digits");
  }
};


D.formatMonth = ({names = [], digits}) => d => {
  switch (digits) {
    case 1: return String(d.getMonth() + 1);
    case 2: return String(d.getMonth() + 1).padStart(2, "0");
    case 3: return names[String(d.getMonth())];
    default: throw new Err("invalid number of digits");
  }
};


D.formatWeekday = ({names = [], digits}) => d => {
  switch (digits) {
    case 1: return String(d.getDay());
    case 2: return String(d.getDay()).padStart(2, "0");
    case 3: return names[String(d.getDay())];
    default: throw new Err("invalid number of digits");
  }
};


D.formatYear = digits => d => {
  switch (digits) {
    case 2: return String(d.getFullYear()).slice(2);
    case 4: return String(d.getFullYear());
    default: throw new Err("invalid number of digits");
  }
};


D.formatMilliSec = digits => d => {
  switch (digits) {
    case 1: return String(d.getMilliseconds());
    case 3: return String(d.getMilliseconds()).padStart(3, "0");
    default: throw new Err("invalid number of digits");
  }
};


D.formatSecond = digits => d => {
  switch (digits) {
    case 1: return String(d.getSeconds());
    case 2: return String(d.getSeconds()).padStart(2, "0");
    default: throw new Err("invalid number of digits");
  }
};


D.formatMinute = digits => d => {
  switch (digits) {
    case 1: return String(d.getMinutes());
    case 2: return String(d.getMinutes()).padStart(2, "0");
    default: throw new Err("invalid number of digits");
  }
};


D.formatHour = digits => d => {
  switch (digits) {
    case 1: return String(d.getHours());
    case 2: return String(d.getHours()).padStart(2, "0");
    default: throw new Err("invalid number of digits");
  }
};


// time zone

D.formatTz = digits => d => {
  if (digits === 0) return "Z";

  else {
    let offset = d.getTimezoneOffset() / 60, sign = "";

    if (offset < 0) {
      sign = "-";
      offset = String(offset).slice(1);
    }

    else if (offset > 0) sign = "+";

    else return "Z";

    switch (digits) {
      case 2: return sign + offset.padStart(2, "0") + ":00";
      default: throw new Err("invalid number of digits");
    }
  }
};


// DDMMYY

D.formatDe6 = D.format("") (
  D.formatDay(2),
  D.formatMonth({digits: 2}),
  D.formatYear(2));


// DDMMYYYY

D.formatDe8_ = D.format("") (
  D.formatDay(2),
  D.formatMonth({digits: 2}),
  D.formatYear(4));


// DD.MM.YY

D.formatDe8 = D.format(".") (
  D.formatDay(2),
  D.formatMonth({digits: 2}),
  D.formatYear(2));


// DD.MM.YYYY

D.formatDe10 = D.format(".") (
  D.formatDay(2),
  D.formatMonth({digits: 2}),
  D.formatYear(4));


// YYMMDD

D.formatIso6 = D.format("") (
  D.formatYear(2),
  D.formatMonth({digits: 2}),
  D.formatDay(2));


// YYYYMMDD

D.formatIso8 = D.format("") (
  D.formatYear(4),
  D.formatMonth({digits: 2}),
  D.formatDay(2));


// YY-MM-DD

D.formatIso8 = D.format("-") (
  D.formatYear(2),
  D.formatMonth({digits: 2}),
  D.formatDay(2));


// YYYY-MM-DD

D.formatIso10 = D.format("-") (
  D.formatYear(4),
  D.formatMonth({digits: 2}),
  D.formatDay(2));


// HH:MM

D.formatTimeIso5 = D.format(":") (
  D.formatHour(2),
  D.formatMinute(2));


// HH:MM:SS

D.formatTimeIso8 = D.format(":") (
  D.formatHour(2),
  D.formatMinute(2),
  D.formatSecond(2));


// HH:MM:SS.SSS

D.formatTimeIso12 = d =>
  [D.formatTimeIso8, D.formatMilliSec(3)]
    .map(f => f(d)).join(".");


// YYYY-MM-DDTHH:MM:SS.SSSZ

D.formatIso24 = d => 
  [D.formatIso10, D.formatTimeIso12]
    .map(f => f(d)).join("T")
      + D.formatTz(0) (d);


// YYYY-MM-DDTHH:MM:SS.SSS+|-HH:MM

D.formatIso29 = d => 
  [D.formatIso10, D.formatTimeIso12]
    .map(f => f(d)).join("T")
      + D.formatTz(2) (d);


//█████ Conversion ████████████████████████████████████████████████████████████


// parse date string

D.fromStr = (locale, century = 20) => s => {
  let xs;

  switch (locale) {
    case "iso": xs = R.iso.dates; break;
    case "de-DE": xs = R.i18n.deDE.dates; break;
    default: throw new Err(`unknown locale "${locale}"`);
  }

  for (const rx of xs) {
    if (rx.test(s)) {
      const o = s.match(rx);

      o.groups.y = o.groups.y.length === 2
        ? century + o.groups.y
        : o.groups.y;

      const y = Number(o.groups.y),
        m = Number(o.groups.m),
        d = Number(o.groups.d);

      if (m < 1 || m > 12)
        throw new Err(`invalid month in date string "${s}"`);

      else if (d < 1 || d > 31 || d > D.lastDayOfMonth(y) (m))
        throw new Err(`invalid day in date string "${s}"`);

      return new Date(Date.parse(
        `${o.groups.y}-${o.groups.m}-${o.groups.d}`));
    }
  }

  throw new Err(`invalid ${locale} date string "${s}"`);
};


// parse the time string and add it to the date object

D.fromTimeStr = d => s => {
  for (const rx of R.iso.times) {
    if (rx.test(s)) {
      const o = s.match(rx),
        h = Number(o.groups.h),
        m = Number(o.groups.m),
        s_ = o.groups.s ? Number(o.groups.s) : 0,
        ms = o.groups.ms ? Number(o.groups.ms) : 0,
        tzh = o.groups.tzh ? Number(o.groups.tzh) : 0,
        tzm = o.groups.tzm ? Number(o.groups.tzm) : 0;

      if (h > 23)
        throw new Err(`invalid hours in de-DE time string "${s}"`);
          
      else if (m > 59)
        throw new Err(`invalid minutes in time string "${s}"`);

      else if (s_ > 59)
        throw new Err(`invalid seconds in time string "${s}"`);

      else if (tzh > 23)
        throw new Err(`invalid timezone hours in de-DE time string "${s}"`);

      else if (tzm > 59)
        throw new Err(`invalid timezone minutes in time string "${s}"`);

      d.setHours(h, m, s_, ms);
      return d;
    }
  }

  throw new Err(`invalid iso time string "${s}"`);
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████ DIFFERENCE LIST ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const DList = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


DList.append = f => g => tail => f(g(tail));


DList.cons = x => tail => List.Cons(x) (tail);


DList.snoc = f => x => DList.append(f) (DList.singleton(x));


DList.empty = id;


DList.toList = f => f(List.Nil);


DList.fromList = xs => function go(ys) {
  if (ys?.[Lazy.thunk]) {
    return tail => {
      const zs = Lazy.eager(ys), f = go(zs);
      return f(tail);
    };
  }

  else if (ys === List.Nil) return DList.empty;

  else {
    const f = go(ys[1]);
    return tail => List.Cons(ys[0]) (lazy(() => f(tail)));
  }
} (xs);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ERROR ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Computations that might throw an error (non-algebraic). Distinguishes the
explicit error type from all other type. */


export const Er = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Er.map = f => x => intro(x) === "Error" ? x : f(x);


Er.ap = f => x => intro(x) === "Error" ? x : intro(x) === "Error" ? x : f(x);


Er.of = id;


Er.chain = Er.map;


Er.mapA = dict => f => x => intro(x) === "Error" ? dict.of(x) : dict.map(id) (fn(x));


Er.seqA = dict => x => intro(x) === "Error" ? dict.of(x) : x;


Er.append = dict => x => y =>
  intro(x) === "Error" ? x : intro(x) === "Error" ? y : dict.append(x, y);


Er.empty = () => new Error("empty");


Er.alt = x => y => intro(x) === "Error" ? y : x;


Er.zero = () => new Error("zero");


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FUNCTION ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const F = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// semigroup

F.append = dict => f => g => x => dict.append(f(x), g(x));

// monoid

F.empty = dict => _ => monoid.empty();


// comonad extend

F.extend = dict => f => g => x => f(y => g(dict.append(x, y)));


// comonad extract

F.extract = dict => f => f(dict.empty);


// profunctor

F.dimap = h => g => f => x => g(f(h(x)));


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ ITERATOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Iterators defer execution which isn't sufficient for lazy evaluation because
it lacks sharing of intermediate results. You cannot share an iterator since
every invocation of `next` destructively changes the iterator's state.

You can compose generator functions with the normal composition operator. Please
keep the different intermediate iterator objects in mind like `v` for array or
`[k, v]` for map itrators. */


export const It = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


It.from = x => x[Symbol.iterator] ();


It.take = n => function* (ix) {
  while (n-- > 0) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


It.takeWhile = p => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done || !p(o.value)) return undefined;
    else yield o.value;
  }
};


It.drop = n => function* (ix) {
  while (n-- > 0) {
    const o = ix.next();
    if (o.done) return undefined;
  };

  while (true) {
    const o = ix.next();

    if (o.done) return undefined;
    else yield o.value;
  }
};


It.dropWhile = p => function* (ix) {
  while (true) {
    const o = ix.next();

    if (o.done) return undefined;

    else if (!p(o.value)) {
      yield o.value;
      break;
    }
  };

  while (true) {
    const o = ix.next();

    if (o.done) return undefined;
    else yield o.value;
  }
};


It.alternate = ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else (yield o.value, yield p.value);
  }
};


// interpolate a string into a stream

It.interpose = s => function* (ix) {
  for (const t of ix) {
    yield t;
    yield s;
  }
};


// interpolate a string into an array

It.interposeArr = s => function* (xs) {
  for (let i = 0; i < xs.length; i++) {
    yield xs[i];
    yield s;
  }
};


It.cons = x => function* (ix) {
  yield x;

  while (true) {
    const o = ix.next();
    if (done) return undefined;
    else yield o.value;
  }
};


It.consr = ix => function* (x) {
  yield x;

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


It.snoc = x => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) yield x;
    else yield o.value;
  }
};


It.snocr = ix => function* (x) {
  while (true) {
    const o = ix.next();
    if (o.done) yield x;
    else yield o.value;
  }
};


It.last = function* (ix) {
  let p;

  while (true) {
    const o = ix.next();
    if (o.done) return p || o;
    else p = o;
  }
};


It.init = function* (ix) {
  let p;

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else if (p) yield p.value;
    p = o;
  }
};


// inits require idempotent iterators


It.tail = function* (ix) {
  ix.next();

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


// tails require idempotent iterators


//█████ Type Classes ██████████████████████████████████████████████████████████


It.filter = p => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else if (p(o.value)) yield o.value;
  }
};


// strictly evaluated left-associative fold

It.foldl = f => acc => ix => {
  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = f(acc, o.value);
  }
};


// strictly evaluated right-associative fold

It.foldr = f => acc => ix => {
  const stack = [];

  while (true) {
    const o = ix.next();
    if (o.done) break;
    else stack.push(o.value);
  }

  for (let i = stack.length - 1; i >= 0; i--)
    acc = f(acc, stack[i]);

  return acc;
};


// monoidal fold

It.foldMap = dict => f => ix => {
  let acc = dict.empty;

  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = dict.append(acc, f(o.value));
  }
};


/* Lazy, potentially infinite unfold that always needs to be at the beginning
of the iterator chain. */

It.unfold = f => function* (seed) {
  let x = seed;

  while (true) {
    const pair = f(x);
    
    if (pair === null) return undefined;
    
    else {
      const [y, z] = pair;

      x = z;
      yield y;
    }
  }
};


It.map = f => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield f(o.value);
  }
};


// map effects but discard values

It.mapEff = f => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else (f(o.value), yield o.value);
  }
};


// applicative is only semi-lazy

It.ap = _if => function* (ix) {
  const xs = Array.from(ix); // strict

  if (xs.length === 0) return undefined;

  while (true) {
    const o = _if.next();

    if (o.done) return undefined;
    
    else {
      const f = o.value;
      for (const value of xs) yield f(value);
    }
  }
};


It.chain = mx => function* (fm) {
  while (true) {
    const o = mx.next();
    if (o.done) return undefined;
    else yield* fm(o.value);
  }
};


It.of = function* (x) {yield x};


It.flatten = function* (iix) {
  while (true) {
    const o = iix.next();
    if (o.done) return undefined;
    else yield* o.value;
  }
};


It.append = function* (ix, iy) {
  yield* ix;
  yield* iy;
};


It.empty = function* () {};


// alt/zero are just append/empty


// kleisli composition

// (b -> Iterator c) -> (a -> Iterator b) -> a -> Iterator c
It.komp = f => g => function* (x) {
  for (let y of g(x)) yield* f(y);
};


//█████ Special Folds █████████████████████████████████████████████████████████


// strictly evaluated

It.sum = ix => {
  let n = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return n;
    else n = n + o.value;
  }
};


// strictly evaluated

It.any = p => ix => {
  let n = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return n;
    else if (p(o.value)) return true;
  }

  return false;
};


// strictly evaluated

It.all = p => ix => {
  let n = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return n;
    else if (!p(o.value)) return false;
  }

  return true;
};


// apomorhism: fold with an extra short circuit mechanism

It.apo = f => function* (seed) {
  let x = seed;

  while (true) {
    const pair = f(x);
    
    if (pair === null) return undefined;
    
    else {
      const [y, z] = pair;

      if (z?.constructor?.name === "Error") {
        yield y;
        return undefined;
      }

      else {
        x = z;
        yield y;
      }
    }
  }
};


// hylomorphism: unfold and then fold without any intermediate structure

It.hylo = ({f, g, init}) => function* (seed) {
  let acc = init, state = seed;

  while (true) {
    const o = f(state);

    if (o === null) {
      yield acc;
      return undefined;
    }

    else {
      const [x, state2] = o;
      acc = g(acc, x);
      yield [x, acc]; // yield both
      state = state2;
    }
  }
};


// fold while using the index

It.foldi = f => acc => ix => {
  let i = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = f(acc, o.value, i++);
  }
};


/* Fold with context each overlapping pair, i.e. elements will be passed to the
folding twice. */

It.foldPair = f => acc => ix => {
  let curr,
    next = ix.next();

  while (true) {
    curr = next;
    next = ix.next();
    
    if (next.done) break;
    else acc = f(acc, curr.value, next.value);
  }

  return f(acc) (curr.value, null);
};


/* Fold with context each overlapping triple, i.e. elements will be passed to
the folding three times. */

It.foldTriple = f => acc => ix => {
  let prev,
    curr = {value: null, done: false},
    next = ix.next();

  while (true) {
    prev = curr;
    curr = next;
    next = ix.next();
    
    if (next.done) break;
    else acc = f(acc, prev.value, curr.value, next.value);
  }

  return f(acc) (prev.value, curr.value, null);
};


// map while using the index

It.mapi = f => function* (ix) {
  let i = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield f(o.value, i++);
  }
};


//█████ Zipping ███████████████████████████████████████████████████████████████


It.zip = ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else yield [o.value, p.value];
  }
};


It.zipWith = f => ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else yield f(o.value, p.value);
  }
};


It.unzip = ix => function* (iy) {
  while (true) {
    const o = ix.next();

    if (o.done) return undefined;
    
    else {
      yield o.value[0];
      yield o.value[1];
    }
  }
};


It.unzipWith = f => ix => function* (iy) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield f(o.value[0], o.value[1]);
  }
};


//█████ Infinite Lists ████████████████████████████████████████████████████████


It.cycle = function* (xs) {
  while (true) {
    yield* xs[Symbol.iterator]();
  }
};


It.iterate = f => function* (x) {
  while (true) {
    yield x;
    x = f(x);
  }
};


It.repeat = function* (x) {
  while (true) yield x;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
██████████████████████████████ ITERATOR :: ASYNC ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Asynchronous iterators used to abstract from Node.js data streams and API
calls. Return promises that must be transformed to the more principled `Cont`
type by the caller. */


export const Ait = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Ait.from = x => x[Symbol.asyncIterator] ();


// alternate two async iterators

Ait.alternate = ix => async function* (iy) {
  for await (const x of ix) {
    for await (const y of iy) {
      yield x;
      yield y;
    }    
  }
};


// interpolate a string into an async iterator

Ait.interpose = s => async function* (ix) {
  for await (const t of ix) {
    yield t;
    yield s;
  }
};


// interpolate a string into an array

Ait.interposeArr = s => async function* (xs) {
  for (let i = 0; i < xs.length; i++) {
    const t = await xs[i];
    yield t
    yield s;
  }
};


//█████ Chunking ██████████████████████████████████████████████████████████████


/* Supply semantically complete data chunks that can be processed in isolation
from each other as part of a stream of chunks. This way, large data sources can
be processed in a divide and conquer fashion exibiting a small memory footprint.
Usage:

  const writable = fs.createWriteStream("./awords.txt");

  const sx = stream.compose(
    Ait.from(fs.createReadStream("./words.txt")),
    Ait.chunk({sep: /\r?\n/}),
    Ait.filter(line => line[0] === "a"),
    Ait.map(line => line + "\n"));

  stream.pipeline(sx, writable, e => {
    if (e) console.error(e);
    else console.log("done");
  });

The listed code reads from a text file containing words separated by newline,
reduces the chunk size to each line length, filters all words starting with "a"
and writes them to a text file with the filtered words separated by newline. */

Ait.chunk = ({sep, threshold = 65536, skipRest = false}) => ix => {
  let chunks = [], buffer = "";

  return async function* () {
    for await (const value of ix) {
      chunks = (buffer + value.toString()).split(sep);
      buffer = chunks.pop();

      if (buffer.length > threshold) throw new Err("buffer overflow");
      else if (chunks.length === 0) continue;

      else {
        yield* async function* () {
          do {
            const chunk = chunks.shift();
            yield chunk;
          } while (chunks.length);
        } ();

        continue;
      }
    }

    if (buffer.length && skipRest === false) {
      yield* async function* () {
        yield buffer;
      } ();
    }
  } ();
};


/* Iterate over groups of n consecutive chunks where each iteration is offset by
a single chunk, i.e. the groups overlap one another. The last n - 1 chunks of the
source are filled with empty strings in order to maintain a consistent group size.
Consumer of this function must only store the first chunk of each group to avoid
redundancy. Usage:

  const sx = stream.compose(
    Ait.from(fs.createReadStream("./words.txt")),
    Ait.chunk({sep: /\r?\n/}),
    Ait.overlappingChunks(3)) */

Ait.overlappingChunks = num => {
  const chunks = [];

  return async function* (ix) {
    if (chunks.length === 0) {
      for (let i = num; i > 1; i--) {
        const o = await ix.next();
        if (o.done) return;
        else chunks.push(o.value);
      }
    }

    while (true) {
      const p = await ix.next();
      if (p.done) break;
      else chunks.push(p.value);
      yield chunks;
      chunks.shift();
    }

    for (const chunk of chunks) {
      const xs = Array(num).fill("");
      xs[0] = chunk;
      yield xs;
    }
  };
};


/* Same as above but iterates over non-overlapping groups of n consecutive
chunks. Usage:

  const sx = stream.compose(
    Ait.from(fs.createReadStream("./words.txt")),
    Ait.chunk({sep: /\r?\n/}),
    Ait.nonOverlappingChunks(3)) */

Ait.nonOverlappingChunks = num => async function* (ix) {
  while (true) {
    const chunks = [];

    for (let i = num; i > 0; i--) {
      const o = await ix.next();
      if (o.done) break;
      else chunks.push(o);
    }

    if (chunks.length < num) break;
    else yield chunks;
  }

  for (const chunk of chunks) {
    const xs = Array(num).fill("");
    xs[0] = chunk;
    yield xs;
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████ ITERATOR :: IDEMPOTENT ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Idempotent iterators mimic immutable ones by rendering the `next` method
idempotent. The following sequence of invocations advances the iterator only
once:
  
  ix.next();
  ix.next();
  ix.next();

In order to advance it further, invocations need to be recursive:
  
  ix.next().next();

You must not separate the next method from its receiver, as with native
iterators:

  const next = ix.next;
  next(); // will advance the iterator as a side effect

Iterator results are nested and can be traversed backwards via the `prev`
property:

  const iy = ix.next().next().next();
  iy.prev.prev; // yields the first iterator result

*/


export const Iit = ix => {
  const iy = ix;

  const createWrapper = (prevWrapper, o) => {
    const newWrapper = {
      value: o.value,
      done: o.done,
      prev: prevWrapper,
      cachedNext: null,
      cachedErr: null,

      next() {
        if (this.cachedNext) return this.cachedNext;
        else if (this.cachedErr) throw this.cachedErr;
        
        try {
          const p = iy.next();
          const nextWrapper = createWrapper(this, p);
          this.cachedNext = nextWrapper;
          return nextWrapper;
        }

        catch (error) {
          this.cachedErr = error;
          throw error;
        }
      }
    };

    newWrapper[$] = "IdempotentIterator";
    newWrapper[$$] = "IdempotentIterator";
    return newWrapper;
  };

  const entryPoint = {
    value: undefined,
    done: false,
    prev: null,
    cachedNext: null,
    cachedErr: null,

    next() {
      if (this.cachedNext) return this.cachedNext;
      else if (this.cachedErr) throw this.cachedErr;

      try {
        const o = iy.next(),
          firstWrapper = createWrapper(this, o);

        this.cachedNext = firstWrapper;
        return firstWrapper;
      }

      catch (e) {
        this.cachedErr = e;
        throw e;
      }
    }
  };

  entryPoint[$] = "IdempotentIterator";
  entryPoint[$$] = "IdempotentIterator";
  return entryPoint;
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Iit.from = x => Iit(x[Symbol.iterator] ());


// resumable take

Iit.take = n => function* (ix) {
  while (true) {
    const iy = ix.next();

    if (iy.done) return undefined;
    else if (n <= 0) return ix;
    else yield iy.value;
    ix = iy;
    n--;
  }
};


// resumable take while

Iit.takeWhile = p => function* (ix) {
  while (true) {
    const iy = ix.next();

    if (iy.done) return undefined;
    else if (p(iy.value)) yield ix.value;
    else return ix;
    ix = iy;
  }
};


// efficient inits

Iit.inits = function* (ix) {
  let o = ix;
  let prefix = [];

  yield prefix;

  while (!o.done) {
    const p = o.next();

    if (p.done) break;
    prefix = prefix.concat(p.value);
    yield prefix;
    o = p;
  }
};


// efficient tails

Iit.tails = function* (ix) {
  let iy = ix;

  while (true) {
    const o = iy.next(), xs = [];
    let p = o;

    while (!p.done) {
      xs.push(p.value);
      p = p.next();
    }

    yield xs;
    if (o.done) break;
    iy = o;
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ LIST █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// stack-safe lazy list type for consing/unconsing operations


export const List = {};


List.Nil = scope(() => {
  const empty = [];
  empty[$] = "List";
  empty[$$] = "List.Nil";
  return Object.freeze(empty);
});


List.Cons = x => xs => {
  const pair = [x, xs];
  pair[$] = "List";
  pair[$$] = "List.Cons";
  return pair;
};


// for unconsing just pattern match the underlying pair


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


List.map = f => function go(xs) {
  if (xs === List.Nil) return xs;
  else return List.Cons(f(xs[0])) (lazy(() => go(xs[1])));
};


// a real right associative but stack-safe fold!!!

List.foldr = f => acc => xs => {
  while (true) {
    const ys = Lazy.eager(xs);
    if (ys === List.Nil) return acc;
    else acc = f(acc, ys[0]);
    xs = ys[1];
  }
};


List.forEach = f => xs => {
  while (true) {
    const ys = Lazy.eager(xs);
    if (ys === List.Nil) break;
    else f(ys[0]);
    xs = ys[1];
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Map = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATA █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


_Map.deDE = {};


// deviates from Javascript's index

Object.defineProperty(_Map.deDE, "months", {
  get() {
    const m = new Map([
      [1, "Januar"], [2, "Februar"], [3, "März"], [4, "April"], [5, "Mai"],
      [6, "Juni"], [7, "Juli"], [8, "August"], [9, "September"], [10, "Oktober"],
      [11, "November"], [12, "Dezember"],
      
      [1, "Jan"], [2, "Feb"], [3, "Mär"], [4, "Apr"], [5, "Mai"],
      [6, "Jun"], [7, "Jul"], [8, "Aug"], [9, "Sep"], [9, "Sept"],
      [10, "Okt"], [11, "Nov"], [12, "Dez"],
    ]);

    delete this.months;
    this.months = m;
    return m;
  },

  configurable: true
});


// deviates from Javascript's index

Object.defineProperty(_Map.deDE, "monthsRev", {
  get() {
    const m = new Map([
      ["Januar", 1], ["Februar", 2], ["März", 3], ["April", 4], ["Mai", 5],
      ["Juni", 6], ["Juli", 7], ["August", 8], ["September", 9], ["Oktober", 10],
      ["November", 11], ["Dezember", 12],
      
      ["Jan", 1], ["Feb", 2], ["Mär", 3], ["Apr", 4], ["Mai", 5],
      ["Jun", 6], ["Jul", 7], ["Aug", 8], ["Sep", 9], ["Sept", 9],
      ["Okt", 10], ["Nov", 11], ["Dez", 12],
    ]);

    delete this.monthsRev;
    this.monthsRev = m;
    return m;
  },

  configurable: true
});


Object.defineProperty(_Map.deDE, "weekdays", {
  get() {
    const m = new Map([
      [1, "Montag"], [2, "Dienstag"], [3, "Mittwoch"], [4, "Donnerstag"],
      [5, "Freitag"], [6, "Samstag"], [7, "Sonntag"],

      [1, "Mo"], [2, "Di"], [3, "Mi"], [4, "Do"], [5, "Fr"], [6, "Sa"], [0, "So"],
    ]);

    delete this.weekdays;
    this.weekdays = m;
    return m;
  },

  configurable: true
});


Object.defineProperty(_Map.deDE, "weekdaysRev", {
  get() {
    const m = new Map([
      ["Montag", 1], ["Dienstag", 2], ["Mittwoch", 3], ["Donnerstag", 4],
      ["Freitag", 5], ["Samstag", 6], ["Sonntag", 0],

      ["Mo", 1], ["Di", 2], ["Mi", 3], ["Do", 4], ["Fr", 5], ["Sa", 6], ["So", 0],
    ]);

    delete this.weekdaysRev;
    this.weekdaysRev = m;
    return m;
  },

  configurable: true
});


Object.defineProperty(_Map.deDE, "generalAlterations", {
  get() {
    const m = new Map([
      ["ä", "a"], ["ö", "o"], ["ü", "u"],
    ]);

    delete this.generalAlteration;
    this.generalAlteration = m;
    return m;
  },

  configurable: true
});


Object.defineProperty(_Map.deDE, "nominalAlterations", {
  get() {
    const m = new Map([
      ["Ä", "A"], ["Ö", "O"], ["Ü", "U"],
      ["ä", "a"], ["ö", "o"], ["ü", "u"],
    ]);

    delete this.nominalAlteration;
    this.nominalAlteration = m;
    return m;
  },

  configurable: true
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


_Map.upd = f => k => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)));
  else return m;
};


// monoidal

_Map.updOr = dict => (v, k) => m => {
  if (m.has(k)) return m.set(k, dict.append(m.get(k), v));
  else return m.set(k, f(dict.empty) (v));
};


_Map.inc = k => m => m.has(k) ? m.set(k, m.get(k) + 1) : m.set(k, 1);


_Map.entries = m => m[Symbol.iterator] ();


_Map.keys = function* (m) {
  for (let [k] of m) {
    yield k;
  }
};


_Map.values = function* (m) {
  for (let [, v] in m) {
    yield v;
  }
};


_Map.clone = m => new Map(m);


//█████ Set Operations ████████████████████████████████████████████████████████


_Map.intersect = m => n => {
  const mn = new Map();
  for (const [k, v] of m) n.has(x) ? mn.set(k, v) : null;
  return mn;
};


_Map.union = m => n => {
  const mn = new Map(m);
  n.forEach(([k, v]) => mn.set(k, v));
  return mn;
};


_Map.diff = m => n => {
  const l = new Map(), r = new Map();
  for (const [k, v] of m) !n.has(k) ? l.set(k, v) : null;
  for (const [k, v] of n) !m.has(k) ? r.set(k, v) : null;
  r.forEach(([k, v]) => l.set(k, v));
  return l;
};


_Map.diffl = m => n => {
  const l = new Map();
  for (const [k, v] of m) !n.has(k) ? l.set(k, v) : null;
  return l;
};


//█████ Conversion ████████████████████████████████████████████████████████████


_Map.fromAit = comp(Cont.fromPromise) (async function (ix) {
  const m = new Map();
  for await (const [k, v] of ix) m.set(k, v);
  return m;
});


_Map.fromArr = xs => {
  const m = new Map();
  for (let i = 0; i < xs.length; i++) m.set(i, xs[i]);
  return m;
};


_Map.fromIt = ix => {
  const m = new Map();
  for (const [k, v] of ix) m.set(k, v);
  return m;
};


// `k` must be unique

_Map.fromTable = k => xs => xs.reduce(
  (acc, o) => acc.set(o[k], o), new Map());


// key is dynamically generated by the passed function

_Map.fromTableBy = f => xs => xs.reduce(
  (acc, o) => acc.set(f(o), o), new Map());


_Map.interconvert = f => m => new Map(f(Array.from(m)));


_Map.interconvertBy = f => g => m => new Map(f(Array.from(m).map(g)));


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████ MAP :: MULTIMAP :: SET ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Map variant that encodes 1:n-relations between key/value pairs, i.e.
uncertainty. Uses a set for each key and thus ensures uniqueness. */

export class MultiMap extends Map {

  // provide tag

  get [$] () {
    return "MultiMap";
  }


  // provide constructor

  get [$$] () {
    return "MultiMap";
  }


  // get inherited by parent


  // get all values that satisfies a predicate under a specific key

  getWith(k, p) {
    const s = this.get(k);

    if (s === undefined) return s;

    else {
      const xs = [];
      for (const v of s) if (p(v)) xs.push(v);
      return xs;
    }
  }


  // get the first value under a specific key

  getFirst(k) {
    const s = this.get(k);
    for (const v of s) return v;
    return null;
  }


  // get the last value under a specific key

  getLast(k) {
    const s = this.get(k);
    let r = null;
    for (const v of s) r = v;
    return r;
  }


  // has inherited from parent


  // check membership of a value under a specific key

  hasVal(k, v) {
    const s = this.get(k);
    if (s === undefined) return false;
    else return s.has(v);
  }


  // check membership of a value that satisfies a predicate under a specific key

  hasWith(k, p) {
    const s = this.get(k);
    
    if (s === undefined) return false;

    else {
      for (const v of s) if (p(v)) return true;
      return false;
    }
  }


  // set inherited from parent


  // set a value under a specific key, provided it doesn't exist

  setVal(k, v) {
    if (this.has(k)) {
      const s = this.get(k);
      if (!s.has(v)) s.add(v);
      return this;
    }

    else {
      this.set(k, new Set([v]));
      return this;
    }
  }


  // update an entire key, provided it does exist

  update(k, f) {
    const s = this.get(k);

    if (s === undefined) return this;

    else {
      this.delete(k);
      this.set(k, f(s));
      return this;
    }
  }


  // update a value under a specific key, provided it does exist

  updateVal(k, f, v) {
    const s = this.get(k);

    if (s === undefined) return this;

    else {
      if (!s.has(v)) return this;
      s.delete(v);
      s.add(f(v));
      return this;
    }
  }


  /* Update all values that satisfies a predicate under a specific key,
  provided one does exist. */

  updateWith(k, f, p) {
    const s = this.get(k);

    if (s === undefined) return this;

    else {
      for (const v of s) {
        if (p(v)) {
          s.delete(v);
          s.add(f(v));
        }
      }

      return this;
    }
  }


  // delete inherited from parent


  // delete a value under a specific key and delete the entire key if empty

  deleteVal(k, v) {
    const s = this.get(k);
    s.delete(v);
    if (s.size === 0) this.delete(k);
    return this;
  }


  /* Delete all values that satisfy a preredicate under a specific key and
  delete the entire key if empty. */

  deleteWith(k, p) {
    const s = this.get(k);
    for (const v of s) if (p(v)) s.delete(v);
    if (s.size === 0) this.delete(k);
    return this;
  }


  // iterate and mutate existing instance

  forEach(k, f) {
    const s = this.get(k), s2 = new set();

    if (s === undefined) return this;

    else {
      for (const v of s) s2.add(f(v));
      this.set(k, s2);
      return this;
    }
  }


  // map over and create new instance

  mapVals(k, f) {
    const s = this.get(k), s2 = new set();

    if (s === undefined) return undefined;

    else {
      for (const v of s) s2.add(f(v));
      return s2;
    }
  }

  
  // size inherited from parent


  // count all values under all keys
  
  valueCount() {
    let n = 0;
    for (const s of this) n += s.size;
    return n;
  }


  static fromIt = ix => {
    const m = new MultiMap();
    for (const [k, v] of ix) m.setVal(k, v);
    return m;
  };


  // `k` must be unqiue

  static fromTable(xss, k) {
    const m = new MultiMap();
    for (const cols of xss) m.setVal(cols[k], cols);
    return m;
  }


  // key is dynamically generated by the passed function

  static fromTableBy(xss, f) {
    const m = new MultiMap();
    for (const cols of xss) m.setVal(f(cols), cols);
    return m;
  }


  static get fromAit() {
    return comp(Cont.fromPromise) (async function (ix) {
      const m = new MultiMap();
      for await (const [k, v] of ix) m.setVal(k, v);
      return m;
    });
  };


  /* Iterate flat over all values wrapped in sets. Standard iterators for keys,
  values and entries are inherited by the parent. */

  *[Symbol.iterator]() {
    for (const [k, s] of super[Symbol.iterator]()) {
      for (const v of s) yield [k, v];
    }
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
██████████████████████████ MAP :: MULTIMAP :: ARRAY ███████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Map variant that encodes 1:n-relations between key/value pairs, i.e.
uncertainty. Uses an array for each key and thus allows duplicates. */

export class MultiMap2 extends Map {

  // provide tag

  get [$] () {
    return "MultiMap2";
  }


  // provide constructor

  get [$$] () {
    return "MultiMap2";
  }


  // get inherited by parent


  // get all values that satisfies a predicate under a specific key

  getWith(k, p) {
    const xs = this.get(k);

    if (xs === undefined) return xs;

    else {
      const ys = [];
      for (const v of xs) if (p(v)) ys.push(v);
      return ys;
    }
  }


  // get the first value under a specific key

  getFirst(k) {
    const xs = this.get(k);
    if (xs?.length > 0) return xs[0];
    else return null;
  }


  // get the last value under a specific key

  getLast(k) {
    const xs = this.get(k);
    if (xs?.length > 0) return xs[xs.length - 1];
    else return null;
  }


  // has inherited from parent


  // check membership of a value under a specific key

  hasVal(k, v) {
    const xs = this.get(k);
    if (xs === undefined) return false;
    else return xs.includes(v);
  }


  // check membership of a value that satisfies a predicate under a specific key

  hasWith(k, p) {
    const xs = this.get(k);
    
    if (xs === undefined) return false;

    else {
      for (const v of xs) if (p(v)) return true;
      return false;
    }
  }


  // count the number of values that equal the argument

  valCount(k, v) {
    const xs = this.get(k);
    
    if (xs === undefined) return false;
    else return xs.filter(v2 => v === v2).length;
  }


  // set inherited from parent


  // set a value under a specific key

  setVal(k, v) {
    if (this.has(k)) {
      const xs = this.get(k);
      xs.push(v);
      return this;
    }

    else {
      this.set(k, [v]);
      return this;
    }
  }


  // update an entire key, provided it does exist

  update(k, f) {
    const xs = this.get(k);

    if (xs === undefined) return this;

    else {
      this.set(k, f(xs));
      return this;
    }
  }


  /* Update all values equal to the argument under a specific key, provided one
  does exist. */

  updateVal(k, f, v) {
    const xs = this.get(k);

    if (xs === undefined) return this;

    else {
      if (!xs.includes(v)) return this;

      for (let i = 0; i < xs.length; i++)
        if (xs[i] === v) xs.splice(i, 1, f(v));
      
      return this;
    }
  }


  /* Update all values that satisfies a predicate under a specific key,
  provided one does exist. */

  updateWith(k, f, p) {
    const xs = this.get(k);

    if (xs === undefined) return this;

    else {
      for (let i = 0; i < xs.length; i++)
        if (p(v)) xs.splice(i, 1, f(v));
      
      return this;
    }
  }


  // delete inherited from parent


  // delete all values under a specific key and delete the entire key if empty

  deleteVal(k, v) {
    const xs = this.get(k);
    if (!xs.includes(v)) return this;

    for (let i = 0; i < xs.length; i++)
      if (xs[i] === v) xs.splice(i, 1);

    if (xs.length === 0) this.delete(k);
    return this;
  }


  /* Delete all values that satisfy a preredicate under a specific key and
  delete the entire key if empty. */

  deleteWith(k, p) {
    const xs = this.get(k);

    for (let i = 0; i < xs.length; i++)
      if (p(v)) xs.splice(i, 1);

    if (xs.length === 0) this.delete(k);
    return this;
  }


  // iterate and mutate existing instance

  forEach(k, f) {
    const xs = this.get(k), ys = [];

    if (xs === undefined) return this;

    else {
      for (const v of xs) ys.push(f(v));
      this.set(k, ys);
      return this;
    }
  }


  // map over and create new instance

  mapVals(k, f) {
    const xs = this.get(k), ys = [];

    if (xs === undefined) return undefined;

    else {
      for (const v of xs) ys.push(f(v));
      return ys;
    }
  }

  
  // size inherited from parent


  // count all values under all keys
  
  valueCount() {
    let n = 0;
    for (const xs of this) n += xs.length;
    return n;
  }


  static fromIt = ix => {
    const m = new MultiMap2();
    for (const [k, v] of ix) m.setVal(k, v);
    return m;
  };


  // `k` must be unqiue

  static fromTable(xss, k) {
    const m = new MultiMap2();
    for (const cols of xss) m.setVal(cols[k], cols);
    return m;
  }


  // key is dynamically generated by the passed function

  static fromTableBy(xss, f) {
    const m = new MultiMap2();
    for (const cols of xss) m.setVal(f(cols), cols);
    return m;
  }


  static get fromAit() {
    return comp(Cont.fromPromise) (async function (ix) {
      const m = new MultiMap2();
      for await (const [k, v] of ix) m.setVal(k, v);
      return m;
    });
  };


  /* Iterate flat over all values wrapped in sets. Standard iterators for keys,
  values and entries are inherited by the parent. */

  *[Symbol.iterator]() {
    for (const [k, xs] of super[Symbol.iterator]()) {
      for (const v of xs) yield [k, v];
    }
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ NULL █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Computations that might not yield a result value (non-algebraic).
Distinguishes the null type from all other types. */


export const Null = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Null.map = f => x => x === null ? x : f(x);


Null.ap = f => x => f === null ? x : x === null ? x : f(x);


Null.of = id;


Null.chain = Null.map;


Null.mapA = dict => f => x => x === null ? dict.of(x) : dict.map(id) (fn(x));


Null.seqA = dict => x => x === null ? dict.of(x) : x;


Null.append = dict => x => y =>
  x === null ? x : y === null ? y : dict.append(x, y);


Null.empty = () => null;


Null.alt = x => y => x === null ? y : x;


Null.zero = Null.empty;


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ NUMBER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Num = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// parse number string

Num.fromStr = ({locale, strict = true}) => s => {
  let xs;

  switch (locale) {
    case "iso": xs = R.iso.nums; break;
    case "de-DE": xs = R.i18n.deDE.nums; break;
    default: throw new Err(`unknown locale "${locale}"`);
  }

  for (const rx of xs) {
    if (rx.test(s)) {
      const o = s.match(rx);

      const presign = o.groups.sign === undefined
        ? "" : o.groups.sign;

      const postsign = o.groups.postsign === undefined
        ? "" : o.groups.postsign;

      const sign = presign ? presign : postsign,
        int = o.groups.int.replaceAll(/[^\d]/g, "");

      const frac = o.groups.frac === undefined
        ? "" : o.groups.frac;

      if (strict && int[0] === "0")
        throw new Err(`invalid number string: "${s}"`);        

      return Number(sign + int + "." + frac);
    }
  }

  throw new Err(`invalid number string: "${s}"`);
};


//█████ Decimal Places ████████████████████████████████████████████████████████


Num.round = places => n => {
  const shifter = "e" + places,
    negShifter = "e-" + places,
    shiftedNum = Number(n + shifter),
    roundedNum = Math.round(shiftedNum);

  return Number(roundedNum + negShifter);
};


Num.round2 = Num.round(2);


Num.ceil = places => n => {
  const shifter = "e" + places,
    negShifter = "e-" + places,
    shiftedNum = Number(n + shifter),
    ceiledNum = Math.ceil(shiftedNum);

  return Number(ceiledNum + negShifter);
};


Num.ceil2 = Num.ceil(2);


Num.floor = places => n => {
  const shifter = "e" + places,
    negShifter = "e-" + places,
    shiftedNum = Number(n + shifter),
    flooredNum = Math.floor(shiftedNum);

  return Number(flooredNum + negShifter);
};


Num.floor2 = Num.floor(2);


Num.trunc = places => n => {
  const shifter = "e" + places,
    negShifter = "e-" + places,
    shiftedNum = Number(n + shifter),
    truncatedNum = Math.trunc(shiftedNum);

  return Number(truncatedNum + negShifter);
};


Num.trunc2 = Num.trunc(2);


//█████ Serialization █████████████████████████████████████████████████████████


Num.format = (...fs) => n =>
  fs.map(f => f(n))
    .join("");


Num.formatFrac = digits => n =>
  String(n)
    .replace(/^[^.]+\.?/, "")
    .padEnd(digits, "0");


Num.formatInt = sep => n =>
  String(Math.trunc(n))
    .replace(/^-/, "")
    .replaceAll(R.g("(\\d)(?=(?:\\d{3})+$)"), `$1${sep}`);


Num.formatSign = ({pos, neg}) => n =>
  n > 0 ? pos : n < 0 ? neg : "";


Num.formatSep = sep => n => sep;


Num.formatDe = Num.format(
  Num.formatSign({pos: "", neg: "-"}),
  Num.formatInt(""),
  Num.formatSep(","),
  Num.formatFrac(2));


Num.formatIso = Num.format(
  Num.formatSign({pos: "", neg: "-"}),
  Num.formatInt(""),
  Num.formatSep("."),
  Num.formatFrac(2));


//█████ Ordering ██████████████████████████████████████████████████████████████


export const asc = x => y => x - y;


export const asc_ = (x, y) => x - y;


export const desc = y => x => x - y;


export const desc_ = (y, x) => x - y;


export const ctor = (a, b) => a > b ? 1 : a < b ? -1 : 0;


export const compareOn = order => lift(order);


export const compareOn_ = order => f => x => y => order(f(x), f(y));


export const between = ({lower, upper}) => x => x >= lower && x <= upper;


export const notBetween = ({lower, upper}) => x => x < lower || y > upper;


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OBJECT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const O = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Immutable and composable object path updates with structural sharing that
returns the newly created object. Please note that `f` also has to be pure for
the whole computation to be pure as well. */

O.update = ({path, f}) => o => {
  if (path.length === 0) return f(o);
  else if (Object(o) !== o) throw new Err("object type expected");

  const [key, ...path2] = path,
    child = o[key];

  const child2 = O.update({path: path2, f}) (child);

  if (child === child2) return o;

  else if (Array.isArray(o)) {
    xs = o.concat();
    xs[key] = child2;
    return xs;
  }
  
  else {
    const p = Object.assign({}, o);
    p[key] = child2;
    return p;
  }
};


// cloning without losing getters/setters

O.clone = o => {
  const p = {};

  for (const k of objKeys(o))
    Object.defineProperty(
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


O.partial = (f, o) => p => f(Object.assign({}, o, p));


O.entries = function* (o) {
  for (let prop in o) {
    yield [prop, o[prop]];
  }
};


O.keys = function* (o) {
  for (let prop in o) {
    yield prop;
  }
};


O.values = function* (o) {
  for (let prop in o) {
    yield o[prop];
  }
};


O.fromAit = comp(Cont.fromPromise) (async function (ix) {
  const o = {};
  for await (const [k, v] of ix) o[k] = v;
  return o;
});


O.fromArr = headings => xs => {
  const o = {};

  for (let i = 0; i < xs.length; i++)
    if (headings.has(i)) o[headings.get(i)] = xs[i];

  return o;
};


O.fromIt = ix => {
  const o = {};
  for (const [k, v] of ix) o[k] = v;
  return o;
};


O.fromPairs = pairs => pairs.reduce((acc, [k, v]) => (acc[k] = v, acc), {});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ PARSER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Parse, don't validate. This isn't yet another parser implementation but
essentially a type that is meant to replace ture/false validations suffering
from boolean blindness. A parser takes unstructured data and returns structured
data or an error. The structured data can either be a definitively valid value
or a maybe valid value with some confidence. The type can be handled as a row
polaymorphic one, i.e. there is a set of required properties but you can add
arbitrary ones. */


export const Parser = {};


Parser.Valid = ({value, kind, ...rest}) => ({
  [$]: "Parser",
  [$$]: "Parser.Valid",
  value,
  kind,
  ...rest
});


Parser.Invalid = ({value, kind, reason, ...rest}) => ({
  [$]: "Parser",
  [$$]: "Parser.Valid",
  value,
  kind,
  reason,
  ...rest
});


Parser.Maybe = ({value, kind, confidence, ...rest}) => ({
  [$]: "Parser",
  [$$]: "Parser.Maybe",
  value,
  kind,
  confidence,
  ...rest
});


//█████ Combinators ███████████████████████████████████████████████████████████


// take two parsers but short circuit if the first fails

Parser.and = f => g => x => {
  const o = f(x);
  if (o[$$] === "Parser.Valid") return g(o.value);
  else return o;
};


// take many parsers but short circuit as soon as one fails

Parser.all = (...fs) => x => {
  let o = {value: x};

  for (const f of fs) {
    o = f(o.value);
    if (x[$$] === "Parser.Invalid") return o;
  }

  return o;
};


// take two parsers but short circuit if the first succeeds

Parser.or = f => g => x => {
  const o = f(x);
  if (o[$$] === "Parser.Valid") return o;
  else return g(x);
};


// take many parsers but short circuit as soon as the first parser succeeds

Parser.any = (...fs) => {
  let o = {value: x};

  for (const f of fs) {
    o = f(o.value);
    if (x[$$] === "Parser.Valid") return o;
  }

  return o;
};


Parser.reject = reason => x => Parser.Invalid({
  value: x,
  kind: "reject",
  reason,
});


Parser.satisfy = ({p, kind, reason}) => x => {
  if (p(x)) return Parser.Valid({value: x, kind});
  else return Parser.Invalid({value: x, kind, reason});
};


//█████ Numbers ███████████████████████████████████████████████████████████████


Parser.num = n => {
  if (typeof n !== "number") Parser.Invalid({
    value: n,
    kind: "number",
    reason: "not of type number",
  });

  if (!Number.isFinite(n)) return Parser.Invalid({
    value: n,
    kind: "number",
    reason: "infinite number",
  });

  if (!Number.isSafeInteger(n)) return Parser.Invalid({
    value: n,
    kind: "number",
    reason: "number out of range",
  });

  else return Parser.Valid({
    value: n,
    kind: "number",
    reason: "not of type number",
  });
};


Parser.int = n => {
  const o = Parser.num(n);

  if (o[$$] === "Parser.Valid") {
    if (n % 1 !== 0) return Parser.Invalid({
      value: n,
      kind: "integer",
      reason: "decimal number received",
    });
    
    else return Parser.Valid({
      value: n,
      kind: "integer",
    });
  }

  else return o;
};


Parser.nat = n => {
  const o = Parser.int(n);

  if (o[$$] === "Parser.Valid") {
    if (n === 0) return Parser.Invalid({
      value: n,
      kind: "natrual number",
      reason: "zero received",
    });

    else if (n < 0) return Parser.Invalid({
      value: n,
      kind: "natrual number",
      reason: "negative number received",
    });
    
    else return Parser.Valid({
      value: n,
      kind: "natrual number",
    });
  }

  else return o;
};


Parser.neg = n => {
  const o = Parser.num(n);

  if (o[$$] === "Parser.Valid") {
    if (n === 0) return Parser.Invalid({
      value: n,
      kind: "negative number",
      reason: "zero received",
    });

    else if (n > 0) return Parser.Invalid({
      value: n,
      kind: "negative number",
      reason: "positive number received",
    });
    
    else return Parser.Valid({
      value: n,
      kind: "negative number",
    });
  }

  else return o;
};


Parser.min = min => n => {
  if (n < min) return Parser.Invalid({
    value: n,
    kind: "min number",
    reason: "below threshold",
  });

  else return Parser.Valid({
    value: n,
    kind: "min number",
  });
};


Parser.max = max => n => {
  if (n > max) return Parser.Invalid({
    value: n,
    kind: "max number",
    reason: "above threshold",
  });

  else return Parser.Valid({
    value: n,
    kind: "max number",
  });
};


// minimal decimal places

Parser.minDec = min => n => {
  const [, dec] = String(n).split(/\./);
  
  if (dec.length < min) return Parser.Invalid({
    value: n,
    kind: "min precision",
    reason: "below threshold",
  });

  else return Parser.Valid({
    value: n,
    kind: "min precision",
  });
};


// maximal decimal places

Parser.maxDec = max => n => {
  const [, dec] = String(n).split(/\./);
  
  if (dec.length < min) return Parser.Invalid({
    value: n,
    kind: "max precision",
    reason: "above threshold",
  });

  else return Parser.Valid({
    value: n,
    kind: "max precision",
  });
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████ REGULAR EXPRESSIONS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Regular expresions work best with complex strings using a divide and conquer
strategy. First, determine the bounds of the region of interest in the string
and than extract individual subpatterns within this region independently of
each other. Accumulate all necessary subpatterns and feed them to a downstream
function along with the original string to take the context into account. */


export const R = RegExp.bind(null);


R.g = rx => new RegExp(rx, "g");


R.i = rx => new RegExp(rx, "i");


R.v = rx => new RegExp(rx, "v");


R.gi = rx => new RegExp(rx, "gi");


R.gv = rx => new RegExp(rx, "gv");


R.iv = rx => new RegExp(rx, "iv");


R.giv = rx => new RegExp(rx, "giv");


R.gu = rx => new RegExp(rx, "gu");


R.iu = rx => new RegExp(rx, "iu");


R.giu = rx => new RegExp(rx, "giu");


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// count more complex substring patterns

R.count = rx => s => Array.from(s.matchAll(rx)).length;


// remove repetitive characters

R.dedupe = s => s.replaceAll(/(.)\1{1,}/g, "$1");


R.escape = s => s.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');


/* Take an object with properties holding regular expressions and apply each
to the provided string. Store each match under the respective property. */

R.extract = o => s =>
  O.fromIt(It.map(([k, rx]) => [k, R.matchFirst(rx) (s)]) (O.entries(o)));


/* Replace the following characters:

  * redundant carriage returns or spaces
  * redundant newlines at the beginning/end
  * all control chars but newline
  * all special spaces like NBSP */

R.normalize = s => s
  .replaceAll(/^\r?\n|\r?\n$/g, "")
  .replaceAll(/\r?\n/g, "<nl/>")
  .replaceAll(/[\p{C}\p{Z}]/gv, " ")
  .replaceAll(/ {2,}/g, " ")
  .replaceAll(/^ +/g, " ")
  .replaceAll(/ +$/g, " ")
  .replaceAll(/<nl\/>{2,}/g, "<nl/>")
  .replaceAll(/<nl\/>/g, "\n");


//█████ Common Patterns ███████████████████████████████████████████████████████


R.iso = {
  dates: [
    /^(?<y>\d\d)-(?<m>\d\d)-(?<d>\d\d)$/, // 24-12-01
    /^(?<y>\d{4})-(?<m>\d\d)-(?<d>\d\d)$/, // 2024-12-01
  ],

  times: [
    /^(?<h>\d\d):(?<m>\d\d)$/, // 12:00
    /^(?<h>\d\d):(?<m>\d\d):(?<s>\d\d)$/, // 12:00:00
    /^(?<h>\d\d):(?<m>\d\d):(?<s>\d\d)\.(?<ms>\d{3})$/, // 12:00:00.123
    /^(?<h>\d\d):(?<m>\d\d):(?<s>\d\d)Z$/, // 12:00:00Z (UTC)
    /^(?<h>\d\d):(?<m>\d\d):(?<s>\d\d)\.(?<ms>\d{3})Z$/, // 12:00:00.123Z (UTC)
    /^(?<h>\d\d):(?<m>\d\d):(?<s>\d\d)(?:\+|\-)(?<tzh>\d\d):(?<tzm>\d\d)$/, // 12:00:00+/-01:00 (time zone)
    /^(?<h>\d\d):(?<m>\d\d):(?<s>\d\d)\.(?<ms>\d{3})(?:\+|\-)(?<tzh>\d\d):(?<tzm>\d\d)$/, // 12:00:00.123+/-01:00 (time zone)
  ],

  nums: [
    /^(?<int>0|(?:[1-9]\d*))$/, // natural numbers
    /^(?<sign>\+|\-)?(?<int>[1-9]\d*)$/, // integers
    /^(?<sign>\+|\-)?(?<int>\d+)\.(?<frac>\d+)$/, // 1234.567
  ],
};


R.i18n = {
  deDE: {
    dates: [
      /^(?<d>\d\d)(?<m>\d\d)(?<y>\d\d)$/, // 011224
      /^(?<d>\d\d)(?<m>\d\d)(?<y>\d{4})$/, // 01122024
      /^(?<d>\d{1,2})\.(?<m>\d{1,2})\.(?<y>\d\d)$/, // 01.12.24, 1.12.24
      /^(?<d>\d\d)\.(?<m>\d\d)\.(?<y>\d\d)$/, // 01.12.24
      /^(?<d>\d{1,2})\.(?<m>\d{1,2})\.(?<y>\d{4})$/, // 01.12.2024, 1.12.2024
      /^(?<d>\d\d)\.(?<m>\d\d)\.(?<y>\d{4})$/, // 01.12.2024
    ],

    // time is equal to iso formats and thus skipped

    nums : [
      /^(?<sign>\+|\-)?(?<int>\d+),(?<frac>\d+)(?<postsign>\+|\-)?$/, // 1234,567
      /^(?<sign>\+|\-)?(?<int>\d+(?:\.\d{3})*),(?<frac>\d+)(?<postsign>\+|\-)?$/, // 1.234,567
    ],
  }
};


//█████ Major Classes █████████████████████████████████████████████████████████


R.classes = {};


R.classes.alnum = {
  s: "[\\p{L}\\p{N}]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.aldig = {
  s: "[\\p{L}\\d]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.letter = {
  s: "\\p{L}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// upper-case letter

R.classes.ucl = {
  s: "\\p{Lu}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// lower-case letter

R.classes.lcl = {
  s: "\\p{Ll}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};
    

R.classes.num = {
  s: "\\p{N}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.digit = {
  s: "\\d",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// punctuation

R.classes.punct = {
  s: "\\p{P}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// space

R.classes.space = {
  s: "\\p{Z}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// symbol

R.classes.sym = {
  s: "\\p{S}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// currency

R.classes.curr = {
  s: "\\p{Sc}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ctrl = {
  s: "\\p{C}",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.crnl = {
  s: "\\r?\\n",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// ASCII


R.classes.ascii = {};


R.classes.ascii.aldig = {
  s: "[A-Za-z\\d]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ascii.letter = {
  s: "[A-Za-z]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ascii.ucl = {
  s: "[A-Z]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ascii.lcl = {
  s: "[a-z]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// vowels

R.classes.ascii.vowels = {
  s: "[AEUIOaeuio]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// upper-case vowels

R.classes.ascii.ucv = {
  s: "[AEUIO]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// lower-case vowels

R.classes.ascii.lcv = {
  s: "[aeuio]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ascii.punct = {
  s: "[!\"#$%&'()*+,-./:;<=>?@\\[\\]\\\\^_`{|}~]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ascii.ctrl = {
  s: "[\\0\\a\\b\\t\\v\\f\\r\\n\\cZ]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// Latin1 (ISO-8859-1)


R.classes.latin1 = {};


R.classes.ascii.alnum = {
  s: "[A-Za-zÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\d²³¹¼½¾]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.ascii.aldig = {
  s: "[A-Za-zÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\\d]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.latin1.letter = {
  s: "[A-Za-zÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.latin1.ucl = {
  s: "[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.latin1.lcl = {
  s: "[a-zßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// vowels

R.classes.latin1.vowels = {
  s: "[AEUIOÁÀĂÂÅÄÃĀÐÉÈÊĚËĖĘÍÌÎÏĮĪÓÒÔÖŐÕØŌÚÙŬÛŮÜŰŨŲŪaeuioáàăâåäãāðéèêěëėęíìîïįīóòôöőõøōúùŭûůüűũųū]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// upper-case vowels

R.classes.latin1.ucv = {
  s: "[AEUIOÁÀĂÂÅÄÃĀÐÉÈÊĚËĖĘÍÌÎÏĮĪÓÒÔÖŐÕØŌÚÙŬÛŮÜŰŨŲŪ]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


// lower-case vowels

R.classes.latin1.lcv = {
  s: "[aeuioáàăâåäãāðéèêěëėęíìîïįīóòôöőõøōúùŭûůüűũųū]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.latin1.punct = {
  s: "[!\"#$%&'()*+,-./:;<=>?@\\[\\]\\\\^_`{|}~€‚„…†‡ˆ‰‹‘’“”•–­—˜™›¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


R.classes.latin1.curr = {
  s: "[¤$€£¥¢]",
  get sep() {return `(?<=${this.s})(?!${this.s})|(?<!${this.s})(?=${this.s})`}
};


//█████ Searching █████████████████████████████████████████████████████████████


R.searchAll = rx => s =>
  Array.from(s.matchAll(rx)).map(ix => ix.index);


R.searchAllWith = p => rx => s =>
  R.matchAllWith({p, rx}) (s).map(ix => ix.index);


R.searchFirst = rx => s => {
  if (rx.flags.search("g") !== notFound)
    throw new Err("unexpected global flag");

  const i = s.search(rx);

  if (i === notFound) return []
  else return [i];
};


R.searchFirstWith = p => rx => s => {
  for (const ix of s.matchAll(rx))
    if (p(ix)) return [ix.index];

  return [];
};


R.searchLast = rx => s => {
  const xs = s.matchAll(rx);
  if (xs.length === 0) return [];
  else return [xs[xs.length - 1]];
};


R.searchLastWith = p => rx => s => {
  const xs = R.matchAllWith({p, rx}) (s);
  if (xs.length === 0) return [];
  else return [xs[xs.length - 1]];
};


R.searchNth = (rx, i) => s => {
  const xs = s.matchAll(rx);
  if (i - 1 >= xs.length) return [];
  else return [xs[i - 1]];
};


R.searchNthWith = p => (rx, i) => s => {
  const xs = R.matchAllWith({p, rx}) (s);
  if (i - 1 >= xs.length) return [];
  else return [xs[i - 1]];
};


//█████ Splitting █████████████████████████████████████████████████████████████


/* Split a string at the specified indices. If the supplied argument is an array
of matches, the separators themselves are excluded from the result. If it is an
array of indices, no substrings are removed during splitting. */

R.split = xs => s => {
  if (typeof xs[0] === "number") {
    return xs.reduce(({acc, offset}, i) => {
      if (offset === 0) {
        acc.push(s.slice(0, i));
        offset = i;
        acc.push(s.slice(i));
      }
      
      else {
        const last = acc.pop();
        acc.push(last.slice(0, i - offset));
        offset = i;
        acc.push(s.slice(i));
      }
      
      return {acc, offset};
    }, {acc: [], offset: 0}).acc;
  }

  else {
    return xs.reduce(({acc, offset}, o) => {
      if (offset === 0) {
        acc.push(s.slice(0, o.index));
        offset = o.index + o[0].length;
        acc.push(s.slice(offset));
      }

      else {
        const last = acc.pop();
        acc.push(last.slice(0, o.index - offset));
        offset = o.index + o[0].length;
        acc.push(s.slice(offset));
      }

      return {acc, offset};
    }, {acc: [], offset: 0}).acc;
  }
};


// variant that additionally passes each split to a function

R.splitWith = ({f, xs}) => s => {
  if (typeof xs[0] === "number") {
    return xs.reduce(({acc, offset}, i) => {
      if (offset === 0) {
        acc.push(...f(s.slice(0, i)));
        offset = i;
        acc.push(s.slice(i));
      }
      
      else {
        const last = acc.pop();
        acc.push(...f(last.slice(0, i - offset)));
        offset = i;
        acc.push(s.slice(i));
      }
      
      return {acc, offset};
    }, {acc: [], offset: 0}).acc;
  }

  else {
    return xs.reduce(({acc, offset}, o) => {
      if (offset === 0) {
        acc.push(...f(s.slice(0, o.index)));
        offset = o.index + o[0].length;
        acc.push(s.slice(offset));
      }

      else {
        const last = acc.pop();
        acc.push(...f(last.slice(0, o.index - offset)));
        offset = o.index + o[0].length;
        acc.push(s.slice(offset));
      }

      return {acc, offset};
    }, {acc: [], offset: 0}).acc;
  }
};


// variant that splits only once

R.split1 = x => s => {
  if (typeof x === "number") {
    acc.push(s.slice(0, i));
    acc.push(s.slice(i));
  }

  else {
    acc.push(s.slice(0, o.index));
    acc.push(s.slice(o.index + o[0].length));
  }
};


/* Split a string depending on character class transitions defined by regular
expressions in the following form:

  (?<=charClass)(?!charClass)|(?<!charClass)(?=charClass)

There are lots of suitable predefined character classes defined within this
namespace. If you need more granular control, use one of the combinators with
splitting semantics from the string namespace. */

R.splitTrans = flags => (...xs) => s => s.split(
  R(xs.join("|"), flags));


R.splitLetterTrans = R.splitTrans("v") (R.classes.letter.sep);


R.splitCasingTrans = R.splitTrans("v")
  (R.classes.ucl.sep, R.classes.lcl.sep);


// unicode number class

R.splitNumTrans = R.splitTrans("v") (R.classes.num.sep);


// only ascii digits

R.splitDigTrans = R.splitTrans("v") (R.classes.digit.sep);


R.splitAlnumTrans = R.splitTrans("v") (R.classes.alnum.sep);


R.splitAldigTrans = R.splitTrans("v") (R.classes.aldig.sep);


R.splitNonAlnumTrans = R.splitTrans("v") (
  R.classes.punct.sep,
  R.classes.sym.sep,
  R.classes.space.sep,
  R.classes.crnl.sep);


// split almost all

R.splitAlmostAllTrans = R.splitTrans("v") (
  R.classes.num.sep,
  R.classes.punct.sep,
  R.classes.sym.sep,
  R.classes.space.sep,
  R.classes.crnl.sep,
  "(?<=\\p{Ll})(?=\\p{Lu})"); // "fooBar" -> ["foo", "Bar"]


// split all

R.splitAllTrans = R.splitTrans("v") (
  R.classes.num.sep,
  R.classes.punct.sep,
  R.classes.sym.sep,
  R.classes.space.sep,
  R.classes.crnl.sep,
  "(?<=\\p{Ll})(?=\\p{Lu})|(?<=\\p{Lu})(?=\\p{Ll})"); // "fooBar" -> ["foo", "B", "ar"]


//█████ Matching ██████████████████████████████████████████████████████████████


// strict variant

R.matchAll = rx => s => Array.from(s.matchAll(rx));


R.matchAllWith = ({p, rx}) => s => Array.from(s.matchAll(rx)).filter(r => {
  const [match, ...xs] = r,
    o = r.groups,
    i = r.index;

  return p({match, xs, i, o, s});
});



R.matchFirst = rx => s => {
  if (rx.flags.search("g") !== notFound)
    throw new Err("unexpected global flag");

  const r = s.match(rx);
  if (r === null) return [];
  else return [r];
};


R.matchFirstWith = ({p, rx}) => s => {
  for (const r of s.matchAll(rx)) {
    const [match, ...xs] = r,
      o = r.groups,
      i = r.index;

    if (p({match, xs, i, o, s})) return [r];
  }

  return [];
};


R.matchLast = rx => s => Array.from(s.matchAll(rx)).slice(-1);


R.matchLastWith = ({p, rx}) => s =>
  R.matchAllWith({p, rx}) (s).slice(-1);


// considers negative indices like native slice does

R.matchNth = ({i, rx}) => s => {
  const xs = Array.from(s.matchAll(rx));
  if (i - 1 >= xs.length) return [];
  else if (i >= 0) return [xs[i - 1]];
  else return [xs.slice(i) [0]];
};


// considers negative indices like native slice does

R.matchNthWith = ({p, i, rx}) => s => {
  const xs = R.matchAllWith({p, rx}) (s),
    o = xs[i];

  if (i - 1 >= xs.length) return [];
  else if (i >= 0) return [xs[i - 1]];
  else return [xs.slice(i) [0]];
};


//█████ Replacing █████████████████████████████████████████████████████████████


// R.replaceAll is redundant


R.replaceAllAccum = rx => s => {
  const xs = Array.from(s.matchAll(rx));

  if (xs.length === 0) return s;

  else for (let i = xs.length - 1; i >= 0; i--) {
    const r = xs[i],
      [match, ...ys] = r,
      o = r.groups,
      j = r.index;

    const sub = f({match, xs: ys, i: j, o, s});
    s = s.slice(0, j) + sub + s.slice(j + match.length);
  }

  return s;
};


R.replaceAllWith = ({f, rx}) => s => {
  const xs = Array.from(s.matchAll(rx));

  if (xs.length === 0) return s;

  else for (let i = xs.length - 1; i >= 0; i--) {
    const r = xs[i],
      [match, ...ys] = r,
      o = r.groups,
      j = r.index;

    const sub = f({match, xs: ys, i: j, o, s});
    s = s.slice(0, j) + sub + s.slice(j + match.length);
  }

  return s;
};


// accumulate each individual replacement

R.replaceAllWithAccum = ({f, rx}) => s => {
  const xs = Array.from(s.matchAll(rx)), ys = [];

  if (xs.length === 0) return s;

  else for (let i = xs.length - 1; i >= 0; i--) {
    const r = xs[i],
      [match, ...zs] = r,
      o = r.groups,
      j = r.index;

    const sub = f({match, xs: zs, i: j, o, s});
    ys.unshift(s.slice(0, j) + sub + s.slice(j + match.length));
  }

  return ys;
};


// more general version that allows to restrict the matches using a predicate

R.replaceAllBy = ({p, f, rx}) => s => {
  const xs = R.matchAllWith({p, rx}) (s);

  if (xs.length === 0) return s;

  for (let i = xs.length - 1; i >= 0; i--) {
    const r = xs[i],
      [match, ...ys] = r,
      o = r.groups,
      j = r.index;

    const sub = f({match, xs: ys, i: j, o, s});
    s = s.slice(0, j) + sub + s.slice(j + match.length);
  }

  return s;
};


// accumulate each individual replacement

R.replaceAllByAccum = ({p, f, rx}) => s => {
  const xs = R.matchAllWith({p, rx}) (s), ys = [];

  if (xs.length === 0) return s;

  for (let i = xs.length - 1; i >= 0; i--) {
    const r = xs[i],
      [match, ...zs] = r,
      o = r.groups,
      j = r.index;

    const sub = f({match, xs: zs, i: j, o, s});
    ys.unshift(s.slice(0, j) + sub + s.slice(j + match.length));
  }

  return ys;
};


// R.replaceFirst is redundant


R.replaceFirstWith = ({f, rx}) => s => {
  if (rx.flags.search("g") !== notFound)
    throw new Err("unexpected global flag");

  const r = s.match(rx);

  if (r === null) return s;

  else {
    const [match, ...xs] = r,
      o = r.groups,
      i = r.index;

    const sub = f({match, xs, i, o, s});
    return s.slice(0, i) + sub + s.slice(i + match.length);
  }
};


R.replaceFirstBy = ({p, f, rx}) => s => {
  for (const r of s.matchAll(rx)) {
    const [match, ...xs] = r,
      o = r.groups,
      i = r.index;

    if (p({match, xs, i, o, s})) {
      const sub = f({match, xs, i, o, s});
      return s.slice(0, i) + sub + s.slice(i + match.length);
    }
  }

  return s;
};


R.replaceLast = ({sub, rx}) => s => {
  if (rx.flags.search("g") === notFound)
    throw new Err("missing global flag");

  const xs = Array.from(s.matchAll(rx));

  if (xs.length === 0) return s;

  else {
    const match = xs[xs.length - 1], i = match.index;
    return s.slice(0, i) + sub + s.slice(i + match.length);
  }
};


R.replaceLastWith = ({f, rx}) => s => {
  const xs = Array.from(s.matchAll(rx));

  if (xs.length === 0) return s;

  else {
    const r = xs[xs.length - 1],
      [match, ...ys] = r,
      o = r.groups,
      i = r.index;

    const sub = f({match, xs: ys, i, o, s});
    return s.slice(0, i) + sub + s.slice(i + match.length);
  }
};


R.replaceLastBy = ({p, f, rx}) => s => {
  const xs = R.matchAllWith({p, rx}) (s);

  if (xs.length === 0) return s;

  else {
    const r = xs[xs.length - 1],
      [match, ...ys] = r,
      o = r.groups,
      i = r.index;

    const sub = f({match, xs: ys, i, o, s});
    return s.slice(0, i) + sub + s.slice(i + match.length);
  }
};


// considers negative indices like native slice does

R.replaceNth = ({i, sub, rx}) => s => {
  if (rx.flags.search("g") === notFound)
    throw new Err("missing global flag");

  const xs = Array.from(s.matchAll(rx));

  if (i - 1 >= xs.length) return s;

  else {
    const match = i < 0 ? xs.slice(i) [0] : xs[i - 1],
      i2 = match.index;

    return s.slice(0, i2) + sub + s.slice(i2 + match.length);
  }
};


// considers negative indices like native slice does

R.replaceNthWith = ({i, f, rx}) => s => {
  const xs = Array.from(s.matchAll(rx));

  if (i - 1 >= xs.length) return s;

  else {
    const r = i < 0 ? xs.slice(i) [0] : xs[i - 1],
      [match, ...ys] = r,
      o = r.groups,
      i2 = r.index;

    const sub = f({match, xs: ys, i: i2, o, s});
    return s.slice(0, i2) + sub + s.slice(i2 + match.length);
  }
};


// considers negative indices like native slice does

R.replaceNthBy = ({i, f, rx}) => s => {
  const xs = R.matchAllWith({p, rx}) (s);

  if (i - 1 >= xs.length) return s;

  else {
    const r = i < 0 ? xs.slice(i) [0] : xs[i - 1],
      [match, ...ys] = r,
      o = r.groups,
      i2 = r.index;

    const sub = f({match, xs: ys, i: i2, o, s});
    return s.slice(0, i2) + sub + s.slice(i2 + match.length);
  }
};


//█████ Slicing ███████████████████████████████████████████████████████████████


/* slice a region of a string using a single search function that yields several
matches. The first and last match then define the bounds. */

R.slice = search => {
  const is = search(s);
  if (is.length <= 1) return s;
  else return s.slice(is[0], is[is.length - 1]);
};


// define the left bound of a string in a composable manner

R.sliceFrom = search => s => {
  const is = search(s);
  if (is.length === 0) return s;
  else return s.slice(is[0]);
};


// define the right bound of a string in a composable manner

R.sliceTo = search => s => {
  const is = search(s);
  if (is.length === 0) return s;
  else return s.slice(0, is[0]);
};


//█████ Word Boundaries ███████████████████████████████████████████████████████


/* Create a more general word boundary pattern (`\b`) by combining the passed
subpattern with its left/right character classes and create a regular expression
from it. */

R.bound = ({left, right}) => rx => {
  const flags = left.flags + right.flags + rx.flags;
  return R(`(?<=^|[${left}])${rx.source}(?=$|[${right}])`, flags);
};


// create only a left boundary

R.leftBound = left => rx => {
  const flags = left.flags + rx.flags;
  return R(`(?<=^|[${left}])${rx.source}`, flags);
};


// create only a right boundary

R.rightBound = right => rx => {
  const flags = right.flags + rx.flags;
  return R(`${rx.source}(?=$|[${right}])`, flags);
};


//█████ Generalizing ██████████████████████████████████████████████████████████


/* Generalize textual patterns by a 1:1-replacement of characters of different
classes with their respective substitutes. You can provide overrides to alter
default substitution behavior. Substitutions are guaranteed not to be replaced
but subsequent replacements. */


R.General = {};


R.General.Class = {};


R.General.Overrides = {};


R.General.Class.letter = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{L}/gv, subst || "L"]});


R.General.Class.notLetter = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{L}]/gv, subst]});


R.General.Class.ucl = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{Lu}/gv, subst || "A"]});


R.General.Class.notUcl = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{Lu}]/gv, subst]});


R.General.Class.lcl = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{Ll}/gv, subst || "a"]});


R.General.Class.notLcl = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{Ll}]/gv, subst]});


R.General.Class.num = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{N}/gv, subst || "ℕ"]});


R.General.Overrides.digit = [[/\d/g, "#"]];


R.General.Class.notNum = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{N}]/gv, subst]});


R.General.Class.punct = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{P}/gv, subst || "·"]});


R.General.Class.notPunct = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{P}]/gv, subst]});


R.General.Class.symbol = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{S}/gv, subst || "$"]});


R.General.Class.notSymbol = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{S}]/gv, subst]});


R.General.Class.space = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{Z}/gv, subst || "_"]});


R.General.Class.notSpace = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{Z}]/gv, subst]});


R.General.Class.control = ({overrides: [...xs], subst = null}) => 
  ({overrides: xs, fallback: [/\p{C}/gv, subst || "¶"]});


R.General.Class.notControl = ({overrides: [...xs], subst}) => 
  ({overrides: xs, fallback: [/[^\p{C}]/gv, subst]});


R.General.generalize = (...classes) => s => {
  const subs = new Set();
  let s2 = s, s3 = s;

  for (const _class of classes) {
    s2 = s2.replaceAll(..._class.fallback);

    for (const [rx, sub] of _class.overrides) {
      s3 = s3.replaceAll(rx, sub);
      subs.add(sub);
    }
  }

  for (let i = 0; i < s.length; i++) {
    if (s[i] !== s2[i]) {
      if (s[i] === s3[i] && !subs.has(s[i]))
        s3 = s3.slice(0, i) + s2[i] + s3.slice(i + 1);
    }
  }

  return {general: s3, abstract: R.dedupe(s3)};
};


//█████ Context ███████████████████████████████████████████████████████████████


/* Remerge tokens that form meaningful compositions. Some of these contexts are
localized, i.e. require a list of locales that should be considered. Meant to
be used after splitting strings into tokens. */


R.Context = {};


R.Context.hyphen = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "-") {
      xs.push(curr);
      continue;
    }

    // foo-bar

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // foo-\nbar (at the end of line)

    else if (/\p{L}/v.test(prev)
      && /\r?\n/.test(next)
      && /\p{L}/v.test(next2))
        xs[last] += next2;

    // 3-foo

    else if (/\p{N}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // -foo (suffix abbreviation)

    else if (/ /.test(prev) && /\p{L}/v.test(next)) {
      xs.push(curr + next);
      i++;
    }

    // foo- (prefix abbreviation)

    else if (/\p{L}/v.test(prev) && / /.test(next)) {
      xs[last] += curr;
      i++;
    }

    // -123

    else if (/ */.test(prev) && /\p{N}/v.test(next)) {
      xs.push(curr + next);
      i++;
    }

    // 50-100 (range or nominal number)

    else if (/\d/.test(prev)
      && /\d/.test(next)) {
        xs[last] += curr + next;
        i++;
    }

    else xs.push(curr);
  }

  return xs;
};


// takes a set of abbreviations

R.Context.period = abbrs => tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== ".") {
      xs.push(curr);
      continue;
    }

    // e.g.

    else if (/\p{L}/v.test(prev)
      && /\p{L}/v.test(next)
      && next2 === ".") {
        xs[last] += curr + next;
        i++;
    }

    else if (prev2 === "."
      && /\p{L}/v.test(prev)
      && / */.test(next))
        xs[last] += curr;

    // eg.

    else if (/ */.test(prev2)
      && /\p{L}/v.test(prev)
      && / */.test(next)
      && abbrs.has(prev + curr))
        xs[last] += curr;

    // 0.1

    else if (/\d/.test(prev) && /\d/.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.apo = (...locales) => tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "'") {
      xs.push(curr);
      continue;
    }

    // foo' (colloquial abbreviation)

    else if (/\p{L}/v.test(prev)
      && / */.test(next)
      && locales.includes("deDE"))
        xs[last] += curr;

    // 'foo (colloquial abbreviation)

    else if (/ */.test(prev)
      && /\p{L}/v.test(next)
      && locales.includes("deDE"))
        xs[last] += curr;

    // Foo'bar (Netwon'sche)

    else if (/ */.test(prev2)
      && /\p{L}/v.test(prev)
      && /\p{L}/v.test(next)
      && / */.test(next2)
      && locales.includes("deDE")) {
        xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.slash = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "/") {
      xs.push(curr);
      continue;
    }

    // foo/bar (or enum)

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // 1/3 (fraction or enum)

    else if (/\d/.test(prev) && /\d/.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // 3/foo (per or enum)

    else if (/\d/.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.comma = (...locales) => tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== ",") {
      xs.push(curr);
      continue;
    }

    // 0,1 (decimal number or enumeration)

    else if (/\d/.test(prev)
      && /\d/.test(next)
      && locales.includes("deDE")) {
        xs[last] += curr + next;
        i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.colon = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== ":") {
      xs.push(curr);
      continue;
    }

    // Lehrer:innen (gender notation)

    else if (/[^:]/.test(prev2)
      && /\p{L}/v.test(prev)
      && /\p{L}/v.test(next)
      && /[^:]/.test(next2)) {
        xs[last] += curr + next;
        i++;
    }

    // 1:3 (ratio or nominal number)

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.quota = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== '"') {
      xs.push(curr);
      continue;
    }

    // 19" (inches)

    else if (/\d/.test(prev) && /[^\d]/.test(next))
      xs[last] += curr;

    else xs.push(curr);
  }

  return xs;
};


R.Context.percent = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "%") {
      xs.push(curr);
      continue;
    }

    // 100%

    else if (/\d/.test(prev) && /[^\d]/.test(next))
      xs[last] += curr;

    else xs.push(curr);
  }

  return xs;
};


R.Context.ampersand = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "&") {
      xs.push(curr);
      continue;
    }

    // Foo&Bar

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // Foo & Bar

    else if (/\p{L}/v.test(prev2)
      && prev === " "
      && next === " "
      && /\p{L}/v.test(next2)) {
        const space = xs[last].pop();
        xs[last - 1] += space + curr + next + next2;
        i += 2;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.currency = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (!_Set.currencies.has(curr)) {
      xs.push(curr);
      continue;
    }

    // 10¤

    else if (/\d/.test(prev)) 
      xs[last] += curr;

    // ¤10

    else if (/\d/.test(next)) {
      xs.push(curr + next);
      i++;
    }

    // 10 ¤
    
    else if (/\d/.test(prev2) && prev === " ") {
      const space = xs[last].pop();
      xs[last - 1] += space + curr;
      xs[last] += curr;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.plus = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "+") {
      xs.push(curr);
      continue;
    }
      
    // +100

    else if (/[^\d]/.test(prev) && /\d/.test(next)) {
      xs.push(curr + next);
      i++;
    }

    // 10+11 (enum)

    else if (/\d/.test(prev) && /\d/.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.at = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "@") {
      xs.push(curr);
      continue;
    }

    // info@mail.com

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.asterisk = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "*") {
      xs.push(curr);
      continue;
    }

    // Lehrer*innen

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.underscore = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "_") {
      xs.push(curr);
      continue;
    }

    // Lehrer_innen

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.para = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "§" && curr !== "§§") {
      xs.push(curr);
      continue;
    }
      
    // §100 or §§100

    else if (/[^\d]/.test(prev) && /\d/.test(next)) {
      xs.push(curr + next);
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.degree = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "°") {
      xs.push(curr);
      continue;
    }

    // 100°C

    else if (/\d/.test(prev) && next === "C") {
      xs[last] += curr + next;
      i++;
    }

    // 100°

    else if (/\d/.test(prev) && /[^\d]/.test(next))
      xs[last] += curr;

    else xs.push(curr);
  }

  return xs;
};


R.Context.ellipsis = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== ".." && curr !== "...") {
      xs.push(curr);
      continue;
    }
    
    // foo..bar or foo...bar

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // 1..10 or 1...10

    else if (/\d/.test(prev) && /\d/.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    // foo.. or foo...

    else if (/\p{L}/.test(prev))
      xs[last] += curr;

    // ..foo or ...foo

    else if (/\d/.test(next)) {
      xs.push(curr + next);
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.amount = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== ".-"
      && curr !== ".--"
      && curr !== ",-"
      && curr !== ",--") {
        xs.push(curr);
        continue;
    }

    // 1.- or 1,- or 1.-- or 1,--

    else if (/\d/.test(prev))
      xs[last] += curr;

    // Foo.-Bar.

    else if (/\p{L}/v.test(prev)
      && curr === ".-"
      && /\p{L}/v.test(next)
      && next2 === ".") {
        xs[last] += curr + next + next2;
        i += 2;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.abbrs = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== ".-") {
      xs.push(curr);
      continue;
    }

    // Foo.-Bar.

    else if (/\p{L}/v.test(prev)
      && /\p{L}/v.test(next)
      && next2 === ".") {
        xs[last] += curr + next + next2;
        i += 2;
    }

    else xs.push(curr);
  }

  return xs;
};


R.Context.protocol = tokens => {
  const xs = [];

  for (let i = 0; i < tokens.length; i++) {
    const last = xs.length >= 1 ? xs.length - 1 : null,
      prev2 = i <= 1 ? "" : tokens[i - 2],
      prev = i === 0 ? "" : tokens[i - 1],
      curr = tokens[i],
      next = i + 1 >= tokens.length ? "" : tokens[i + 1],
      next2 = i + 2 >= tokens.length ? "" : tokens[i + 2];

    if (curr !== "://") {
      xs.push(curr);
      continue;
    }

    // http://www

    else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next)) {
      xs[last] += curr + next;
      i++;
    }

    else xs.push(curr);
  }

  return xs;
};


// TODO: predefined composition


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Set = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATA █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


_Set.deDE = {};


// currencies

Object.defineProperty(_Set, "currencies", {
  get() {
    const s = new Set([
      "€", "$", "¥", "£", "₩", "₹", "₽", "₺", "¢", "¤",
      "EUR", "USD", "CNY", "JPY", "GBP", "INR", "RUB", "TRY", "CHF"
    ]);

    delete this.currencies;
    this.currencies = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "nominalInterfixes", {
  get() {
    const s = new Set([
      "ens", "en", "er", "es", "e", "n", "s",
    ]);

    delete this.nominalInterfixes;
    this.nominalInterfixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "nominalSuffixes", {
  get() {
    const s = new Set([
      "ern", "nen", "en", "er", "es", "e", "n", "s",
    ]);

    delete this.nominalSuffixes;
    this.nominalSuffixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "verbalPrefixes", {
  get() {
    const s = new Set([
      "ge",
    ]);

    delete this.verbalPrefixes;
    this.verbalPrefixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "verbalInterfixes", {
  get() {
    const s = new Set([
      "zu", "ge",
    ]);

    delete this.verbalInterfixes;
    this.verbalInterfixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "verbalSuffixes", {
  get() {
    const s = new Set([
      "test", "tet", "ten", "te", "est", "et", "st", "en", "t", "e", "n",
    ]);

    delete this.verbalSuffixes;
    this.verbalSuffixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "verbalInfinitives", {
  get() {
    const s = new Set([
      "en", "n",
    ]);

    delete this.verbalInfinitives;
    this.verbalInfinitives = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "adjectivalInterfixes", {
  get() {
    const s = new Set([
      "ens", "en", "er", "es", "e", "n", "s",
    ]);

    delete this.adjectivalInterfixes;
    this.adjectivalInterfixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "numeralInterfixes", {
  get() {
    const s = new Set([
      "und",
    ]);

    delete this.numeralInterfixes;
    this.numeralInterfixes = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "inflectionElisions", {
  get() {
    const s = new Set([
      "en", "e",
    ]);

    delete this.inflectionElisions;
    this.inflectionElisions = s;
    return s;
  },

  configurable: true
});


Object.defineProperty(_Set.deDE, "compoundElisions", {
  get() {
    const s = new Set([
      "e",
    ]);

    delete this.compoundElisions;
    this.compoundElisions = s;
    return s;
  },

  configurable: true
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


_Set.entries = s => s[Symbol.iterator] ();


_Set.clone = s => new Set(s);


_Set.addn = xs => s => xs.forEach(x => s.add(x));


//█████ Set Operations ████████████████████████████████████████████████████████


_Set.intersect = s => t => {
  const st = new Set();
  for (const x of s) t.has(x) ? st.add(x) : null;
  return st;
};


_Set.union = s => t => {
  const st = new Set(s);
  t.forEach(x => st.add(x));
  return st;
};


_Set.diff = s => t => {
  const l = new Set(), r = new Set();
  for (const x of s) !t.has(x) ? l.add(x) : null;
  for (const x of t) !s.has(x) ? r.add(x) : null;
  r.forEach(x => l.add(x));
  return l;
};


_Set.diffl = s => t => {
  const l = new Set();
  for (const x of s) !t.has(x) ? l.add(x) : null;
  return l;
};


//█████ Conversion ████████████████████████████████████████████████████████████


_Set.fromAit = comp(Cont.fromPromise) (async function (ix) {
  const s = new Set();
  for await (const k of ix) s.add(k);
  return s;
});


_Set.fromAitKeys = comp(Cont.fromPromise) (async function (ix) {
  const s = new Set();
  for await (const [k,] of ix) s.add(k);
  return s;
});


_Set.fromAitValues = comp(Cont.fromPromise) (async function (ix) {
  const s = new Set();
  for await (const [, v] of ix) s.add(v);
  return s;
});


_Set.fromIt = ix => {
  const s = new Set();
  for (const k of ix) s.add(k);
  return s;
};


_Set.fromItKeys = ix => {
  const s = new Set();
  for (const [k,] of ix) s.add(k);
  return s;
};


_Set.fromItValues = ix => {
  const s = new Set();
  for (const [, v] of ix) s.add(v);
  return s;
};


_Set.interconvert = f => s => new Set(f(Array.from(s)));


_Set.interconvertBy = f => g => s => new Set(f(Array.from(s).map(g)));


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STRING ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const S = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATA █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


S.deDE = {};


S.deDE.vowelConsonantRatio = 0.666666667;


S.deDE.avgWordLen = 5.5;


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


S.searchAll = sub => s => {
  const is = [];
  
  for (let i = s.indexOf(sub); i !== -1; i = s.indexOf(sub, i + 1))
    is.push(i);
  
  return is;
};


S.stripAlphaNum = s => s.replaceAll(/[\p{L}\p{N}]/gv, "");


S.stripAllButAlphaNum = s => s.replaceAll(/[^\p{L}\p{N}]/gv, "");


S.stripAllButNum = s => s.replaceAll(/[^\p{N}]/gv, "");


S.catWith = s => (...xs) => xs.join(s);


// try to truncate a string without breaking its tokens

S.trunc = maxLen => s => {
  if (maxLen >= s.length) return s;
  else if (s[maxLen] === " ") return s.slice(0, maxLen);

  else {
    const is = R.searchAll(/ /g) (s);

    for (let j = 0; j < is.length; j++)
      if (is[j] > maxLen) return s.slice(0, is[j - 1]);
  }

  return s.slice(0, maxLen);
};


/* Try to truncate a strings without breaking its tokens while both parts meet
the max length consrtaint. */

S.trunc2 = maxLen => s => {
  if (maxLen >= s.length) return [s, ""];
  else if (maxLen * 2 <= s.length) return [s.slice(0, maxLen), s.slice(maxLen)];

  else {
    const is = R.searchAll(/ /g) (s);

    for (let j = 0; j < is.length; j++) {
      if (is[j] > maxLen) {
        if (s.length - is[j - 1] - 1 <= maxLen) return [
          s.slice(0, is[j - 1]),
          s.slice(is[j - 1] + 1)
        ];

        else break;
      }
    }
  }

  return [s.slice(0, maxLen), s.slice(maxLen)];
};


S.cat = S.catWith("");


S.cat_ = S.catWith(" ");


/* Plain applicator but with a telling name. Intended use:

  S.template(o => `Happy ${o.foo}, ${o.bar}!`)
    ({foo: "Thanksgiving", bar: "Muad'dib"})

Yields "Happy Thanksgiving, Muad'dib!" */

S.template = f => o => f(o);


//█████ Counting ██████████████████████████████████████████████████████████████


S.countChar = c => s => {
  let n = 0;
  for (const c2 of s) if (c === c2 ) n++;
  return n;
};


S.countChars = s => {
  const m = new Map();
  for (const c of s) _Map.inc(c) (acc);
  return m;
};


S.countSubstr = t => s => {
  let n = 0, offset = 0;

  while (true) {
    const i = s.indexOf(t, offset);
    if (i === -1) break;
    else (n++, offset = i + 1);
  }

  return n;
};


//█████ Replacing █████████████████████████████████████████████████████████████


S.replaceChar = (c, sub) => s => {
  let t = "";
  
  for (const c2 of s) {
    if (c !== c2) t += c2;
    else t += sub;
  }
  
  return t;
};


// accumulate each individual replacement

S.replaceCharAccum = (c, sub) => s => {
  const xs = [];

  for (let i = s.indexOf(c); i !== -1; i = s.indexOf(c, i + 1)) {
    const prefix = s.substring(0, i),
      suffix = s.substring(i + c.length);
    
    xs.push(prefix + sub + suffix);
  }

  return xs;
};


S.replaceSub = (c, sub) => s => {
  let r = "", j = 0;

  for (let i = s.indexOf(c, j); i !== -1; i = s.indexOf(c, j)) {
    r += s.substring(j, i);
    r += sub;
    j = i + c.length;
  }

  r += s.substring(j);
  return r;
};


// accumulate each individual replacement

S.replaceSubAccum = (sub, sub2) => s => {
  const xs = [];
  let j = 0;

  for (let i = s.indexOf(sub, j); i !== -1; i = s.indexOf(sub, j)) {
    const prefix = s.substring(0, i),
      suffix = s.substring(i + sub.length);

    xs.push(prefix + sub2 + suffix);
    j = i + 1;
  }

  return xs;
};


//█████ Splitting █████████████████████████████████████████████████████████████


S.splitChunk = ({size, padding = " ", overlap = false}) => s => {
  const xs = [];

  for (let i = 0; i === i; overlap ? i++ : i += size) {
    if (i >= s.length) break;
    
    else if (i + size > s.length) {
      if (!overlap)
        xs.push(s.slice(i, i + size).padEnd(size, padding));
    }
    
    else xs.push(s.slice(i, i + size));
  }

  return xs;
};


S.bigram = S.splitChunk({size: 2, overlap: true});


S.trigram = S.splitChunk({size: 3, overlap: true});


S.fromNgram = ngram => {
  let s = "";
  for (const t of ngram) s += t[0];
  s += ngram[ngram.length - 1].slice(1);
  return s;
};


/* Split at character transitions:
  S.splitChars("abbccc") // yields ["a", "bb", "ccc"] */

S.splitTrans = s => {
  return s.split("").reduce((acc, c) => {
    const i = acc.length - 1;
    
    if (acc[i] === "") acc[i] += c;
    else if (acc[i] [0] === c) acc[i] += c;
    else acc.push(c);

    return acc;
  }, [""]);
};


// split at transitions from ASCII to not ASCII characters

S.splitAscii = s => {
  return s.split("").reduce((acc, c) => {
    const i = acc.length - 1;
    
    if (acc[i] === "") acc[i] += c;
    else if (acc[i].charCodeAt(0) < 128 && c.charCodeAt(0) < 128) acc[i] += c;
    else acc.push(c);

    return acc;
  }, [""]);
};


//█████ Retrieval █████████████████████████████████████████████████████████████


// retrieve similar words based on bigrams


S.Retrieve = {};


// Word :: Str
// Bigram :: [Str]
// Index :: Nat
// S.Corpus{bigrams: [Bigram], lookup: Map<Str, Set<Index>>}
// [Word] => S.Corpus
S.Retrieve.createCorpus = words => {
  const bigrams = words.map(S.bigram),
    lookup = new Map();

  bigrams.forEach((bigram, i) => {
    const metaBigrams = A.bigram(bigram);

    metaBigrams.forEach(metaBigram => {
      const k = JSON.stringify(metaBigram).toLowerCase();
      if (!lookup.has(k)) lookup.set(k, new Set());
      lookup.get(k).add(i);
    });
  });

  return {
    [$]: "S.Corpus",
    [$$]: "S.Corpus",
    bigrams,
    lookup
  };
};


/* Retrieve words of a corpus that are similar to a query word using bigrams.
The comparison is conducted in a case-insensitive manner.

lenDiff: sets the lower and upper bounds for the allowed length difference
by calculating the length ratio between the query and the corpus word.

threshold: sets the lower bound of necessary bigram matches by calculating the
quotient of matching over total bigrams of the *shorter* word.

The result is ordered by score in descending order. Consecutive bigram matches
yield a higher score than scattered ones. */

// Nat :: Num
// Word :: Str
// Bigram :: [Str]
// S.Corpus{bigrams: [Bigram], lookup: Map<Str, Set<Index>>}
// {corpus: S.Corpus, lenDiff: [Num, Num], threshold: Num} => Word => [{i: Index, score: Nat}]
S.Retrieve.query = ({corpus, lenDiff = [0.75, 1.34], threshold = 0.25}) => word => {
  const queryBigram = S.bigram(word.toLowerCase()),
    queryMetas = A.bigram(queryBigram);

  if (queryMetas.length === 0) return [];
  
  const m = new Map();

  queryMetas.forEach(queryMeta => {
    const k = JSON.stringify(queryMeta);

    if (corpus.lookup.has(k)) {
      corpus.lookup.get(k).forEach(i => {
        const ratio = queryBigram.length / corpus.bigrams[i].length;
        
        if ((lenDiff[0] === null || ratio >= lenDiff[0])
          && (lenDiff[1] === null || ratio <= lenDiff[1])) {
            if (m.has(i)) m.set(i, m.get(i) + 1);
            else m.set(i, 1);
        }
      });
    }
  });

  const candidates = new Set();

  m.forEach((n, i) => {
    if (queryBigram.length <= corpus.bigrams[i].length) {
      if (n / (queryBigram.length - 1) >= threshold) candidates.add(i);
    }

    else if (n / (corpus.bigrams[i].length - 1) >= threshold) candidates.add(i);
  });

  const results = [], qlen = queryMetas.length;

  candidates.forEach(corpusIndex => {
    const corpusBigram = corpus.bigrams[corpusIndex].map(s => s.toLowerCase()),
      corpusMetas = A.bigram(corpusBigram),
      clen = corpusMetas.length;

    const xs = Array(qlen + 1)
      .fill(null)
      .map(() => Array(clen + 1).fill(0));

    for (let i = 1; i <= qlen; i++) {
      for (let j = 1; j <= clen; j++) {
        const queryMeta = queryMetas[i - 1],
          corpusMeta = corpusMetas[j - 1];

        if (queryMeta[0] === corpusMeta[0] && queryMeta[1] === corpusMeta[1])
          xs[i] [j] = xs[i - 1] [j - 1] + 1;

        else xs[i] [j] = 0;
      }
    }

    // calculate score

    let score = 0;

    for (let i = 1; i <= qlen; i++) {
      for (let j = 1; j <= clen; j++) {
        if (xs[i] [j] > 0) {
          const atQueryEnd = i === qlen,
            atCorpusEnd = j === clen;
          
          let isMismatch = false;

          if (!atQueryEnd && !atCorpusEnd) {
            const queryMeta2 = queryMetas[i],
              corpusMeta2 = corpusMetas[j];

            if (queryMeta2[0] !== corpusMeta2[0]
              || queryMeta2[1] !== corpusMeta2[1])
                isMismatch = true;
          }

          if (atQueryEnd || atCorpusEnd || isMismatch) {
            const runLen = xs[i] [j];
            score += runLen * runLen;
          }
        }
      }
    }

    results.push({index: corpusIndex, score});
  });

  results.sort((o, p) => p.score - o.score);
  return results;
};


//█████ Diffing ███████████████████████████████████████████████████████████████


/* Query differences between two strings in a case-insensitive manner. Only
return diffings for word pairs that have at least a two-letter sequence in
common. */


S.Diff = class Diff {
  static #createNgrams(word) {
    const n = word.length, ngrams = [];

    for (let len = n; len >= 1; len--) {
      for (let i = 0; i <= n - len; i++) {
        ngrams.push({
          text: word.substring(i, i + len),
          start: i,
          length: len,
          end: i + len - 1
        });
      }
    }

    return ngrams;
  }


  static #match(wordLeft, wordRight) {
    const ngramsLeft = Diff.#createNgrams(wordLeft),
      ngramsRight = Diff.#createNgrams(wordRight),
      lookupLeft = new Set(),
      lookupRight = new Set(),
      matchesLeft = [],
      matchesRight = [];

    for (const o of ngramsLeft) {
      if (lookupLeft.has(o.text + "/" + o.start)) continue;

      for (const p of ngramsRight) {
        if (o.text.toLowerCase() === p.text.toLowerCase()) {
          if (!lookupLeft.has(o.text + "/" + o.start)) matchesLeft.push(o);
          if (!lookupRight.has(p.text + "/" + p.start)) matchesRight.push(p);
          lookupLeft.add(o.text + "/" + o.start);
          lookupRight.add(p.text + "/" + p.start);
        }
      }
    }

    matchesLeft.sort((o, p) => o.start - p.start);
    matchesRight.sort((o, p) => o.start - p.start);

    return {
      ngramsLeft: matchesLeft,
      ngramsRight: matchesRight,
    };
  }


  static #format(ngrams, wordLeft, wordRight) {
    const letters = {
      left: Array(wordLeft.length).fill(""),
      right: Array(wordRight.length).fill(""),
    };

    for (const ngram of ngrams) {
      for (let i = ngram.start, j = 0; i <= ngram.end; i++, j++)
        letters.left[i] = ngram.text[j];

      for (let i = ngram.right, j = 0; i < ngram.right + ngram.length; i++, j++)
        letters.right[i] = ngram.text[j];
    }

    const left = {
      str: wordLeft,
      matches: [],
      matches_: [],
      mismatches: [],
      mismatches_: [],
    };

    const right = {
      str: wordRight,
      matches: [],
      matches_: [],
      mismatches: [],
      mismatches_: [],
    };

    let matchBuf = "", mismatchBuf = "";

    for (let i = 0; i < letters.left.length; i++) {
      if (letters.left[i] === "") {
        left.mismatches.push({char: wordLeft[i], index: i});
        mismatchBuf += wordLeft[i];

        if (matchBuf !== "") {
          left.matches_.push(matchBuf);
          matchBuf = ""
        };
      }
      
      else {
        left.matches.push({char: wordLeft[i], index: i});
        matchBuf += wordLeft[i];

        if (mismatchBuf !== "") {
          left.mismatches_.push(mismatchBuf);
          mismatchBuf = ""
        };
      }
    }

    if (matchBuf) left.matches_.push(matchBuf);
    if (mismatchBuf) left.mismatches_.push(mismatchBuf);
    
    matchBuf = "", mismatchBuf = "";

    for (let i = 0; i < letters.right.length; i++) {
      if (letters.right[i] === "") {
        right.mismatches.push({char: wordRight[i], index: i});
        mismatchBuf += wordRight[i];

        if (matchBuf !== "") {
          right.matches_.push(matchBuf);
          matchBuf = ""
        };
      }
      
      else {
        right.matches.push({char: wordRight[i], index: i});
        matchBuf += wordRight[i];

        if (mismatchBuf !== "") {
          right.mismatches_.push(mismatchBuf);
          mismatchBuf = ""
        };
      }
    }

    if (matchBuf) right.matches_.push(matchBuf);
    if (mismatchBuf) right.mismatches_.push(mismatchBuf);

    return tag("S.Diff") ({left, right});
  };


  // Nat :: Num
  // IndexedChar :: {char: Str, index: Nat}
  // SubStr :: Str
  // DiffSide :: {str: Str, matches: [IndexedChar], matches_: [SubStr], mismatches: [IndexedChar], mismatches_: [SubStr]}
  // S.Diff{left: DiffSide, right: DiffSide}
  // Str => Str => S.Diff
  static query = wordLeft => wordRight => {
    const {ngramsLeft, ngramsRight} = Diff.#match(wordLeft, wordRight), result = [];
    let maxLenLeft = 0, maxLenRight = 0;

    // retrieve max ngram length in the left word

    for (let i = 0; i < ngramsLeft.length; i++)
      if (ngramsLeft[i].text.length > maxLenLeft) maxLenLeft = ngramsLeft[i].text.length;

    // retrieve max ngram length in the right word

    for (let i = 0; i < ngramsRight.length; i++)
      if (ngramsRight[i].text.length > maxLenRight) maxLenRight = ngramsRight[i].text.length;

    // short circuit on no or only 1-gram matches

    if (maxLenLeft <= 1) return Diff.#format([], wordLeft, wordRight);
    
    // collect indices of longest ngrams

    const maxIsLeft = A.filterIndicesWith(o => o.text.length === maxLenLeft) (ngramsLeft),
      maxIsRight = A.filterIndicesWith(o => o.text.length === maxLenRight) (ngramsRight);

    // traverse largest ngrams

    for (let i = 0; i < maxIsLeft.length; i++) {
      const longestLeft = ngramsLeft[maxIsLeft[i]],
        longestStartLeft = ngramsLeft[maxIsLeft[i]].start,
        longestEndLeft = ngramsLeft[maxIsLeft[i]].end;

      const longestRight = ngramsRight[maxIsRight[i]],
        longestStartRight = ngramsRight[maxIsRight[i]].start,
        longestEndRight = ngramsRight[maxIsRight[i]].end;

      const pickedNgrams = [longestLeft],
        prefixesLeft = [],
        suffixesLeft = [];

      // preserve ngram index of right word

      longestLeft.right = ngramsRight[maxIsRight[i]].start;

      // look for matching ngrams in prefix position of the longest ngram

      if (longestStartLeft > 0) {
        const maybePrefixesLeft = ngramsLeft.filter(o => o.end < longestStartLeft),
          maybePrefixesRight = ngramsRight.filter(o => o.end < longestStartRight);

        maybePrefixesLeft.sort((a, b) => {
          if (a.start !== b.start) return a.start - b.start;
          return b.length - a.length;
        });

        // keep only the longest ngrams

        let currIndex = -1;

        for (const maybePrefixLeft of maybePrefixesLeft) {
          if (maybePrefixLeft.start > currIndex) {
            prefixesLeft.push(maybePrefixLeft);
            currIndex = maybePrefixLeft.end;
          }
        }
        
        // pick ngrams in close prefix position

        let currIndexLeft = longestLeft.start,
          currIndexRight = longestRight.start;

        for (let i = prefixesLeft.length - 1; i >= 0; i--) {
          if (currIndexLeft - prefixesLeft[i].end > 3) break;

          const j = maybePrefixesRight.findLastIndex(o =>
            o.text.toLowerCase() === prefixesLeft[i].text.toLowerCase());
          
          if (j === notFound) continue;
          else if (maybePrefixesRight[j].start >= currIndexRight) continue;
          else if (currIndexRight - maybePrefixesRight[j].end > 3) break;
          
          else {
            prefixesLeft[i].right = maybePrefixesRight[j].start;
            pickedNgrams.unshift(prefixesLeft[i]);
            currIndexLeft = prefixesLeft[i].start;
            currIndexRight = maybePrefixesRight[j].start;
          }
        }
      }

      // look for matching ngrams in suffix position of the longest ngram

      if (longestEndLeft < wordLeft.length - 1) {
        const maybeSuffixesLeft = ngramsLeft.filter(o => o.start > longestEndLeft),
          maybeSuffixesRight = ngramsRight.filter(o => o.start > longestEndRight);

        maybeSuffixesLeft.sort((a, b) => {
          if (a.start !== b.start) return a.start - b.start;
          return b.length - a.length;
        });

        // keep only the longest ngrams

        let currIndex = -1;

        for (const maybeSuffixLeft of maybeSuffixesLeft) {
          if (maybeSuffixLeft.start > currIndex) {
            suffixesLeft.push(maybeSuffixLeft);
            currIndex = maybeSuffixLeft.end;
          }
        }
        
        // pick ngrams in close suffix position

        let currIndexLeft = longestLeft.end,
          currIndexRight = longestRight.end;

        for (let i = 0; i < suffixesLeft.length; i++) {
          if (suffixesLeft[i].start - currIndexLeft > 3) break;

          const j = maybeSuffixesRight.findIndex(o =>
            o.text.toLowerCase() === suffixesLeft[i].text.toLowerCase());
          
          if (j === notFound) continue;
          else if (maybeSuffixesRight[j].end <= currIndexRight) continue;
          else if (maybeSuffixesRight[j].start - currIndexRight > 3) break;
          
          else {
            suffixesLeft[i].right = maybeSuffixesRight[j].start;
            pickedNgrams.push(suffixesLeft[i]);
            currIndexLeft = suffixesLeft[i].start;
            currIndexRight = maybeSuffixesRight[j].start;
          }
        }
      }

      if (pickedNgrams.length) result.push(pickedNgrams);
    }

    if (result.length <= 1) return Diff.#format(result[0], wordLeft, wordRight);

    // consolidate result

    const lookup = new Set(), result2 = [];

    // dedupe

    for (const os of result) {
      const k = os.map(o => o.text).join("/");

      if (!lookup.has(k)) {
        result2.push(os);
        lookup.add(k);
      }
    }

    if (result2.length === 1) return Diff.#format(result2[0], wordLeft, wordRight);

    // pick the ngram that has more letters and is less scattered (left bias)

    const scores = result2.map((ngramsRight, i) => {
      const factor = ngramsRight.reduce((acc, o) => {
        acc.score += o.text.length * o.text.length;
        return acc;
      }, {i, score: 0});

      const factor2 = ngramsRight.length;

      factor.score = factor.score - factor2 * 0.99;
      return factor;
    });

    scores.sort((o, p) => p.score - o.score || o.i - p.i);
    
    return Diff.#format(result2[scores[0].i], wordLeft, wordRight);
  };
};


//█████ Diffing :: Evaluation █████████████████████████████████████████████████


// evaluate diffings between two compared strings


S.Diff.Eval = class DiffEval {
  constructor(locale) {
    this.locale = locale;
  }

  static #data = {
    deDE: {
      misreadings: new Map([
        ["0", ["D", "O"]],
        ["1", ["I", "l"]],
        ["2", ["Z"]],
        ["5", ["S"]],
        ["6", ["b", "G"]],
        ["7", ["T"]],
        ["8", ["S", "B"]],
        ["9", ["g", "q"]],
        ["B", ["8"]],
        ["b", ["6"]],

        ["D", ["0"]],
        ["G", ["6"]],
        ["g", ["9"]],
        ["I", ["1"]],
        ["l", ["1"]],
        ["O", ["0"]],
        ["q", ["9"]],
        ["S", ["5", "8"]],
        ["T", ["7"]],
        ["Z", ["2"]],
      ]),

      equivalences: MultiMap.fromIt([
        ["ä", "ae"], ["ü", "ue"], ["ö", "oe"], ["ß", "ss"], ["Æ", "Ae"],
        ["æ", "ae"], ["ᴭ", "Ae"], ["ᵆ", "ae"], ["Ǽ", "Ae"], ["ǽ", "ae"],
        ["Ǣ", "Ae"], ["ǣ", "ae"], ["ᴁ", "Ae"], ["ᴂ", "ae"], ["ȸ", "db"],
        ["Ǳ", "Dz"], ["ǲ", "Dz"], ["ǳ", "dz"], ["Ǆ", "Dz"], ["ǅ", "Dz"],
        ["ǆ", "dz"], ["ﬀ", "ff"], ["ﬃ", "ffi"], ["ﬄ", "ffl"], ["ﬁ", "fi"],
        ["ﬂ", "fl"], ["Ĳ", "Ij"], ["ĳ", "ij"], ["Ǉ", "Lj"], ["ǈ", "Lj"],
        ["ǉ", "lj"], ["Ǌ", "Nj"], ["ǋ", "Nj"], ["ǌ", "nj"], ["Œ", "Oe"],
        ["œ", "oe"], ["ȹ", "qp"], ["ᵫ", "ue"],
        
        ["ae", "ä"], ["ue", "ü"], ["oe", "ö"], ["ss", "ß"], ["Ae", "Æ"],
        ["ae", "æ"], ["Ae", "ᴭ"], ["ae", "ᵆ"], ["Ae", "Ǽ"], ["ae", "ǽ"],
        ["Ae", "Ǣ"], ["ae", "ǣ"], ["Ae", "ᴁ"], ["ae", "ᴂ"], ["db", "ȸ"],
        ["Dz", "Ǳ"], ["Dz", "ǲ"], ["dz", "ǳ"], ["Dz", "Ǆ"], ["Dz", "ǅ"],
        ["dz", "ǆ"], ["ff", "ﬀ"], ["ffi", "ﬃ"], ["ffl", "ﬄ"], ["fi", "ﬁ"],
        ["fl", "ﬂ"], ["Ij", "Ĳ"], ["ij", "ĳ"], ["Lj", "Ǉ"], ["Lj", "ǈ"],
        ["lj", "ǉ"], ["Nj", "Ǌ"], ["Nj", "ǋ"], ["nj", "ǌ"], ["Oe", "Œ"],
        ["oe", "œ"], ["qp", "ȹ"], ["ue", "ᵫ"],
      ]),

      mishearings: {
        match11: [
          {letters: ["ä", "e"], constraints: ["tail"]}, // abwägig/abwegig
          {letters: ["b", "p"], constraints: ["tail"]}, // Absorbtion/Absorption
          {letters: ["c", "k"], constraints: []}, // cirka/circa
          {letters: ["f", "v"], constraints: []}, // Flies/Vlies
          {letters: ["i", "e"], constraints: ["tail"]}, // deligieren/delegieren
          {letters: ["i", "y"], constraints: ["tail"]}, // Gulli/Gully
          {letters: ["m", "n"], constraints: ["tail"]}, // Pantomine/Pantomime
          {letters: ["s", "ß"], constraints: ["tail"]}, // blos/bloß
          {letters: ["t", "d"], constraints: ["tail"]}, // entgültig/endgültig
          {letters: ["v", "w"], constraints: ["tail"]}, // Nirvana/Nirwana
          {letters: ["z", "c"], constraints: []}, // Zellulite/Cellulite
          {letters: ["z", "s"], constraints: ["tail"]}, // Konsenz/Konsens
          {letters: ["z", "t"], constraints: ["tail"]}, // exponenziell/exponentiell
        ],

        matchFirst12: [
          {letters: ["i", "ia"], constraints: []}, // brilliant/brillant
          {letters: ["i", "io"], constraints: []}, // Pavillion/Pavillon
          {letters: ["o", "oo"], constraints: []}, // Looser/Loser
          {letters: ["s", "sz"], constraints: []}, // sechszig/sechzig
          {letters: ["t", "ts"], constraints: []}, // hälst/hältst
          {letters: ["t", "tz"], constraints: []}, // Matraze/Matratze
        ],

        matchSecond12: [
          {letters: ["a", "oa"], constraints: []}, // Board/Bord
          {letters: ["e", "ie"], constraints: []}, // Maschiene/Maschine
          {letters: ["h", "ah"], constraints: []},
          {letters: ["h", "äh"], constraints: []},
          {letters: ["h", "eh"], constraints: []}, // erwürdig/ehrwürdig
          {letters: ["h", "gh"], constraints: []},
          {letters: ["h", "ih"], constraints: []}, // gefeiht/gefeit
          {letters: ["h", "oh"], constraints: []},
          {letters: ["h", "öh"], constraints: []},
          {letters: ["h", "ph"], constraints: []},
          {letters: ["h", "rh"], constraints: []},
          {letters: ["h", "th"], constraints: []},
          {letters: ["h", "uh"], constraints: []},
          {letters: ["h", "üh"], constraints: []},
          {letters: ["k", "ck"], constraints: []}, // Hecktik/Hektik + Packet/Paket
          {letters: ["r", "ar"], constraints: []}, // Amatur/Armatur
          {letters: ["r", "ur"], constraints: []}, // Tunier/Turnier
          {letters: ["t", "dt"], constraints: ["tail"]}, // verwand/verwandt
          {letters: ["u", "ou"], constraints: []}, // Favouriten/Favoriten
        ],

        mismatch12: [
          {letters: ["ä", "ai"], constraints: []}, // Portrait/Porträt
          {letters: ["c", "ss"], constraints: ["tail"]}, // Fassette/Facette
          {letters: ["f", "ph"], constraints: []}, // Elephant/Elefant
          {letters: ["g", "ch"], constraints: ["tail"]}, // revangieren/revanchieren
          {letters: ["k", "ch"], constraints: []}, // Kaos/Chaos
          {letters: ["t", "ed"], constraints: ["last", "noFlip"]}, // gemanaged/gemanagt
          {letters: ["x", "ks"], constraints: ["tail"]}, // Extase/Ekstase
          {letters: ["x", "kt"], constraints: ["tail"]}, // Reflektion/Reflexion
          {letters: ["y", "ie"], constraints: ["tail"]}, // Hobbies Hobbys
        ],

        matchFirst22: [
          {letters: ["ee", "eh"], constraints: []}, // verhehrend/verheerend
          {letters: ["pf", "ph"], constraints: []}, // Triumpf/Triumph
        ],

        matchSecond22: [
          {letters: ["ai", "ei"], constraints: []}, // Leib/Laib
          {letters: ["kt", "gt"], constraints: []}, // prankt/prangt
          {letters: ["qu", "ku"], constraints: []}, // Bisquit/Biskuit
        ],

        mismatch22: [
          {letters: ["ss", "cc"], constraints: []}, // Asseccoire/Accessoire
        ],

        mismatch13: [
          {letters: ["x", "chs"], constraints: []}, // achsial/axial
          {letters: ["x", "cks"], constraints: []}, // Boxhorn/Bockshorn
        ],
      },
    },
  }


  // compose two evaluations

  //  EvalFun :: S.Diff.Eval => [S.Diff.Eval]
  // EvalFun => EvalFun => S.Diff.Eval => [S.Diff.Eval]
  comp = f => g => evals => {
    if (!Array.isArray(evals)) {
      if (evals[$] === "S.Diff")
        evals = this.initialize(evals);

      else evals = [evals];
    }

    const evals2 = evals.flatMap(o => {
      const xs = g(o);

      return xs.map(p => {
        p.desc = [...o.desc, ...p.desc];
        p.reason = [...o.reason, ...p.reason];
        p.penalty = [...o.penalty, ...p.penalty];
        p.offset = [...o.offset, ...p.offset];
        return p;
      });
    });

    const evals3 = evals2.flatMap(o => {
      const xs = f(o);

      return xs.flatMap(p => {
        p.desc = [...o.desc, ...p.desc];
        p.reason = [...o.reason, ...p.reason];
        p.penalty = [...o.penalty, ...p.penalty];
        p.offset = [...o.offset, ...p.offset];
        return p;
      });
    });

    return evals3.sort((o, p) => A.sum(o.penalty) - A.sum(p.penalty));
  }


  // variadic variant of comp with reversed order

  pipe(...fs) {
    if (fs.length < 2) throw new Err("at least two arguments expected");
    else return fs.reduce((g, f) => this.comp(f) (g));
  }


  /* Default composition of all available evaluations:
    * start with initial wrapping
    * all actual evaluations in arbitrary order
    * finalize with remaining evaluation */

  pipeAll = this.pipe(
    this.initialize,
    this.match11.bind(this),
    this.matchFirst12.bind(this),
    this.matchSecond12.bind(this),
    this.mismatch12.bind(this),
    this.matchFirst22.bind(this),
    this.matchSecond22.bind(this),
    this.mismatch22.bind(this),
    this.mismatch13.bind(this),
    this.misreading.bind(this),
    this.transposition.bind(this),
    this.repetition.bind(this),
    this.modifier.bind(this),
    this.equivalence.bind(this),
    this.remainder.bind(this)
  )


  #empty = _eval => ({
    [$]: "S.Diff.Eval",
    [$$]: "S.Diff.Eval",
    desc: [],
    reason: [],
    offset: [],
    penalty: [],
    left: _eval.left,
    right: _eval.right
  })


  /* Take a diff and wrap it into an empty eval. The combinator is meant to be
  used first in compositions of evaluations. */

  // Nat :: Num
  // IndexedChar :: {char: Str, index: Nat}
  // DiffSide :: {str: Str, matches: [IndexedChar], mismatches: [IndexedChar]}
  // S.Diff{left: DiffSide, right: DiffSide}
  // S.Diff.Eval{desc: Str, reason: [Str], offset: [Nat], penalty: [Nat], left: DiffSide, right: DiffSide}
  // S.Diff => [S.Diff.Eval]
  initialize(diff) {
    return [{
      [$]: "S.Diff.Eval",
      [$$]: "S.Diff.Eval",
      desc: [],
      reason: [],
      offset: [],
      penalty: [],
      left: diff.left,
      right: diff.right,
    }];
  }


  /* Penalize every remaining mismatch with a higher penality. The combinator is
  meant to be used last in compositions of evaluations. */

  // S.Diff.Eval => [S.Diff.Eval]
  remainder(_eval) {
    const ls = _eval.left.mismatches,
      rs = _eval.right.mismatches;

    let penalty = 0;

    if (ls.length + rs.length === 0) return [{
      [$]: "S.Diff.Eval",
      [$$]: "S.Diff.Eval",
      desc: [],
      reason: [],
      offset: [],
      penalty: [],
      left: _eval.left,
      right: _eval.right,
    }];

    for (const mismatch of _eval.left.mismatches) penalty += 10;
    for (const mismatch of _eval.right.mismatches) penalty += 10;

    const desc = S.cat(
      ls.map(o => o.char).join("") || "_",
      "/",
      rs.map(o => o.char).join("") || "_");

    return [{
      [$]: "S.Diff.Eval",
      [$$]: "S.Diff.Eval",
      desc: [desc],
      reason: ["remainder"],
      offset: [0],
      penalty: [penalty],
      left: _eval.left,
      right: _eval.right,
    }];
  };


  // S.Diff.Eval => [S.Diff.Eval]
  match11(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i],
        side2 = ({left: "right", right: "left"}) [side],
        xs = [];

      if (mismatch.char === o.letters[0]) {
        const mismatches2 = _eval[side2].mismatches
          .filter(p => p.char === o.letters[1]);

        for (const mismatch2 of mismatches2) {
          for (const constraint of o.constraints) switch (constraint) {
            case "tail": {
              if (mismatch.index === 0 || mismatch2.index === 0) return [];
              break;
            }

            default: throw new Err(`unknown constraint "${constraint}"`);
          }

          const eval2 = comp(O.update({
            path: [side, "mismatches"],
            f: ys => ys.filter(p => p.index !== mismatch.index)
          })) (O.update({
            path: [side2, "mismatches"],
            f: ys => ys.filter(p => p.index !== mismatch2.index)
          })) (_eval);

          const desc = side === "left"
            ? o.letters.join("/")
            : o.letters.toReversed().join("/");

          const offset = side === "left"
            ? mismatch.index - mismatch2.index
            : mismatch2.index - mismatch.index;

          xs.push({
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["mishearing"],
            offset: [mismatch.index - mismatch2.index],
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval));
        }
      }

      return xs;
    };

    const os = DiffEval.#data[this.locale].mishearings.match11,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  matchFirst12(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i];

      if (mismatch.char === o.letters[0]) {
        const match = _eval[side].matches
          .find(p => p.index === mismatch.index + 1
            && p.char === o.letters[1] [1]);

        if (match) {
          const eval2 = O.update({
            path: [side, "mismatches"],
            f: ys => ys.filter(p => p.index !== mismatch.index)
          }) (_eval);

          const desc = side === "left"
            ? o.letters.toReversed().join("/")
            : o.letters.join("/");

          return [{
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["mishearing"],
            offset: [0], // cannot retrieve offset
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval)];
        }
      }

      return [];
    };

    const os = DiffEval.#data[this.locale].mishearings.matchFirst12,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];  
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  matchSecond12(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i];

      if (mismatch.char === o.letters[0]) {
        for (const constraint of o.constraints) switch (constraint) {
          case "tail": {
            if (mismatch.index === 0) return [];
            break;
          }

          default: throw new Err(`unknown constraint "${constraint}"`);
        }

        const match = _eval[side].matches
          .find(p => p.index === mismatch.index - 1
            && p.char === o.letters[1] [0]);

        if (match) {
          const eval2 = O.update({
            path: [side, "mismatches"],
            f: ys => ys.filter(p => p.index !== mismatch.index)
          }) (_eval);

          const desc = side === "left"
            ? o.letters.toReversed().join("/")
            : o.letters.join("/");

          return [{
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["mishearing"],
            offset: [0], // cannot retrieve offset
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval)];
        }
      }

      return [];
    };

    const os = DiffEval.#data[this.locale].mishearings.matchSecond12,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  mismatch12(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i],
        side2 = ({left: "right", right: "left"}) [side],
        xs = [];

      if (mismatch.char === o.letters[0]) {
        const mismatches2 = _eval[side2].mismatches
          .filter((p, i2) => p.char === o.letters[1] [0]
            && _eval[side2].mismatches[i2 + 1]?.char === o.letters[1] [1]);

        for (const mismatch2 of mismatches2) {
          for (const constraint of o.constraints) switch (constraint) {
            case "last": {
              if (_eval[side].str.length - mismatch.index - 1 > 1) return [];
              else if (_eval[side2].str.length - mismatch2.index - 1 > 1) return [];
              break;
            }

            case "noFlip": {
              if (side !== "right") return [];
              break;
            }

            case "tail": {
              if (mismatch.index === 0 || mismatch2.index === 0) return [];
              break;
            }

            default: throw new Err(`unknown constraint "${constraint}"`);
          }

          const mismatch3 = _eval[side2].mismatches
            .find(p => p.index === mismatch2.index + 1);

          const eval2 = comp(O.update({
            path: [side, "mismatches"],
            f: ys => ys.filter(p => p.index !== mismatch.index)
          })) (O.update({
            path: [side2, "mismatches"],
            f: ys => ys.filter(p =>
              p.index !== mismatch2.index
                && p.index !== mismatch3.index)
          })) (_eval);

          const desc = side === "left"
            ? o.letters.join("/")
            : o.letters.toReversed().join("/");

          const offset = side === "left"
            ? mismatch.index - mismatch2.index
            : mismatch2.index - mismatch.index;

          xs.push({
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["mishearing"],
            offset: [offset],
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval));
        }
      }

      return xs;
    };

    const os = DiffEval.#data[this.locale].mishearings.mismatch12,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  matchFirst22(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i],
        side2 = ({left: "right", right: "left"}) [side],
        xs = [];

      const match = _eval[side].matches
        .find(p => p.index === mismatch.index - 1);

      if (!match) return [];

      else if (match.char + mismatch.char === o.letters[0]) {
        const mismatches2 = _eval[side2].mismatches
          .filter(p => p.char === o.letters[1] [1]);

        for (const mismatch2 of mismatches2) {
          const match2 = _eval[side2].matches
            .find(p => p.index === mismatch2.index - 1
              && p.char === o.letters[1] [0]);

          if (match2) {
            const eval2 = comp(O.update({
              path: [side, "mismatches"],
              f: ys => ys.filter(p => p.index !== mismatch.index)
            })) (O.update({
              path: [side2, "mismatches"],
              f: ys => ys.filter(p => p.index !== mismatch2.index)
            })) (_eval);

            const desc = side === "left"
              ? o.letters.join("/")
              : o.letters.toReversed().join("/");

            const offset = side === "left"
              ? mismatch.index - mismatch2.index
              : mismatch2.index - mismatch.index;

            return [{
              [$]: "S.Diff.Eval",
              [$$]: "S.Diff.Eval",
              desc: [desc],
              reason: ["mishearing"],
              offset: [offset],
              penalty: [1],
              left: eval2.left,
              right: eval2.right,
            }, this.#empty(_eval)];
          }
        }
      }

      return [];
    };

    const os = DiffEval.#data[this.locale].mishearings.matchFirst22,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  matchSecond22(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i],
        side2 = ({left: "right", right: "left"}) [side],
        xs = [];

      const match = _eval[side].matches
        .find(p => p.index === mismatch.index + 1);

      if (!match) return [];

      else if (mismatch.char + match.char === o.letters[0]) {
        const mismatches2 = _eval[side2].mismatches
          .filter(p => p.char === o.letters[1] [0]);

        for (const mismatch2 of mismatches2) {
          const match2 = _eval[side2].matches
            .find(p => p.index === mismatch2.index + 1
              && p.char === o.letters[1] [1]);

          if (match2) {
            const eval2 = comp(O.update({
              path: [side, "mismatches"],
              f: ys => ys.filter(p => p.index !== mismatch.index)
            })) (O.update({
              path: [side2, "mismatches"],
              f: ys => ys.filter(p => p.index !== mismatch2.index)
            })) (_eval);

            const desc = side === "left"
              ? o.letters.join("/")
              : o.letters.toReversed().join("/");

            const offset = side === "left"
              ? mismatch.index - mismatch2.index
              : mismatch2.index - mismatch.index;

            return [{
              [$]: "S.Diff.Eval",
              [$$]: "S.Diff.Eval",
              desc: [desc],
              reason: ["mishearing"],
              offset: [offset],
              penalty: [1],
              left: eval2.left,
              right: eval2.right,
            }, this.#empty(_eval)];
          }
        }
      }

      return [];
    };

    const os = DiffEval.#data[this.locale].mishearings.matchSecond22,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  mismatch22(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i],
        side2 = ({left: "right", right: "left"}) [side],
        xs = [];

      const mismatch2 = _eval[side].mismatches[i + 1];

      if (!mismatch2) return [];

      else if (mismatch.char + mismatch2.char === o.letters[0]) {
        const mismatches3 = _eval[side2].mismatches
          .filter((p, i2) => p.char === o.letters[1] [0]
            && _eval[side2].mismatches[i2 + 1]?.char === o.letters[1] [1]);

        for (const mismatch3 of mismatches3) {
          const mismatch4 = _eval[side2].mismatches
            .find(p => p.index === mismatch3.index + 1);

          const eval2 = comp(O.update({
            path: [side, "mismatches"],
            f: ys => ys.filter(p =>
              p.index !== mismatch.index
                && p.index !== mismatch2.index)
          })) (O.update({
            path: [side2, "mismatches"],
            f: ys => ys.filter(p =>
              p.index !== mismatch3.index
                && p.index !== mismatch4.index)
          })) (_eval);

          const desc = side === "left"
            ? o.letters.join("/")
            : o.letters.toReversed().join("/");

          const offset = side === "left"
            ? mismatch.index - mismatch3.index
            : mismatch3.index - mismatch.index;

          xs.push({
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["mishearing"],
            offset: [offset],
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval));
        }
      }

      return xs;
    };

    const os = DiffEval.#data[this.locale].mishearings.mismatch22,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  mismatch13(_eval) {
    const pick = (o, side, i) => {
      const mismatch = _eval[side].mismatches[i],
        side2 = ({left: "right", right: "left"}) [side],
        xs = [];

      if (mismatch.char === o.letters[0]) {
        const mismatches2 = _eval[side2].mismatches
          .filter((p, i2) => p.char === o.letters[1] [0]
            && _eval[side2].mismatches[i2 + 1]?.char === o.letters[1] [1]
            && _eval[side2].mismatches[i2 + 2]?.char === o.letters[1] [2]);

        for (const mismatch2 of mismatches2) {
          const mismatch3 = _eval[side2].mismatches
            .find(p => p.index === mismatch2.index + 1);

          const mismatch4 = _eval[side2].mismatches
            .find(p => p.index === mismatch2.index + 2);

          const eval2 = comp(O.update({
            path: [side, "mismatches"],
            f: ys => ys.filter(p => p.index !== mismatch.index)
          })) (O.update({
            path: [side2, "mismatches"],
            f: ys => ys.filter(p =>
              p.index !== mismatch2.index
                && p.index !== mismatch3.index
                && p.index !== mismatch4.index)
          })) (_eval);

          const desc = side === "left"
            ? o.letters.join("/")
            : o.letters.toReversed().join("/");

          const offset = side === "left"
            ? mismatch.index - mismatch2.index
            : mismatch2.index - mismatch.index;

          xs.push({
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["mishearing"],
            offset: [offset],
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval));
        }
      }

      return xs;
    };

    const os = DiffEval.#data[this.locale].mishearings.mismatch13,
      candidates = [];

    for (const o of os) {
      for (let i = 0; i < _eval.left.mismatches.length; i++)
        candidates.push(...pick(o, "left", i));

      for (let i = 0; i < _eval.right.mismatches.length; i++)
        candidates.push(...pick(o, "right", i));
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  misreading(_eval) {
    const candidates = [];

    for (const mismatch of _eval.left.mismatches) {
      if (DiffEval.#data[this.locale].misreadings.has(mismatch.char)) {
        const xs = DiffEval.#data[this.locale].misreadings.get(mismatch.char);

        for (const mismatch2 of _eval.right.mismatches) {
          if (xs.includes(mismatch2.char)) {
            const eval2 = comp(O.update({
              path: ["left", "mismatches"],
              f: ys => ys.filter(o => o.index !== mismatch.index)
            })) (O.update({
              path: ["right", "mismatches"],
              f: ys => ys.filter(o => o.index !== mismatch2.index)
            })) (_eval);

            candidates.push({
              [$]: "S.Diff.Eval",
              [$$]: "S.Diff.Eval",
              desc: [`${mismatch.char}/${mismatch2.char}`],
              reason: ["misreading"],
              offset: [mismatch.index - mismatch2.index],
              penalty: [1],
              left: eval2.left,
              right: eval2.right,
            }, this.#empty(_eval));
          }
        }
      }
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  transposition(_eval) {
    const candidates = [];

    for (const mismatch of _eval.left.mismatches) {
      for (const mismatch2 of _eval.right.mismatches) {
        if (mismatch.char === mismatch2.char) {
          let offset = 0;

          const matchLeftBefore = _eval.left.matches
            .find(o => o.index === mismatch.index - 1);

          const matchLeftAfter = _eval.left.matches
            .find(o => o.index === mismatch.index + 1);

          const matchRightBefore = _eval.right.matches
            .find(o => o.index === mismatch2.index - 1);

          const matchRightAfter = _eval.right.matches
            .find(o => o.index === mismatch2.index + 1);

          if (matchLeftBefore
            && matchRightAfter
            && matchLeftBefore.char === matchRightAfter.char)
              offset = -1;

          else if (matchLeftAfter
            && matchRightBefore
            && matchLeftAfter.char === matchRightBefore.char)
              offset = 1;

          else continue;

          const eval2 = comp(O.update({
            path: ["left", "mismatches"],
            f: ys => ys.filter(o => o.index !== mismatch.index)
          })) (O.update({
            path: ["right", "mismatches"],
            f: ys => ys.filter(o => o.index !== mismatch2.index)
          })) (_eval);

          const match2 = _eval.left.matches
            .find(o => o.index === mismatch.index + offset);

          const desc = offset < 0
            ? `${matchLeftBefore.char}${mismatch.char}/${mismatch.char}${matchRightAfter.char}`
            : `${mismatch.char}${matchLeftAfter.char}/${matchRightBefore.char}${mismatch.char}`;

          candidates.push({
            [$]: "S.Diff.Eval",
            [$$]: "S.Diff.Eval",
            desc: [desc],
            reason: ["transposition"],
            offset: [mismatch.index - mismatch2.index + offset],
            penalty: [1],
            left: eval2.left,
            right: eval2.right,
          }, this.#empty(_eval));
        }
      }
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  repetition(_eval) {
    const candidates = [];

    for (const mismatch of _eval.left.mismatches) {
      const matches2 = _eval.right.matches.filter(o => {
        if (o.char === mismatch.char) {
          const match = _eval.left.matches.find(p => p.index === mismatch.index - 1);
          return match && match.char === mismatch.char;
        }

        else return false;
      });

      for (const match2 of matches2) {
        const eval2 = O.update({
          path: ["left", "mismatches"],
          f: ys => ys.filter(o => o.index !== mismatch.index)
        }) (_eval);

        candidates.push({
          [$]: "S.Diff.Eval",
          [$$]: "S.Diff.Eval",
          desc: [`${mismatch.char.repeat(2)}/${match2.char}`],
          reason: ["repetition"],
          offset: [mismatch.index - match2.index - 1],
          penalty: [1],
          left: eval2.left,
          right: eval2.right,
        }, this.#empty(_eval));
      }
    }

    for (const mismatch of _eval.right.mismatches) {
      const matches2 = _eval.left.matches.filter(o => {
        if (o.char === mismatch.char) {
          const match = _eval.right.matches.find(p => p.index === mismatch.index - 1);
          return match && match.char === mismatch.char;
        }

        else return false;
      });

      for (const match2 of matches2) {
        const eval2 = O.update({
          path: ["right", "mismatches"],
          f: ys => ys.filter(o => o.index !== mismatch.index)
        }) (_eval);

        candidates.push({
          [$]: "S.Diff.Eval",
          [$$]: "S.Diff.Eval",
          desc: [`${match2.char}/${mismatch.char.repeat(2)}`],
          reason: ["repetition"],
          offset: [match2.index - mismatch.index + 1],
          penalty: [1],
          left: eval2.left,
          right: eval2.right,
        }, this.#empty(_eval));
      }
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  modifier(_eval) {
    const candidates = [];

    for (const mismatch of _eval.left.mismatches) {
      for (const mismatch2 of _eval.right.mismatches) {
        if (S.Norm.modifier.has(mismatch.char)) {
          const c = S.Norm.modifier.get(mismatch.char);

          if (mismatch2.char === c) {
            const eval2 = comp(O.update({
              path: ["left", "mismatches"],
              f: ys => ys.filter(o => o.index !== mismatch.index)
            })) (O.update({
              path: ["right", "mismatches"],
              f: ys => ys.filter(o => o.index !== mismatch2.index)
            })) (_eval);

            candidates.push({
              [$]: "S.Diff.Eval",
              [$$]: "S.Diff.Eval",
              desc: [`${mismatch.char}/${mismatch2.char}`],
              reason: ["modifier"],
              offset: [mismatch.index - mismatch2.index],
              penalty: [1],
              left: eval2.left,
              right: eval2.right,
            }, this.#empty(_eval));
          }
        }

        else if (S.Norm.modifier.has(mismatch2.char)) {
          const c = S.Norm.modifier.get(mismatch2.char);

          if (mismatch.char === c) {
            const eval2 = comp(O.update({
              path: ["left", "mismatches"],
              f: ys => ys.filter(o => o.index !== mismatch.index)
            })) (O.update({
              path: ["right", "mismatches"],
              f: ys => ys.filter(o => o.index !== mismatch2.index)
            })) (_eval);

            candidates.push({
              [$]: "S.Diff.Eval",
              [$$]: "S.Diff.Eval",
              desc: [`${mismatch.char}/${mismatch2.char}`],
              reason: ["modifier"],
              offset: [mismatch.index - mismatch2.index],
              penalty: [1],
              left: eval2.left,
              right: eval2.right,
            }, this.#empty(_eval));
          }
        }
      }
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  };


  // S.Diff.Eval => [S.Diff.Eval]
  equivalence(_eval) {
    const candidates = [];

    for (const [k, v] of DiffEval.#data[this.locale].equivalences) {
      for (let i = 0; i < _eval.left.mismatches.length; i++) {
        const mismatch = _eval.left.mismatches[i];

        for (let j = 0; j < _eval.right.mismatches.length; j++) {
          const mismatch2 = _eval.right.mismatches[j];

          if (k.length === 1) {
            if (mismatch.char === k) {
              if (v.length === 2) {
                const s = mismatch2.char + _eval.right.mismatches[j + 1]?.char;

                if (s === v) {
                  const eval2 = comp(O.update({
                    path: ["left", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch.index)
                  })) (O.update({
                    path: ["right", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch2.index
                      && o.index !== mismatch2.index + 1)
                  })) (_eval);

                  candidates.push({
                    [$]: "S.Diff.Eval",
                    [$$]: "S.Diff.Eval",
                    desc: [`${mismatch.char}/${s}`],
                    reason: ["equivalence"],
                    offset: [mismatch.index - mismatch2.index],
                    penalty: [1],
                    left: eval2.left,
                    right: eval2.right,
                  }, this.#empty(_eval));
                }
              }

              else if (v.length === 3) {
                const s = mismatch2.char
                  + _eval.right.mismatches[j + 1]?.char
                  + _eval.right.mismatches[j + 2]?.char;

                if (s === v) {
                  const eval2 = comp(O.update({
                    path: ["left", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch.index)
                  })) (O.update({
                    path: ["right", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch2.index
                      && o.index !== mismatch2.index + 1
                      && o.index !== mismatch2.index + 2)
                  })) (_eval);

                  candidates.push({
                    [$]: "S.Diff.Eval",
                    [$$]: "S.Diff.Eval",
                    desc: [`${mismatch.char}/${s}`],
                    reason: ["equivalence"],
                    offset: [mismatch.index - mismatch2.index],
                    penalty: [1],
                    left: eval2.left,
                    right: eval2.right,
                  }, this.#empty(_eval));
                }
              }

              else throw new Err("unexpected length");
            }
          }

          else if (k.length === 2) {
            const s = mismatch.char + _eval.left.mismatches[i + 1]?.char;

            if (s === k) {
              if (v.length === 1) {
                if (mismatch2.char === v) {
                  const eval2 = comp(O.update({
                    path: ["left", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch.index
                      && o.index !== mismatch.index + 1)
                  })) (O.update({
                    path: ["right", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch2.index)
                  })) (_eval);

                  candidates.push({
                    [$]: "S.Diff.Eval",
                    [$$]: "S.Diff.Eval",
                    desc: [`${s}/${mismatch2.char}`],
                    reason: ["equivalence"],
                    offset: [mismatch.index - mismatch2.index],
                    penalty: [1],
                    left: eval2.left,
                    right: eval2.right,
                  }, this.#empty(_eval));
                }
              }

              else throw new Err("unexpected length");
            }
          }

          else if (k.length === 3) {
            const s = mismatch.char
              + _eval.left.mismatches[i + 1]?.char
              + _eval.left.mismatches[i + 2]?.char;

            if (s === k) {
              if (v.length === 1) {
                if (mismatch2.char === v) {
                  const eval2 = comp(O.update({
                    path: ["left", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch.index
                      && o.index !== mismatch.index + 1
                      && o.index !== mismatch.index + 2)
                  })) (O.update({
                    path: ["right", "mismatches"],
                    f: ys => ys.filter(o => o.index !== mismatch2.index)
                  })) (_eval);

                  candidates.push({
                    [$]: "S.Diff.Eval",
                    [$$]: "S.Diff.Eval",
                    desc: [`${s}/${mismatch2.char}`],
                    reason: ["equivalence"],
                    offset: [mismatch.index - mismatch2.index],
                    penalty: [1],
                    left: eval2.left,
                    right: eval2.right,
                  }, this.#empty(_eval));
                }
              }

              else throw new Err("unexpected length");
            }
          }

          else throw new Err("unexpected length");
        }
      }
    }

    if (candidates.length === 0) return [this.#empty(_eval)];
    else return candidates;
  }
};


//█████ Normalizing ███████████████████████████████████████████████████████████


// normalize unicode characters


S.Norm = {};


S.Norm.fraction = new Map([
  ["½", "1/2"],
  ["⅓", "1/3"],
  ["⅔", "2/3"],
  ["¼", "1/4"],
  ["¾", "3/4"],
  ["⅕", "1/5"],
  ["⅖", "2/5"],
  ["⅗", "3/5"],
  ["⅘", "4/5"],
  ["⅙", "1/6"],
  ["⅚", "5/6"],
  ["⅐", "1/7"],
  ["⅛", "1/8"],
  ["⅜", "3/8"],
  ["⅝", "5/8"],
  ["⅞", "7/8"],
  ["⅑", "1/9"],
  ["⅒", "1/10"],
]);


S.Norm.modifier = new Map([
  ["Á", "A"], ["á", "a"], ["À", "A"], ["à", "a"], ["Â", "A"], ["â", "a"], ["Ǎ", "A"], ["ǎ", "a"], ["Ă", "A"],
  ["ă", "a"], ["Ã", "A"], ["ã", "a"], ["Ả", "A"], ["ả", "a"], ["Ȧ", "A"], ["ȧ", "a"], ["Ạ", "A"], ["ạ", "a"],
  ["Ä", "A"], ["ä", "a"], ["Å", "A"], ["å", "a"], ["Ḁ", "A"], ["ḁ", "a"], ["Ā", "A"], ["ā", "a"], ["Ą", "A"],
  ["ą", "a"], ["ᶏ", "a"], ["Ⱥ", "A"], ["ⱥ", "a"], ["Ȁ", "A"], ["ȁ", "a"], ["Ấ", "A"], ["ấ", "a"], ["Ầ", "A"],
  ["ầ", "a"], ["Ẫ", "A"], ["ẫ", "a"], ["Ẩ", "A"], ["ẩ", "a"], ["Ậ", "A"], ["ậ", "a"], ["Ắ", "A"], ["ắ", "a"],
  ["Ằ", "A"], ["ằ", "a"], ["Ẵ", "A"], ["ẵ", "a"], ["Ẳ", "A"], ["ẳ", "a"], ["Ặ", "A"], ["ặ", "a"], ["Ǻ", "A"],
  ["ǻ", "a"], ["Ǡ", "A"], ["ǡ", "a"], ["Ǟ", "A"], ["ǟ", "a"], ["Ȃ", "A"], ["ȃ", "a"], ["Ɑ", "A"], ["ɑ", "a"],
  ["ᴀ", "A"], ["Ɐ", "A"], ["ɐ", "a"], ["ɒ", "a"], ["Ａ", "A"], ["ａ", "a"], ["Ḃ", "B"], ["ḃ", "b"], ["Ḅ", "B"],
  ["ḅ", "b"], ["Ḇ", "B"], ["ḇ", "b"], ["Ƀ", "B"], ["ƀ", "b"], ["Ɓ", "B"], ["ɓ", "b"], ["Ƃ", "b"], ["ƃ", "b"],
  ["ᵬ", "b"], ["ᶀ", "b"], ["ʙ", "B"], ["Ｂ", "B"], ["ｂ", "b"], ["Ć", "C"], ["ć", "c"], ["Ĉ", "C"], ["ĉ", "c"],
  ["Č", "C"], ["č", "c"], ["Ċ", "C"], ["ċ", "c"], ["C̄", "C"], ["c̄", "c"], ["Ç", "C"], ["ç", "c"], ["Ḉ", "C"],
  ["ḉ", "c"], ["Ȼ", "C"], ["ȼ", "c"], ["Ƈ", "C"], ["ƈ", "c"], ["ɕ", "c"], ["ᴄ", "c"], ["Ｃ", "C"], ["ｃ", "c"],
  ["Ď", "D"], ["ď", "d"], ["Ḋ", "D"], ["ḋ", "d"], ["Ḑ", "D"], ["ḑ", "d"], ["D̦", "D"], ["d̦", "d"], ["Ḍ", "D"],
  ["ḍ", "d"], ["Ḓ", "D"], ["ḓ", "d"], ["Ḏ", "D"], ["ḏ", "d"], ["Đ", "D"], ["đ", "d"], ["Ð", "D"], ["ð", "d"],
  ["D̦", "D"], ["d̦", "d"], ["Ɖ", "D"], ["ɖ", "d"], ["Ɗ", "D"], ["ɗ", "d"], ["Ƌ", "D"], ["ƌ", "d"], ["ᵭ", "d"],
  ["ᶁ", "d"], ["ᶑ", "d"], ["ȡ", "d"], ["ᴅ", "D"], ["Ｄ", "D"], ["ｄ", "d"], ["Þ", "D"], ["þ", "d"], ["É", "E"],
  ["é", "e"], ["È", "E"], ["è", "e"], ["Ê", "E"], ["ê", "e"], ["Ḙ", "E"], ["ḙ", "e"], ["Ě", "E"], ["ě", "e"],
  ["Ĕ", "E"], ["ĕ", "e"], ["Ẽ", "E"], ["ẽ", "e"], ["Ḛ", "E"], ["ḛ", "e"], ["Ẻ", "E"], ["ẻ", "e"], ["Ė", "E"],
  ["ė", "e"], ["Ë", "E"], ["ë", "e"], ["Ē", "E"], ["ē", "e"], ["Ȩ", "E"], ["ȩ", "e"], ["Ę", "E"], ["ę", "e"],
  ["ᶒ", "e"], ["Ɇ", "E"], ["ɇ", "e"], ["Ȅ", "E"], ["ȅ", "e"], ["Ế", "E"], ["ế", "e"], ["Ề", "E"], ["ề", "e"],
  ["Ễ", "E"], ["ễ", "e"], ["Ể", "E"], ["ể", "e"], ["Ḝ", "E"], ["ḝ", "e"], ["Ḗ", "E"], ["ḗ", "e"], ["Ḕ", "E"],
  ["ḕ", "e"], ["Ȇ", "E"], ["ȇ", "e"], ["Ẹ", "E"], ["ẹ", "e"], ["Ệ", "E"], ["ệ", "e"], ["ⱸ", "e"], ["ᴇ", "E"],
  ["Ə", "e"], ["ə", "e"], ["Ǝ", "E"], ["ǝ", "e"], ["Ɛ", "E"], ["ɛ", "e"], ["Ｅ", "E"], ["ｅ", "e"], ["Ḟ", "F"],
  ["ḟ", "f"], ["Ƒ", "F"], ["ƒ", "f"], ["ᵮ", "f"], ["ᶂ", "f"], ["ꜰ", "F"], ["Ｆ", "F"], ["ｆ", "f"], ["Ǵ", "G"],
  ["ǵ", "g"], ["Ğ", "G"], ["ğ", "g"], ["Ĝ", "G"], ["ĝ", "g"], ["Ǧ", "G"], ["ǧ", "g"], ["Ġ", "G"], ["ġ", "g"],
  ["Ģ", "G"], ["ģ", "g"], ["Ḡ", "G"], ["ḡ", "g"], ["Ǥ", "G"], ["ǥ", "g"], ["Ɠ", "G"], ["ɠ", "g"], ["ᶃ", "g"],
  ["ɢ", "G"], ["Ȝ", "G"], ["ȝ", "g"], ["Ｇ", "G"], ["ｇ", "g"], ["ɢ", "G"], ["ɢ̆", "G"], ["Ĥ", "H"], ["ĥ", "h"],
  ["Ȟ", "H"], ["ȟ", "h"], ["Ḧ", "H"], ["ḧ", "h"], ["Ḣ", "H"], ["ḣ", "h"], ["Ḩ", "H"], ["ḩ", "h"], ["Ḥ", "H"],
  ["ḥ", "h"], ["Ḫ", "H"], ["ḫ", "h"], ["H̱", "H"], ["ẖ", "h"], ["Ħ", "H"], ["ħ", "h"], ["Ⱨ", "H"], ["ⱨ", "h"],
  ["Ɦ", "H"], ["ɦ", "h"], ["Ꜧ", "H"], ["ꜧ", "h"], ["ʰ", "h"], ["ʜ", "H"], ["Ｈ", "H"], ["ｈ", "h"], ["h̃", "h"],
  ["ɧ", "h"], ["Í", "I"], ["í", "i"], ["Ì", "I"], ["ì", "i"], ["Ĭ", "I"], ["ĭ", "i"], ["Î", "I"], ["î", "i"],
  ["Ǐ", "I"], ["ǐ", "i"], ["Ï", "I"], ["ï", "i"], ["Ḯ", "I"], ["ḯ", "i"], ["Ĩ", "I"], ["ĩ", "i"], ["Į", "I"],
  ["į", "i"], ["Ī", "I"], ["ī", "i"], ["Ỉ", "I"], ["ỉ", "i"], ["Ȉ", "I"], ["ȉ", "i"], ["Ȋ", "I"], ["ȋ", "i"],
  ["Ị", "I"], ["ị", "i"], ["Ḭ", "I"], ["ḭ", "i"], ["Ɨ", "I"], ["ɨ", "i"], ["ᵻ", "I"], ["ᶖ", "i"], ["İ", "I"],
  ["i", "i"], ["I", "I"], ["ı", "i"], ["ɪ", "I"], ["Ɩ", "I"], ["ɩ", "i"], ["Ｉ", "I"], ["ｉ", "i"], ["Ĵ", "J"],
  ["ĵ", "j"], ["Ɉ", "J"], ["ɉ", "j"], ["J̌", "J"], ["ǰ", "j"], ["ȷ", "J"], ["ʝ", "j"], ["ɟ", "j"], ["ʄ", "j"],
  ["ᴊ", "J"], ["Ｊ", "J"], ["ｊ", "j"], ["ʲ", "j"], ["j̃", "j"], ["Ḱ", "K"], ["ḱ", "k"], ["Ǩ", "K"], ["ǩ", "k"],
  ["Ķ", "K"], ["ķ", "k"], ["Ḳ", "K"], ["ḳ", "k"], ["Ḵ", "K"], ["ḵ", "k"], ["Ƙ", "K"], ["ƙ", "k"], ["Ⱪ", "K"],
  ["ⱪ", "k"], ["ᶄ", "k"], ["Ꝁ", "K"], ["ꝁ", "k"], ["ᴋ", "K"], ["Ｋ", "K"], ["ｋ", "k"], ["Ĺ", "L"], ["ĺ", "l"],
  ["Ľ", "L"], ["ľ", "l"], ["Ļ", "L"], ["ļ", "l"], ["Ḷ", "L"], ["ḷ", "l"], ["Ḹ", "L"], ["ḹ", "l"], ["Ḽ", "L"],
  ["ḽ", "l"], ["Ḻ", "L"], ["ḻ", "l"], ["Ł", "L"], ["ł", "l"], ["Ŀ", "L"], ["ŀ", "l"], ["Ƚ", "L"], ["ƚ", "l"],
  ["Ⱡ", "L"], ["ⱡ", "l"], ["Ɫ", "L"], ["ɫ", "l"], ["ɬ", "l"], ["ᶅ", "l"], ["ɭ", "l"], ["ȴ", "l"], ["ʟ", "L"],
  ["Ｌ", "L"], ["ｌ", "l"], ["Ḿ", "M"], ["ḿ", "m"], ["Ṁ", "M"], ["ṁ", "m"], ["Ṃ", "M"], ["ṃ", "m"], ["ᵯ", "m"],
  ["ᶆ", "m"], ["Ɱ", "M"], ["ɱ", "m"], ["ᴍ", "M"], ["Ｍ", "M"], ["ｍ", "m"], ["Ń", "N"], ["ń", "n"], ["Ǹ", "N"],
  ["ǹ", "n"], ["Ň", "N"], ["ň", "n"], ["Ñ", "N"], ["ñ", "n"], ["Ṅ", "N"], ["ṅ", "n"], ["Ņ", "N"], ["ņ", "n"],
  ["Ṇ", "N"], ["ṇ", "n"], ["Ṋ", "N"], ["ṋ", "n"], ["Ṉ", "N"], ["ṉ", "n"], ["N̈", "N"], ["n̈", "n"], ["Ɲ", "N"],
  ["ɲ", "n"], ["Ƞ", "N"], ["ƞ", "n"], ["ᵰ", "n"], ["ᶇ", "n"], ["ɳ", "n"], ["ȵ", "n"], ["ɴ", "N"], ["Ｎ", "N"],
  ["ｎ", "n"], ["Ŋ", "N"], ["ŋ", "n"], ["Ó", "O"], ["ó", "o"], ["Ò", "O"], ["ò", "o"], ["Ŏ", "O"], ["ŏ", "o"],
  ["Ô", "O"], ["ô", "o"], ["Ố", "O"], ["ố", "o"], ["Ồ", "O"], ["ồ", "o"], ["Ỗ", "O"], ["ỗ", "o"], ["Ổ", "O"],
  ["ổ", "o"], ["Ǒ", "O"], ["ǒ", "o"], ["Ö", "O"], ["ö", "o"], ["Ȫ", "O"], ["ȫ", "o"], ["Ő", "O"], ["ő", "o"],
  ["Õ", "O"], ["õ", "o"], ["Ṍ", "O"], ["ṍ", "o"], ["Ṏ", "O"], ["ṏ", "o"], ["Ȭ", "O"], ["ȭ", "o"], ["Ȯ", "O"],
  ["ȯ", "o"], ["Ȱ", "O"], ["ȱ", "o"], ["Ø", "O"], ["ø", "o"], ["Ǿ", "O"], ["ǿ", "o"], ["Ǫ", "O"], ["ǫ", "o"],
  ["Ǭ", "O"], ["ǭ", "o"], ["Ō", "O"], ["ō", "o"], ["Ṓ", "O"], ["ṓ", "o"], ["Ṑ", "O"], ["ṑ", "o"], ["Ỏ", "O"],
  ["ỏ", "o"], ["Ȍ", "O"], ["ȍ", "o"], ["Ȏ", "O"], ["ȏ", "o"], ["Ơ", "O"], ["ơ", "o"], ["Ớ", "O"], ["ớ", "o"],
  ["Ờ", "O"], ["ờ", "o"], ["Ỡ", "O"], ["ỡ", "o"], ["Ở", "O"], ["ở", "o"], ["Ợ", "O"], ["ợ", "o"], ["Ọ", "O"],
  ["ọ", "o"], ["Ộ", "O"], ["ộ", "o"], ["Ɵ", "O"], ["ɵ", "o"], ["Ɔ", "O"], ["ɔ", "o"], ["Ȣ", "O"], ["ȣ", "o"],
  ["ⱺ", "O"], ["ᴏ", "o"], ["Ｏ", "O"], ["ｏ", "o"], ["Ṕ", "P"], ["ṕ", "p"], ["Ṗ", "P"], ["ṗ", "p"], ["Ᵽ", "P"],
  ["ᵽ", "p"], ["Ƥ", "P"], ["ƥ", "p"], ["P̃", "P"], ["p̃", "p"], ["ᵱ", "p"], ["ᶈ", "p"], ["ᴘ", "P"], ["Ƿ", "P"],
  ["ƿ", "p"], ["Ｐ", "P"], ["ｐ", "p"], ["Ɋ", "q"], ["ɋ", "q"], ["Ƣ", "Q"], ["ƣ", "q"], ["ʠ", "q"], ["Ｑ", "Q"],
  ["ｑ", "q"], ["ꞯ", "Q"], ["Ŕ", "R"], ["ŕ", "r"], ["Ř", "R"], ["ř", "r"], ["Ṙ", "R"], ["ṙ", "r"], ["Ŗ", "R"],
  ["ŗ", "r"], ["Ȑ", "R"], ["ȑ", "r"], ["Ȓ", "R"], ["ȓ", "r"], ["Ṛ", "R"], ["ṛ", "r"], ["Ṝ", "R"], ["ṝ", "r"],
  ["Ṟ", "R"], ["ṟ", "r"], ["Ɍ", "R"], ["ɍ", "r"], ["Ɽ", "R"], ["ɽ", "r"], ["Ꝛ", "R"], ["ꝛ", "r"], ["ᵲ", "r"],
  ["ᶉ", "r"], ["ɼ", "r"], ["ɾ", "r"], ["ᵳ", "r"], ["ʀ", "R"], ["Ｒ", "R"], ["ｒ", "r"], ["ɹ", "r"], ["ʁ", "R"],
  ["ſ", "s"], ["ẞ", "S"], ["ß", "s"], ["Ś", "S"], ["ś", "s"], ["Ṥ", "S"], ["ṥ", "s"], ["Ŝ", "S"], ["ŝ", "s"],
  ["Š", "S"], ["š", "s"], ["Ṧ", "S"], ["ṧ", "s"], ["Ṡ", "S"], ["ṡ", "s"], ["ẛ", "s"], ["Ş", "S"], ["ş", "s"],
  ["Ṣ", "S"], ["ṣ", "s"], ["Ṩ", "S"], ["ṩ", "s"], ["Ș", "S"], ["ș", "s"], ["S̩", "S"], ["s̩", "s"], ["ᵴ", "s"],
  ["ᶊ", "s"], ["Ʂ", "S"], ["ʂ", "s"], ["Ȿ", "S"], ["ȿ", "s"], ["ꜱ", "s"], ["Ʃ", "S"], ["ʃ", "s"], ["Ｓ", "S"],
  ["ｓ", "s"], ["Ť", "T"], ["ť", "t"], ["Ṫ", "T"], ["ṫ", "t"], ["Ţ", "T"], ["ţ", "t"], ["Ṭ", "T"], ["ṭ", "t"],
  ["Ț", "T"], ["ț", "t"], ["Ṱ", "T"], ["ṱ", "t"], ["Ṯ", "T"], ["ṯ", "t"], ["Ŧ", "T"], ["ŧ", "t"], ["Ⱦ", "T"],
  ["ⱦ", "t"], ["Ƭ", "T"], ["ƭ", "t"], ["Ʈ", "T"], ["ʈ", "t"], ["T̈", "T"], ["ẗ", "t"], ["ᵵ", "t"], ["ƫ", "t"],
  ["ȶ", "t"], ["ᴛ", "T"], ["Ｔ", "T"], ["ｔ", "t"], ["Ú", "U"], ["ú", "u"], ["Ù", "U"], ["ù", "u"], ["Ŭ", "U"],
  ["ŭ", "u"], ["Û", "U"], ["û", "u"], ["Ǔ", "U"], ["ǔ", "u"], ["Ů", "U"], ["ů", "u"], ["Ü", "U"], ["ü", "u"],
  ["Ǘ", "U"], ["ǘ", "u"], ["Ǜ", "U"], ["ǜ", "u"], ["Ǚ", "U"], ["ǚ", "u"], ["Ǖ", "U"], ["ǖ", "u"], ["Ű", "U"],
  ["ű", "u"], ["Ũ", "U"], ["ũ", "u"], ["Ṹ", "U"], ["ṹ", "u"], ["Ų", "U"], ["ų", "u"], ["Ū", "U"], ["ū", "u"],
  ["Ṻ", "U"], ["ṻ", "u"], ["Ủ", "U"], ["ủ", "u"], ["Ȕ", "U"], ["ȕ", "u"], ["Ȗ", "U"], ["ȗ", "u"], ["Ư", "U"],
  ["ư", "u"], ["Ứ", "U"], ["ứ", "u"], ["Ừ", "U"], ["ừ", "u"], ["Ữ", "U"], ["ữ", "u"], ["Ử", "U"], ["ử", "u"],
  ["Ự", "U"], ["ự", "u"], ["Ụ", "U"], ["ụ", "u"], ["Ṳ", "U"], ["ṳ", "u"], ["Ṷ", "U"], ["ṷ", "u"], ["Ṵ", "U"],
  ["ṵ", "u"], ["Ʉ", "U"], ["ʉ", "u"], ["Ʊ", "U"], ["ʊ", "u"], ["Ȣ", "U"], ["ȣ", "u"], ["ᵾ", "U"], ["ᶙ", "u"],
  ["ᴜ", "u"], ["Ｕ", "U"], ["ｕ", "u"], ["ɯ", "u"], ["Ṽ", "V"], ["ṽ", "v"], ["Ṿ", "V"], ["ṿ", "v"], ["Ʋ", "V"],
  ["ʋ", "v"], ["ᶌ", "v"], ["ⱱ", "v"], ["ⱴ", "v"], ["ᴠ", "v"], ["Ʌ", "V"], ["ʌ", "v"], ["Ｖ", "V"], ["ｖ", "v"],
  ["Ẃ", "W"], ["ẃ", "w"], ["Ẁ", "W"], ["ẁ", "w"], ["Ŵ", "W"], ["ŵ", "w"], ["Ẅ", "W"], ["ẅ", "w"], ["Ẇ", "W"],
  ["ẇ", "w"], ["Ẉ", "W"], ["ẉ", "w"], ["W̊", "W"], ["ẘ", "w"], ["Ⱳ", "W"], ["ⱳ", "w"], ["ᴡ", "w"], ["Ｗ", "W"],
  ["ｗ", "w"], ["ʷ", "w"], ["ʍ", "w"], ["w̃", "w"], ["Ẍ", "X"], ["ẍ", "x"], ["Ẋ", "X"], ["ẋ", "x"], ["ᶍ", "x"],
  ["Ｘ", "X"], ["ｘ", "x"], ["Ý", "Y"], ["ý", "y"], ["Ỳ", "Y"], ["ỳ", "y"], ["Ŷ", "Y"], ["ŷ", "y"], ["ẙ", "y"],
  ["Ÿ", "Y"], ["ÿ", "y"], ["Ỹ", "Y"], ["ỹ", "y"], ["Ẏ", "Y"], ["ẏ", "y"], ["Ȳ", "Y"], ["ȳ", "y"], ["Ỷ", "Y"],
  ["ỷ", "y"], ["Ỵ", "Y"], ["ỵ", "y"], ["Ɏ", "Y"], ["ɏ", "y"], ["Ƴ", "Y"], ["ƴ", "y"], ["ʏ", "Y"], ["Ｙ", "Y"],
  ["ｙ", "y"], ["Ź", "Z"], ["ź", "z"], ["Ẑ", "Z"], ["ẑ", "z"], ["Ž", "Z"], ["ž", "z"], ["Ż", "Z"], ["ż", "z"],
  ["Ẓ", "Z"], ["ẓ", "z"], ["Ẕ", "Z"], ["ẕ", "z"], ["Ƶ", "Z"], ["ƶ", "z"], ["Ȥ", "Z"], ["ȥ", "z"], ["Ⱬ", "Z"],
  ["ⱬ", "z"], ["ᵶ", "z"], ["ᶎ", "z"], ["ʐ", "z"], ["ʑ", "z"], ["ɀ", "z"], ["ᴢ", "z"], ["Ʒ", "Z"], ["ʒ", "z"],
  ["Ǯ", "Z"], ["ǯ", "z"], ["Ƹ", "Z"], ["ƹ", "z"], ["Ｚ", "Z"], ["ｚ", "z"],
]);


S.Norm.equivalence = new Map([
  ["ä", "ae"], ["ü", "ue"], ["ö", "oe"], ["ß", "ss"], ["Æ", "Ae"],
  ["æ", "ae"], ["ᴭ", "Ae"], ["ᵆ", "ae"], ["Ǽ", "Ae"], ["ǽ", "ae"],
  ["Ǣ", "Ae"], ["ǣ", "ae"], ["ᴁ", "Ae"], ["ᴂ", "ae"], ["ȸ", "db"],
  ["Ǳ", "Dz"], ["ǲ", "Dz"], ["ǳ", "dz"], ["Ǆ", "Dz"], ["ǅ", "Dz"],
  ["ǆ", "dz"], ["ﬀ", "ff"], ["ﬃ", "ffi"], ["ﬄ", "ffl"], ["ﬁ", "fi"],
  ["ﬂ", "fl"], ["Ĳ", "Ij"], ["ĳ", "ij"], ["Ǉ", "Lj"], ["ǈ", "Lj"],
  ["ǉ", "lj"], ["Ǌ", "Nj"], ["ǋ", "Nj"], ["ǌ", "nj"], ["Œ", "Oe"],
  ["œ", "oe"], ["ȹ", "qp"], ["ᵫ", "ue"],
]);


S.Norm.latinise = ({inclAlpha}) => doc => {
  let s = "";

  for (const c of doc) {

    // control

    if (/\p{C}/v.test(c)) {
      if (c === "\n") s += c;
      else s += " ";
    }

    // letter

    else if (/\p{L}/v.test(c)) {
      if (c.codePointAt(0) <= 127) s += c;
      else if (c === "ʼ") s += "'";
      else if (c === "ʻ") s += "'";
      else if (c === "ˮ") s += "'";
      
      else if (inclAlpha) {
        if (S.Norm.modifier.has(c)) s += S.Norm.modifier.get(c);
        else if (S.Norm.equivalence.has(c)) s += S.Norm.equivalence.get(c);
      }

      else s += c;
    }

    // mark

    else if (/\p{M}/v.test(c)) s += c;

    // number

    else if (/\p{N}/v.test(c)) {
      if (S.Norm.fraction.has(c))
        s += S.Norm.fraction.get(c);
      
      else s += c;
    }

    // punctuation

    else if (/\p{P}/v.test(c)) {
      if (c.codePointAt(0) <= 127) s += c;

      // hyphen/dash

      else if (/\p{Pd}/v.test(c)) s += "-";

      else {
        if (c === "‚") s += '"';
        else if (c === "„") s += '"';
        else if (c === "⹂") s += '"';
        else if (c === "〝") s += '"';
        else if (c === "〞") s += '"';
        else if (c === "〟") s += '"';
        else if (c === "«") s += '"';
        else if (c === "»") s += '"';
        else if (c === "‹") s += '"';
        else if (c === "›") s += '"';
        else if (c === "‘") s += '"';
        else if (c === "‛") s += '"';
        else if (c === "“") s += '"';
        else if (c === "‟") s += '"';
        else if (c === "’") s += '"';
        else if (c === "”") s += '"';
        else if (c === "＂") s += '"';

        else if (c === "‐") s += "-"; // 0x2010
        else if (c === "‑") s += "-"; // 0x2011
        else if (c === "‒") s += "-"; // 0x2012
        else if (c === "–") s += "-"; // 0x2013
        else if (c === "—") s += "-"; // 0x2014
        else if (c === "―") s += "-"; // 0x2015
        else if (c === "﹘") s += "-"; // 0xFE58
        else if (c === "﹣") s += "-"; // 0xFE63
        else if (c === "－") s += "-"; // 0xFF0D
        else if (c === "‧") s += "-"; // 0x2027

        else if (c === "՚") s += "'";

        else if (c === "…") s += "...";

        else if (c === "•") s += "*";
        else if (c === "‣") s += "*";

        else if (c === "‼") s += "!!";
        else if (c === "⁇") s += "??";
        else if (c === "⁈") s += "?!";
        else if (c === "⁉") s += "!?";
        else if (c === "‽") s += "?!";

        else s += c;
      }
    }

    // symbol

    else if (/\p{S}/v.test(c)) {
      if (c === "❛") s += '"';
      else if (c === "❜") s += '"';
      else if (c === "❝") s += '"';
      else if (c === "❞") s += '"';
      else if (c === "❟") s += '"';
      else if (c === "❠") s += '"';
      else if (c === "❮") s += '"';
      else if (c === "❯") s += '"';
      else if (c === "⹂") s += '"';
      else if (c === "`") s += "'";
      else if (c === "´") s += "'";
      else if (c === "℃") s += "°C";
      else if (c === "℉") s += "°F";
      else s += c;
    }
    
    // separator

    else if (/\p{Z}/v.test(c)) {

      // space
      
      if (c.codePointAt(0) <= 127) s += c;
      else s += " ";
    }

    else throw new Err(`unknown char "${c}"/${c.codePointAt(0)}`);
  }

  return This(s)
    .map(s2 => s2
      .replace(/\n{2,}/g, "\n")
      .replace(/ +\n/g, "\n")
      .replace(/\n +/g, "\n")
      .replace(/ {2,}/g, " ")
      .replace(/^ +/g, "")
      .replace(/ +$/g, ""))
    .map(s2 => s2 + "<doc/>")
    .unthis;
};


//█████ Ordering ██████████████████████████████████████████████████████████████


/* Locale string format: "de-DE"

Collator option object properties (first one is default value):

  * usage = "sort"/"search"
  * collation = false/true
  * numeric = false/true
  * caseFirst = false/true
  * sensitivity = "variant"/"base"/"accent"/"case"
  * ignorePunctuation = false/true

If case insensitive string comparison is required, set the `sensitivity`
property in the option argument to `"accent"`, */


// ascending order

S.ctor = locale => opt =>
  new Intl.Collator(locale, opt).compare;


// descending order

S.ctorDesc = locale => opt => (p, o) =>
  new Intl.Collator(locale, opt).compare(o, p);


S.ctorObj = ({locale, k}) => opt => (o, p) =>
  new Intl.Collator(locale, opt).compare(o[k], p[k]);


S.ctorWith = ({locale, f}) => opt => (o, p) =>
  new Intl.Collator(locale, opt).compare(...f(o, p));


S.ctorDe = S.ctor("de-DE");


//█████ Casing ████████████████████████████████████████████████████████████████


// capitalize a word and its potential word components

S.capitalize = word => {
  const xs = word.split("-");

  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === "") continue;
    else if (xs[i - 1] === "") xs[i] = xs[i].toLowerCase();
    else xs[i] = xs[i] [0].toUpperCase() + xs[i].slice(1).toLowerCase();

    const ys = xs[i].split(".");

    for (let i2 = 0; i2 < ys.length; i2++) {
      if (ys[i2] === "") continue;
      ys[i2] = ys[i2] [0].toUpperCase() + ys[i2].slice(1);
    }

    xs[i] = ys.join(".");

    if (/\p{L}+'\p{L}{2,}/v.test(xs[i])) {
      const zs = xs[i].split("'");

      for (let i2 = 0; i2 < zs.length; i2++)
        zs[i2] = zs[i2] [0].toUpperCase() + zs[i2].slice(1);

      xs[i] = zs.join("'");
    }
  }

  return xs.join("-");
};


/* Possible casings:

  • lower-case: foo
  • sentence-case: Foo
  • camel-case: fooBar or FooBar
  • acronym: FOO
  • arbitrary-case: FOOBar */

S.determineCasing = word => {
  const lc = word.toLowerCase(),
    uc = s.toUpperCase();

  if (lc === word) return "lower-case";
  else if (uc === word) return "acronym";
  
  else {
    const guess = "";

    for (let i = 0; i < word.length; i++) {
      if (lc[i] !== word[i]) {
        if (i === 0) guess = "sentence-case";
        else if (s[i - 1] === "-") continue;
        else if (s[i - 1] === ".") continue;
        else if (s[i - 1] === "'") continue;
        else if (s[i - 1] === word[i - 1]) guess = "camel-case";
        
        else {
          guess = "arbitrary-case";
          break;
        }
      }
    }

    return guess;
  }
};


//█████ Word ██████████████████████████████████████████████████████████████████


S.Word = {};


/* Well-formed words may include the follwing character:

  * lower-case letters
  * upper-case letters only at the beginning and after a special char
  * the following special chars: -.'& (but not consecutive)
  * digits only at the beginning and only separated by hyphen */

S.Word.parse = s => {
  let mode = "", offset = 0;

  if (/\d/.test(s[0])) {
    offset++;

    for (let i = 1; i < s.length; i++) {
      if (!/\d/.test(s[i])) {
        if (s[i] === "."
          || s[i] === "'"
          || s[i] === "&") {
            return Parser.Invalid({
              value: s,
              kind: "word",
              reason: "#· sequence",
            });
        }

        else break;
      }

      else if (i + 1 === s.length) return Parser.Invalid({
        value: s,
        kind: "word",
        reason: "number word",
      });

      else offset++;
    }
  }

  if (offset > 0 && s[offset] !== "-") return Parser.Invalid({
    value: s,
    kind: "word",
    reason: "#L sequence",
  });

  if (s[offset] === "-") {
    offset++;

    if (s[offset] === "-"
      || s[offset] === "."
      || s[offset] === "'"
      || s[offset] === "&") {
        return Parser.Invalid({
          value: s,
          kind: "word",
          reason: "·· sequence",
        });
    }
  }

  if (/\p{L}/v.test(s[offset])) {
    for (let i = offset + 1; i < s.length; i++) {
      if (/\p{Ll}/v.test(s[i])) mode = "";
      
      else if (/\p{Lu}/v.test(s[i])) {
        if (i === 0) mode = "";

        else if (mode === "") return Parser.Invalid({
          value: s,
          kind: "word",
          reason: "aA sequence",
        });

        else mode = "";
      }
      
      else if (/\d/.test(s[i])) return Parser.Invalid({
        value: s,
        kind: "word",
        reason: "L# sequence",
      });
      
      else if (s[i] === "-"
        || s[i] === "."
        || s[i] === "'"
        || s[i] === "&") {
          if (mode !== "") return Parser.Invalid({
            value: s,
            kind: "word",
            reason: "·· sequence",
          });

          else mode = s[i];
          continue;
      }

      else return Parser.Invalid({
        value: s,
        kind: "word",
        reason: `invalid char "${s[i]}"`,
      });
    }

    return Parser.Valid({
      value: s,
      kind: "word",
    });
  }

  else return Parser.Invalid({
    value: s,
    kind: "word",
    reason: `invalid char "${s[i]}"`,
  });
};


/* Take a set of well-known abbreviations, trigrams from a general corpus and
the right string context of the given word and determine whether it is an
abbreviation. The combinator is not meant to detecting acronyms. */

S.Word.parseAbbr = ({locale, abbrs, trigrams, context}) => abbr => {
  const abbr2 = S.replaceChar(".", "") (abbr);

  // well-known abbreviation

  if (abbrs.has(abbr2)) return Parser.Valid({value: abbr, kind: "abbr"});

  // check whether it is a normal, written out word

  else {
    const score = 0,
      standAlonePeriods = R.count(/(?<!\.)\.(?!\.)/g) (abbr),
      totalPeriods = S.countChar(".") (abbr),
      caps = R.count(/\p{Lu}/gv) (abbr2),
      firstCap = /^\p{Lu}/.test(abbr2);

    const standAloneVowels = R.count(RegExp(
      `${R.classes.latin1.lcl.s}+|${R.classes.latin1.ucl.s}+`, "g")) (abbr2);

    const vowels = R.count(RegExp(`${R.classes.latin1.vowels.s}`, "g")) (abbr2);

    // filter ellipsis

    if (standAlonePeriods === 0 && totalPeriods > 0) return Parser.Invalid({
      value: abbr, kind: "abbr", reason: "ellipsis"
    });

    // several stand-alone periods within a term

    else if (standAlonePeriods > 1) return Parser.Maybe({
      value: abbr, kind: "abbr", confidence: 1
    });

    // no vowels

    else if (vowels === 0) return Parser.Maybe({
      value: abbr, kind: "abbr", confidence: 1
    });

    // only vowels

    else if (vowels === abbr2.length) return Parser.Maybe({
      value: abbr, kind: "abbr", confidence: 1
    });

    // lower-case first letter followed by capitalized ones

    else if (!firstCap && caps > 0) return Parser.Maybe({
      value: abbr, kind: "abbr", confidence: 1
    });

    // context (followed by comma)

    else if (context && /^ *,/.test(context)) return Parser.Maybe({
      value: abbr, kind: "abbr", confidence: 1
    });

    // context (followed by lower-case word)

    else if (context && /^ +\p{Ll}/v.test(context))return Parser.Maybe({
      value: abbr, kind: "abbr", confidence: 1
    });

    else {

      // score derived from the default abbr length

      const lenScore = S[locale].avgWordLen - (abbr2.length);

      // consider trigram deviation

      // TODO

      // score derived from upper-case letters (all-caps get low score)

      const capScore = caps === abbr2.length ? 1 : caps;

      // score derived from deviation against default vowel-consonant ratio

      const vowelRatio = S[locale].vowelConsonantRatio
        - (standAloneVowels / (abbr2.length - standAloneVowels));

      const vowelRatioScore = vowelRatio > 0 ? vowelRatio * 10 : vowelRatio;

      // score derived from last letter being a consonant

      const finalConsonantScore = R.g(R.classes.latin1.vowels.s)
        .test(abbr2[abbr2.length - 1]) ? 0 : 1;

      const finalScore = Alg.expGrowth({maxInput: 10}) (
        lenScore
        + capScore
        + vowelRatioScore
        + finalConsonantScore);

      return Parser.Maybe({
        value: abbr, kind: "abbr", confidence: finalScore
      });
    }
  }
};


/* Parse part of speech. A part of speech category is assigned by the degree
of conformity of the word's trigrams with the distribution of trigrams of a
category. Another factor is the order of word types in the context of the given
word, provided their part of speech is already known. */

S.Word.parsePos = trigramsPerPos => word => {
  const queryTrigram = S.trigram(word);

  const score = {
    noun: 0,
    verb: 0,
    adj: 0,
  };

  for (const [pos, trigrams] of O.entries(trigramsPerPos)) {
    for (const triple of queryTrigram) {
      if (!(pos in score)) throw new Err(`unexpcted pos "${pos}"`);
      else if (trigrams.has(triple)) score[pos] += trigrams.get(triple);
    }
  }

  // normalization

  score.noun *= trigramsPerPos.noun.size;
  score.verb *= trigramsPerPos.verb.size;
  score.adj *= trigramsPerPos.adj.size;

  const pairs = Object.entries(score)
    .sort((pair, pair2) => pair2[1] - pair[1]);

  const result = [];

  for (let i = 0; i < pairs.length; i++) {
    if (i === pairs.length - 1) result.push(Parser.Maybe({
      value: pairs[i] [0],
      kind: "pos",
      confidence: pairs[i] [1],
      delta: 0,
    }));

    else result.push(Parser.Maybe({
      value: pairs[i] [0],
      kind: "pos",
      confidence: pairs[i] [1],
      delta: pairs[i] [1] - pairs[i + 1] [1],
    }));
  }

  // TODO: incorporate context (pos order)

  return result;
};


/* Split compound nouns, verbs, adjectives, and numerals unsing a corpus of
well-known words. */

S.Word.splitCompoundWord = ({locale, pos, corpus}) => queryWord => {
  const reconstructInfix = (prefix, infix, suffix, interfixes, elisions, decompositions) => {
    if (interfixes.has(infix)) 
      decompositions.push({prefix, infix: "", suffix, remainder: ""});

    else {
      const infixes = [infix];

      // remove left or right and left/right interfixes

      for (const interfix of interfixes) {
        infixes.forEach(infix2 => {
          if(infix2.startsWith(interfix) && infix2.length > interfix.length) {
            infixes.push(infix2.slice(interfix.length));

            if(infix2.endsWith(interfix) && infix2.length > 2 * interfix.length)
              infixes.push(infix2.slice(interfix.length, -interfix.length));
          }

          if(infix2.endsWith(interfix) && infix2.length > interfix.length)
            infixes.push(infix2.slice(0, -interfix.length));
        });
      }

      // add composita elision

      infixes.forEach(infix2 => {
        for (const elision of elisions) {
          infixes.push(infix2 + elision);
        }
      });

      // reconstruct infix

      for (const infix2 of infixes) {
        const infixCandidates = S.Retrieve.query({corpus}) (infix2);
        let wellKnownInfix = false;

        for (const infixCandidate of infixCandidates) {
          const infixCandidate2 = S.fromNgram(corpus.bigrams[infixCandidate.index]),
            infixEval = S.Diff.Eval.all(S.Diff.retrieve(infix2) (infixCandidate2));

          if (A.sum(infixEval[0].penalty) <= 1) {
            decompositions.push({prefix, infix: infixCandidate2, suffix, remainder: ""});
            wellKnownInfix = true;
          }
        }

        if (!wellKnownInfix)
          decompositions.push({prefix, infix: "", suffix, remainder: infix});
      }
    }
  };

  const prefixes = [], suffixes = [];

  const candidates = S.Retrieve.query(
    {corpus, lenDiff: [1.2, null]}) (queryWord);

  // retrieve prefixes/suffixes

  for (const candidate of candidates) {
    const corpusWord = S.fromNgram(corpus.bigrams[candidate.index]),
      queryPrefix = queryWord.slice(0, corpusWord.length),
      querySuffix = queryWord.slice(-(corpusWord.length)),
      prefixEval = S.Diff.Eval.all(S.Diff.retrieve(queryPrefix) (corpusWord)),
      suffixEval = S.Diff.Eval.all(S.Diff.retrieve(querySuffix) (corpusWord)),
      prefixPenalty = prefixEval.length ? A.sum(prefixEval[0].penalty) : posInf,
      suffixPenalty = suffixEval.length ? A.sum(suffixEval[0].penalty) : posInf;

    // match prefix

    if (prefixPenalty < 10) prefixes.push(corpusWord);

    else if (prefixPenalty < 30) {
      if (prefixEval[0].reason.includes("remainder")) {
        const o = prefixEval[0].left.mismatches.length
          ? prefixEval[0].left.mismatches[0]
          : prefixEval[0].right.mismatches[0];

        if ((o.char === queryPrefix[queryPrefix.length - 1]
          || o.char === queryWord[queryPrefix.length])
          && o.index >= queryPrefix.length - 2)
            prefixes.push(corpusWord);
      }
    }

    // match suffix

    if (suffixPenalty < 10) suffixes.push(corpusWord);

    else if (suffixPenalty < 30) {
      if (suffixEval[0].reason.includes("remainder")) {
        const o = suffixEval[0].left.mismatches[0];

        if ((o.char === querySuffix[0]
          || o.char === queryWord[queryWord.length - querySuffix.length - 1])
          && o.index <= 1)
            suffixes.push(corpusWord);
      }
    }
  }

  // derive infix from prefix/suffix pair

  const decompositions = [];

  if (prefixes.length ^ suffixes.length) {
    if (prefixes.length) prefixes.forEach(prefix => {
      decompositions.push({
        prefix,
        infix: "",
        suffix: "",
        remainder: queryWord.slice(prefix.length)
      });
    });

    else suffixes.forEach(suffix => {
      decompositions.push({
        prefix: "",
        infix: "",
        suffix,
        remainder: queryWord.slice(0, -suffix.length)
      });
    });
  }

  else for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      if (prefix.length + suffix.length < queryWord.length) {
        let infix = queryWord;

        infix = infix.slice(prefix.length);
        infix = infix.slice(0, -suffix.length);

        // check for interfixes

        if (pos === "noun") {
          reconstructInfix(
            prefix,
            infix,
            suffix,
            _Set[locale].nominalInterfixes,
            _Set[locale].compositaElisions,
            decompositions);
        }

        else if (pos === "verb") {
          reconstructInfix(
            prefix,
            infix,
            suffix,
            _Set[locale].verbalInterfixes,
            _Set[locale].compositaElisions,
            decompositions);
        }

        else if (pos === "adj") {
          reconstructInfix(
            prefix,
            infix,
            suffix,
            _Set[locale].adjectivalInterfixes,
            _Set[locale].compositaElisions,
            decompositions);
        }

        else if (pos === "num") {
          reconstructInfix(
            prefix,
            infix,
            suffix,
            _Set[locale].numeralInterfixes,
            _Set[locale].compositaElisions,
            decompositions);
        }
      }

      else if (prefix.length + suffix.length === queryWord.length) {
        decompositions.push({
          prefix,
          infix: "",
          suffix,
          remainder: ""
        });
      }

      else {
        decompositions.push({
          prefix,
          infix: "",
          suffix: "",
          remainder: queryWord.slice(prefix.length)
        });

        decompositions.push({
          prefix: "",
          infix: "",
          suffix,
          remainder: queryWord.slice(0, -suffix.length)
        });
      }
    }
  }

  if (decompositions.length === 0) return decompositions;
  else if (decompositions.length === 1) return decompositions;

  // select result set

  else {

    // dedupe decompositions

    const m = decompositions.reduce((acc, o) => {
      const k = `${o.prefix}/${o.infix}/${o.suffix}`;
      if (!acc.has(k)) acc.set(k, o);
      return acc;
    }, new Map);

    const xs = Array.from(m).map(([, o]) => o);

    const pair = A.partition(o => o.remainder.length === 0) (xs);

    if (pair[0].length) return pair[0];
    else return pair[1];
  }
};


S.Word.splitSentences = s => {
  // TODO
  // split at periods/exclamation/question mark but
    // take abbreviation periods into account
    // take ellipses into account
    // take several exclamation/question marks into account?!?
  // newlines might be considered like implicit periods
  // trim redundant spaces
  // encode type of sentence: expressive, interrogative, exclamatory
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ TRANSDUCER ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Compute chains of iterative operations without intermediate structures and
allow short circuits at any point in the process:

const transformer = comp(
  Trans.map(([x, y]) => [x.toUpperCase(), y]))
    (Trans.map(([x, y]) => [x, y * y]));

const appendix = Trans.Append.obj(o => Object.keys(o).length < 3),
  props = Object.entries({foo: 1, bar: 2, bas: 3, bat: 4, baz: 5});  

Trans.duce(transformer) (appendix) ({}) (props); // {FOO: 1, BAR: 4, BAS: 9}

Please note that the append function is necessarily curried. */


export const Trans = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Trans.fold = f => init => it => Loop2((acc, ix) => {
  const o = ix.next();

  return o.done
    ? Loop2.Base(acc)
    : f(acc) (o.value) (acc2 => Loop2.Rec(acc2, ix));
}) (init, it[Symbol.iterator] ());


Trans.duce = transducer => append => Trans.fold(transducer(append));


//█████ Transformer ███████████████████████████████████████████████████████████


Trans.map = f => append => acc => x => k => append(acc) (f(x)) (k);


Trans.filter = p => append => acc => x => k =>
  p(x) ? append(acc) (x) (k) : k(acc);


Trans.chain = f => append => init => x => k => {
  const ix = f(x);
  let acc = init, terminated = false;

  for (const x of ix) {
    const result = append(acc) (x) (acc2 => {
      acc = acc2;
      return true;
    });

    if (result?.[$$] === 'Loop2.Base') {
      acc = result.x;
      terminated = true;
      break;
    }
  }

  return terminated ? Loop2.Base(acc) : k(acc);
};


Trans.take = n => append => { 
  let m = 0;

  return acc => x => k =>
    m++ < n
      ? append(acc) (x) (k)
      : Loop2.Base(acc);
};


Trans.takeWhile = p => append => acc => x => k =>
  p(x) ? append(acc) (x) (k) : Loop2.Base(acc);


Trans.takeNth = n => append => {
  let m = 0;

  return acc => x => k => {
    return (m++ % n === 0) ? append(acc) (x) (k) : Loop2.Base(acc);
  };
};


Trans.drop = n => append => { 
  let m = 0;

  return acc => x => k =>
    m++ < n
      ? k(acc)
      : append(acc) (x) (k)
};


Trans.dropWhile = p => append => {
  let drop = true;

  return acc => x => k =>
    drop && p(x)
      ? k(acc)
      : (drop = false, append(acc) (x) (k))
};


Trans.tap = f => append => {
  return acc => x => k => {
    return (f(x), append(acc) (x) (k));
  };
};


//█████ Appending █████████████████████████████████████████████████████████████


Trans.Append = {};


Trans.Append.arr = p => acc => x => k => p(acc)
  ? k(acc.concat(x))
  : Loop2.Base(acc);


Trans.Append.map = p => acc => pair => k => p(acc)
  ? k(acc.set(...pair))
  : Loop2.Base(acc);


Trans.Append.set = p => acc => x => k => p(acc)
  ? k(acc.add(x))
  : Loop2.Base(acc);


Trans.Append.obj = p => acc => pair => k =>
  p(acc) ? k(Object.assign(acc, {[pair[0]]: pair[1]})) : Loop2.Base(acc);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TREE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Balanced binary search tree as a persistent data structure with structural
sharing. Stores values in the order imposed by the provided comparator. Can
be used as an inherently ordered list or as a priority queue. */


export class Tree {
  #root;
  #cmp;
  #size;


  constructor(cmp) {
    this.#root = Tree.root;
    this.#cmp = cmp || ctor;
    this.#size = 0;
  }


  #findNode(key) {
    let node = this.#root;
    while (node !== Tree.root) {
      const c = this.#cmp(key, node.key);
      if (c === 0) return node;
      node = c < 0 ? node.left : node.right;
    }

    return undefined;
  }


  static root = reify(o => {
    o.level = 0;
    o.key = undefined;
    o.value = undefined;
    o.left = o;
    o.right = o;
    return o;
  })


  static createNode(key, value) {
    return {
      key: key,
      value: value,
      level: 1,
      left: Tree.root,
      right: Tree.root
    };
  }


  static skew(node) {
    if (node.level === node.left.level && node.level !== 0) {
      const leftChild = node.left;

      node.left = leftChild.right;
      leftChild.right = node;
      return leftChild;
    }

    return node;
  }


  static split(node) {
    if (node.level === node.right.right.level && node.level !== 0) {
      const rightChild = node.right;

      node.right = rightChild.left;
      rightChild.left = node;
      rightChild.level++;
      return rightChild;
    }

    return node;
  }


  insert(key, value) {
    if (this.#root === Tree.root) {
      this.#root = Tree.createNode(key, value);
      this.#size++;
      return this;
    }

    const path = [];

    let node = this.#root,
      parentNode = null,
      direction = 0;

    while (node !== Tree.root) {
      path.push(node);
      parentNode = node;

      const c = this.#cmp(key, node.key);

      if (c === 0) return this;
      direction = c < 0 ? -1 : 1;
      node = direction < 0 ? node.left : node.right;
    }

    const node2 = Tree.createNode(key, value);
    this.#size++;

    if (direction < 0) parentNode.left = node2;
    else parentNode.right = node2;

    for (let i = path.length - 1; i >= 0; i--) {
      let node3 = path[i],
        parent = (i > 0) ? path[i - 1] : null;

      node3 = Tree.skew(node3);
      node3 = Tree.split(node3);

      if (parent) {
        if (this.#cmp(node3.key, parent.key) < 0)
          parent.left = node3;

        else parent.right = node3;
      }

      else this.#root = node3;
    }
    
    return this;
  }


  delete(key) {
    if (this.#root === Tree.root) return false;

    const path = [];
    let node = this.#root, found = false;

    while (node !== Tree.root) {
      path.push(node);
      const c = this.#cmp(key, node.key);

      if (c === 0) {
        found = true;
        break;
      }

      node = c < 0 ? node.left : node.right;
    }

    if (!found) return false;

    if (node.left !== Tree.root && node.right !== Tree.root) {
      path.push(node.right);
      let successor = node.right;

      while (successor.left !== Tree.root) {
        path.push(successor.left);
        successor = successor.left;
      }

      node.key = successor.key;
      node.value = successor.value;

      node = successor;
    }

    const node2 = (node.left === Tree.root)
      ? node.right
      : node.left;

    const parentIndex = path.length - 2;

    if (parentIndex < 0) this.#root = node2;

    else {
      const parent = path[parentIndex];

      if (this.#cmp(node.key, parent.key) < 0)
         parent.left = node2;

      else parent.right = node2;
    }

    for (let i = path.length - 2; i >= 0; i--) {
      let node3 = path[i],
        parent = (i > 0) ? path[i - 1] : null;

      const level = Math.max(
        node3.left.level, node3.right.level) + 1;

      if (level < node3.level) {
        node3.level = level;

        if (level < node3.right.level)
          node3.right.level = level;
      }

      node3 = Tree.skew(node3);

      if (node3.right !== Tree.root) {
        node3.right = Tree.skew(node3.right);

        if (node3.right.right !== Tree.root)
          node3.right.right = Tree.skew(node3.right.right);
      }

      node3 = Tree.split(node3);

      if (node3.right !== Tree.root)
        node3.right = Tree.split(node3.right);

      if (parent) {
        if (this.#cmp(node3.key, parent.key) < 0)
          parent.left = node3;

        else parent.right = node3;
      }

      else this.#root = node3;
    }

    this.#size--;
    return true;
  }


  has(key) {
    return this.#findNode(key) !== undefined;
  }


  find(key) {
    const node = this.#findNode(key);
    return node ? node.value : undefined;
  }


  peekMin() {
    if (this.#root === Tree.root) return undefined;
    let node = this.#root;
    while (node.left !== Tree.root) node = node.left;
    return {key: node.key, value: node.value};
  }


  peekMax() {
    if (this.#root === Tree.root) return undefined;
    let node = this.#root;
    while (node.right !== Tree.root) node = node.right;
    return {key: node.key, value: node.value};
  }


  extractMin() {
    if (this.#root === Tree.root) return undefined;
    let node = this.#root;
    while (node.left !== Tree.root) node = node.left;

    const minKey = node.key, minValue = node.value;
    this.delete(minKey);
    return {key: minKey, value: minValue};
  }


  extractMax() {
    if (this.#root === Tree.root) return undefined;
    let node = this.#root;
    while (node.right !== Tree.root) node = node.right;

    const maxKey = node.key;
    const maxValue = node.value;
    this.delete(maxKey);
    return {key: maxKey, value: maxValue};
  }


  inorder(callback) {
    const stack = [];
    let current = this.#root;

    while (current !== Tree.root || stack.length > 0) {
      while (current !== Tree.root) {
        stack.push(current);
        current = current.left;
      }

      current = stack.pop();
      callback(current);
      current = current.right;
    }
  }


  getRoot() {
    return this.#root;
  }


  get size() {
    return this.#size;
  }


  * [Symbol.iterator]() {
    const stack = [];
    let curr = this.#root;

    while (curr !== Tree.root || stack.length > 0) {
      while (curr !== Tree.root) {
        stack.push(curr);
        curr = curr.left;
      }

      curr = stack.pop();
      yield [curr.key, curr.value];

      curr = curr.right;
    }
  }


  * entries() {
    yield* this[Symbol.iterator]();
  }


  * keys() {
    const stack = [];
    let curr = this.#root;

    while (curr !== Tree.root || stack.length > 0) {
      while (curr !== Tree.root) {
        stack.push(curr);
        curr = curr.left;
      }
      curr = stack.pop();
      yield curr.key;
      curr = curr.right;
    }
  }


  * values() {
    const stack = [];
    let curr = this.#root;

    while (curr !== Tree.root || stack.length > 0) {
      while (curr !== Tree.root) {
        stack.push(curr);
        curr = curr.left;
      }
      curr = stack.pop();
      yield curr.value;
      curr = curr.right;
    }
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████ LINEAR ALGEBRA ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Alg = {};

/* TODO

1.  **Vectors:**
2.  **Matrices:**
3.  **Vector Spaces:**
4.  **Linear Independence & Span:**
5.  **Basis:**
6.  **Matrix Multiplication (and Vector-Matrix, Matrix-Vector):**
7.  **Element-wise Operations (Hadamard Product):**
8.  **Transpose:**
9.  **Dot Product (Inner Product):**
10. **Normed Vector Spaces (Norms):**
      **L1 Norm (Manhattan):** Used in LASSO regularization for sparsity, feature selection.
      **L2 Norm (Euclidean):** Used in Ridge regularization, standard distance metric, loss functions (MSE).
      **Frobenius Norm:** Matrix norm used in regularization, matrix factorization objectives.
11. **Inner Product Spaces:**
      **Projections:** Projecting data onto lower-dimensional subspaces (PCA, Linear Regression).
      **Orthogonality:** Finding uncorrelated bases (PCA), simplifying calculations. Used in QR decomposition, Gram-Schmidt.
      **Kernel Methods (SVMs):** Kernels often implicitly compute inner products in high-dimensional spaces.
12. **Orthogonality / Orthonormal Bases:**
13. **Systems of Linear Equations (Ax = b):**
14. **Linear Least Squares:**
15. **Matrix Inverse:**
16. **Pseudo-inverse (Moore-Penrose):**
17. **Eigenvalue Decomposition (EVD) (for square matrices):**
      **Principal Component Analysis (PCA):** Eigenvalues/eigenvectors of the covariance matrix reveal directions of maximum variance (principal components).
      **Eigenvalues:** Scalars representing scaling factors.
      **Eigenvectors:** Vectors remaining in the same direction after transformation (scaled by eigenvalue).
      **Eigenspace:** The space spanned by eigenvectors corresponding to the same eigenvalue.
18. **Singular Value Decomposition (SVD) (for any matrix):**
      **PCA Implementation:** Can be computed via SVD of the data matrix.
      **Dimensionality Reduction / Matrix Approximation:** Low-rank approximation by keeping top singular values/vectors.
      **Calculating Pseudo-inverse.**
      **Latent Semantic Analysis (LSA)** in NLP.
      **Recommender systems (matrix factorization).
19. **QR Decomposition / Factorization:**
      **Gram–Schmidt Process:** A method to compute QR, conceptually important for understanding orthogonalization (though modified versions are often used for stability).
      **Householder Transformation:** A numerically stable method (reflections) used to compute QR decomposition.
20. **Cholesky Decomposition (for positive definite symmetric matrices):**
21. **Positive Definite / Semidefinite Matrices:**
22. **Tensors:**
23. **Tensor Algebra:**
24. **Outer Product:**
25. **Woodbury Matrix Identity:**

**Concepts Less Directly Emphasized in Typical ML Applications:**

ignore:

* Matrix Equivalence/Congruence/Similarity/Consimilarity
* Row Echelon Form / Elementary Row Operations
* Determinant
* Topological Vector Space, Pseudo-Euclidean Space, Orientation, Symplectic Structure
*/


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// calculate the exponent for a given base and result x

Alg.logx = base => x => Math.log(x) / Math.log(base);


Alg.log2 = Alg.logx(2);


Alg.log3 = Alg.logx(3);


//█████ Fractions █████████████████████████████████████████████████████████████


// greatest common denominator

Alg.gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  
  while (b) {
    let temp = b;
    b = a % b;
    a = temp;
  }
  
  return a;
};


// least common multiplicator

Alg.lcm = (a, b) => {
  if (a === 0 || b === 0) return 0;

  else {
    const cd = gcd(a, b);
    return (Math.abs(a) / cd) * Math.abs(b);
  }
};


Alg.simplifyFrac = (n, d) => {
  if (n === 0) return {n: 0, d: 1};

  const cd = Alg.gcd(n, d);
  let n2 = n / cd;
  let d2 = d / cd;

  if (d2 < 0) {
    n2 = -n2;
    d2 = -d2;
  }

  return {n: n2, d: d2};
};


Alg.addFracs = (o, p) => {
  const n1 = o.n,
    d1 = o.d,
    n2 = p.n,
    d2 = p.d;

  const n3 = n1 * d2 + n2 * d1,
    d3 = d1 * d2;

  return Alg.simplifyFrac(n3, d3);
};


Alg.subFracs = (o, p) => {
  const n1 = o.n,
    d1 = o.d,
    n2 = p.n,
    d2 = p.d;

  const n3 = n1 * d2 - n2 * d1,
    d3 = d1 * d2;

  return Alg.simplifyFrac(n3, d3);
};


Alg.mulFracs = (o, p) => {
  const n1 = o.n,
    d1 = o.d,
    n2 = p.n,
    d2 = p.d;

  const n3 = n1 * n2,
    d3 = d1 * d2;

  return simplifyFrac(n3, d3);
};


Alg.divFracs = (o, p) => {
  const n1 = o.n,
    d1 = o.d,
    n2 = p.n,
    d2 = p.d;

  if (n2 === 0) throw new Err("div by zero");

  const n3 = n1 * d2,
    d3 = d1 * n2;

  return simplifyFrac(n3, d3);
};


Alg.avgFracs = (o, p) => {
  const sum = Alg.addFracs(o, p),
    n = sum.n,
    d = sum.d * 2;

  return Alg.simplifyFrac(n, d);
};


//█████ Model Growth ██████████████████████████████████████████████████████████


/* Caluclate exponential growth. Max input is used to normalize the input range.
Slope is a scaling factor to shift the transition from slow to rapid change.
Suitable to model confidence, e.g. low confidence at the beginning but then
exponential increase in confidence. */

Alg.expGrowth = ({maxInput, slope = 8}) => x => {
  if (slope <= 0) throw Err("slope must be greater than 0");
  else if (maxInput <= 0) throw Err("max input must be greater than 0");

  else {
    const normalizedValue = Math.min(Math.max(x / maxInput, 0), 1),
      expTerm = -slope * (normalizedValue - 0.5),
      growth = 1 / (1 + Math.exp(expTerm));

    return growth;
  }
};


// calculate asymptotic growth.

Alg.asympGrowth = ({maxInput, slope = 5}) => x => {
  if (slope <= 0) throw Err("slope must be greater than 0");
  else if (maxInput <= 0) throw Err("max input must be greater than 0");

  else {
    const expTerm = (Math.min(Math.max(x / maxInput, 0), 1)) * slope,
      growth = 1 - Math.exp(-expTerm);

    return growth;
  }
};


//█████ Vectors ███████████████████████████████████████████████████████████████


Alg.dotProduct = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("diverging dimensions");

  let n = 0;
  for (let i = 0; i < xs.length; i++) n += xs[i] * ys[i];
  return n;
};


Alg.cosine = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("diverging dimensions");
  else if (xs.length === 0) return 0;

  let n = 0, n2 = 0, n3 = 0;

  for (let i = 0; i < xs.length; i++) {
    n += xs[i] * ys[i];
    n2 += xs[i] * xs[i];
    n3 += ys[i] * ys[i];
  }
  
  return n / (Math.sqrt(n2) * Math.sqrt(n3));
};


Alg.euclidean = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("diverging dimensions");
  else if (xs.length === 0) return 0;

  let n = 0;

  for (let i = 0; i < xs.length; i++) {
    const diff = xs[i] - ys[i];
    n += diff * diff;
  }

  return Math.sqrt(n);
};


Alg.euclidean2 = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("diverging dimensions");
  else if (xs.length === 0) return 0;

  let n = 0;

  for (let i = 0; i < xs.length; i++) {
    const diff = xs[i] - ys[i];
    n += diff * diff;
  }

  return n;
};


Alg.manhattan = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("same length expected");
  else if (xs.length === 0) return 0;

  let n = 0;
  for (let i = 0; i < xs.length; i++) n += Math.abs(xs[i] - ys[i]);
  return n;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ NODE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Node = {};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ CHILD PROCESS ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Pass an asynchronous type (`Serial`/`Parallel`) to get a child process.
Example of use:

  Child.exec("pdftotext -layout ./foo.pdf ./foo.txt")

Yields either the text file or an error message from the executable (installed
pdftotext assumed). */


// TODO: dysfunctional - adapt to new async type


Node.Child = Cons => {
  const o = {};

  o.handle = reify(p => {
    p.exec = cmd => Cons(k =>
      Child.exec(cmd, (e, stdout, stderr) => {
        if (e) return k(new Err(e));
        else if (stderr) return k(new Err(stderr));
        else return k(stdout);
      }));

    return p;
  });

  o.throw = reify(p => {
    p.exec = cmd => Cons(k =>
      Child.exec(cmd, (e, stdout, stderr) => {
        if (e) throw e;
        else if (stderr) throw stderr;
        else return k(stdout);
      }));

    return p;
  });
  return o;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ COMMAND LINE ARGUMENTS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Node.CLA = {};


/* Take an object of mandatory and optional command line arguments each and
check if all mandatory arguments are supplied. If a property of the mandatory
or optional object includes a predicate, use it to validate the respective
argument value. */

Node.CLA.scan = ({mandatory, optional = {}}) => {
  const o = {}, xs = [];

  process.argv.slice(2).forEach(arg => {
    if (arg[0] === "/") return;

    else if (!/-[a-z]\b|--[a-z_]\w*=./.test(arg))
      throw new Err(`malformed CLA "${arg}"`);

    else {
      const [k, v = null] = arg.split("="),
        k2 = k.replaceAll(/-/g, "");

      if (k2 in mandatory) {
        if (typeof mandatory[k2] === "function"
          && !mandatory[k2] (v))
            throw new Err(`malformed mandatory CLA "${k2}=${v}"`);

        xs.push(k2);
      }
      
      else if (k2 in optional) {
        if (typeof optional[k2] === "function"
          && !optional[k2] (v))
            throw new Err(`malformed optional CLA "${k2}=${v}"`);
      }

      else throw new Err(`unknown CLA "${k2}"`);

      o[k2] = v;
    }
  }); 

  const ks = Object.keys(mandatory);

  if (ks.length !== xs.length) {
    const diff = A.diff(ks) (xs).join(", ");
    throw new Err(`missing CLAs "${diff}"`);
  }

  return o;
};


Node.CLA.setEnv = o => {
  Object.keys(o).forEach(k => {
    if (k in process.env) console.warn(`overwrite property "${k}"`);
    process.env[k] = o[k];
  });

  return o;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ CRYPTO ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Node.Crypto = {};


/* Encrypt with 256-bit private key. If this key is derived from a user password,
you must use a strong key derivation function (KDF) like Argon2id or PBKDF2 with
a high iteration count and a unique salt per user before passing the resulting
key buffer to the encryption function. */

Node.Crypto.encryptSym = key => plaintext => {
  if (!Buffer.isBuffer(key) || key.length !== 32)
    throw new Err("32-byte buffer expected");

  else if (typeof plaintext !== "string")
    throw new Err("Plaintext must be a string.");

  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    ciphertext,
    iv: iv.toString("base64"),
    tag: tag.toString("base64")
  };
};


// decrypt with 256-bit private key

Node.Crypto.decryptSym = ({ key, iv, tag }) => ciphertext => {
  if (!Buffer.isBuffer(key) || key.length !== 32)
    throw new Err("32-byte buffer expected");

  else if (typeof iv !== "string"
    || typeof tag !== "string"
    || typeof ciphertext !== "string")
      throw new Err("base64 encoded strings expected");

  try {
    const ivBuf = Buffer.from(iv, "base64");
    const tagBuf = Buffer.from(tag, "base64");

    if (ivBuf.length !== 12)
      throw new Err("invalid iv length provided for gcm decryption");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuf);
    decipher.setAuthTag(tagBuf);

    let plaintext = decipher.update(ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
  }

  catch (error) {
    return null // indicate failure securely
  };
};


// generate 256-bit private key

Node.Crypto.createKey256 = () => Crypto.randomBytes(32).toString("base64");


// TODO: add asymetric encription


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ FILE SYSTEM █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: dysfunctional - adapt to new async type


Node.FS = Cons => {
  const o = {};

  // file system that imposes error handling on the calling site

  o.handle = reify(p => {
    p.collectFiles = (rootPath, maxDepth, fileTypes) => {
      return function go(acc, currentPath, depth) {
        if (depth > maxDepth) return Cons.of();

        return Cons.chain(p.scanDir({withFileTypes: true}) (currentPath)) (qs => {
          if (intro(qs) === "Error") throw qs;

          const xs = qs.map(q => {
            const fullPath = Node.path.join(currentPath, q.name),
              relativePath = Node.path.relative(rootPath, fullPath);

            if (q.isFile()) {
              const ys = q.name.split(/\./);
              
              if (ys.length > 1 && fileTypes.has(ys[ys.length - 1])) {
                acc.push(relativePath);
                return Cons.of();
              }

              else return Cons.of();
            }

            else if (q.isDirectory()) return go(acc, fullPath, depth + 1);
            else return Cons.of();
          });

          return Cons.map(_ =>
            acc.map(path => Node.path.join(rootPath, path))) (Cons.allArr(xs));
        });
      } ([], rootPath, 0);
    };

    p.copy = src => dest => Cons(k =>
      FS.copyFile(src, dest, e =>
        e ? k(new Err(e)) : k(null)));

    p.move = src => dest =>
      Cons.chain(p.copy(src) (dest)) (e =>
        e?.constructor?.name === "Exception" ? Cons.of(e) : p.unlink(src));

    p.read = opt => path => Cons(k =>
      FS.readFile(path, opt, (e, x) =>
        e ? k(new Err(e)) : k(x)));

    p.scanDir = opt => path => Cons(k =>
      FS.readdir(path, opt, (e, xs) =>
        e ? k(new Err(e)) : k(xs)));

    p.stat = path => Cons(k =>
      FS.stat(path, (e, p) =>
        e ? k(new Err(e)) : k(p)));

    p.unlink = path => Cons(k =>
      FS.unlink(path, e =>
        e ? k(new Err(e)) : k(null)));

    p.write = opt => path => s => Cons(k =>
      FS.writeFile(path, s, opt, e =>
        e ? k(new Err(e)) : k(s)));

    return p;
  });

  // file system that immediately throws on error

  o.throw = reify(p => {
    p.collectFiles = (rootPath, maxDepth, fileTypes) => {
      return function go(acc, currentPath, depth) {
        if (depth > maxDepth) return Cons.of();

        return Cons.chain(p.scanDir({withFileTypes: true}) (currentPath)) (qs => {
          const xs = qs.map(q => {
            const fullPath = Node.path.join(currentPath, q.name),
              relativePath = Node.path.relative(rootPath, fullPath);

            if (q.isFile()) {
              const ys = q.name.split(/\./);
              
              if (ys.length > 1 && fileTypes.has(ys[ys.length - 1])) {
                acc.push(relativePath);
                return Cons.of();
              }

              else return Cons.of();
            }

            else if (q.isDirectory()) return go(acc, fullPath, depth + 1);
            else return Cons.of();
          });

          return Cons.map(_ =>
            acc.map(path => Node.path.join(rootPath, path))) (Cons.allArr(xs));
        });
      } ([], rootPath, 0);
    };

    p.copy = src => dest => Cons(k =>
      FS.copyFile(src, dest, e =>
        e ? _throw(e) : k(null)));

    p.move = src => dest =>
      Cons.chain(p.copy(src) (dest)) (_ =>
        p.unlink(src));

    p.read = opt => path => Cons(k =>
      FS.readFile(path, opt, (e, x) =>
        e ? _throw(e) : k(x)));

    p.scanDir = opt => path => Cons(k =>
      FS.readdir(path, opt, (e, xs) =>
        e ? _throw(e) : k(xs)));

    p.stat = path => Cons(k =>
      FS.stat(path, (e, p) =>
        e ? _throw(e) : k(p)));

    p.unlink = path => Cons(k =>
      FS.unlink(path, e =>
        e ? _throw(e) : k(null)));

    p.write = opt => path => s => Cons(k =>
      FS.writeFile(path, s, opt, e =>
        e ? _throw(e) : k(s)));

    return p;
  });

  return o;
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SQL █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// TODO: dysfunctional - adapt to new async type


Node.SQL = Cons => {
  const o = {};

  // meta is additional data passed to the query

  o.Query = product("SqlQuery", "sq") ("meta", "query");


  o.Result = product("SqlResult", "sr") ("data", "fields");


  o.createCredentials = ({host, port, name, charset = "utf8mb4"}) => ({
    host,
    port,
    user: process.dbUser,
    password: process.env.dbPassword,
    database: name,
    charset
  });


  o.createResource = credentials => mysql.createConnection(credentials);


  o.handle = reify(p => {
    p.connect = res =>
      Cons(k =>
        res.connect(e => e
          ? k(new Err(e)) : k(res))),


    o.disconnect = res =>
      Cons(k =>
        res.end(e => e
          ? k(new Err(e)) : k(true))),


    o.query = con => tx => Cons(k => {
      return con.query(tx.sq.query, (e, data, fields) => {
        if (e) return k(new Err(e));
        else return k(Sql.Result(data, fields));
      });
    });
  });


  o.throw = reify(p => {
    p.connect = res =>
      Cons(k =>
        res.connect(e => e
          ? _throw(e) : k(res))),


    o.disconnect = res =>
      Cons(k =>
        res.end(e => e
          ? _throw(e) : k(true))),


    o.query = con => tx => Cons(k => {
      return con.query(tx.sq.query, (e, data, fields) => {
        if (e) throw e;
        else return k(Sql.Result(data, fields));
      });
    });
  });
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████ RESOLVE INTERNAL DEPS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


A.Ait.fromEntries = A.Ait.fromEntries();
A.Ait.fromKeys = A.Ait.fromKeys();
A.Ait.fromValues = A.Ait.fromValues();
