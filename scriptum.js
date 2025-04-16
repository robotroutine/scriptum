/* 
 __   __   __     __  ___            
/__` /  ` |__) | |__)  |  |  |  |\/| 
.__/ \__, |  \ | |     |  \__/  |  | 


lib: functional base library

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
// TODO: add immutable.js?


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


export const not_found = -1;


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


// intercept type signatures

export const trace = x => {
  console.log(JSON.stringify(Sign.get(x)));
  return x;
};


//█████ Visualization █████████████████████████████████████████████████████████


/*const ComputationVisualizerProxy = (() => {
    let indentationLevel = 0;
    const indentChar = '  ';

    const stringifyArgs = (args) => {
       try {

            return Array.from(args).map(arg => {
                if (typeof arg === 'function') return `[Function ${arg.name || 'anonymous'}]`;
                if (typeof arg === 'undefined') return 'undefined';
                if (arg === null) return 'null';
                try {
                    return JSON.stringify(arg, (key, value) =>
                        typeof value === 'bigint' ? value.toString() + 'n' : value
                    );
                } catch (e) {
                    return arg.toString();
                }
            }).join(', ');
        } catch (e) {
            return '[Error stringifying args]';
        }
    };

     const stringifyResult = (result) => {
        if (typeof result === 'undefined') return 'undefined';
        if (typeof result === 'function') return `[Function ${result.name || 'anonymous'}]`;
        if (result === null) return 'null';
        try {
             return JSON.stringify(result, (key, value) =>
                 typeof value === 'bigint' ? value.toString() + 'n' : value
             );
        } catch (e) {
              try {
                 return result.toString();
              } catch (e2) {
                 return '[Unstringifiable result]';
              }
        }
     };

    const visualize = (originalFunc, name = originalFunc.name || 'anonymous') => {
        if (typeof originalFunc !== 'function') {
            console.warn(`ComputationVisualizerProxy: Input '${name}' is not a function.`);
            return originalFunc;
        }

        const handler = {
            apply(target, thisArg, argumentsList) {
                const currentIndent = indentChar.repeat(indentationLevel);


                if (console.groupCollapsed) {
                     console.groupCollapsed(`${currentIndent}-> ${name}(${stringifyArgs(argumentsList)})`);
                } else {
                     console.log(`${currentIndent}-> ${name}(${stringifyArgs(argumentsList)})`);
                }

                indentationLevel++;

                let result;
                try {


                    result = Reflect.apply(target, thisArg, argumentsList);


                    indentationLevel--;
                    console.log(`${currentIndent}<- ${name} returned: ${stringifyResult(result)}`);

                } catch (error) {

                    indentationLevel--;
                    console.error(`${currentIndent}<- ${name} threw: ${error}`);

                    throw error;

                } finally {
                     if (console.groupEnd) {
                         console.groupEnd();
                     }

                     if (indentationLevel < 0) {
                         console.warn("ComputationVisualizerProxy: Indentation level mismatch detected.");
                         indentationLevel = 0;
                     }
                }

                return result;
            }
        };

        return new Proxy(originalFunc, handler);
    };


    return {
        visualize: visualize
    };
})();


let fibonacci = (n) => {
    if (n <= 0) return 0;
    if (n === 1) return 1;

    return fibonacci(n - 1) + fibonacci(n - 2);
};

let factorial = function fact(n) {
    if (n < 0) throw new Error("Negative factorial");
    if (n === 0) return 1n;



    return BigInt(n) * factorial(n - 1);
};

console.log("--- Wrapping functions (rebinding required for recursion) ---");
fibonacci = ComputationVisualizerProxy.visualize(fibonacci, 'Fibonacci');
factorial = ComputationVisualizerProxy.visualize(factorial, 'Factorial');
console.log("--- Functions wrapped ---");

console.log("\n--- Calculating Fibonacci(4) ---");
const fibResult = fibonacci(4);
console.log("Final Fibonacci Result:", fibResult);

console.log("\n--- Calculating Factorial(5) ---");
try {
    const factResult = factorial(5);
    console.log("Final Factorial Result:", factResult);
} catch(e) {
    console.error("Factorial calculation failed:", e);
}

let simpleAdd = (a, b) => a + b;
simpleAdd = ComputationVisualizerProxy.visualize(simpleAdd, 'Add');

console.log("\n--- Calculating Add(10, 25) ---");
const addResult = simpleAdd(10, 25);
console.log("Final Add Result:", addResult);

console.log("\n--- Calculating Factorial(-3) ---");
try {
    factorial(-3);
} catch (e) {
    console.log("Caught expected error from Factorial.");
}*/


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ WELL-KNOWN COMBINATORS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const id = x => x;


export const comp = f => g => x => f(g(x));


export const pipe = g => f => x => f(g(x));


export const compn = (...fs) => fs.reduce((acc, f) => comp(f) (acc), id);


export const pipen = (...fs) => fs.reduce((acc, f) => pipe(f) (acc), id);


export const lift = f => g => x => y => f(g(x)) (g(y));


export const liftl = f => g => x => y => f(g(x) (y));


export const liftr = f => g => x => y => f(x) (g(y));


export const constl = x => y => x;


export const constr = x => y => y;


export const curry = f => x => y => f(x, y);


export const uncurry = f => (x, y) => f(x) (y);


export const partial = (f, ...args) => (...args2) => f(...args, ...args2);


export const flip = f => y => x => f(x) (y);


export const app = f => x => f(x);


export const appr = x => f => f(x);


// flipped arguments

export const appf = (f, y) => x => f(x) (y);


// object notation with self-reference like `this`

export const reify = f => f({});


export const appObj = f => o => 
  Object.values(o).reduce((acc, v) => acc(v), f);


export const appTuple = f => xs =>
  xs.reduce((acc, x) => acc(x), f);


// mimic let bindings

export const _let = (...args) => ({in: f => f(...args)});


// explicit scope

export const scope = f => f();


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
}


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


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ TYPE SIGNATURES ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Sign = {};


Sign.get = x => {
  if (x === null) return "Nul";
  else if (x === undefined) return "Und";

  else if (typeof x === "object") {
    const tag = Object.prototype.toString.call(x).slice(8, -1);

    switch (tag) {
      case "Array": return `[${Sign.arr(x)}]`;
      case "Boolean": return "Bol{}";
      case "Date": return "Dat{}";
      case "Map": return `Map<${Sign.map(x)}>`;
      case "Number": return "Num{}";
      case "Promise": return "Pro{}";
      case "RegExp": return "Rex{}";
      case "Set": return `Set<${Sign.set(x)}>`;
      case "String": return "Str{}";
      case "Symbol": return "Sym{}";
      case "WeakMap": return `Wap<${Sign.map(x)}>`;
      case "WeakRef": return "Ref{}";
      case "WeakSet": return `Wet<${Sign.set(x)}>`;
      
      case "Object": {
        if (x?.[$]) return `${x[$]}{${Sign.obj(x)}}`;

        else {
          const name = x?.constructor?.name === "Object"
            ? "" : x.constructor.name;

          return `${name}{${Sign.obj(x)}}`;
        }
      }

      default: throw new Err(`unknown tag "${tag}`);
    }
  }

  else switch (Object.prototype.toString.call(x).slice(8, -1)) {
    case "Boolean": return "Boo";
    case "BigInt": return "Big";
    case "Function": return "=>";
    case "NaN": return "NaN";
    case "Null": return "Nul";
    case "Number": return "Num";
    case "String": return "Str";
    case "Undefined": return "Und";

    default: {

    }
  }
};


Sign.arr = xs => {
  const s = xs.reduce((acc, x) => {
    return acc.add(Sign.get(x))
  }, new Set());

  return Array.from(s).join(",");
};


Sign.set = s => {
  const s2 = Array.from(s).reduce((acc, x) => {
    return acc.add(Sign.get(x))
  }, new Set());

  return Array.from(s2).join(",");
};


Sign.map = m => {
  const s2 = Array.from(m).reduce((acc, pair) => {
    return acc.add(`${Sign.get(pair[0])}:${Sign.get(pair[1])}`);
  }, new Set());

  return Array.from(s2).join(",");
};


Sign.obj = o => {
  const s2 = Object.entries(o).reduce((acc, pair) => {
    return acc.add(`${Sign.key(pair[0])}:${Sign.get(pair[1])}`);
  }, new Set());

  return Array.from(s2).join(",");
};


Sign.key = x => {
  if (Object.prototype.toString.call(x).slice(8, -1) === "Symbol")
    return "Sym";

  else return x;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


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


A.filter = p => xs => xs.filter(x => p(x));


A.foldl = f => init => xs => {
  let acc = init?.[NEW] ? init() : init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc, xs[i]);

  return acc;
};


// fold while using the index

A.foldi = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc, xs[i], i);

  return acc;
};


// stack-safe right-associative
// TODO: uncurry

A.foldr = f => acc => xs => Stack(i => {
  if (i === xs.length) return Stack.Base(acc);

  else return Stack.Call(
    f(xs[i]),
    Stack.Rec(i + 1));
}) (0);


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
    acc = dict.append(acc) (f(xs[i]));

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
  let m = Number.POSITIVE_INFINITY
  for (const n of xs) if (n < m) m = n;
  return m;
};


A.max = xs => {
  let m = Number.NEGATIVE_INFINITY
  for (const n of xs) if (n > m) m = n;
  return m;
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


// Applicative f => (a -> f b) -> t a -> f (t b)
// should be used with immutable.js

A.mapA = dict => f => xs => {
  return xs.reduce((acc, x) =>
    dict.ap(dict.map(A.snoc) (f(x))) (acc), dict.of([]));
};


// Applicative f => t (f a) -> f (t a)
// should be used with immutable.js

A.seqA = dict => xs => {
  return xs.reduce((acc, x) =>
    dict.ap(dict.map(A.snoc) (x)) (acc), dict.of([]));
};


A.append = xs => ys => xs.concat(ys);


A.empty = () => [];


A.alt = A.append;


A.zero = A.empty;


// should be used with immutable.js

A.scanl = f => init => A.foldl(acc => x =>
  acc.concat([f(acc[acc.length - 1], x)]))
    ([init]);


// should be used with immutable.js

A.scanr = f => init => A.foldr(x => acc =>
  acc.concat([f(x, acc[0])]))
    ([init]);


// left associative, eager unfold due to non-recursive array data type

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


// set a focus on an array without altering it (immutable slice)

A.focus = ({from, to}) => xs => new Proxy(xs, {
  get: (ys, i, _this) => {
    const tag = typeof i;

    if (i === "length") return to - from + 1;

    else if (tag === "number"
      || tag === "string" && /^\d+$/.test(i)) {
        const i2 = Number(i) + from;

        if (i2 >= from && i2 <= to) return ys[i2];
        else return undefined;
    }

    const o = Reflect.get(ys, i, _this);
    
    if (typeof o === "function" && Array.prototype.hasOwnProperty(i)) {
      return o.bind(_this);
    }
 
    return o;
  },

  has: (ys, i) => {
    const tag = typeof i;
  
    if (i === "length") return true;

    else if (tag === "number"
      || tag === "string" && /^\d+$/.test(i)) {
        const i2 = Number(i) + from;
        return i2 >= from && i2 <= to && i2 in ys;
    }

    else return Reflect.has(ys, i);
  }
});


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


A.span = p => xs => {
  const ys = [];

  for (let i = 0; i < xs.length; i++) {
    if (p(xs[i])) ys.push(xs[i]);
    else break;
  }

  return [ys, xs.slice(ys.length)];
};


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


/* Group all consecutive elements by applying a predicate to each element.
If the predicate succeeds the element is pushed onto the current subgroup,
otherwise a new subgroup is created. */

A.groupBy = p => xs => Loop2((acc, i) => {
  if (i >= xs.length) return Loop2.Base(acc);
  if (acc.length === 0) acc.push([xs[0]]);

  if (p(xs[i])) {
    acc[acc.length - 1].push(xs[i]);
    return Loop2.Rec(acc, i + 1);
  }
  
  else {
    acc.push([xs[i]]);
    return Loop2.Rec(acc, i + 1);
  }
}) ([], 1);


// zipping

A.zip = xs => ys => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.Base(acc);
  else if (i === ys.length) return Loop2.Base(acc);

  else {
    acc.push([xs[i], ys[i]]);
    return Loop2.Rec(acc, i + 1);
  }
}) ([], 0);


A.zipWith = f => xs => ys => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.Base(acc);
  else if (i === ys.length) return Loop2.Base(acc);
  else return Loop2.Rec((acc.push(f(xs[i]) (ys[i])), acc), i + 1);
}) ([], 0);


A.unzip = () => A.foldl(([x, y], [xs, ys]) =>
  [(xs.push(x), xs), (ys.push(y), ys)]) ([[], []]);


// TODO: A.unzipWith


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


// group all overlapping, consecutive elements of a predefined length

A.consec = len => xs => {
  const ys = [];

  if (len > xs.length) return ys;

  else for (let i = 0; i + len <= xs.length; i++)
    ys.push(xs.slice(i, i + len));

  return ys;
};


// group all overlapping, consecutive elements within a predefined range

A.consecs = ({min, max}) => xs => {
  let ys = [];
  for (let i = min; i <= max; i++) ys = ys.concat(A.consec(i) (xs));
  return ys;
};


/* Collect all subsequences including those with index gaps. Since for the
general type [a] there is no effective pruning, the algorithm becomes slow very
quickly. In this case, you can implement a version for a specialized type that
relies on pruning like the version for [Number] below. */

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


// specialized pruned powerset

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


// determine all permutations (only use with very constrained arrays)

A.perms = xs => {
  if (xs.length === 0) return [[]];
  
  else return xs.flatMap((x, i) =>
    A.perms(xs.filter((y, j) => i !== j))
      .map(ys => [x, ...ys]));
};


A.transpose = xss => {
  return xss.reduce((acc, xs) => {
    return xs.map((x, i) => {
      const ys = acc[i] || [];
      return (ys.push(x), ys);
    });
  }, []);
};


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
    .replaceAll(new RegExp(`(?<=${sep}|^)${delim}{2}(?=${sep}|$)`, "gmv"), "") 
    .replaceAll(new RegExp(`${delim}{3}`, "gv"), "<delim/>") 
    .replaceAll(new RegExp(
      `((?:${sep}|^)${delim})([^${delim}\n]+)(${delim}(?:${sep}|$))`, "gmv"), (...args) => {
        let s = args[2].replaceAll(new RegExp(sep, "g"), "<sep/>");
        if (args[1].startsWith(sep)) s = sep + s;
        if (args[3].endsWith(sep)) s += sep;
        return s;
      });

  if (new RegExp(delim, "g").test(csv2)) throw new Err("malformed delimiter")

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


/* Stack-safe implementation of continuations in continuation passing style.
Intended use cases:

  * async computations in serial/parallel
  * sync computations in CPS

The type is based on a trampoline, i.e. you must interpret expressions of this
type using `Cont.interpret`. */


export const Cont = resume => ({
  [$]: "Cont",
  [$$]: "Cont",
  resume
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TYPES ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Cont.Pause = thunk => ({
  [$]: "Cont.Tramp",
  [$$]: "Cont.Pause",
  thunk
});


Cont.Done = value => ({
  [$]: "Cont.Tramp",
  [$$]: "Cont.Done",
  value
});


Cont.Err = reason => ({
  [$]: "Cont.Tramp",
  [$$]: "Cont.Err",
  reason
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


//█████ Generic ███████████████████████████████████████████████████████████████


Cont.comp = f => g => x => Cont((res, rej) =>
  Cont.Pause(() => Cont.chain(g(x)) (f).resume(res, rej)));


Cont.foldl = f => acc => o => Cont((res, rej) => Cont.Pause(() => {
  return o.resume(it => {
    for (const x of it) acc = f(acc) (x);
    return res(acc);
  }, rej);
}));


Cont.filter = p => acc => o => Cont((res, rej) => Cont.Pause(() => {
  const xs = [];

  return o.resume(it => {
    for (const x of it) p(x) ? xs.push(x) : noop;
    return res(acc);
  }, rej);
}));


Cont.map = f => o => Cont((res, rej) =>
  Cont.Pause(() => o.resume(x => res(f(x)), rej)));


Cont.mapEff = x => Cont.map(_ => x);


Cont.foldMap = dict => f => it => {
  let m = Cont.of(dict.empty());

  for (const x of it)
    m = Cont.chain(m) (acc => Cont.of(dict.append(acc) (f(x))));

  return m;
};


Cont.ap = o => p => Cont((res, rej) => Cont.Pause(() =>
  o.resume(f =>
    p.resume(x =>
      res(f(x)), rej), rej)));


Cont.apEffl = o => p => Cont.ap(Cont.map(constl) (o)) (p);


Cont.apEffr = o => p => Cont.ap(Cont.map(constr) (o)) (p);


Cont.liftA = f => o => p => Cont.ap(Cont.map(f) (o)) (p);


Cont.chain = m => f => {
  return Cont((res, rej) => Cont.Pause(() => m.resume(x => {
    if (x === undefined || x === null || x !== x)
      return rej(new Err(x));
    
    else {
      const o = f(x);
      if (o?.[$] !== "Cont") throw new Err("trampoline expected");
      else return o.resume(res, rej);
    }
  },

  e => rej(e))));
};


Cont.of = x => Cont((res, rej) => Cont.Pause(() => res(x)));


// Cont.seqA @Cont.All.arr


Cont.mapA = f => it => {
  let acc = Cont.of([]);
  for (const x of it) acc = Cont.liftA(A.append) (f(x)) (acc);
  return acc;
};


Cont.zero = _ => Cont((res, rej) =>
  Cont.Pause(() => rej(new Err("zero continuation"))));


Cont.alt = o => p => Cont((res, rej) =>
  Cont.Pause(() => o.resume(res, _ => p.resume(res, rej))));


// typically used within a sequence of monadic computations

Cont.guard = b => b ? Cont.of(null) : Cont.zero;


Cont.assume = it => {
  let o = Cont.zero;
  for (const p of it) o = Cont.alt(o) (p);
  return o;
};


Cont.append = dict => o => p => Cont((res, rej) => Cont.Pause(() =>
  o.resume(x =>
    p.resume(y =>
      res(dict.append(x) (y)), rej), rej)));


Cont.empty = dict => Cont((res, rej) =>
  Cont.Pause(() => res(dict.empty())));


//█████ Specific ██████████████████████████████████████████████████████████████


Cont.pipe = g => f => x => Cont((res, rej) =>
  Cont.Pause(() => Cont.chain(g(x)) (f).resume(res, rej)));


Cont.and = o => p => Cont((res, rej) =>
  Cont.Pause(() => o.resume(x => p.resume(y => res([x, y])))));


Cont.forever = o => Cont.chain(o) (_ => Cont.forever(c)); // TODO: make stack safe


Cont.reject = e => Cont((res, rej) => Cont.Pause(() => rej(e)));


Cont.validate = p => o => Cont.chain(c) (x =>
  p(x) ? Cont.of(x) : Cont.reject(new Err("unsatisfied")));


Cont.fromPromise = px => Cont((res, rej) =>
  Cont.Pause(() => px.then(x => res(x)).catch(e => rej(e))));


Cont.tryCatch = f => o => Cont((res, rej) =>
  Cont.Pause(() => o.resume(id, e => res(f(e)))));


Cont.tryThrow = o => Cont((res, rej) =>
  Cont.Pause(() => o.resume(id, e => {throw e})));


// run a finalizer after computation finishes, regardless of success or failure

Cont.finalize = finalizer => computation => Cont((res, rej) =>
  Cont.Pause(() =>
    computation.resume(
      x => finalizer.resume(_ => res(x), e => rej(e)),
      e => finalizer.resume(_ => rej(e), e2 => rej(e2))
    )
  )
);


// only for syncronous computations

Cont.mapCont = f => o => Cont((res, rej) =>
  Cont.Pause(() => f(Cont.interpret(o))));


Cont.capture = f => o => Cont((res, rej) =>
  Cont.Pause(() => o.resume(f(res), rej)));


Cont.interrupt = res => x => Cont((_, rej) => Cont.Pause(() => res(x)));


Cont.async = f => x => Cont((res, rej) =>
  Cont.Pause(() => Promise.resolve(x)
    .then(y => f(y).resume(res, rej))
    .catch(rej)));


//█████ Serial ████████████████████████████████████████████████████████████████


Cont.All = {};


Cont.All.arr = xs => {
  return xs.reduce((acc, o) => {
    return Cont((res, rej) => {
      return Cont.Pause(() => {
        return acc.resume(ys => {
          return o.resume(x => {
            ys.push(x);
            return res(ys);
          }, rej);
        }, rej);
      });
    });
  }, Cont.of([]));
};


Cont.seqA = Cont.All.arr;


Cont.All.obj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return Cont((res, rej) => {
      return Cont.Pause(() => {
        return acc.resume(p => {
          return o[key].resume(x => {
            p[key] = x;
            return res(p);
          }, rej);
        }, rej);
      });
    });
  }, Cont.of({}));
};


//█████ Parallel ██████████████████████████████████████████████████████████████


Cont.Par = {};


Cont.Par.and = o => p => Cont((res, rej) => {
  return Cont.Pause(() => {
    const pair = Array(2);
    let i = 0;

    return [o, p].map((q, j) => {
      return q.resume(x => {
        if (i < 2) {
          if (pair[j] === undefined) {
            pair[j] = x;
            i++;
          }

          if (i === 2) return res(pair);
          else return null;
        }

        else return res(pair);
      }, rej);
    });
  });
});


Cont.Par.all = xs => {
  if (xs.length === 0) throw new Err("empty array");
  else return xs.reduce((acc, x) => Cont.Par.and(acc) (x));
};


Cont.Par.race = o => p => Cont((res, rej) => {
  return Cont.Pause(() => {
    let done = false;

    return [o, p].map(q => {
      return q.resume(x => {
        if (!done) {
          done = true;
          return res(x);
        }

        else return null;
      }, rej);
    });
  });
});


Cont.Par.never = Cont((res, rej) => Cont.Pause(() => null));


Cont.Par.raceAll = xs => {
  return xs.reduce((acc, o) => {
    return Cont.Par.race(acc) (o);
  }, Cont.Par.never);
};


//█████ Interpreter ███████████████████████████████████████████████████████████


Cont.interpret = o => {
  let initialStep = o.resume(
    x => Cont.Done(x),
    e => Cont.Err(e));

  function go(step) {
    if (step?.[$$] === "Cont.Pause") {
      outer: while (true) {
        step = step.thunk();

        if (step?.constructor?.name === "Promise") {
          step.then(go);
          break;
        }

        else switch (step?.[$$]) {
          case "Cont.Done": break outer;
          case "Cont.Err": throw step;
          case "Cont.Pause": break;
          default: throw new Err("trampoline constructor expected");
        }
      }
    }
    
    else throw new Err("invalid trampoline state");

    return step; // return for sync case
  }

  return go(initialStep); // return for sync case
};


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
    case "iso": xs = Rex.iso.dates; break;
    case "de-DE": xs = Rex.i18n.deDE.dates; break;
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
  for (const rx of Rex.iso.times) {
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
  intro(x) === "Error" ? x : intro(x) === "Error" ? y : dict.append(x) (y);


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

F.append = dict => f => g => x => dict.append(f(x)) (g(x));

// monoid

F.empty = dict => _ => monoid.empty();


// comonad extend

F.extend = dict => f => g => x => f(y => g(dict.append(x) (y)));


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


It.filter = p => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else if (p(o.value)) yield o.value;
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


It.append = ix => function* (iy) {
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


// TODO: unzipWith


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


//█████ Foldable ██████████████████████████████████████████████████████████████


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
    else acc = dict.append(acc) (f(o.value));
  }
};


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
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Map = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


_Map.clone = m => new Map(m);


//█████ Conversion ████████████████████████████████████████████████████████████


_Map.fromAit = () => comp(Cont.fromPromise) (async function (ix) {
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


//█████ Generators ████████████████████████████████████████████████████████████


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


//█████ Getters/Setters ███████████████████████████████████████████████████████


_Map.get = k => m => m.has(k) ? m.get(k) : null;


_Map.getOr = x => k => m => m.has(k) ? m.get(k) : x;


_Map.has = k => m => m.has(k);


_Map.inc = k => m => m.has(k) ? m.set(k, m.get(k) + 1) : m.set(k, 1);


_Map.set = (k, v) => m => m.set(k, v);


_Map.del = k => m => m.delete(k);


_Map.upd = f => k => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)));
  else return m;
};


/* Either update a key by appending the previous and the provided value or just
set the provided value. */

_Map.updOr = f => (k, v) => m => {
  if (m.has(k)) return m.set(k, f(m.get(k)) (v));
  else return m.set(k, v);
};


_Map.updOr_ = f => (k, v) => m => {
  if (m.has(k)) return m.set(k, f(m.get(k), v));
  else return m.set(k, v);
};


//█████ Mappings ████████████████████████████████████████████████████████████████*/


_Map.monthsFullDe = new Map([
  ["Januar", "01"],
  ["Februar", "02"],
  ["März", "03"],
  ["Maerz", "03"],
  ["April", "04"],
  ["Mai", "05"],
  ["Juni", "06"],
  ["Juli", "07"],
  ["August", "08"],
  ["September", "09"],
  ["Oktober", "10"],
  ["November", "11"],
  ["Dezember", "12"]
]);


_Map.monthsShortDe = new Map([
  ["Jan", "01"],
  ["Feb", "02"],
  ["Mär", "03"],
  ["Mar", "03"],
  ["Apr", "04"],
  ["Mai", "05"],
  ["Jun", "06"],
  ["Jul", "07"],
  ["Aug", "08"],
  ["Sep", "09"],
  ["Okt", "10"],
  ["Nov", "11"],
  ["Dez", "12"]
]);


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


_Map.diffr = m => n => {
  const r = new Map();
  for (const [k, v] of n) !m.has(k) ? r.set(k, v) : null;
  return r;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████ MAP :: MULTIMAP :: SET ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Map variant that encodes 1:n-relations between key/value pairs, i.e.
uncertainty. Uses a set for each key and thus ensures uniqueness. */

export class MultiMap extends Map {
  constructor() {
    super();
    this[$] = "MultiMap";
    this[$$] = "MultiMap";
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
  constructor() {
    super();
    this[$] = "MultiMap2";
    this[$$] = "MultiMap2";
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
  x === null ? x : y === null ? y : dict.append(x) (y);


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
    case "iso": xs = Rex.iso.nums; break;
    case "de-DE": xs = Rex.i18n.deDE.nums; break;
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
    .replaceAll(new RegExp("(\\d)(?=(?:\\d{3})+$)", "g"), `$1${sep}`);


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


// immutable object path updates with structural sharing

O.update = ({path, f}) => o => {
  if (path.length === 0) return f(o);

  const [key, ...path2] = path,
    child = o[key];

  const child2 = O.update({path: path2, f}) (child);

  if (child === child2) throw new Err("cycle detected");

  else if (Array.isArray(o) || Object(o) !== o)
    throw new Err("object type expected");

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


O.fromAit = () => comp(Cont.fromPromise) (async function (ix) {
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
█████████████████████████████ REGULAR EXPRESSIONS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Regular expresions work best with complex strings using a divide and conquer
strategy. First, determine the bounds of the region of interest in the string
and than extract individual subpatterns within this region independently of
each other. Accumulate all necessary subpatterns and feed them to a downstream
function along with the original string to take the context into account. */


export const Rex = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Create a more general word boundary pattern (`\b`) by combining the passed
subpattern with its left/right character classes and create a regular expression
from it. */

Rex.bound = ({left, right}) => rx => {
  const flags = left.flags + right.flags + rx.flags;
  return new RegExp(`(?<=^|[${left}])${rx.source}(?=$|[${right}])`, flags);
};


// create only a left boundary

Rex.leftBound = left => rx => {
  const flags = left.flags + rx.flags;
  return new RegExp(`(?<=^|[${left}])${rx.source}`, flags);
};


// create only a right boundary

Rex.rightBound = right => rx => {
  const flags = right.flags + rx.flags;
  return new RegExp(`${rx.source}(?=$|[${right}])`, flags);
};


/* Take an object with properties holding regular expressions and apply each
to the provided string. Store each match under the respective property. */

Rex.extract = o => s =>
  O.fromIt(It.map(([k, rx]) => [k, Rex.matchFirst(rx) (s)]) (O.entries(o)));


Rex.count = rx => s => Array.from(s.matchAll(rx)).length;


Rex.escape = s => s.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');


// generalize from character classes

Rex.generalize = casing => s => {
  if (casing) return s
    .replaceAll(/\p{Lu}/gv, "A")
    .replaceAll(/\p{Ll}/gv, "a")
    .replaceAll(/\p{P}/gv, "·")
    .replaceAll(/\p{S}/gv, "$")
    .replaceAll(/\d/g, "#")
    .replaceAll(/\p{N}/gv, "N")
    .replaceAll(/\p{Z}/gv, "_")
    .replaceAll(/\p{C}/gv, "^")

  else return s
    .replaceAll(/\p{Lu}/gv, "@")
    .replaceAll(/\p{P}/gv, "·")
    .replaceAll(/\p{S}/gv, "$")
    .replaceAll(/\d/g, "#")
    .replaceAll(/\p{N}/gv, "N")
    .replaceAll(/\p{Z}/gv, "_")
    .replaceAll(/\p{C}/gv, "^");
};


// generalize from repetition

Rex.generalize2 = s => s.replaceAll(/(.)\1{1,}/g, "$1");


/* Replace the following characters:

  * redundant newlines or spaces
  * all control chars but newline
  * all special spaces like NBSP */

Rex.normalize = s => s
  .replaceAll(/\r?\n/g, "<nl/>")
  .replaceAll(/[\p{C}\p{Z}]/gv, " ")
  .replaceAll(/ {2,}/g, " ")
  .replaceAll(/^ +/g, " ")
  .replaceAll(/ +$/g, " ")
  .replaceAll(/<nl\/>{2,}/g, "<nl/>")
  .replaceAll(/<nl\/>/g, "\n");


//█████ Character Classes █████████████████████████████████████████████████████


Rex.classes = {};


Rex.classes.alnum = {
  rex: /[\p{L}\p{N}]/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.aldig = {
  rex: /[\p{L}\d]/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.letter = {
  rex: /\p{L}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// upper-case letter

Rex.classes.ucl = {
  rex: /\p{Lu}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// lower-case letter

Rex.classes.lcl = {
  rex: /\p{Ll}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};
    

Rex.classes.num = {
  rex: /\p{N}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.digit = {
  rex: /\d/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// punctuation

Rex.classes.punct = {
  rex: /\p{P}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// space

Rex.classes.space = {
  rex: /\p{Z}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// symbol

Rex.classes.sym = {
  rex: /\p{S}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// currency

Rex.classes.curr = {
  rex: /\p{Sc}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.ctrl = {
  rex: /\p{C}/v,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.crnl = {
  rex: /\r?\n/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};


// ASCII


Rex.classes.ascii = {};


Rex.classes.ascii.aldig = {
  rex: /[[A-Za-z\d]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.ascii.letter = {
  rex: /[A-Za-z]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.ascii.ucl = {
  rex: /[A-Z]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.ascii.lcl = {
  rex: /[a-z]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


// vowels

Rex.classes.ascii.vowels = {
  rex: /[AEUIOaeuio]/,
  
  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


// upper-case vowels

Rex.classes.ascii.ucv = {
  rex: /[AEUIO]/,
  
  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


// lower-case vowels

Rex.classes.ascii.lcv = {
  rex: /[aeuio]/,
  
  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


Rex.classes.ascii.punct = {
  rex: /[!"#$%&'()*+,-./:;<=>?@\[\]\\^_`{|}~]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};


Rex.classes.ascii.ctrl = {
  rex: /[\0\a\b\t\v\f\r\n\cZ]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};


// Latin1 (ISO-8859-1)


Rex.classes.latin1 = {};


Rex.classes.ascii.alnum = {
  rex: /[A-Za-zÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\d²³¹¼½¾]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.ascii.aldig = {
  rex: /[A-Za-zÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\d]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "v");
    return this.split;
  },
};


Rex.classes.latin1.letter = {
  rex: /[A-Za-zÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


Rex.classes.latin1.ucl = {
  rex: /[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞ]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};


Rex.classes.latin1.lcl = {
  rex: /[a-zßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};


// vowels

Rex.classes.latin1.vowels = {
  rex: /[AEUIOÁÀĂÂÅÄÃĀÐÉÈÊĚËĖĘÍÌÎÏĮĪÓÒÔÖŐÕØŌÚÙŬÛŮÜŰŨŲŪaeuioáàăâåäãāðéèêěëėęíìîïįīóòôöőõøōúùŭûůüűũųū]/,
  
  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


// upper-case vowels

Rex.classes.latin1.ucv = {
  rex: /[AEUIOÁÀĂÂÅÄÃĀÐÉÈÊĚËĖĘÍÌÎÏĮĪÓÒÔÖŐÕØŌÚÙŬÛŮÜŰŨŲŪ]/,
  
  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


// lower-case vowels

Rex.classes.latin1.lcv = {
  rex: /[aeuioáàăâåäãāðéèêěëėęíìîïįīóòôöőõøōúùŭûůüűũųū]/,
  
  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "i");
    return this.split;
  },
};


Rex.classes.latin1.punct = {
  rex: /[!"#$%&'()*+,-./:;<=>?@\[\]\\^_`{|}~€‚„…†‡ˆ‰‹‘’“”•–­—˜™›¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};

  
Rex.classes.latin1.curr = {
  rex: /[¤$€£¥¢]/,

  get split() {
    delete this.split;
    this.split = new RegExp(`(?<=${this.rex.source})(?!${this.rex.source})|(?<!${this.rex.source})(?=${this.rex.source})`, "");
    return this.split;
  },
};


//█████ Slicing ███████████████████████████████████████████████████████████████


// composable combinators to slice substrings of greater strings


Rex.sliceFrom = f => s => {
  const is = f(s);
  if (is.length === 0) return s;
  else return s.slice(is[0]);
};


// excluding the delimiter

Rex.sliceFromEx = f => s => {
  const is = f(s);
  if (is.length === 0) return s;
  else return s.slice(is[0] + 1);
};


Rex.sliceUpTo = f => s => {
  const is = f(s);
  if (is.length === 0) return s;
  else return s.slice(0, is[0] + 1);
};


// excluding the delimiter

Rex.sliceUpToEx = f => s => {
  const is = f(s);
  if (is.length === 0) return s;
  else return s.slice(0, is[0]);
};


//█████ Splitting █████████████████████████████████████████████████████████████


/* Split a string based on certain transitions of character classes defined by
regular expressions in the following form:

  (?<=charClass)(?!charClass)|(?<!charClass)(?=charClass)

The combinator is meant to be used with the predefined character classes in this
section. If you need more granular control, use one of the split combinators from
the string section. */

Rex.splitAt = flags => (...rs) => s => s.split(
  new RegExp(rs.map(rx => rx.source).join("|"), flags));


Rex.splitAtLetter = Rex.splitAt("v") (Rex.classes.letter.split);


Rex.splitAtCasing = Rex.splitAt("v")
  (Rex.classes.ucl.split, Rex.classes.lcl.split);


// unicode number class

Rex.splitAtNum = Rex.splitAt("v") (Rex.classes.num.split);


// only ascii digits

Rex.splitAtDig = Rex.splitAt("v") (Rex.classes.digit.split);


Rex.splitAtAlnum = Rex.splitAt("v") (Rex.classes.alnum.split);


Rex.splitAtAldig = Rex.splitAt("v") (Rex.classes.aldig.split);


Rex.splitAtNonAlnum = Rex.splitAt("v") (
  Rex.classes.punct.split,
  Rex.classes.sym.split,
  Rex.classes.space.split,
  Rex.classes.crnl.split);


// split into the smallest possible tokens

Rex.splitAtToken = Rex.splitAt("v") (
  Rex.classes.num.split,
  Rex.classes.punct.split,
  Rex.classes.sym.split,
  Rex.classes.space.split,
  Rex.classes.crnl.split,
  /(?<=\p{Ll})(?=\p{Lu})/v); // "fooBar" -> "foo Bar"


//█████ Consolidating █████████████████████████████████████████████████████████


/* Re-merge tokens that form a meaningful composition and were separated with
`Rex.splitAtToken` or another splitting combinator. */

Rex.consolidate = xs => {
  const ys = [];

  for (let i = 0; i < xs.length; i++) {
    const prev2 = i <= 1 ? "" : xs[i - 2],
      prev = i === 0 ? "" : xs[i - 1],
      curr = xs[i],
      next = i + 1 >= xs.length ? "" : xs[i + 1],
      next2 = i + 2 >= xs.length ? "" : xs[i + 2];

    // edge case: id S . -> idS .

    if (/^\p{Ll}{1,2}$/v.test(prev)
      && /^\p{Lu}/v.test(curr)
      && next === ".") {
        ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else if (curr === "-") {

      // Mund-zu-Mund-Beatmung

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // 3-fach

      else if (/\p{N}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // -fach

      else if (prev === " " && /\p{L}/v.test(next))
        ys.push({s: curr + next, is: [i, i + 1]});

      // Fach-

      else if (/\p{L}/v.test(prev) && next === " ")
        ys.push({s: prev + curr, is: [i - 1, i]});

      // Fach-\nschule

      else if (/\p{L}/v.test(prev)
        && /\r?\n/.test(next)
        && /\p{L}/v.test(next2))
          ys.push({s: prev + next2, is: [i - 1, i, i + 1, i + 2]});

      // -123

      else if (prev === " " && /\p{N}/v.test(next))
        ys.push({s: curr + next, is: [i, i + 1]});

      // 1-100

      else if (/\d/.test(prev) && /\d/.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // Dipl.-Ing.

      else if (/\p{L}/v.test(prev2)
        && prev === "."
        && /\p{L}/v(next))
          ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === ".") {

      // z.B.

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      else if (/\p{L}/v.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});

      // Dipl.-Ing.

      else if (/\p{L}/v.test(prev)
        && next === "-"
        && /\p{L}/v.test(next2))
          ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // 0.1

      else if (/\d/.test(prev) && /\d/.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === "'") {
    
      // Max'

      if (/\p{L}/v.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});

      // 'ne

      else if (/[ .;\r\n]|^$/.test(prev) && /\p{L}/v.test(next))
        ys.push({s: curr + next, is: [i, i + 1]});

      // Newton'sche

      else if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === ",") {

      // 0,1

      if (/\d/.test(prev) && /\d/.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === "/") {

      // 1/3

      if (/\d/.test(prev) && /\d/.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // http://www

      else if (prev === ":" && next === "/")
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      else if (prev2 === ":" && prev === "/" && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === ":") {

      // Lehrer:innen

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // http://www

      else if (/\p{L}/v.test(prev) && next === "/" && next2 === "/")
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === '"') {

      // 19"

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else if (curr === "%") {

      // 100%

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else if (curr === "&") {

      // H&M

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});


      // H & M

      if (/\p{L}/v.test(prev2)
        && prev === " "
        && next === " "
        && /\p{L}/v.test(next2)) {
          ys.push({
            s: prev2 + prev + curr + next + next2,
            is: [i - 2, i - 1, i, i + 1, i + 2]
          });
      }
    }

    else if (curr === "€") {

      // 10€

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});

      // 10 €
      
      if (/\d/.test(prev2) && prev === " ")
        ys.push({s: prev2 + prev + curr, is: [i - 2, i - 1, i]});
    }

    else if (curr === "$") {

      // 10$

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});

      // 10 $
      
      if (/\d/.test(prev2) && prev === " ")
        ys.push({s: prev2 + prev + curr, is: [i - 2, i - 1, i]});
    }

    else if (curr === "+") {
      
      // +100

      if (/[ .;\r\n]|^$/.test(prev) && /\d/.test(next))
        ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else if (curr === "@") {

      // info@mail.com

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }
    
    else if (curr === "*") {

      // Lehrer*innen

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === "_") {

      // Lehrer_innen

      if (/\p{L}/v.test(prev) && /\p{L}/v.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === "§") {
      
      // §100

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else if (curr === "°") {

      // 100°C

      if (/\d/.test(prev) && next === "C")
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});

      // 100°

      else if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});

    }

    else if (curr === ".." || curr === "...") {
      
      // 1..10 or 1...10

      if (/\d/.test(prev) && /\d/.test(next))
        ys.push({s: prev + curr + next, is: [i - 1, i, i + 1]});
    }

    else if (curr === ".-" || curr === ".--") {

      // 1.- or 1.--

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else if (curr === ",-" || curr === ",--") {

      // 1.- or 1.--

      if (/\d/.test(prev)) ys.push({s: prev + curr, is: [i - 1, i]});
    }

    else ys.push({s: curr, is: [i]});
  }

  const zs = [ys[0]];

  for (const curr of ys) {
    const last = zs[zs.length - 1],
      dupes = curr.is.length + last.is.length,
      uniqs = new Set([...curr.is, ...last.is]);

    if (last === curr) continue;
    else if (dupes === uniqs.size) zs.push(curr);

    else if (dupes - uniqs.size === last.is.length
      || dupes - uniqs.size === curr.is.length) {
        if (last.is.length < curr.is.length) {
          last.s = curr.s;
          last.is = curr.is;
        }
    }

    else {
      const o = {s: "", is: []};

      Array.from(uniqs).sort((m, n) => m - n).forEach(i => {
        o.s += xs[i];
        o.is.push(i);
      });

      last.s = o.s;
      last.is = o.is;
    }
  }

  return zs.map(o => o.s);
};


//█████ Matching ██████████████████████████████████████████████████████████████


Rex.matchAll = rx => s => s.matchAll(rx);


// strict variant

Rex.matchAll_ = rx => s => Array.from(s.matchAll(rx));


Rex.matchAllWith = p => rx => s => Rex.matchAll(rx) (s).filter(p);


Rex.matchFirst = rx => s => {
  const r = s.match(rx);
  if (r === null) return [];
  else return [r];
};


Rex.matchFirstWith = p => rx => s => Rex.matchAllWith(p) (rx) (s).slice(0, 1);


Rex.matchLast = rx => s => Rex.matchAll(rx) (s).slice(-1);


Rex.matchLastWith = p => rx => s => Rex.matchAllWith(p) (rx) (s).slice(-1);


// considers negative indices like slice

Rex.matchNth = (rx, i) => s => {
  const xs = Rex.matchAll(rx) (s);
  if (xs.length - 1 < i) return [];
  else if (i >= 0) return xs.slice(i, i + 1);
  else return [xs.slice(i) [0]];
};


// considers negative indices like slice

Rex.matchNthWith = p => (rx, i) => s => {
  const xs = Rex.matchAllWith(rx) (s), o = xs[i];
  if (xs.length - 1 < i) return [];
  else if (i >= 0) return xs.slice(i, i + 1);
  else return [xs.slice(i) [0]];
};


//█████ Replacing █████████████████████████████████████████████████████████████


Rex.replaceAll = t => rx => s => s.replaceAll(rx, t);


Rex.replaceAllWith = f => rx => s => {
  return s.replaceAll(rx, (...args) => {
    const groups = typeof args[args.length - 1] === "object"
      ? args.pop() : {};

    const s = args.shift(), matches = [];
    let i;

    while (true) {
      const arg = args.shift();
      
      if (typeof arg === "number") {
        i = arg;
        break;
      }
      
      else matches.push(arg);
    }
      
    return f({s, i, matches, groups});
  });
};


Rex.replaceFirst = t => rx => s => {
  if (rx.flags.search("g") !== NOT_FOUND)
    throw new Err("unexpected global flag");

  return s.replace(rx, t);
};


Rex.replaceFirstWith = f => rx => s => {
  if (rx.flags.search("g") !== NOT_FOUND)
    throw new Err("unexpected global flag");

  return s.replace(rx, (...args) => {
    const groups = typeof args[args.length - 1] === "object"
      ? args.pop() : {};

    const s = args.shift(), matches = [];
    let i;

    while (true) {
      const arg = args.shift();
      
      if (typeof arg === "number") {
        i = arg;
        break;
      }
      
      else matches.push(arg);
    }
      
    return f({s, i, matches, groups});
  });
};


Rex.replaceLast = t => rx => s => {
  if (rx.flags.search("g") === NOT_FOUND)
    throw new Err("missing global flag");

  const xs = s.match(rx);

  if (xs.length === 0) return s;

  else {
    const match = xs[xs.length - 1],
      i = match.index
      len = match.length;
    
    return str.slice(0, i) + t + str.slice(i + len);
  }
};


Rex.replaceLastWith = f => rx => s => {
  if (rx.flags.search("g") === NOT_FOUND)
    throw new Err("missing global flag");

  const xs = s.match(rx);

  if (xs.length === 0) return s;

  else {
    const match = xs[xs.length - 1],
      matches = Array.from(match),
      i = match.index
      len = match.length;

    return str.slice(0, i)
      + f({s, i, matches, groups: match.groups})
      + str.slice(i + len);
  }
};


// considers negative indices like slice

Rex.replaceNth = t => (rx, i) => s => {
  if (rx.flags.search("g") === NOT_FOUND)
    throw new Err("missing global flag");

  const xs = s.match(rx);

  if (xs.length - 1 < i) return s;

  else if (i >= 0) {
    const match = xs[i - 1],
      j = match.index
      len = match.length;
    
    return str.slice(0, j) + t + str.slice(j + len);
  }

  else {
    const match = xs[xs.length + i],
      j = match.index
      len = match.length;
    
    return str.slice(0, j) + t + str.slice(j + len);
  }
};


// considers negative indices like slice

Rex.replaceNthWith = f => (rx, i) => s => {
  if (rx.flags.search("g") === NOT_FOUND)
    throw new Err("missing global flag");

  const xs = s.match(rx);

  if (xs.length - 1 < i) return s;

  else if (i >= 0) {
    const match = xs[i],
      matches = Array.from(match),
      j = match.index
      len = match.length;
    
    return str.slice(0, j)
      + f({s, i: j, matches, groups: match.groups})
      + str.slice(j + len);
  }

  else {
    const match = xs[xs.length + i],
      matches = Array.from(match),
      j = match.index
      len = match.length;
    
    return str.slice(0, j)
      + f({s, i: j, matches, groups: match.groups})
      + str.slice(j + len);
  }
};


//█████ Searching █████████████████████████████████████████████████████████████


Rex.searchAll = rx => s =>
  Array.from(s.matchAll(rx)).map(ix => ix.index);


Rex.searchAllWith = p => rx => s =>
  Rex.matchAll(rx) (s).filter(p).map(ix => ix.index);


Rex.searchFirst = rx => s => {
  if (rx.flags.search("g") !== NOT_FOUND)
    throw new Err("unexpected global flag");

  const i = s.search(rx);

  if (i === NOT_FOUND) return []
  else return [i];
};


Rex.searchFirstWith = p => rx => s => {
  for (const ix of s.matchAll(rx))
    if (p(ix)) return [ix.index];

  return [];
};


Rex.searchLast = rx => s => {
  let last = [];

  for (const ix of s.matchAll(rx))
    last = [ix.index];

  return last;
};


Rex.searchLastWith = p => rx => s => {
  let last = [];

  for (const ix of s.matchAll(rx))
    if (p(ix)) last = [ix.index];

  return last;
};


Rex.searchNth = (rx, i) => s => {
  const xs = [];

  for (const ix of s.matchAll(rx))
    xs.push(ix.index);

  if (xs.length - 1 < i) return [];
  else return [xs[i]];
};


Rex.searchNthWith = p => (rx, i) => s => {
  const xs = [];

  for (const ix of s.matchAll(rx))
    if (p(ix)) xs.push(ix.index);

  if (xs.length - 1 < i) return [];
  else return [xs[i]];
};


//█████ Patterns ██████████████████████████████████████████████████████████████


Rex.iso = {
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


Rex.i18n = {
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

    months: /(\b(Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\b)/,
    months_: /(\b(Jan|Feb|Febr|Mär|Mar|Apr|Mai|Jun|Jul|Aug|Sep|Sept|Okt|Nov|Dez)\b)\.?/,
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Set = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


_Set.clone = s => new Set(s);


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


//█████ Generators ████████████████████████████████████████████████████████████


_Set.entries = s => s[Symbol.iterator] ();


//█████ Getters/Setters ███████████████████████████████████████████████████████


_Set.del = k => s => s.delete(k);


_Set.has = k => s => s.has(k);


_Set.set = k => s => s.add(k);


//█████ Ranges ████████████████████████████████████████████████████████████████


Object.defineProperty(_Set, "_0to9", {
  get() {
    const s = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
    delete this._0to9;
    this._0to9 = s;
    return s;
  },

  configurable: true,
  enumerable: true
});


Object.defineProperty(_Set, "atoz", {
  get() {
    const s = new Set(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]);
    delete this.atoz;
    this.atoz = s;
    return s;
  },

  configurable: true,
  enumerable: true
});


Object.defineProperty(_Set, "atoZ", {
  get() {
    const s = new Set(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"])
    delete this.atoZ;
    this.atoZ = s;
    return s;
  },

  configurable: true,
  enumerable: true
});


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


_Set.diffr = s => t => {
  const r = new Set();
  for (const x of t) !s.has(x) ? r.add(x) : null;
  return r;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STRING ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Str = {}; // namespace


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// split at transitions from ASCII to not ASCII characters

Str.splitAscii = s => {
  return s.split("").reduce((acc, c) => {
    const i = acc.length - 1;
    
    if (acc[i] === "") acc[i] += c;
    else if (acc[i].charCodeAt(0) < 128 && c.charCodeAt(0) < 128) acc[i] += c;
    else acc.push(c);

    return acc;
  }, [""]);
};


// split at character transitions

Str.splitChars = s => {
  return s.split("").reduce((acc, c) => {
    const i = acc.length - 1;
    
    if (acc[i] === "") acc[i] += c;
    else if (acc[i] [0] === c) acc[i] += c;
    else acc.push(c);

    return acc;
  }, [""]);
};


Str.splitChunk = ({size, pad = " ", overlap = false}) => s => {
  const xs = [];

  for (let i = 0; i === i; overlap ? i++ : i += size) {
    if (i >= s.length) break;
    
    else if (i + size >= s.length) {
      xs.push(s.slice(i, i + size).padEnd(size, pad));
      break;
    }
    
    else xs.push(s.slice(i, i + size));
  }

  return xs;
};


Str.count = t => s => {
  let n = 0, offset = 0;

  while (true) {
    const i = s.indexOf(t, offset);
    if (i === -1) break;
    else (n++, offset = i + 1);
  }

  return n;
};


Str.count_ = (s, t) => {
  let n = 0, offset = 0;

  while (true) {
    const i = s.indexOf(t, offset);
    if (i === -1) break;
    else (n++, offset = i + 1);
  }

  return n;
};


Str.countChars = s => s.split("").reduce((acc, c) =>
  _Map.inc(c) (acc), new Map());


/* Try to estimate how likely the given string is a password. Use length,
string entropy, number of used character classes, and number of character
class transitions as indicators. */

Str.isPwd = s => {
  const m = new Map(), m2 = new Map();    

  // upper-case letter in the middle/at the end
  // uses digits and punctuation

  for (let i = 0; i < s.length; i++) {
    let n = 0;

    if (!m.has(s[i])) m.set(s[i], n);

    if (/\p{Lu}/v.test(s[i])) {
      if (!m2.has("Lu")) m2.set("Lu", 26);
    }

    else if (/\p{Ll}/v.test(s[i])) {
      if (!m2.has("Ll")) m2.set("Ll", 26);
    }

    else if (/\p{N}/v.test(s[i])) {
      if (!m2.has("N")) m2.set("N", 10);
    }

    else if (/\p{P}|\p{S}/v.test(s[i])) {
      if (!m2.has("S")) m2.set("S", 32);
    }

    else throw Err(`unexpected character "${s[i]}"`);
  }

  const sum = Array.from(m2)
    .reduce((acc, pair) => acc + pair[1], 0);

  const entropy = sum + Math.log2(m.size),
    numClasses = m2.size,
    numTrans = Rex.splitAtToken(s).length,
    features = numClasses + numTrans,
    score = entropy * Math.log2(numClasses + numTrans);

  return {entropy, numClasses, numTrans, features, score};
};


Str.catWith = s => (...xs) => xs.join(s);


Str.cat = Str.catWith("");


Str.cat_ = Str.catWith(" ");


/* Plain applicator but with a telling name. Intended use:

  Str.template(o => `Happy ${o.foo}, ${o.bar}!`)
    ({foo: "Thanksgiving", bar: "Muad'dib"})

Yields "Happy Thanksgiving, Muad'dib!" */

Str.template = f => o => f(o);


//█████ Diffing ███████████████████████████████████████████████████████████████


Str.Diff = {};


Str.Diff.equivalence = new Map([
  ["ä", "ae"], ["ü", "ue"], ["ö", "oe"], ["ß", "ss"], ["Æ", "Ae"],
  ["æ", "ae"], ["ᴭ", "Ae"], ["ᵆ", "ae"], ["Ǽ", "Ae"], ["ǽ", "ae"],
  ["Ǣ", "Ae"], ["ǣ", "ae"], ["ᴁ", "Ae"], ["ᴂ", "ae"], ["ȸ", "db"],
  ["Ǳ", "Dz"], ["ǲ", "Dz"], ["ǳ", "dz"], ["Ǆ", "Dz"], ["ǅ", "Dz"],
  ["ǆ", "dz"], ["ﬀ", "ff"], ["ﬃ", "ffi"], ["ﬄ", "ffl"], ["ﬁ", "fi"],
  ["ﬂ", "fl"], ["Ĳ", "Ij"], ["ĳ", "ij"], ["Ǉ", "Lj"], ["ǈ", "Lj"],
  ["ǉ", "lj"], ["Ǌ", "Nj"], ["ǋ", "Nj"], ["ǌ", "nj"], ["Œ", "Oe"],
  ["œ", "oe"], ["ᴔ", "oe"], ["ȹ", "qp"], ["ᵫ", "ue"],
]);


Str.Diff.ocr = new Map([
  ["0", ["D", "O", "o"]],
  ["1", ["I", "l"]],
  ["2", ["Z", "z"]],
  ["5", ["S"]],
  ["6", ["b", "G"]],
  ["7", ["T"]],
  ["8", ["S", "B"]],
  ["9", ["g", "q"]],
]);


Str.Diff.ocr_ = new Map([
  ["B", ["8"]],
  ["b", ["6"]],
  ["D", ["0"]],
  ["G", ["6"]],
  ["g", ["9"]],
  ["I", ["1"]],
  ["l", ["1"]],
  ["O", ["0"]],
  ["o", ["0"]],
  ["q", ["9"]],
  ["S", ["5", "8"]],
  ["T", ["7"]],
  ["Z", ["2"]],
  ["z", ["2"]],
]);


Str.Diff.phonetics = new Map([
  ["a", ["ah"]],
  ["ä", ["äh"]],
  ["c", ["k", "z"]],
  ["d", ["dt", "t"]],
  ["e", ["i"]],
  ["f", ["ph"]],
  ["g", ["gh"]],
  ["i", ["e", "ie", "y"]],
  ["k", ["c", "ck"]],
  ["o", ["oh"]],
  ["ö", ["öh"]],
  ["p", ["ph"]],
  ["r", ["rh"]],
  ["s", ["ß", "z"]],
  ["ß", ["s", "ss"]],
  ["t", ["d", "th"]],
  ["u", ["uh"]],
  ["ü", ["üh"]],
  ["y",["i"]],
  ["z", ["c", "s", "ts", "tz"]],
]);


Str.Diff.phonetics2 = new Map([
  ["ah", ["a"]],
  ["äh", ["ä"]],
  ["ck", ["k"]],
  ["dt", ["d", "t"]],
  ["gh", ["g"]],
  ["ie", ["i"]],
  ["oh", ["o"]],
  ["öh", ["ö"]],
  ["ph", ["f", "p"]],
  ["rh", ["r"]],
  ["ss", ["ß"]],
  ["th", ["t"]],
  ["ts", ["z"]],
  ["tz", ["z"]],
  ["uh", ["u"]],
  ["üh", ["ü"]],
]);


Str.Diff.repetition = new Set(
  ["b", "d", "f", "g", "l", "m", "n", "p", "r", "s", "t"]);


// keyboard typos on the x-axis are far more likely than on the y-axis

Str.Diff.keyb = new Map([
  ["q", ["w"]],
  ["w", ["q", "e"]],
  ["e", ["w", "r"]],
  ["r", ["e", "t"]],
  ["t", ["r", "z"]],
  ["z", ["t", "u"]],
  ["u", ["z", "i"]],
  ["i", ["u", "o"]],
  ["o", ["i", "p"]],
  ["p", ["o", "ü"]],
  ["ü", ["p"]],
  ["a", ["s"]],
  ["s", ["a", "d"]],
  ["d", ["s", "f"]],
  ["f", ["d", "g"]],
  ["g", ["f", "h"]],
  ["h", ["g", "j"]],
  ["j", ["h", "k"]],
  ["k", ["j", "l"]],
  ["l", ["k", "ö"]],
  ["ö", ["l", "ä"]],
  ["ä", ["ö"]],
  ["y", ["x"]],
  ["x", ["y", "c"]],
  ["c", ["x", "v"]],
  ["v", ["c", "b"]],
  ["b", ["v", "n"]],
  ["n", ["b", "m"]],
  ["m", ["n"]],
]);


/* Evaluate the difference between two numbers. The algorithm doesn't cover the
following cases:

  * number/letter confusion (e.g. oo123 instead of 00123)
  * unexpected structure (e.g. 123-456 instead of 123456) */

Str.Diff.nums = l => r => {
  let score = 0;

  // too long

  if (l.length > r.length) {
    let offset = 0, s = "";

    for (let i = 0; i < r.length; i++) {
      if (l[i + offset] === r[i]) s += l[i + offset];
      else if (l[i + offset - 1] !== l[i + offset]) continue;
      else (score++, offset++, i--);
    }

    return {score, valid: s === r};
  }

  // too short

  else if (l.length < r.length) {
    let offset = 0, s = "";

    for (let i = 0; i < r.length; i++) {
      if (l[i + offset] === r[i]) s += r[i];
      else if (r[i - 1] !== r[i]) continue;
      else (s += r[i], score++, offset--);
    }

    return {score, valid: s === r};
  }

  // flipped digits

  else {
    let s = "";

    for (let i = 0; i < r.length; i++) {
      if (l[i] === r[i]) s += r[i];
      
      else if (l[i + 1] === r[i] && l[i] === r[i + 1])
        (s += r[i], s += r[i + 1], i++, score += 2);

      else score++;
    }

    return {score, valid: s === r};
  }
};


/* Determine all shared letters while preserving their order for two word-like
strings, i.e. strings without spaces or newlines:
  
  "rethoric" = "rhetoric"
  left difference:  [{s: "h", i: 3}]
  right difference: [{s: "h", i: 1}]

  "Getisburger" = "Gettysburg"
  left difference:  [{s: "ty", i: 3}]
  right difference: [{s: "i", i: 3}, {s: "er", i: 10}]

The first argument is supposed to be the "left", possibly incorrect string,
whereas the second one should be the "right" string used as a benchmark. */

Str.Diff.words = l => r => {
  const s = l.length <= r.length ? l : r,
    t = l.length <= r.length ? r : l,
    s_ = s.toLowerCase(),
    t_ = t.toLowerCase(),
    offset = t.length - s.length;

  const o = diffWords(s_, t_);

  if (t.length - o.indices.length <= t.length / 3) return o;

  const o2 = offset < 2
    ? diffWords(t_, " " + s_ + " ")
    : diffWords(" " + s_ + " ", t_);

  const o3 = diffWords(s_, " " + t_ + " ");
  let o4;

  if (o.indices.length >= o2.indices.length) {
    if (o.indices.length >= o3.indices.length) o4 = o;
    else o4 = o3;
  }

  else if (o2.indices.length >= o3.indices.length) o4 = o2;
  else o4 = o3;

  // reconstruct original casing

  o4.left.diff = {
    ci: o4.left.diff,
    
    cs: o4.left.diff.map(p =>
      Object.assign({}, p, {s: s.slice(p.i, p.i + p.s.length)}))
  };

  o4.right.diff = {
    ci: o4.right.diff,
    
    cs: o4.right.diff.map(p =>
      Object.assign({}, p, {s: t.slice(p.i, p.i + p.s.length)}))
  };

  o4.left.s = s;
  o4.right.s = t;

  // detect potential casing deviations

  for (const [i, j] of o4.indices) {
    if (o4.left.s[i] !== o4.right.s[j]) {
      if (o4.left.diff.cs.length) {
        const last = o4.left.diff.cs[o4.left.diff.cs.length - 1];
        if (i - last.i === last.s.length) last.s += o4.left.s[i];
        else o4.left.diff.cs.push({s: o4.left.s[i], i});
      }

      else o4.left.diff.cs.push({s: o4.left.s[i], i});
       
      if (o4.right.diff.cs.length) {
        const last = o4.right.diff.cs[o4.right.diff.cs.length - 1];
        if (j - last.i === last.s.length) last.s += o4.right.s[j];
        else o4.right.diff.cs.push({s: o4.right.s[j], i: j});
      }

      else o4.right.diff.cs.push({s: o4.right.s[j], i: j});

      o4.indices.delete(i);
    }
  }

  // necessary to preserve original argument order

  if (o4.right.s !== r) {
    const p = o4.left;
    o4.left = o4.right;
    o4.right = p;
    
    const m = new Map();
    for (const pair of o4.indices) m.set(pair[1], pair[0]);
    o4.indices = m;
  }

  return o4;
};


/* Determine the difference between two tokens, i.e. strings without spaces or
newlines. */

const diffWords = (s, t) => {
  const offset = t.length - s.length,
    offs = s[0] === " " ? 1 : 0,
    offt = t[0] === " " ? 1 : 0,
    pairs = [];

  for (let j = 0; j <= offset; j++) {
    for (let i = 0; i < s.length; i++) {
      if (s[i] === t[i + j]) pairs.push([i - offs, i + j - offt]);
    }
  }

  if (offs) s = s.slice(1, -1);
  else if (offt) t = t.slice(1, -1);

  pairs.sort((pair, pair2) => pair[0] - pair2[0]);

  const m = new Map();
  let max = -1;

  for (const pair of pairs) {
    if (m.has(pair[0])) continue;
    else if (max >= pair[1]) continue;

    else {
      m.set(pair[0], pair[1]);
      max = pair[1];
    }
  }

  const indices = Array.from(m);

  const left = [], right = [];
  let maxl = 0, maxr = 0;

  for (const pair of indices) {
    if (pair[0] !== maxl) {
      let buf = "";
      for (let i = maxl; i < pair[0]; i++) buf += s[i];
      left.push({s: buf, i: maxl});
      maxl = pair[0];
    }

    if (pair[1] !== maxr) {
      let buf = "";
      for (let i = maxr; i < pair[1]; i++) buf += t[i];
      right.push({s: buf, i: maxr});
      maxr = pair[1];
    }

    maxl++;
    maxr++;
  }

  if (indices.length === 0) {
    left.push({s, i: 0});
    right.push({s, i: 0});
  }

  else {
    const last = indices[indices.length - 1];

    if (last[0] + 1 < s.length) {
      left.push({
        s: s.slice(last[0] + 1),
        i: last[0] + 1
      });
    }

    if (last[1] + 1 < t.length) {
      right.push({
        s: t.slice(last[1] + 1),
        i: last[1] + 1
      });
    }
  }

  return {
    indices: m,
    left: {s, diff: left},
    right: {s: t, diff: right}
  };
};


/* Quantify the difference between two tokens. As a rule of thumb, a score <1
represents a soft typo whereas bigger scores are considered hard errors. */

// TODO: consider OCR and keyboard errors

Str.Diff.eval = o => {
  const ls = o.left.diff.ci.slice(),
    rs = o.right.diff.ci.slice(),
    left = o.left,
    right = o.right;

  const desc = [];
  let score = 0;

  while (ls.length || rs.length) {

    // left partial ("zur Zeit" instead of "zurzeit")

    if (right.s.slice(-left.s.length).toLowerCase() === left.s.toLowerCase()) {
        if (right.s.slice(-left.s.length) === left.s) {
          desc.push("partiality");
          score += 1;
        }

        else {
          desc.push("partiality");
          score += 1.25;
        }

        ls.length = 0;
        rs.length = 0;
        continue;
    }

    // left partial ("Ort" instead of "Ortstermin")

    if (right.s.slice(0, left.s.length).toLowerCase() === left.s.toLowerCase()) {
        if (right.s.slice(0, left.s.length) === left.s) {
          desc.push("partiality");
          score += 1;
        }

        else {
          desc.push("partiality");
          score += 1.25;
        }

        ls.length = 0;
        rs.length = 0;
        continue;
    }

    // right partial ("vorort" instead of "vor Ort")

    if (left.s.slice(-right.s.length).toLowerCase() === right.s.toLowerCase()) {
        if (left.s.slice(-right.s.length) === right.s) {
          desc.push("partiality");
          score += 1;
        }

        else {
          desc.push("partiality");
          score += 1.25;
        }

        ls.length = 0;
        rs.length = 0;
        continue;
    }

    // right partial ("Zeitreise" instead of "Zeit")

    if (left.s.slice(0, right.s.length).toLowerCase() === right.s.toLowerCase()) {
        if (left.s.slice(0, right.s.length) === right.s) {
          desc.push("partiality");
          score += 1;
        }

        else {
          desc.push("partiality");
          score += 1.25;
        }

        ls.length = 0;
        rs.length = 0;
        continue;
    }

    // LEFT AND RIGHT

    if (ls.length && rs.length) {
      const l = ls[0], r = rs[0];

      // equivalent ("Mueller" instead of "Müller")

      if (Str.Diff.equivalence.has(l.s[0])
        && r.s.startsWith(Str.Diff.equivalence.get(l.s[0]))) {
          desc.push("equivalence");
          score += 0.25;
          r.s = r.s.slice(Str.Diff.equivalence.get(l.s[0]).length);
          l.s = ls.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }

      if (Str.Diff.equivalence.has(r.s[0])
        && l.s.startsWith(Str.Diff.equivalence.get(r.s[0]))) {
          desc.push("equivalence");
          score += 0.25;
          l.s = l.s.slice(Str.Diff.equivalence.get(r.s[0]).length);
          r.s = r.s.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }

      // case-related ("des weiteren" instead of "des Weiteren")

      if (l.s[0].toLowerCase() === r.s[0].toLowerCase()
        && l.s[0] !== r.s[0]) {
          desc.push("casing");
          score += 0.25;
          l.s = l.s.slice(1);
          r.s = r.s.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }

      // modified ("Cafe" instead of "Café")

      if (Str.modifier.has(l.s[0])
        && Str.modifier.get(l.s[0]) === r.s[0]) {
          desc.push("modifier");
          score += 0.25;
          l.s = l.s.slice(1);
          r.s = r.s.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }

      if (Str.modifier.has(r.s[0])
        && Str.modifier.get(r.s[0]) === l.s[0]) {
          desc.push("modifier");
          score += 0.25;
          l.s = l.s.slice(1);
          r.s = r.s.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }

      // swapped-case (Bürste instead of Brüste)

      if (l.s[0] === r.s[0] && abs(l.i - r.i) === 1) {
        desc.push("swap");
        score += 0.25;
        l.s = l.s.slice(1);
        r.s = r.s.slice(1);
        if (l.s.length === 0) ls.shift();
        if (r.s.length === 0) rs.shift();
        continue;
      }

      // phonetic ("Elefant" instead of "Elephant")

      if (Str.Diff.phonetics.has(l.s[0])
        && Str.Diff.phonetics.get(l.s[0]).some(s => r.s.startsWith(s))) {
          desc.push("phonetics");
          score += 0.5;

          Str.Diff.phonetics.get(l.s[0]).some(s => {
            if (r.s.startsWith(s)) r.s = r.s.slice(s.length);
          });

          l.s = l.s.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }

      // phonetic ("Elepfant" instead of "Elefant")

      if (Str.Diff.phonetics2.has(l.s.slice(0, 2))
        && Str.Diff.phonetics2.get(l.s.slice(0, 2)).includes(r.s)) {
          desc.push("phonetics");
          score += 0.5;
          l.s = l.s.slice(2);
          r.s = r.s.slice(1);
          if (l.s.length === 0) ls.shift();
          if (r.s.length === 0) rs.shift();
          continue;
      }
    }

    // LEFT

    if (ls.length) {
      const l = ls[0];

      // repetitive ("Büffett" instead of "Büfett")

      if (Str.Diff.repetition.has(l.s[0])
        && (l.s[0] === left.s[l.i - 1] || l.s[0] === left.s[l.i + 1])
        && (l.s[0] === right.s[l.i - 1] || l.s[0] === right.s[l.i + 1])) {
          desc.push("repetition");
          score += 0.5;
          l.s = l.s.slice(1);
          if (l.s.length === 0) ls.shift();
          continue;
      }

      // phonetic ("nähmlich" instead of "nämlich")

      if (Str.Diff.phonetics2.has(left.s[l.i - 1] + l.s[0])) {
        desc.push("phonetics");
        score += 0.5;
        l.s = l.s.slice(1);
        if (l.s.length === 0) ls.shift();
        continue;
      }

      if (Str.Diff.phonetics2.has(l.s[0] + left.s[l.i + 1])) {
        desc.push("phonetics");
        score += 0.5;
        l.s = l.s.slice(1);
        if (l.s.length === 0) ls.shift();
        continue;
      }

      // abbreviation ("v.l.g." instead of "vlg.")

      if (l.s === ".") {
        desc.push("period");
        score += 0.25;
        ls.shift();
        continue;
      }

      desc.push("error");
      score += 1;
      l.s = l.s.slice(1);
      if (l.s.length === 0) ls.shift();
    }

    // RIGHT

    if (rs.length) {
      const r = rs[0];

      // repetitive ("Aparat" instead of "Apparat")

      if (Str.Diff.repetition.has(r.s[0])
        && (r.s[0] === right.s[r.i - 1] || r.s[0] === right.s[r.i + 1])
        && (r.s[0] === left.s[r.i - 1] || r.s[0] === left.s[r.i + 1])) {
          desc.push("repetition");
          score += 0.5;
          r.s = r.s.slice(1);
          if (r.s.length === 0) rs.shift();
          continue;
      }

      // phonetic ("war" instead of "wahr")

      if (Str.Diff.phonetics2.has(right.s[r.i - 1] + r.s[0])) {
        desc.push("phonetics");
        score += 0.5;
        r.s = r.s.slice(1);
        if (r.s.length === 0) rs.shift();
        continue;
      }

      if (Str.Diff.phonetics2.has(r.s[0] + right.s[r.i + 1])) {
        desc.push("phonetics");
        score += 0.5;
        r.s = r.s.slice(1);
        if (r.s.length === 0) rs.shift();
        continue;
      }

      // abbreviation ("v.l.g." instead of "vlg.")

      if (r.s === ".") {
        desc.push("period");
        score += 0.25;
        rs.shift();
        continue;
      }

      desc.push("error");
      score += 1;
      r.s = r.s.slice(1);
      if (r.s.length === 0) rs.shift();
    }
  }

  // consolidate casing deviations

  const n = desc.reduce((acc, s) =>
    s === "casing" ? acc + 1 : acc, 0);

  if (n > 1) score -= 0.25 * (n - 1);

  return {desc: Array.from(new Set(desc)), score};
};


//█████ Distance ██████████████████████████████████████████████████████████████


Str.distance = a => b => {
  const min = (d0, d1, d2, bx, ay) => {
    return d0 < d1 || d2 < d1
      ? d0 > d2
        ? d2 + 1
        : d0 + 1
      : bx === ay
        ? d1
        : d1 + 1;
  };

  if (a === b) return 0;

  if (a.length > b.length) {
    var tmp = a;
    a = b;
    b = tmp;
  }

  let la = a.length, lb = b.length;

  while (la > 0 && (a.charCodeAt(la - 1) === b.charCodeAt(lb - 1))) {
    la--;
    lb--;
  }

  let offset = 0;

  while (offset < la && (a.charCodeAt(offset) === b.charCodeAt(offset))) {
    offset++;
  }

  la -= offset;
  lb -= offset;

  if (la === 0 || lb < 3) return lb;

  let x = 0, y;
  let d0, d1, d2, d3;
  let dd, dy, ay;
  let bx0, bx1, bx2, bx3;
  let vector = [];

  for (y = 0; y < la; y++) {
    vector.push(y + 1);
    vector.push(a.charCodeAt(offset + y));
  }

  let len = vector.length - 1;

  for (; x < lb - 3;) {
    bx0 = b.charCodeAt(offset + (d0 = x));
    bx1 = b.charCodeAt(offset + (d1 = x + 1));
    bx2 = b.charCodeAt(offset + (d2 = x + 2));
    bx3 = b.charCodeAt(offset + (d3 = x + 3));
    dd = (x += 4);

    for (y = 0; y < len; y += 2) {
      dy = vector[y];
      ay = vector[y + 1];
      d0 = min(dy, d0, d1, bx0, ay);
      d1 = min(d0, d1, d2, bx1, ay);
      d2 = min(d1, d2, d3, bx2, ay);
      dd = min(d2, d3, dd, bx3, ay);
      vector[y] = dd;
      d3 = d2;
      d2 = d1;
      d1 = d0;
      d0 = dy;
    }
  }

  for (; x < lb;) {
    bx0 = b.charCodeAt(offset + (d0 = x));
    dd = ++x;

    for (y = 0; y < len; y += 2) {
      dy = vector[y];
      vector[y] = dd = min(dy, d0, dd, bx0, vector[y + 1]);
      d0 = dy;
    }
  }

  return dd;
};


//█████ Normalizing ███████████████████████████████████████████████████████████


Str.fraction = new Map([
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


Str.modifier = new Map([
  ["Á", "A"], ["á", "a"], ["À", "A"], ["à", "a"], ["Â", "A"], ["â", "a"], ["Ǎ", "A"], ["ǎ", "a"], ["Ă", "A"],
  ["ă", "a"], ["Ã", "A"], ["ã", "a"], ["Ả", "A"], ["ả", "a"], ["Ȧ", "A"], ["ȧ", "a"], ["Ạ", "A"], ["ạ", "a"],
  ["Ä", "A"], ["ä", "a"], ["Å", "A"], ["å", "a"], ["Ḁ", "A"], ["ḁ", "a"], ["Ā", "A"], ["ā", "a"], ["Ą", "A"],
  ["ą", "a"], ["ᶏ", "a"], ["Ⱥ", "A"], ["ⱥ", "a"], ["Ȁ", "A"], ["ȁ", "a"], ["Ấ", "A"], ["ấ", "a"], ["Ầ", "A"],
  ["ầ", "a"], ["Ẫ", "A"], ["ẫ", "a"], ["Ẩ", "A"], ["ẩ", "a"], ["Ậ", "A"], ["ậ", "a"], ["Ắ", "A"], ["ắ", "a"],
  ["Ằ", "A"], ["ằ", "a"], ["Ẵ", "A"], ["ẵ", "a"], ["Ẳ", "A"], ["ẳ", "a"], ["Ặ", "A"], ["ặ", "a"], ["Ǻ", "A"],
  ["ǻ", "a"], ["Ǡ", "A"], ["ǡ", "a"], ["Ǟ", "A"], ["ǟ", "a"], ["Ȃ", "A"], ["ȃ", "a"], ["Ɑ", "A"], ["ɑ", "a"],
  ["ᴀ", "A"], ["Ɐ", "A"], ["ɐ", "a"], ["ɒ", "a"], ["Ａ", "A"], ["ａ", "a"], ["Æ", "A"], ["æ", "a"], ["ᴭ", "A"],
  ["ᵆ", "a"], ["Ǽ", "A"], ["ǽ", "a"], ["Ǣ", "A"], ["ǣ", "a"], ["ᴁ", "A"], ["ᴂ", "a"], ["Ḃ", "B"], ["ḃ", "b"],
  ["Ḅ", "B"], ["ḅ", "b"], ["Ḇ", "B"], ["ḇ", "b"], ["Ƀ", "B"], ["ƀ", "b"], ["Ɓ", "B"], ["ɓ", "b"], ["Ƃ", "b"],
  ["ƃ", "b"], ["ᵬ", "b"], ["ᶀ", "b"], ["ʙ", "B"], ["Ｂ", "B"], ["ｂ", "b"], ["Ć", "C"], ["ć", "c"], ["Ĉ", "C"],
  ["ĉ", "c"], ["Č", "C"], ["č", "c"], ["Ċ", "C"], ["ċ", "c"], ["C̄", "C"], ["c̄", "c"], ["Ç", "C"], ["ç", "c"],
  ["Ḉ", "C"], ["ḉ", "c"], ["Ȼ", "C"], ["ȼ", "c"], ["Ƈ", "C"], ["ƈ", "c"], ["ɕ", "c"], ["ᴄ", "c"], ["Ｃ", "C"],
  ["ｃ", "c"], ["Ď", "D"], ["ď", "d"], ["Ḋ", "D"], ["ḋ", "d"], ["Ḑ", "D"], ["ḑ", "d"], ["D̦", "D"], ["d̦", "d"],
  ["Ḍ", "D"], ["ḍ", "d"], ["Ḓ", "D"], ["ḓ", "d"], ["Ḏ", "D"], ["ḏ", "d"], ["Đ", "D"], ["đ", "d"], ["Ð", "D"],
  ["ð", "d"], ["D̦", "D"], ["d̦", "d"], ["Ɖ", "D"], ["ɖ", "d"], ["Ɗ", "D"], ["ɗ", "d"], ["Ƌ", "D"], ["ƌ", "d"],
  ["ᵭ", "d"], ["ᶁ", "d"], ["ᶑ", "d"], ["ȡ", "d"], ["ᴅ", "D"], ["Ｄ", "D"], ["ｄ", "d"], ["Þ", "D"], ["þ", "d"],
  ["ȸ", "d"], ["Ǳ", "D"], ["ǲ", "D"], ["ǳ", "d"], ["Ǆ", "D"], ["ǅ", "D"], ["ǆ", "d"], ["É", "E"], ["é", "e"],
  ["È", "E"], ["è", "e"], ["Ê", "E"], ["ê", "e"], ["Ḙ", "E"], ["ḙ", "e"], ["Ě", "E"], ["ě", "e"], ["Ĕ", "E"],
  ["ĕ", "e"], ["Ẽ", "E"], ["ẽ", "e"], ["Ḛ", "E"], ["ḛ", "e"], ["Ẻ", "E"], ["ẻ", "e"], ["Ė", "E"], ["ė", "e"],
  ["Ë", "E"], ["ë", "e"], ["Ē", "E"], ["ē", "e"], ["Ȩ", "E"], ["ȩ", "e"], ["Ę", "E"], ["ę", "e"], ["ᶒ", "e"],
  ["Ɇ", "E"], ["ɇ", "e"], ["Ȅ", "E"], ["ȅ", "e"], ["Ế", "E"], ["ế", "e"], ["Ề", "E"], ["ề", "e"], ["Ễ", "E"],
  ["ễ", "e"], ["Ể", "E"], ["ể", "e"], ["Ḝ", "E"], ["ḝ", "e"], ["Ḗ", "E"], ["ḗ", "e"], ["Ḕ", "E"], ["ḕ", "e"],
  ["Ȇ", "E"], ["ȇ", "e"], ["Ẹ", "E"], ["ẹ", "e"], ["Ệ", "E"], ["ệ", "e"], ["ⱸ", "e"], ["ᴇ", "E"], ["Ə", "e"],
  ["ə", "e"], ["Ǝ", "E"], ["ǝ", "e"], ["Ɛ", "E"], ["ɛ", "e"], ["Ｅ", "E"], ["ｅ", "e"], ["Ḟ", "F"], ["ḟ", "f"],
  ["Ƒ", "F"], ["ƒ", "f"], ["ᵮ", "f"], ["ᶂ", "f"], ["ꜰ", "F"], ["Ｆ", "F"], ["ｆ", "f"], ["ﬀ", "f"], ["ﬃ", "f"],
  ["ﬄ", "f"], ["ﬁ", "f"], ["ﬂ", "f"], ["Ǵ", "G"], ["ǵ", "g"], ["Ğ", "G"], ["ğ", "g"], ["Ĝ", "G"], ["ĝ", "g"],
  ["Ǧ", "G"], ["ǧ", "g"], ["Ġ", "G"], ["ġ", "g"], ["Ģ", "G"], ["ģ", "g"], ["Ḡ", "G"], ["ḡ", "g"], ["Ǥ", "G"],
  ["ǥ", "g"], ["Ɠ", "G"], ["ɠ", "g"], ["ᶃ", "g"], ["ɢ", "G"], ["Ȝ", "G"], ["ȝ", "g"], ["Ｇ", "G"], ["ｇ", "g"],
  ["ɢ", "G"], ["ɢ̆", "G"], ["Ĥ", "H"], ["ĥ", "h"], ["Ȟ", "H"], ["ȟ", "h"], ["Ḧ", "H"], ["ḧ", "h"], ["Ḣ", "H"],
  ["ḣ", "h"], ["Ḩ", "H"], ["ḩ", "h"], ["Ḥ", "H"], ["ḥ", "h"], ["Ḫ", "H"], ["ḫ", "h"], ["H̱", "H"], ["ẖ", "h"],
  ["Ħ", "H"], ["ħ", "h"], ["Ⱨ", "H"], ["ⱨ", "h"], ["Ɦ", "H"], ["ɦ", "h"], ["Ꜧ", "H"], ["ꜧ", "h"], ["ʰ", "h"],
  ["ʜ", "H"], ["Ｈ", "H"], ["ｈ", "h"], ["h̃", "h"], ["ɧ", "h"], ["Í", "I"], ["í", "i"], ["Ì", "I"], ["ì", "i"],
  ["Ĭ", "I"], ["ĭ", "i"], ["Î", "I"], ["î", "i"], ["Ǐ", "I"], ["ǐ", "i"], ["Ï", "I"], ["ï", "i"], ["Ḯ", "I"],
  ["ḯ", "i"], ["Ĩ", "I"], ["ĩ", "i"], ["Į", "I"], ["į", "i"], ["Ī", "I"], ["ī", "i"], ["Ỉ", "I"], ["ỉ", "i"],
  ["Ȉ", "I"], ["ȉ", "i"], ["Ȋ", "I"], ["ȋ", "i"], ["Ị", "I"], ["ị", "i"], ["Ḭ", "I"], ["ḭ", "i"], ["Ɨ", "I"],
  ["ɨ", "i"], ["ᵻ", "I"], ["ᶖ", "i"], ["İ", "I"], ["i", "i"], ["I", "I"], ["ı", "i"], ["ɪ", "I"], ["Ɩ", "I"],
  ["ɩ", "i"], ["Ｉ", "I"], ["ｉ", "i"], ["Ĳ", "I"], ["ĳ", "i"], ["Ĵ", "J"], ["ĵ", "j"], ["Ɉ", "J"], ["ɉ", "j"],
  ["J̌", "J"], ["ǰ", "j"], ["ȷ", "J"], ["ʝ", "j"], ["ɟ", "j"], ["ʄ", "j"], ["ᴊ", "J"], ["Ｊ", "J"], ["ｊ", "j"],
  ["ʲ", "j"], ["j̃", "j"], ["Ḱ", "K"], ["ḱ", "k"], ["Ǩ", "K"], ["ǩ", "k"], ["Ķ", "K"], ["ķ", "k"], ["Ḳ", "K"],
  ["ḳ", "k"], ["Ḵ", "K"], ["ḵ", "k"], ["Ƙ", "K"], ["ƙ", "k"], ["Ⱪ", "K"], ["ⱪ", "k"], ["ᶄ", "k"], ["Ꝁ", "K"],
  ["ꝁ", "k"], ["ᴋ", "K"], ["Ｋ", "K"], ["ｋ", "k"], ["Ĺ", "L"], ["ĺ", "l"], ["Ľ", "L"], ["ľ", "l"], ["Ļ", "L"],
  ["ļ", "l"], ["Ḷ", "L"], ["ḷ", "l"], ["Ḹ", "L"], ["ḹ", "l"], ["Ḽ", "L"], ["ḽ", "l"], ["Ḻ", "L"], ["ḻ", "l"],
  ["Ł", "L"], ["ł", "l"], ["Ŀ", "L"], ["ŀ", "l"], ["Ƚ", "L"], ["ƚ", "l"], ["Ⱡ", "L"], ["ⱡ", "l"], ["Ɫ", "L"],
  ["ɫ", "l"], ["ɬ", "l"], ["ᶅ", "l"], ["ɭ", "l"], ["ȴ", "l"], ["ʟ", "L"], ["Ｌ", "L"], ["ｌ", "l"], ["Ǉ", "L"],
  ["ǈ", "L"], ["ǉ", "l"], ["Ḿ", "M"], ["ḿ", "m"], ["Ṁ", "M"], ["ṁ", "m"], ["Ṃ", "M"], ["ṃ", "m"], ["ᵯ", "m"],
  ["ᶆ", "m"], ["Ɱ", "M"], ["ɱ", "m"], ["ᴍ", "M"], ["Ｍ", "M"], ["ｍ", "m"], ["Ń", "N"], ["ń", "n"], ["Ǹ", "N"],
  ["ǹ", "n"], ["Ň", "N"], ["ň", "n"], ["Ñ", "N"], ["ñ", "n"], ["Ṅ", "N"], ["ṅ", "n"], ["Ņ", "N"], ["ņ", "n"],
  ["Ṇ", "N"], ["ṇ", "n"], ["Ṋ", "N"], ["ṋ", "n"], ["Ṉ", "N"], ["ṉ", "n"], ["N̈", "N"], ["n̈", "n"], ["Ɲ", "N"],
  ["ɲ", "n"], ["Ƞ", "N"], ["ƞ", "n"], ["ᵰ", "n"], ["ᶇ", "n"], ["ɳ", "n"], ["ȵ", "n"], ["ɴ", "N"], ["Ｎ", "N"],
  ["ｎ", "n"], ["Ŋ", "N"], ["ŋ", "n"], ["Ǌ", "N"], ["ǋ", "N"], ["ǌ", "n"], ["Ó", "O"], ["ó", "o"], ["Ò", "O"],
  ["ò", "o"], ["Ŏ", "O"], ["ŏ", "o"], ["Ô", "O"], ["ô", "o"], ["Ố", "O"], ["ố", "o"], ["Ồ", "O"], ["ồ", "o"],
  ["Ỗ", "O"], ["ỗ", "o"], ["Ổ", "O"], ["ổ", "o"], ["Ǒ", "O"], ["ǒ", "o"], ["Ö", "O"], ["ö", "o"], ["Ȫ", "O"],
  ["ȫ", "o"], ["Ő", "O"], ["ő", "o"], ["Õ", "O"], ["õ", "o"], ["Ṍ", "O"], ["ṍ", "o"], ["Ṏ", "O"], ["ṏ", "o"],
  ["Ȭ", "O"], ["ȭ", "o"], ["Ȯ", "O"], ["ȯ", "o"], ["Ȱ", "O"], ["ȱ", "o"], ["Ø", "O"], ["ø", "o"], ["Ǿ", "O"],
  ["ǿ", "o"], ["Ǫ", "O"], ["ǫ", "o"], ["Ǭ", "O"], ["ǭ", "o"], ["Ō", "O"], ["ō", "o"], ["Ṓ", "O"], ["ṓ", "o"],
  ["Ṑ", "O"], ["ṑ", "o"], ["Ỏ", "O"], ["ỏ", "o"], ["Ȍ", "O"], ["ȍ", "o"], ["Ȏ", "O"], ["ȏ", "o"], ["Ơ", "O"],
  ["ơ", "o"], ["Ớ", "O"], ["ớ", "o"], ["Ờ", "O"], ["ờ", "o"], ["Ỡ", "O"], ["ỡ", "o"], ["Ở", "O"], ["ở", "o"],
  ["Ợ", "O"], ["ợ", "o"], ["Ọ", "O"], ["ọ", "o"], ["Ộ", "O"], ["ộ", "o"], ["Ɵ", "O"], ["ɵ", "o"], ["Ɔ", "O"],
  ["ɔ", "o"], ["Ȣ", "O"], ["ȣ", "o"], ["ⱺ", "O"], ["ᴏ", "o"], ["Ｏ", "O"], ["ｏ", "o"], ["Œ", "O"], ["œ", "o"],
  ["ᴔ", "o"], ["Ṕ", "P"], ["ṕ", "p"], ["Ṗ", "P"], ["ṗ", "p"], ["Ᵽ", "P"], ["ᵽ", "p"], ["Ƥ", "P"], ["ƥ", "p"],
  ["P̃", "P"], ["p̃", "p"], ["ᵱ", "p"], ["ᶈ", "p"], ["ᴘ", "P"], ["Ƿ", "P"], ["ƿ", "p"], ["Ｐ", "P"], ["ｐ", "p"],
  ["Ɋ", "q"], ["ɋ", "q"], ["Ƣ", "Q"], ["ƣ", "q"], ["ʠ", "q"], ["Ｑ", "Q"], ["ｑ", "q"], ["ȹ", "q"], ["ꞯ", "Q"],
  ["Ŕ", "R"], ["ŕ", "r"], ["Ř", "R"], ["ř", "r"], ["Ṙ", "R"], ["ṙ", "r"], ["Ŗ", "R"], ["ŗ", "r"], ["Ȑ", "R"],
  ["ȑ", "r"], ["Ȓ", "R"], ["ȓ", "r"], ["Ṛ", "R"], ["ṛ", "r"], ["Ṝ", "R"], ["ṝ", "r"], ["Ṟ", "R"], ["ṟ", "r"],
  ["Ɍ", "R"], ["ɍ", "r"], ["Ɽ", "R"], ["ɽ", "r"], ["Ꝛ", "R"], ["ꝛ", "r"], ["ᵲ", "r"], ["ᶉ", "r"], ["ɼ", "r"],
  ["ɾ", "r"], ["ᵳ", "r"], ["ʀ", "R"], ["Ｒ", "R"], ["ｒ", "r"], ["ɹ", "r"], ["ʁ", "R"], ["ſ", "s"], ["ẞ", "S"],
  ["ß", "s"], ["Ś", "S"], ["ś", "s"], ["Ṥ", "S"], ["ṥ", "s"], ["Ŝ", "S"], ["ŝ", "s"], ["Š", "S"], ["š", "s"],
  ["Ṧ", "S"], ["ṧ", "s"], ["Ṡ", "S"], ["ṡ", "s"], ["ẛ", "s"], ["Ş", "S"], ["ş", "s"], ["Ṣ", "S"], ["ṣ", "s"],
  ["Ṩ", "S"], ["ṩ", "s"], ["Ș", "S"], ["ș", "s"], ["S̩", "S"], ["s̩", "s"], ["ᵴ", "s"], ["ᶊ", "s"], ["Ʂ", "S"],
  ["ʂ", "s"], ["Ȿ", "S"], ["ȿ", "s"], ["ꜱ", "s"], ["Ʃ", "S"], ["ʃ", "s"], ["Ｓ", "S"], ["ｓ", "s"], ["Ť", "T"],
  ["ť", "t"], ["Ṫ", "T"], ["ṫ", "t"], ["Ţ", "T"], ["ţ", "t"], ["Ṭ", "T"], ["ṭ", "t"], ["Ț", "T"], ["ț", "t"],
  ["Ṱ", "T"], ["ṱ", "t"], ["Ṯ", "T"], ["ṯ", "t"], ["Ŧ", "T"], ["ŧ", "t"], ["Ⱦ", "T"], ["ⱦ", "t"], ["Ƭ", "T"],
  ["ƭ", "t"], ["Ʈ", "T"], ["ʈ", "t"], ["T̈", "T"], ["ẗ", "t"], ["ᵵ", "t"], ["ƫ", "t"], ["ȶ", "t"], ["ᴛ", "T"],
  ["Ｔ", "T"], ["ｔ", "t"], ["Ú", "U"], ["ú", "u"], ["Ù", "U"], ["ù", "u"], ["Ŭ", "U"], ["ŭ", "u"], ["Û", "U"],
  ["û", "u"], ["Ǔ", "U"], ["ǔ", "u"], ["Ů", "U"], ["ů", "u"], ["Ü", "U"], ["ü", "u"], ["Ǘ", "U"], ["ǘ", "u"],
  ["Ǜ", "U"], ["ǜ", "u"], ["Ǚ", "U"], ["ǚ", "u"], ["Ǖ", "U"], ["ǖ", "u"], ["Ű", "U"], ["ű", "u"], ["Ũ", "U"],
  ["ũ", "u"], ["Ṹ", "U"], ["ṹ", "u"], ["Ų", "U"], ["ų", "u"], ["Ū", "U"], ["ū", "u"], ["Ṻ", "U"], ["ṻ", "u"],
  ["Ủ", "U"], ["ủ", "u"], ["Ȕ", "U"], ["ȕ", "u"], ["Ȗ", "U"], ["ȗ", "u"], ["Ư", "U"], ["ư", "u"], ["Ứ", "U"],
  ["ứ", "u"], ["Ừ", "U"], ["ừ", "u"], ["Ữ", "U"], ["ữ", "u"], ["Ử", "U"], ["ử", "u"], ["Ự", "U"], ["ự", "u"],
  ["Ụ", "U"], ["ụ", "u"], ["Ṳ", "U"], ["ṳ", "u"], ["Ṷ", "U"], ["ṷ", "u"], ["Ṵ", "U"], ["ṵ", "u"], ["Ʉ", "U"],
  ["ʉ", "u"], ["Ʊ", "U"], ["ʊ", "u"], ["Ȣ", "U"], ["ȣ", "u"], ["ᵾ", "U"], ["ᶙ", "u"], ["ᴜ", "u"], ["Ｕ", "U"],
  ["ｕ", "u"], ["ᵫ", "u"], ["ɯ", "u"], ["Ṽ", "V"], ["ṽ", "v"], ["Ṿ", "V"], ["ṿ", "v"], ["Ʋ", "V"], ["ʋ", "v"],
  ["ᶌ", "v"], ["ⱱ", "v"], ["ⱴ", "v"], ["ᴠ", "v"], ["Ʌ", "V"], ["ʌ", "v"], ["Ｖ", "V"], ["ｖ", "v"], ["Ẃ", "W"],
  ["ẃ", "w"], ["Ẁ", "W"], ["ẁ", "w"], ["Ŵ", "W"], ["ŵ", "w"], ["Ẅ", "W"], ["ẅ", "w"], ["Ẇ", "W"], ["ẇ", "w"],
  ["Ẉ", "W"], ["ẉ", "w"], ["W̊", "W"], ["ẘ", "w"], ["Ⱳ", "W"], ["ⱳ", "w"], ["ᴡ", "w"], ["Ｗ", "W"], ["ｗ", "w"],
  ["ʷ", "w"], ["ʍ", "w"], ["w̃", "w"], ["Ẍ", "X"], ["ẍ", "x"], ["Ẋ", "X"], ["ẋ", "x"], ["ᶍ", "x"], ["Ｘ", "X"],
  ["ｘ", "x"], ["Ý", "Y"], ["ý", "y"], ["Ỳ", "Y"], ["ỳ", "y"], ["Ŷ", "Y"], ["ŷ", "y"], ["ẙ", "y"], ["Ÿ", "Y"],
  ["ÿ", "y"], ["Ỹ", "Y"], ["ỹ", "y"], ["Ẏ", "Y"], ["ẏ", "y"], ["Ȳ", "Y"], ["ȳ", "y"], ["Ỷ", "Y"], ["ỷ", "y"],
  ["Ỵ", "Y"], ["ỵ", "y"], ["Ɏ", "Y"], ["ɏ", "y"], ["Ƴ", "Y"], ["ƴ", "y"], ["ʏ", "Y"], ["Ｙ", "Y"], ["ｙ", "y"],
  ["Ź", "Z"], ["ź", "z"], ["Ẑ", "Z"], ["ẑ", "z"], ["Ž", "Z"], ["ž", "z"], ["Ż", "Z"], ["ż", "z"], ["Ẓ", "Z"],
  ["ẓ", "z"], ["Ẕ", "Z"], ["ẕ", "z"], ["Ƶ", "Z"], ["ƶ", "z"], ["Ȥ", "Z"], ["ȥ", "z"], ["Ⱬ", "Z"], ["ⱬ", "z"],
  ["ᵶ", "z"], ["ᶎ", "z"], ["ʐ", "z"], ["ʑ", "z"], ["ɀ", "z"], ["ᴢ", "z"], ["Ʒ", "Z"], ["ʒ", "z"], ["Ǯ", "Z"],
  ["ǯ", "z"], ["Ƹ", "Z"], ["ƹ", "z"], ["Ｚ", "Z"], ["ｚ", "z"],
]);


Str.normalize = ({inclAlpha}) => doc => {
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
      
      else if (inclAlpha && Str.modifier.has(c))
        s += Str.modifier.get(c);
      
      else s += c;
    }

    // mark

    else if (/\p{M}/v.test(c)) s += c;

    // number

    else if (/\p{N}/v.test(c)) {
      if (Str.fraction.has(c))
        s += Str.fraction.get(c);
      
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


Str.comparator = locale => opt => s => t =>
    new Intl.Collator(locale, opt).compare(s, t);


Str.comparator_ = locale => opt =>
    new Intl.Collator(locale, opt).compare;


Str.comparatorDe = Str.comparator("de-DE");


Str.comparatorDe_ = Str.comparator_("de-DE");


//█████ Casing ████████████████████████████████████████████████████████████████


// capitalize a word and its potential word components

Str.capitalize = word => {
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


Str.determineCasing = word => {
  const s = word.toLowerCase();

  if (s === word) return "all-lower-case";
  else if (s.toUpperCase() === word) return "all-upper-case";
  
  else {
    let guess = "";

    for (let i = 0; i < s.length; i++) {
      if (s[i] !== word[i]) {
        if (i === 0) guess = "sentence-case";
        else if (s[i - 1] === "-") guess = "sentence-case";
        else if (s[i - 1] === ".") guess = "sentence-case";
        else if (s[i - 1] === "'") guess = "sentence-case";
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

Trans.duce(transformer) (appendix) ({}) (props); // {FOO: 1, BAR: 4, BAS: 9} */


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


/* Unbalanced binary search tree as a persistent data structure with structural
sharing. */


export const Tree = value => ({value, left: null, right: null});


/* TODO: replace with splay tree with the following features:

  * explicit comparator
  * allow duplicate or unique value insert
  * find successor/predecessor
  * range queries (keys within a range)
  * rank queries (nth smallest/biggest element)
    * requires augmenting nodes with info about the size of their left subtree */


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// uncurried for performance

Tree.insert = (node, value) => {
  if (node === null) return Tree(value);

  else if (value < node.value)
    return {...node, left: Tree.insert(node.left, value)};

  else return {...node, right: Tree.insert(node.right, value)};
};


Tree.remove = value => node => {
  if (node === null) return null;

  else if (value < node.value) {
    const newLeft = Tree.remove(value) (node.left);
    return {...node, left: newLeft};
  }

  else if (value > node.value) {
    const newRight = Tree.remove(value) (node.right);
    return {...node, right: newRight};
  }

  else {
    if (node.left === null) return node.right;
    else if (node.right === null) return node.left;

    else {
      const value2 = Tree.findMin(node.right),
        right2 = Tree.remove(value2) (node.right);

      return {
        ...node,
        value: value2,
        right: right2
      };
    }
  }
};


Tree.has = value => node => {
  if (node === null) return false;
  else if (value === node.value) return true;

  return value < node.value
    ? Tree.has(node.left, value)
    : Tree.has(node.right, value);
};


Tree.find = value => node => {
  if (node === null) return null;
  else if (value === node.value) return node;

  return value < node.value
    ? Tree.find(value) (node.left)
    : Tree.find(value) (node.right);
};


Tree.findMin = node => {
  if (node === null) return null;
  let current = node;
  while (current.left !== null) current = current.left;
  return current.value;
};


Tree.findMax = node => {
  if (node === null) return null;
  let current = node;
  while (current.right !== null) current = current.right;
  return current.value;
};


// inorder fold

Tree.foldl = f => init => node => function go(acc, currNode) {
  if (currNode === null) return acc;

  const accLeft = go(acc, currNode.left),
    accRight = go(f(accLeft) (currNode.value), currNode.right);

  return accRight;
} (init, node);


Tree.Traversal = {};


Tree.Traversal.preorder = node => {
  if (node === null) return [];

  return [node.value]
    .concat(Tree.Traversal.preorder(node.left))
    .concat(Tree.Traversal.preorder(node.right));
};


Tree.Traversal.inorder = node => {
  if (node === null) return [];

  return Tree.Traversal.inorder(node.left)
    .concat([node.value])
    .concat(Tree.Traversal.inorder(node.right));
};


Tree.Traversal.postorder = node => {
  if (node === null) return [];

  return Tree.Traversal.postorder(node.left)
    .concat(Tree.Traversal.postorder(node.right))
    .concat([node.value]);
};


Tree.Traversal.levelOrder = node => {
  if (node === null) return [];
  const queue = [node], result = [];

  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current.value);
    if (current.left) queue.push(current.left);
    if (current.right) queue.push(current.right);
  }

  return result;
};


Tree.getHeight = node => {
  if (node === null) return -1;

  const leftHeight = Tree.getHeight(node.left),
    rightHeight = Tree.getHeight(node.right);

  return 1 + Math.max(leftHeight, rightHeight);
};


Tree.countNodes = node => {
  if (node === null) return 0;
  return 1 + Tree.countNodes(node.left) + Tree.countNodes(node.right);
};


// balance an existing tree

Tree.balance = node => {
  if (node === null) return null;
  const xs = Tree.Traversal.inorder(node);
  return Tree.reconstruct(xs, 0, xs.length - 1);
};


// create a balanced tree from a sorted array

Tree.reconstruct = (xs, start, end) => {
  if (start > end) return null;

  const mid = Math.floor((start + end) / 2),
    value = xs[mid],
    node = Tree(value);

  node.left = Tree.reconstruct(xs, start, mid - 1);
  node.right = Tree.reconstruct(xs, mid + 1, end);

  return node;
};


Tree.fromArr = xs => {
  let node = null;
  for (const x of xs) node = Tree.insert(node, x);
  return node;
};


Tree.fromSortedArr = xs => Tree.reconstruct(xs, 0, xs.length - 1);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ VALIDATION ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Validation is a set of predicate-like types. The result sum type:

  Val.True = {valid: Boolean}
  Val.False = a => {valid: Boolean, reason: String}

They are composable (a => Validate) to form large validation pipelines. */


export const Val = {};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TYPES ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


Val.True = ({
  [$]: "Val",
  [$$]: "Val.True",
  valid: true
});


Val.False = reason => ({
  [$]: "Val",
  [$$]: "Val.False",
  valid: false,
  reason
});


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* TODO:
batchTotal
checksum
cardinality/relation
order
structuralIntegrity
binary
withProp (associate two props)
withoutProp (disassociate two props)
objKeys
includes (arr)
uri
hex
uuid
domain
creditCard
base64
alphaNum
*/


Val.hasSign = tag => x => {
  const tag2 = Sign.get(x);
  if (tag === tag2) return Val.True;
  else return Val.False(`"${tag}" expected`);
};


Val.withPred = p => x => {
  const r = p(x);
  if (r === true) return Val.True;
  
  else {
    if (p.name === "") return Val.False("unmet predicate");
    else return Val.False(`unmet predicate "${p.name}"`);
  }
};


Val.withPattern = rx => s => {
  if (rx.test(s) === true) return Val.True;
  else return Val.False(`pattern mismatch "${rx.source}"`);
};


Val.value = x => {
  if (x === undefined) return Val.False("type error");
  else if (x === null) return Val.False("missing result");
  else if (x !== x) return Val.False("invalid number");
  else if (isNaN(x)) return Val.False("invalid date");

  else if (typeof x === "number") {
    if (!Number.isFinite(x)) return Val.False("infinite number");
    else if (!Number.isSafeInteger(x)) return Val.False("number out of range");
    else return Val.True;
  }

  else return Val.True;
};


Val.empty = x => {
  const tag = intro(x);

  switch (tag) {
    case "Array": {
      if (x.length === 0) return Val.True;
      break;
    }

    case "Bigint": {
      if (x === 0n) return Val.True;
      break;
    }

    case "Map":
    case "WeakMap": {
      if (x.size === 0) return Val.True;
      break;
    }

    case "Number": {
      if (x === 0) return Val.True;
      break;
    }
      
    case "Object": {
      if (Object.keys(x).length === 0) return Val.True;
      break;
    }
      
    case "Set":
    case "WeakSet": {
      if (x.size === 0) return Val.True;
      break;
    }

    case "String": {
      if (x === "") return Val.True;
      break;
    }
    
    return Val.False("not empty");
  }
};


//█████ Strings ███████████████████████████████████████████████████████████████


Val.ascii = s => {
  if (new RegExp(Str.cat(
    "^(?:",
    "[a-z0-9]",
    "|",
    Rex.classes.ascii.punct.rex.source,
    "|",
    Rex.classes.ascii.ctrl.rex.source,
    ")+$"), "i").test(s))
      return Val.True;

  else return Val.False("ascii character(s) expected");
};


Val.asciiLetters = s => {
  if (/^[a-z]$/i.test(s)) return Val.True;
  else return Val.False("ascii letter(s) expected");
};


Val.asciiLcl = s => {
  if (/^[a-z]$/.test(s)) return Val.True;
  else return Val.False("ascii lower-case letter(s) expected");
};


Val.asciiUcl = s => {
  if (/^[A-Z]$/.test(s)) return Val.True;
  else return Val.False("ascii upper-case letter(s) expected");
};


Val.latin1 = s => {
  if (new RegExp(Str.cat(
    "^(?:",
    Rex.classes.latin1.letter.rex.source,
    "|",
    "\\d",
    "|",
    Rex.classes.latin1.punct.rex.source,
    "|",
    Rex.classes.ascii.ctrl.rex.source,
    ")+$"), "i").test(s))
      return Val.True;

  else return Val.False("latin1 characters");
};


Val.latin1Letters = s => {
  if (new RegExp(`^${Rex.classes.latin1.letter.rex.source}+$`, "iv").test(s))
    return Val.True;

  else return Val.False("latin1 letter(s) expected");
};


Val.latin1LcL = s => {
  if (new RegExp(`^${Rex.classes.latin1.lcl.rex.source}+$`, "v").test(s))
    return Val.True;

  else return Val.False("latin1 lower-case letter(s) expected");
};


Val.latin1Ucl = s => {
  if (new RegExp(`^${Rex.classes.latin1.ucl.rex.source}+$`, "v").test(s))
    return Val.True;

  else return Val.False("latin1 upper-case letter(s) expected");
};


Val.utf8Letter = s => {
  if (/^\p{L}+$/v.test(s)) return Val.True;
  else return Val.False("utf8 letter(s) expected");
};


Val.utf8Lcl = s => {
  if (/^\p{Ll}+$/v.test(s)) return Val.True;
  else return Val.False("utf8 lower-case letter(s) expected");
};


Val.utf8Ucl = s => {
  if (/^\p{Lu}+$/v.test(s)) return Val.True;
  else return Val.False("utf8 upper-case letter(s) expected");
};



Val.iban = s => {
  const codeLen = 22;

  const iban = s.toUpperCase(),
    code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/);

  let digits;

  if (!code || iban.length !== codeLen) return false;

  digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, letter => {
    return letter.charCodeAt(0) - 55;
  });

  let checksum = digits.slice(0, 2),
    fragment;

  for (let offset = 2; offset < digits.length; offset += 7) {
    fragment = String(checksum) + digits.substring(offset, offset + 7);
    checksum = parseInt(fragment, 10) % 97;
  }

  return checksum === 1 ? Val.True : Val.False(`invalid iban "${s}"`);
};


Val.bic = s => {
  if (/^([A-Z]{6}[A-Z2-9][A-NP-Z1-9])(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?$/.test(s))
    return Val.True;

  else return Val.False(`invalid bic "${s}"`);
};


Val.decimal = s => {
  if (/[0-9.,\-+e]/.test(s)) return Val.True;
  else return Val.False("decimal-number character(s) expected");
};


Val.digits = s => {
  if (/^\d+$/.test(s)) return Val.True;
  else return Val.False("digit character(s) expected");
};


Val.phone = s => {
  if (/(\(?([\d \-\)\+\/\(]+){6,}\)?([ .\-–\/]?)([\d]+))/.test(s))
    return Val.True;

  else return Val.False("phone character(s) expected");
};


Val.poBox = s => {
  if (/^[\d ]+$/.test(s)) return Val.True;
  else return Val.False("po-box character(s) expected");
};


Val.properName = s => {
  if (/^[\p{L} \-'.]+$/v.test(s)) return Val.True;
  else return Val.False("proper-name character(s) expected");
};


Val.street = s => {
  if (/^[\p{L}\d \-./]+$/.test(s)) return Val.True;
  else return Val.False("street character(s) expected");
};


Val.email = s => {
  if (/^[\p{L}\d\-.@_']+$/.test(s)) return Val.True;
  else return Val.False("digit character(s) expected");
};


//█████ Numbers ███████████████████████████████████████████████████████████████


Val.num = n => {
  if (typeof n !== "number") throw new Err("number expected");
  if (!Number.isFinite(n)) return Val.False("finite number expected");
  if (!Number.isSafeInteger(n)) return Val.False("number out of range");
  else return Val.True;
};


Val.int = n => {
  const o = Val.num(n), reasons = [];
  if (o.valid === false) reasons.push(o.reason);
  if (n % 1 !== 0) reasons.push("integer expected");
  
  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.nat = n => {
  const o = Val.num(n), reasons = [];
  if (o.valid === false) reasons.push(o.reason);
  if (n <= 0) return Val.False("natural number expected");
  if (n % 1 !== 0) return Val.False("natural number expected");

  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.neg = n => {
  const o = Val.num(n), reasons = [];
  if (o.valid === false) reasons.push(o.reason);
  if (n > 0) return Val.False("negative number expected");
  
  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.minNum = min => n => {
  const o = Val.num(n), reasons = [];
  if (o.valid === false) reasons.push(o.reason);
  if (n < min) reasons.push("number too small");
  
  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.maxNum = max => n => {
  const o = Val.num(n), reasons = [];
  if (o.valid === false) reasons.push(o.reason);
  if (n > max) reasons.push("number too small");
  
  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.minPrecision = min => n => {
  const [, dec] = String(n).split(/\./);
  if (dec.length >= min) return Val.True;
  else return Val.False("too few decimal digits");
};


Val.maxPrecision = max => n => {
  const [, dec] = String(n).split(/\./);
  if (dec.length <= max) return Val.True;
  else return Val.False("too many decimal digits");
};


//█████ Object Types ██████████████████████████████████████████████████████████


Val.minLen = min => xs => { // also string
  if ("length" in xs) xs.length >= min ? Val.True : Val.False("too short");
  else throw new Err("length property expected");
};


Val.maxLen = max => xs => { // also string
  if ("length" in xs) xs.length <= max ? Val.True : Val.False("too long");
  else throw new Err("length property expected");
};


Val.isMember = o => o => {
  if (o.has(o)) return Val.True;
  else return Val.False(`missing member "${x}"`);
};


Val.isProp = o => k => {
  if (k in o) return Val.True;
  else return Val.False(`missing property "${x}"`);
};


Val.minSize = min => o => {
  if ("size" in o) o.size >= min ? Val.True : Val.False("too short");
  else throw new Err("size property expected");
};


Val.maxSize = max => o => {
  if ("size" in o) o.size <= max ? Val.True : Val.False("too long");
  else throw new Err("size property expected");
};


Val.minDate = min => d => {
  if (d.getTime() >= min) return Val.True;
  else return Val.False("date out of range");
};


Val.maxDate = max => d => {
  if (d.getTime() <= max) return Val.True;
  else return Val.False("date out of range");
};


//█████ Stateful ██████████████████████████████████████████████████████████████


Val.unique = s => x => {
  if (s.has(x)) return Val.False(`not unique "${x}"`);

  else {
    s.add(x);
    return Val.True;
  }
};


//█████ Folds █████████████████████████████████████████████████████████████████


Val.and = f => g => x => {
  const o = f(x), p = g(x), reasons = [];

  if (o.valid === false) reasons.push(o.reason);
  if (p.valid === false) reasons.push(p.reason);

  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.all = (...fs) => s => {
  const reasons = [];

  for (const f of fs) {
    const o = f(s);
    if (o.valid === false) reasons.push(o.reason);
  }

  if (reasons.length === 0) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.or = f => g => x => {
  const o = f(x), p = g(x), reasons = [];

  if (o.valid === false) reasons.push(o.reason);
  if (p.valid === false) reasons.push(p.reason);

  if (reasons.length <= 1) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.any = (...fs) => s => {
  const reasons = [];

  for (const f of fs) {
    const o = f(s);
    if (o.valid === false) reasons.push(o.reason);
  }

  if (reasons.length < fs.length) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.xor = f => g => x => {
  const o = f(x), p = g(x), reasons = [];

  if (o.valid === false) reasons.push(o.reason);
  if (p.valid === false) reasons.push(p.reason);

  if (reasons.length === 1) return Val.True;
  else return Val.False(reasons.join(", "));
};


Val.not = f => x => {
  const o = f(x);
  if (o.valid === true) return Val.False("not true");
  else return Val.True;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████ LINEAR ALGEBRA ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Alg = {};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ COMBINATORS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


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


// encrypt with 256-bit private key

Node.Crypto.encryptSym = key => plaintext => {
  const iv = Crypto.randomBytes(12).toString("base64"),
    cipher = Crypto.createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
};


// decrypt with 256-bit private key

Node.Crypto.decryptSym = ({key, iv, tag}) => ciphertext => {
  const decipher = Crypto.createDecipheriv(
    "aes-256-gcm", 
    Buffer.from(key, "base64"),
    Buffer.from(iv, "base64")
  );
  
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let plaintext = decipher.update(ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");
  return plaintext;
}


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
