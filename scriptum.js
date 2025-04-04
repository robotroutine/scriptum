/*
 __   __   __     __  ___            
/__` /  ` |__) | |__)  |  |  |  |\/| 
.__/ \__, |  \ | |     |  \__/  |  | 

functional library for the Node.js environment */


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████ DEPENDENCIES █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


import nodeChild from "node:child_process";
import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodePath from "node:path";
import nodeStream from "node:stream";


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ ASPECTS ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ CONSTANTS ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const PREFIX = "$criptum_"; // avoid property name collisions


export const LT = -1;


export const EQ = 0;


export const GT = 1;


/* Used to tag functions that return a fresh instance of their respective data
type so that any later mutations on these values are not shared. */

export const NEW = Symbol("new");


export const NOOP = null; // no operation


export const NOT_FOUND = -1; // native search protocol


export const TAG = Symbol.toStringTag;


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ STATE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* The monadic types for asynchronous computation used in this library are not
stack safe by default. However, for large asynchronous computations you can run
these types with a special method that utilizes stack safe promises. Every time
the asynchronous counter is greater than a hundred, the monadic asynchronous
type is wrapped in a native promise and the counter is reset to zero. The
counter is shared between all running asynchronous operations. */

let asyncCounter = 0; // upper bound: 100


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TAGGED TYPES █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// create a tagged object with a single property

export const type = (tag, k = tag[0].toLowerCase() + tag.slice(1)) => arg => {
  return Object.defineProperties({}, {
    [TAG]: {value: tag},
    [k]: {value: arg, enumerable: true, writable: true}
  });
};


/* Create a tagged object with multiple properties. The latter are only
accessible via the type's primary property, which enhances type safety.
Usage:

const Coord = product("Coord") ("x", "y", "z");

const point = Coord(2, 3, 4); // Coord {x: 2, y: 3, z: 4}
point.coord.x; // 2 */

export const product = (tag, k = tag[0].toLowerCase() + tag.slice(1)) => (...ks) => (...vs) => {
  return Object.defineProperties({}, {
    [TAG]: {value: tag},

    [k]: {
      value: ks.reduce((acc, k2, i) => (acc[k2] = vs[i], acc), {}),
      enumerable: true,
      writable: true
    }
  });
};


// like product but the first argument is curried

export const product_ = (tag, k = tag[0].toLowerCase() + tag.slice(1)) => (k, ...ks) => (...vs) => v => {
  return Object.defineProperties({}, {
    [TAG]: {value: tag},

    [k]: {
      value: ks.reduce((acc, k2, i) => (acc[k2] = vs[i], acc), {k: v}),
      enumerable: true,
      writable: true
    }
  });
};


// binary product

export const product2 = (tag, k = tag[0].toLowerCase() + tag.slice(1)) => (x, y) => {
  return Object.defineProperties({}, {
    [TAG]: {value: tag},

    [k]: {
      value: Pair(x, y),
      enumerable: true,
      writable: true
    }
  });
};


// ternary product

export const product3 = (tag, k = tag[0].toLowerCase() + tag.slice(1)) => (x, y, z) => {
  return Object.defineProperties({}, {
    [TAG]: {value: tag},

    [k]: {
      value: Triple(x, y, z),
      enumerable: true,
      writable: true
    }
  });
};


/* Create a tagged union type that can instantiate values in different shapes.
Each tagged union has its individual root property where it exposes its values.
The underlying idea is the simple creation of "sum of product" types, i.e. where
tagged unions (sums) contain product types. Usage:

const Option = variant("Option", "opt") (nullary("None"), unary("Some"));

const tx = Option.Some(2), ty = Option.None;

tx.opt.val // 2
tx.opt.tag // "some"

tx.opt.run({some: x => x + 1, none: 0}); // 3
ty.opt.run({some: x => x + 1, none: 0}); // 0

switch (tx.opt.tag) {
  case: "some": {...}
  case: "none": {...}
} */

export const variant = (tag, k = tag[0].toLowerCase() + tag.slice(1)) => (...cases) => {
  return cases.reduce((acc, _case) => {
    acc[_case.name] = _case(tag, k);
    return acc;
  }, {});
};


// nullary constructor (constant)

export const nullary = (_case, k = _case[0].toLowerCase() + _case.slice(1)) => {
  return ({
    [_case]: (tag, k2) => {
      return Object.defineProperties({}, {
        [TAG]: {value: tag},

        [k2]: {
          value: {
            run: ({[_case]: x}) => x,
            val: null,
            tag: k
          },

          enumerable: true,
          writable: true
        }
      });
    }
  }) [_case];
};


// unary constructor

export const unary = (_case, k = _case[0].toLowerCase() + _case.slice(1)) => {
  return ({
    [_case]: (tag, k2) => x => {
      return Object.defineProperties({}, {
        [TAG]: {value: tag},

        [k2]: {
          value: {
            run: ({[_case]: f}) => f(x),
            val: x,
            tag: k
          },

          enumerable: true,
          writable: true
        }
      });
    }
  }) [_case];
};


// binary constructor

export const binary = (_case, k = _case[0].toLowerCase() + _case.slice(1)) => {
  return ({
    [_case]: (tag, k2) => x => y => {
      return Object.defineProperties({}, {
        [TAG]: {value: tag},

        [k2]: {
          value: {
            run: ({[_case]: f}) => f(x) (y),
            val: Pair(x, y),
            tag: k
          },

          enumerable: true,
          writable: true
        }
      });
    }
  }) [_case];
};


export const binary_ = (_case, k = _case[0].toLowerCase() + _case.slice(1)) => {
  return ({
    [_case]: (tag, k2) => (x, y) => {
      return Object.defineProperties({}, {
        [TAG]: {value: tag},

        [k2]: {
          value: {
            run: ({[_case]: f}) => f(x, y),
            val: Pair(x, y),
            tag: k
          },

          enumerable: true,
          writable: true
        }
      });
    }
  }) [_case];
};


// variadic constructor

export const variadic = (_case, k = _case[0].toLowerCase() + _case.slice(1)) => {
  return ({
    [_case]: (tag, k2) => (...args) => {
      return Object.defineProperties({}, {
        [TAG]: {value: tag},

        [k2]: {
          value: {
            run: ({[_case]: f}) => f(...args),
            val: args,
            tag: k
          },

          enumerable: true,
          writable: true
        }
      });
    }
  }) [_case];
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ EFFECTS ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// effectively handle effects in a dynamically typed environment


export const Eff = {};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// functor

Eff.comp = (dict, dict2) => f => ttx => dict.map(dict2.map(f)) (ttx);


// applicative functor

Eff.compA = (dict, dict2) => ttf => ttx =>
  dict.ap(dict.map(dict2.ap) (ttf)) (ttx);


/* Monads cannot be composed in a general way. Use monad transformers instead
or implement your own specific monad composition that suits your needs. */


// Kleisli composition

Eff.komp = dict => fm => gm => x => dict.chain(fm(x)) (gm);


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// eliminiate the effect


Eff.Fold = {};


Eff.Fold.array = () => A.foldl;


Eff.Fold.async = tx => tx(id);


Eff.Fold.bottom = tx => {
  if (tx === undefined) throw new Err("received undefined");
  else return tx;
};


Eff.Fold.defer = thunk => thunk();


Eff.Fold.either = tx => tx.either.val


Eff.Fold.except = tx => {
  if (tx?.constructor?.name === "Exception") throw tx;
  else return tx;
};


Eff.Fold.lazy = tx => strict(tx);


Eff.Fold.list = () => L.foldl;


Eff.Fold.option = x => tx => tx === null ? x : tx;


Eff.Fold.tramp = tx => Tramp(tx);


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


/* Sequence effects in a mechanistically applicative way. Usage:

Eff.Trav.array(Eff.dict.either)
  (x => x & 1 === 1 ? Either.Left(x) : Either.Right(x * x))
    ([2,4,6]); // yields Right([4, 16, 36])

Eff.Trav.array(Eff.dict.either)
  (x => x & 1 === 1 ? Either.Left(x) : Either.Right(x * x))
    ([2,5,6]); // yields Left(5) */


Eff.Trav = {};


// Applicative f => (a -> f b) -> [a] -> f [b]
Eff.Trav.array = () => A.mapA;


// Applicative f => [f a] -> f [a]
Eff.Trav.arraySeq = () => A.seqA;


Eff.Trav.either = dict => ft => tx => {
  switch (tx.either.tag) {
    case "left": return dict.of(tx);

    case "right": return dict.map(x =>
      Either.Right(x)) (ft(tx.either.val));

    default: throw new Err("Either expected");
  }
};


Eff.Trav.eitherSeq = dict => ft => tx => {
  switch (tx.either.tag) {
    case "left": return dict.map(Either.Left) (tx);
    case "right": return dict.map(Either.Right) (tx);
    default: throw new Err("Either expected");
  }
};


Eff.Trav.except = dict => ft => tx =>
  tx?.constructor?.name === "Exception" ? dict.of(tx) : fm(tx);


Eff.Trav.exceptSeq = dict => tx =>
  tx?.constructor?.name === "Exception" ? dict.of(tx) : tx;


// Applicative f => (a -> f b) -> List a -> f (List b)
Eff.Trav.list = () => L.mapA;


// Applicative f => List (f a) -> f (List a)
Eff.Trav.listSeq = () => L.seqA;


Eff.Trav.option = dict => ft => tx => tx === null ? dict.of(tx) : fm(tx);


Eff.Trav.optionSeq = dict => tx => tx === null ? dict.of(tx) : tx;


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Eff.F = {};


// zero, one or several results (indeterministic)

Eff.F.array = f => xs => xs.map(f);


// asynchronous function (serially evaluated)

Eff.F.async = f => tf => k => tf(x => k(f(x)))


// bottom type immediately throws an error to avoid silent errors

Eff.F.bottom = f => tx => tx === undefined
  ? _throw("received undefined")
  : f(tx);


// either arbitrary value or valid computation (used for short circuiting)

Eff.F.either = f => tx => {
  switch (tx.either.tag) {
    case "left": return tx;
    case "right": return Either.Right(f(tx.either.val))
    default: throw new Err("Either expected");
  }
};


// defer evaluation with thunks

Eff.F.defer = f => tx => () => f(tx());


// either exception or valid computation (more restricted than either)

Eff.F.except = f => tx => tx?.constructor?.name === "Exception"
  ? tx : f(tx);


// lazy evaluation with thunks (deferred evaluation + sharing)

Eff.F.lazy = f => tx => lazy(() => f(tx));


// computations that might not yield a result

Eff.F.option = f => tx => tx === null ? tx : f(tx);


// implicit argument

Eff.F.reader = f => tx => r => f(tx(r));


// stateful computation

Eff.F.state = f => tx => s => _let(tx(s)).in(([x, s2]) => [f(x), s2]);


/* Trampoline effect to ensure stack safety. You must wrap the whole expression
into a trampoline using `Tramp.bounce` in order for it to work. */

Eff.F.tramp = f => tx => Eff.M.tramp(tx) (x => Eff.tampOf(f(x)));


// logging

Eff.F.writer = f => ([x, w]) => [f(x), w];


/*
█████ Functor :: Alternative ██████████████████████████████████████████████████*/


Eff.Alt = {};


Eff.Alt.option = tx => ty => tx === null ? ty : tx;


Eff.Alt.optionZero = null;


/*
█████ Functor :: Applicative ██████████████████████████████████████████████████*/


Eff.A = {};


Eff.A.array = tf => tx => tx.reduce((acc, x) =>
  tf.reduce((acc2, f) =>
    (acc2.push(f(x)), acc2), acc), []);


Eff.A.arrayOf = x => [x];


Eff.A.async = tf => tx => k => tf(f => tx(x => k(f(x))))


Eff.A.asyncOf = x => k => k(x);


Eff.A.bottom = tf => tx => tf === undefined
  ? _throw("received undefined")
  : tx === undefined
    ? _throw("received undefined")
    : tf(tx);


Eff.A.bottomOf = x => x === null ? _throw("unexpected null") : x;


Eff.A.defer = tf => tx => () => tf() (tx());


Eff.A.deferOf = x => () => x;


Eff.A.either = tf => tx => {
  switch (tf.either.tag) {
    case "left": return tf;

    case "right": {
      switch (tx.either.tag) {
        case "left": return tx;

        case "right": return Either.Right(
          tf.either.val(tx.either.val));

        default: throw new Err("Either expected");
      }
    }

    default: throw new Err("Either expected");
  }
};


Eff.A.eitherOf = x => Either.Right(x);


Eff.A.except = tf => tx => tf?.constructor?.name === "Exception" ? tf
  : tx?.constructor?.name === "Exception" ? tx
  : tf(tx);


Eff.A.exceptOf = x => {
  if (x?.constructor?.name === "Exception")
    throw new Err("unexpected exception");

  else return x;
};


Eff.A.lazy = tf => tx => lazy(() => tf(tx));


Eff.A.lazyOf = x => lazy(() => x);


// see list monad below

Eff.A.listOf = x => [x, []];


Eff.A.option = tf => tx => tf === null ? tf : tx === null ? tx : tf(tx);


Eff.A.optionOf = x => {
  if (x === null) throw new Err("unexpected null");
  else return x;
};


Eff.A.reader = tf => tx => r => tf(r) (tx(r));


Eff.A.readerOf = x => _ => x;


Eff.A.tramp = tf => tx => Eff.M.tramp(tf) (f =>
  Eff.M.tramp(tx) (x => Eff.A.trampOf(f(x))));


Eff.A.state = tf => tx => s => _let(tf(s)).in(([f, s2]) =>
  _let(tx(s2)).in(([x, s3]) => [f(x), s3]));


Eff.A.stateOf = x => s => [x, s];


Eff.A.trampOf = () => Tramp.return;


Eff.A.writer = dict => ([f, w]) => ([x, w2]) => [f(x), dict.append(w) (w2)];


Eff.A.writerOf = dict => x => [x, dict.empty];


/*
█████ Functor :: Applicative :: Monad █████████████████████████████████████████*/


Eff.M = {};


// lawless array monad (arrays are no ADTs because they lack the empty case)

Eff.M.array = mx => fm => mx.flatMap(fm);

/*Eff.arrayM = mx => fm => function go(acc, i) {
  if (i >= mx.length) return acc;
  else return go(A.pushn(fm(mx[i])) (acc), i + 1);
} ([], 0);*/


// even more lawless array "monad" variant that short circuits

Eff.M.array_ = mx => fm => function go(acc, i) {
  if (i >= mx.length) return acc;
  
  else {
    const my = fm(mx[i]);

    if (my?.constructor?.name === "Array")
      return go(A.pushn(my) (acc), i + 1);

    else return acc;
//       ^^^^^^^^^^ short circuit
  }
} ([], 0);


// can only be the outermost monad in a composition

Eff.M.async = mx => fm => k => mx(x => fm(x) (k));


Eff.M.bottom = mx => fm => {
  if (mx === undefined) throw new Err("received undefined");

  else {
    const my = fm(mx);
    if (my === undefined) throw new Err("returned undefined");
    else return my;
  }
};


// can only be the outermost monad in a composition

Eff.M.defer = mx => fm => () => fm(mx()) ();


Eff.M.either = mx => fm => {
  switch (mx.either.tag) {
    case "left": return mx;
    case "right": return fm(mx.either.val);
    default: throw new Err("Either expected");
  }
};


Eff.M.except = mx => fm =>
  mx?.constructor?.name === "Exception" ? mx : fm(mx);


/* Can only be the outermost monad in a composition. Usage:

const tx = Eff.T.list(Eff.dict.lazy)
  (L.fromArr([1,2,3,4,5]))
    (x => lazy(() => L.of(x * x)));

// result list not evaluated yet

L.take(3) (tx); // evaluates the first three elements and yields 9
tx[1] [0]; // evaluates nothing due to sharing and yields 4 */

Eff.M.lazy = mx => fm => lazy(() => fm(mx));


// the lawful array monad is the list monad

Eff.M.list = mx => fm => function go(my) {
  if (my.length === 0) return [];
  else return L.append(fm(my[0])) (go(my[1]));
} (mx);


Eff.M.option = mx => fm => mx === null ? mx : fm(mx);


Eff.M.reader = mx => fm => r => fm(mx(r)) (r);


Eff.M.state = mx => fm => s => _let(mx(s)).in(([x, s2]) => fm(x) (s2));


/* Can only be the outermost monad in a composition. Usage:

Tramp(Eff.T.array(Eff.dict.tramp)
  (Eff.A.trampOf(Array(1e6).fill(1)))
    (Tramp.bounce_(x => Eff.A.trampOf([x + 1]))))); // stack-safe */

Eff.M.tramp = mx => fm => {
  if (mx.constructor === Tramp.bounce)
    return Tramp.bounce(mx.x) (y => Eff.M.tramp(mx.f(y)) (fm));

  else if (mx.constructor === Tramp.return) return fm(mx.x);
  else throw new Err("invalid constructor");
};


Eff.M.writer = dict => ([x, w]) => fm => 
  _let(f(x)).in(([y, w2]) => [y, dict.append(w, w2)]);


/*
█████ Transformer █████████████████████████████████████████████████████████████*/


// compose monadic effects


Eff.T = {};


// not a lawful monad transformer, i.e. won't always behave as expected

// Monad m -> m [a] -> (a -> m [b]) -> m [b]
Eff.T.array = dict => mmx => fmm => function go(acc, i) {
  return dict.chain(mmx) (mx => {
    if (i >= mx.length) return dict.of(acc);
    else return dict.chain(fmm(mx[i])) (my => go(A.pushn(my) (acc), i + 1));
  });
} ([], 0);


Eff.T.bottom = dict => mmx => fmm => dict.chain(mmx) (mx => {
  if (mx === undefined) throw new Err("received undefined");
  else return fmm(mx);
});


Eff.T.either = dict => mmx => fmm => dict.chain(mmx) (mx => {
  switch (mx.either.tag) {
    case "left": return dict.of(mx);
    case "right": return fmm(mx.either.val);
  }  
});


Eff.T.except = dict => mmx => fmm => dict.chain(mmx) (mx => {
  if (mx?.constructor?.name === "Exception") return dict.of(mx);
  else return fmm(mx);
});


// lawful monad transformer

Eff.M.list = mx => fm => function go(my) {
  if (my.length === 0) return [];
  else return L.append(fm(my[0])) (go(my[1]));
} (mx);


// Monad m -> m (List a) -> (a -> (List b)) -> (List b)
Eff.T.list = dict => mmx => fmm => function go(mmy) {
  return dict.chain(mmy) (my => {
    if (my.length === 0) return dict.of([]);
    else return L.append(fmm(my[0])) (go(my[1]));
  });
} (mmx);


Eff.T.option = dict => mmx => fmm => dict.chain(mmx) (mx => {
  if (mx === null) return dict.of(mx);
  else return fmm(mx);
});


/*
█████ Transformer :: Foldable █████████████████████████████████████████████████*/


// eliminiate the inner effect


Eff.T.Fold = {};


// Monad m -> (a -> m b -> m b) -> m b -> m [a] -> m b
Eff.T.Fold.array = dict => fmm => acc => mmx => function go(i) {
  return dict.chain(mmx) (mx => mx.length === 0 ? acc : f(mx[i]) (go(i + 1)));
} (0);


// Monad m -> (a -> m b -> m b) -> m b -> m (List a) -> m b
Eff.T.Fold.list = dict => fmm => acc => function go(mmx) {
  return dict.chain(mmx) (mx => mx.length === 0 ? acc : fmm(mx[0]) (go(mx[1])));
};


/*
█████ Type Class Ops ██████████████████████████████████████████████████████████*/


Eff.liftA = dict => f => tx => ty => dict.ap(dict.map(f) (tx)) (ty);


// map effects but discard values

Eff.mapEff = dict => x => dict.map(_ => x);


// applicative map but discard the second result

Eff.apEff1 = dict => tx => ty => dict.ap(dict.map(_const) (tx)) (ty);


// applicative map but discard the first result

Eff.apEff2 = dict => tx => ty => dict.ap(dict.map(const_) (tx)) (ty);


/* Fold with effects:

Eff.foldM(Eff.dict.option) (acc => x =>
  x === null ? null : acc + x) (0) ([1, 2, 3, null, 5]); // yields null

Eff.foldM(Eff.dict.either) (acc => tx =>
  tx.either.tag === "left"
    ? Either.Left(acc)
    : Either.Right(acc + tx.either.val)) (0) ([
        Either.Right(1),
        Either.Right(2),
        Either.Right(3),
        Either.Left(4),
        Either.Right(5)]); // yields Left(6) */

// Monad m => (b -> a -> m b) -> b -> [a] -> m b
Eff.foldM = dict => fm => init => xs =>
  A.foldr(x => gm => acc =>
    dict.chain(fm(acc) (x)) (gm)) (dict.of) (xs) (init);


// exception

Eff.except = {};


Eff.except.catch = x => tx => {
  if (tx?.constructor?.name === "Exception") return x;
  else return tx;
};


// option

Eff.option = {};


Eff.option.throw = tx => {
  if (tx === null) throw new Err("missing value");
  else return tx;
};


/*
█████ Type Dictionaries ███████████████████████████████████████████████████████*/


Eff.dict = {};


Eff.dict.array = {
  map: Eff.F.array,
  ap: Eff.A.array,
  of: Eff.A.arrayOf,
  chain: Eff.M.array,
  get mapA() {return Eff.Trav.array},
  get seqA() {return Eff.Trav.arraySeq},
  get fold() {return Eff.Fold.array}
};


Eff.dict.async = {
  map: Eff.F.async,
  ap: Eff.A.async,
  of: Eff.A.asyncOf,
  chain: Eff.M.async,
  mapA: Eff.Trav.async,
  seqA: Eff.Trav.asyncSeq,
  fold: Eff.Fold.async
};


Eff.dict.bottom = {
  map: Eff.F.bottom,
  ap: Eff.A.bottom,
  of: Eff.A.bottomOf,
  chain: Eff.M.bottom,
  mapA: Eff.Trav.bottom,
  seqA: Eff.Trav.bottomSeq,
  fold: Eff.Fold.bottom
};


Eff.dict.defer = {
  map: Eff.F.defer,
  ap: Eff.A.defer,
  of: Eff.A.deferOf,
  chain: Eff.M.defer,
  mapA: Eff.Trav.defer,
  seqA: Eff.Trav.deferSeq,
  fold: Eff.Fold.defer
};


Eff.dict.either = {
  map: Eff.F.either,
  ap: Eff.A.either,
  of: Eff.A.eitherOf,
  chain: Eff.M.either,
  mapA: Eff.Trav.either,
  seqA: Eff.Trav.eitherSeq,
  fold: Eff.Fold.either
};


Eff.dict.except = {
  map: Eff.F.except,
  ap: Eff.A.except,
  of: Eff.A.exceptOf,
  chain: Eff.M.except,
  mapA: Eff.Trav.except,
  seqA: Eff.Trav.exceptSeq,
  fold: Eff.Fold.except
};


Eff.dict.lazy = {
  map: Eff.F.lazy,
  ap: Eff.A.lazy,
  of: Eff.A.lazyOf,
  chain: Eff.M.lazy,
  mapA: Eff.Trav.lazy,
  seqA: Eff.Trav.lazySeq,
  fold: Eff.Fold.lazy
};


Eff.dict.list = {
  map: Eff.F.list,
  ap: Eff.A.list,
  of: Eff.A.listOf,
  chain: Eff.M.list,
  get mapA() {return Eff.Trav.list},
  get seqA() {return Eff.Trav.listSeq},
  get fold() {return Eff.Fold.list}
};


Eff.dict.option = {
  map: Eff.F.option,
  ap: Eff.A.option,
  of: Eff.A.optionOf,
  chain: Eff.M.option,
  mapA: Eff.Trav.option,
  seqA: Eff.Trav.optionSeq,
  fold: Eff.Fold.option
};


Eff.dict.tramp = {
  map: Eff.F.tramp,
  ap: Eff.A.tramp,
  get of() {return Eff.A.trampOf},
  chain: Eff.M.tramp,
  mapA: Eff.Trav.tramp,
  seqA: Eff.Trav.trampSeq,
  fold: Eff.Fold.tramp
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ ERROR/EXCEPTION ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Error ███████████████████████████████████████████████████████████████████*/


export const Err = Error; // shortcut


// throw as a first class expression

export const _throw = e => {
  throw e;
};


export const throw_ = e => {
  return {
    inCaseOf: p => x => {
      if (p(x)) throw e(x);
      else return x;
    },

    exceptFor: p => x => {
      if (!p(x)) throw e(x);
      else return x;
    }
  };
};


// try/catch block as an expression

export const _try = f => x => ({
  catch: handler => {
    try {return f(x)}
    catch(e) {return handler(x) (e)};
  }
});


export const throwAll = (...es) => {
  es[0].stack = es.reduce((acc, e) => acc + "\n" + e.stack, "");
  throw new es[0];
};


/*
█████ Exception ███████████████████████████████████████████████████████████████*/


/* Error class that is mainly used for the exception type or cases where errors
need to be aggregated instead of throwing them immediately. */


export class Exception extends Error {
  constructor(s, cause = {}) {
    super(s, cause);
  }
};


export const Ex = Exception;


// nest causal error chains in hindsight

Ex.aggregate = (...es) => es.reduce((acc, e) => {
  const {stack, message, cause} = e,
    e2 = new e.constructor(message, {cause: acc});

  e2.stack = e.stack;
  return e2;
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ LAZY EVALUATION ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Lazy evaluation has the following properties:

  * evaluate only when needed
  * evaluate only as far as necessary (to WHNF)
  * evaluate at most once (sharing)

scriptum realizes lazy evaluation using implicit thunks, i.e. thunks like
`() => expr` are hidden behind a proxy and thus are called implicitly:

  * expr + x
  * expr.foo
  * expr < x

All three operations force `expr` as an implicit thunk to be evaluated. You can
also call implicit thunks as if it were explicit ones, i.e. `expr()` works even
if if the evaluation doesn't yield an unary function.

There are some limitations to this Proxy-based thunk approach:

  * `typeof` isn't intercepted by the proxy (thus yields `object`)
  * `===` doesn't trigger evaluation
  * `&&`/`||` doesn't trigger evaluation
  * `throw` doesn't trigger evaluation

These limitations are considered throughout the library. */


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


const DETHUNK = PREFIX + "dethunk";


const EVAL = PREFIX + "eval";


const NULL = PREFIX + "null";


const THUNK = PREFIX + "thunk";


/*
█████ API █████████████████████████████████████████████████████████████████████*/


/* Create an implicit thunk. Just like with `typeof`, tag introspection should
not force evaluation. This isn't always possible in an untyped setting, though.
If wihtin an operation the tag for a lazy expression is known upfront, it can
be passed to the thunk through the `tag` argument. Otherwise, `null` is provided
via the `lazy` partially applied auxliliary function. In case of `null`, tag
introspection forces evaluation. When a specific tag is provided, it is up to
the user that it corresponds to the type of the eventually evaluated thunk. */

export const lazy_ = tag => thunk =>
  new Proxy(thunk, new Thunk(tag));


// evaluate an expression to weak head normal form (WHNF) provided it is a thunk

export const strict = x => {
  if (x?.[THUNK]) return x[DETHUNK];
  else return x;
};


/*
█████ Implementation Details ██████████████████████████████████████████████████*/


class Thunk {
  constructor(tag) {
    this.tag = tag;
    this.memo = NULL;
  }

  apply(f, that, args) {

    // enforce evalutation to WHNF

    if (this.memo === NULL) evaluate(this, f);

    if (typeof this.memo === "function") {
      this.memo = this.memo(...args);
      return this.memo;
    }

    // allow implicit thunks to be called explicitly

    else if (args.length === 0) return this.memo;
    else throw Err("calling a non-callable thunk");
  }

  get(f, k, p) {

    // prevent evaluation in case of introspection
    
    if (k === THUNK) return true;
    else if (k === "constructor") return Thunk;

    // enforce evaluation of a single layer

    else if (k === EVAL) {
      if (this.memo === NULL) this.memo = f();
      else if (this?.memo?.[THUNK] === true) this.memo = this.memo[EVAL];
      
      return this.memo;
    }

    // enforce evaluation to WHNF

    else if (k === DETHUNK) {
      if (this.memo === NULL) evaluate(this, f);
      return this.memo;
    }

    // avoid evaluation due to tag introspection

    else if (k === Symbol.toStringTag) {
      if (this.tag === null) {
        if (this.memo === NULL) evaluate(this, f);
        this.tag = this.memo ? this.memo[TAG] : undefined;
      }

      return this.tag;
    }

    // intercept implicit type casts

    else if (k === Symbol.toPrimitive
      || k === "valueOf"
      || k === "toString") {
        if (this.memo === NULL) evaluate(this, f);
        
        if (this.memo === null) throw new Err("implicit type cast on null");
        else if (k === "valueOf") return () => this.memo.valueOf();
        else if (k === "toString") return () => this.memo.toString();
        
        else if (k === Symbol.toPrimitive && this.memo?.[k]) 
          return () => this.memo[k] ();

        else return undefined;
    }

    // enforce evaluation to WHNF due to array context

    else if (k === Symbol.isConcatSpreadable) {
      if (this.memo === NULL) evaluate(this, f);
      if (this.memo?.[Symbol.isConcatSpreadable]) return true;
      else return false;
    }

    // enforce evaluation to WHNF due to property access

    else {
      if (this.memo === NULL) evaluate(this, f);

      // take method binding into account

      if (Object(this.memo) === this.memo 
        && this.memo[k]
        && this.memo[k].bind)
          return this.memo[k].bind(this.memo);

      else {
        const r = this.memo[k];

        if (r?.[THUNK]) {
          const x = r[DETHUNK];
          
          // replace thunk with result value

          this.memo[k] = x;
          return x;
        }

        else return r;
      }
    }
  }

  getOwnPropertyDescriptor(f, k) {

    // force evaluation to WHNF

    if (this.memo === NULL) evaluate(this, f);
    return Reflect.getOwnPropertyDescriptor(this.memo, k);
  }

  has(f, k) {

    // prevent evaluation in case of thunk introspection

    if (k === THUNK) return true;

    // enforce evaluation to WHNF

    if (this.memo === NULL) evaluate(this, f);
    return k in this.memo;
  }

  ownKeys(o) {

    // enforce evaluation to WHNF

    if (this.memo === NULL) evaluate(this, f);
    return Reflect.ownKeys(this.memo);
  }

  set(o) {
    throw new Err("set operation on immutable value");
  }
}


const evaluate = (_this, f) => {
  _this.memo = f();
  
  while (_this.memo?.[THUNK] === true) _this.memo = _this.memo[EVAL];

  // throw on undefined program state

  if (_this.memo === undefined)
    throw new Err("thunk evaluated to undefined");
  
  // enforce tag consistency

  else if (_this.tag !== null && _this.memo?.[TAG] !== _this.tag)
    throw new Err("tag argument deviates from actual value");
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


export const lazy = lazy_(null);


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


const memo = f => {
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

const memo_ = f => g => {
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
████████████████████████████ OVERLOADED OPERATORS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Javascript built-in overloaded operators as functions. Some of them only
make sense with implicit/explicit thunks. For example, with `and` you would
lose the lazy evaluation property of the `&&` operator, if you pass them as
expressions not wrapped in a thunk/function. */


/*
█████ Arithemtic ██████████████████████████████████████████████████████████████*/



export const abs = Math.abs;


export const add = x => y => x + y;


export const add_ = (x, y) => x + y;


export const div = x => y => x / y;


export const div_ = (x, y) => x / y;


export const mod = x => y => x % y;


export const mod_ = (x, y) => x % y;


export const mul = x => y => x * y;


export const mul_ = (x, y) => x * y;


export const pow = x => y => x ** y;


export const pow_ = (x, y) => x ** y;


export const sub = x => y => x - y;


export const sub_ = (x, y) => x - y;


/*
█████ Boolean Logic ███████████████████████████████████████████████████████████*/


export const between = ({lower, upper}) => x => x >= lower && x <= upper;


export const notBetween = ({lower, upper}) => x => x < lower || y > upper;


export const lt = x => y => x < y;


export const lte = x => y => x <= y;


export const eq = x => y => x === y;


/* Since `===` cannot be intercepted by proxies, implicit thunks are not forced
to WHNF. Hence the strict evaluation of operands. Works with implicit and
explicit thunks. */

export const eq_ = f => g => f() === g();


export const neq = x => y => x !== y;


/* Since `===` cannot be intercepted by proxies, implicit thunks are not forced
to WHNF. Hence the strict evaluation of operands. Works with implicit and
explicit thunks. */

export const neq_ = f => g => f() !== g();


export const gt = x => y => x > y;


export const gte = x => y => x >= y;


export const imply = ({true: t, false: f}) => x => y => {
  if (x) {
    if (y) return t;
    else return f;
  }

  else return t;
};


export const min = x => y => x <= y ? x : y;


export const max = x => y => x >= y ? x : y;


export const nand = ({t, f}) => x => y => !(x && y) ? t : f;


export const nor = ({t, f}) => x => y => !(x || y) ? t : f;


export const notF = x => f => !f(x);


export const notF_ = f => x => !f(x);


export const xor = ({t, f}) => x => y => {
  if (x && !y) return t;
  else if (!x && y) return t;
  else return f;
};


export const xor_ = xor({t: true, f: false});


export const xnor = ({t, f}) => x => y => // aka iff
  (x && y) || (!x && !y) ? t : f;


/*
█████ Ordering ████████████████████████████████████████████████████████████████*/


export const asc = x => y => x - y;


export const asc_ = (x, y) => x - y;


export const desc = y => x => x - y;


export const desc_ = (y, x) => x - y;


export const compareOn = order => compBoth(order);


export const compareOn_ = order => f => x => y => order(f(x), f(y));


/*
█████ Short Circuiting ████████████████████████████████████████████████████████*/


// g might never be evaluated

export const and = f => g => f() && g();


// g might never be evaluated

export const or = f => g => f() || g();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ PATTERN MATCHING ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Pattern matching for the poor man with first class switch expressions and a
default case check. You can simply return in each case block instead of having
to rely on the awkward `break` statement. Usage:

match(o => {
  switch(o.tag) {
    case "foo": {return ...}
    case "bar": {return ...}
    default: {return ...}
  }
}).pattern({tag: ...})

match(o => {
  switch(typeof o) {
    case "function": {return ...}
    case "object": {return ...}
    default: {return ...}
  }
}).pattern(x => {...})

match(xs => {
  switch(xs.length) {
    case 1: {return ...}
    case 2: {return ...}
    default: {return ...}
  }
}).pattern([...]) */

const match = f => ({
  pattern: o => {
    const r = f(o);
    if (r === undefined) throw new Err("missing default case");
    else return r;
  }
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ STACK SAFETY █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Tail Recursion ██████████████████████████████████████████████████████████*/


/* Stack-safe tail-recursion and mutual tail-recursion using a trampoline. The
`next` and `done` constructors are used to encode the recursive case and base
cases, respectively. Additionally, the `call` constructor is used to defer
function invocations. */


export const Loop = f => x => {
  let o = f(x);

  while (o?.constructor === Loop.rec) {
    switch (o.constructor) {
      case Loop.call: {
        o = o.f(o.x);
        break;
      }

      case Loop.rec: {
        o = f(o.x);
        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid constructor");
    }
  }

  if (o?.constructor === Loop.base) return o.x;
  else return o;
};


export const Loop2 = f => (x, y) => {
  let o = f(x, y);

  while (o?.constructor === Loop2.rec) {
    switch (o.constructor) {
      case Loop2.call: {
        o = o.f(o.x, o.y);
        break;
      }

      case Loop2.rec: {
        o = f(o.x, o.y);
        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid tag");
    }
  }

  if (o?.constructor === Loop2.base) return o.x;
  else return o;
};


export const Loop3 = f => (x, y, z) => {
  let o = f(x, y, z);

  while (o?.constructor === Loop3.rec) {
    switch (o.constructor) {
      case Loop3.call: {
        o = o.f(o.x, o.y, o.z);
        break;
      }

      case Loop3.rec: {
        o = f(o.x, o.y, o.z);
        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid tag");
    }
  }

  if (o?.constructor === Loop3.base) return o.x;
  else return o;
};


// constructors


Loop.call = function call(f, x) {
  return {[TAG]: "Loop", constructor: Loop.call, f, x};
};


Loop.rec = function rec(x) {
  return {[TAG]: "Loop", constructor: Loop.rec, x};
};


Loop.base = function base(x) {
  return {[TAG]: "Loop", constructor: Loop.base, x};
};


Loop2.call = function call(f, x, y) {
  return {[TAG]: "Loop2", constructor: Loop2.call, f, x, y};
};


Loop2.rec = function rec(x, y) {
  return {[TAG]: "Loop2", constructor: Loop2.rec, x, y};
};


Loop2.base = function base(x) {
  return {[TAG]: "Loop2", constructor: Loop2.base, x};
};


Loop3.call = function call(f, x, y, z) {
  return {[TAG]: "Loop3", constructor: Loop3.call, f, x, y, z};
};


Loop3.rec = function rec(x, y, z) {
  return {[TAG]: "Loop3", constructor: Loop3.rec, x, y, z};
};


Loop3.base = function base(x) {
  return {[TAG]: "Loop3", constructor: Loop3.base, x};
};


/*
█████ Tail Recurson Modulo Cons & Beyond ██████████████████████████████████████*/


/* Stack-safe recursion not in tail position using a trampoline. It is capable
of mimicking tail recursion modulo cons and more complex operations not in
tail position like the original Fibbonacci algorithm:

  const fib_ = n =>
    n <= 1 ? n
      : fib_(n - 1) + fib_(n - 2);

Transformed into the trampoline version it becomes:

  const add = x => y => x + y;

  const fib = Stack(n =>
    n <= 1
      ? Stack.base(n)
      : Stack.call2(
          add,
          Stack.rec(n - 1),
          Stack.rec(n - 2))); */


export const Stack = f => x => {
  const stack = [f(x)];

  while (stack.length > 1 || stack[0].constructor !== Stack.base) {
    let o = stack[stack.length - 1];

    switch (o.constructor) {
      case Stack.call:
      case Stack.call2: {

        // 1st x of call/call2 and 2nd x of nested constructor

        o = f(o.x.x);
        stack.push(o);
        break;
      }

      case Stack.base: {
        while (stack.length > 1 && stack[stack.length - 1].constructor === Stack.base) {
          const p = (stack.pop(), stack.pop());

          switch (p.constructor) {
            case Stack.call: {
              o = Stack.base(p.f(o.x));
              stack.push(o);
              break;
            }

            case Stack.call2: {
              o = Stack.call(p.f(o.x), p.y);
              stack.push(o);
              break;
            }

            default: throw new Err("invalid trampoline constructor");
          }
        }

        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid trampoline constructor");
    }
  }

  return stack[0].x;
};


export const Stack2 = f => (x, y) => {
  const stack = [f(x, y)];

  while (stack.length > 1 || stack[0].constructor !== Stack2.base) {
    let o = stack[stack.length - 1];

    switch (o.constructor) {
      case Stack2.call:      
      case Stack2.call2: {

        // 1st x of call/call2 and 2nd x/y of nested constructor
        
        o = f(o.x.x, o.x.y);
        stack.push(o);
        break;
      }

      case Stack2.base: {
        while (stack.length > 1 && stack[stack.length - 1].constructor === Stack2.base) {
          const p = (stack.pop(), stack.pop());

          switch (p.constructor) {
            case Stack2.call: {
              o = Stack2.base(p.f(o.x, o.y));
              stack.push(o);
              break;
            }

            case Stack2.call2: {
              o = Stack2.call(p.f(o.x, o.y), p.y);
              stack.push(o);
              break;
            }

            default: throw new Err("invalid trampoline constructor");
          }
        }

        break;
      }

      case Thunk: {
        o = strict(o);
        break;
      }

      default: throw new Err("invalid trampoline constructor");
    }
  }

  return stack[0].x;
};


// constructors


Stack.call = function call(f, x) {
  return {[TAG]: "Stack", constructor: Stack.call, f, x};
};


Stack.call2 = function call2(f, x, y) {
  return {[TAG]: "Stack", constructor: Stack.call2, f, x, y};
};


Stack.rec = function rec(x) {
  return {[TAG]: "Stack", constructor: Stack.rec, x};
};


Stack.base = function base(x) {
  return {[TAG]: "Stack", constructor: Stack.base, x};
};


Stack2.call = function call(f, x) {
  return {[TAG]: "Stack2", constructor: Stack2.call, f, x};
};


Stack2.call2 = function call2(f, x, y) {
  return {[TAG]: "Stack2", constructor: Stack2.call2, f, x, y};
};


Stack2.rec = function rec(x) {
  return function rec(y) {
    return {[TAG]: "Stack2", constructor: Stack2.rec, x, y};
  };
};


Stack2.base = function base(x) {
  return {[TAG]: "Stack2", constructor: Stack2.base, x};
};



/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ THIS █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// make the receiving object explicit and consequently `this` redundant

export const This = t => ({
  app: x => This(t(x)), // applies the boxed fun
  app_: x => This(y => t(y) (x)), // applies the 2nd arg of the boxed fun
  map: f => This(f(t)),  // applies the fun
  map_: f => This(x => f(x) (t)), // applies the 2nd arg of the fun
  unthis: t // retrieves the boxed value
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ VALUE OBJECTS ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Value objects are objects but with value identity just like primitives, i.e.
comparing two value objects is equivalent to comparing two numbers. Equality
solely depends on values not references. Value objects don't create a memory
leak because they use weak references. Usage:

  const Tuple = ValObj("Tuple") ("1", "2");

  const tx = Tuple(123, true),
    ty = Tuple(123, true),
    tz = Tuple(123, false),
    ta = Tuple(tx, ty),
    tb = Tuple(tx, ty),
    tc = Tuple(ty, tz);

  tx === ty // true
  tx === tz // false
  ta === tb // true
  ta === tc // false

Internally, the value objects depend on JSON serialization as a hashing
mechanism. Hence, functions and symbols are invalid values. Please note
that a performance penalty only exists at value object creation time, not
afterwards. */

export const ValObj = (tag, store = new Map())  => (...ks) => (...vs) => {
  let hash = "";

  for (let i = 0; i < ks.length; i++) {
    hash += "|" + JSON.stringify(vs[i], function replacer(k, v) {
      const tag2 = Object.prototype.toString.call(v).slice(8, -1);

      switch (tag2) {
        case "Function":
        case "Symbol":
        case "Undefined": throw new Err(`invalid value of type "${tag2}"`);
        default: return v;
      }
    });
  }

  let o = store.get(hash)?.deref();

  if (o === undefined) {
    o = Object.defineProperty({}, TAG, {value: tag});
    for (let i = 0; i < ks.length; i++) o[ks[i]] = vs[i];
    store.set(hash, new WeakRef(o));
    return o;
  }

  else return o;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████ TYPE CLASS COMBINATORS ████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FOLDABLE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const foldAll = Foldable => p => Foldable.foldr(x => acc =>
  p(x) ? acc : false) (true);


export const foldAnd = Foldable => Foldable.foldr(b => acc => b && acc) (true);


export const foldAny = Foldable => p => Foldable.foldr(x => acc =>
  p(x) ? true : acc) (false);


// (Foldable t, Monoid m) => (a -> m) -> t a -> m
export const foldMapl = (Foldable, Monoid) => f =>
  Foldable.foldl(compSnd(Monoid.append) (f)) (Monoid.empty);


// (Foldable t, Monoid m) => (a -> m) -> t a -> m
export const foldMapr = (Foldable, Monoid) => f =>
  Foldable.foldr(comp(Monoid.append) (f)) (Monoid.empty);


export const foldMax = (Foldable, Order) => tx => Foldable.foldl1(Order.max) (tx);


export const foldMin = (Foldable, Order) => tx => Foldable.foldl1(Order.min) (tx);


export const foldOr = Foldable => Foldable.foldr(b => acc => b || acc) (false);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ FUNCTOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// perform effects but discard result

export const mapEff = Functor => x => Functor.map(_ => x);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ FUNCTOR :: ALTERNATIVE ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Usage of guard:

  A.chain([1,2,3]) (x =>
    A.chain([4,5,6]) (y =>
      A.chain(guard(A.Alternative) (x * y === 8)) (_ =>
        A.of(Pair(x, y))))); // yields [[2, 4]]

This is backtracking with left-biased conjunctions. */

export const guard = Alternative => x =>
  x ? Alternative.of(null) : Alternative.zero;


export const some = Alternative => tx =>
  Alternative.ap(Alternative.map(A.Cons) (tx)) (many(Alternative) (tx));
  

export const many = Alternative => tx =>
  Alternative.alt(some(Alternative) (tx)) (Alternative.of([]));


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ FUNCTOR :: APPLY ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const apEff1 = Apply => tx => ty => Apply.ap(Apply.map(_const) (tx)) (ty);


export const apEff2 = Apply => tx => ty => Apply.ap(mapEff(Apply) (id) (tx)) (ty);


export const liftA2 = Apply => f => tx => ty => Apply.ap(Apply.map(f) (tx)) (ty);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████ FUNCTOR :: APPLY :: APPLICATIVE ███████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// Applicative m => (a -> m Boolean) -> [a] -> m [a]
export const filterM = Applicative => p => mx =>
  A.foldr(x => 
    liftA2(Applicative) (b =>
      b ? A.cons(x) : id) (p(x))) (Applicative.of([]));


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████ FUNCTOR :: APPLY :: CHAIN ██████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* It is possible to chain several monads of the same type in a principled
fashion while maintaining a flat composition syntax, provided all subsequent
invocations of the partially applied Kleisli action are wrapped in a minimal
functiorial context.

The approach leaks into the call side and adds some syntactical noise but there
is no better alternative:

  const chain2_ = chain2(Monad);
                         ^^^^^
                       type class

  chain2_([1,2,3]) ([4,5,6]) (x => x & 1 ? of(y => [x + y]) : []);
          ^^^^^^^   ^^^^^^^                ^^^^^^^^^^^^^^^^
           monad     monad         next computation depends on x */


export const chain2 = Chain => mx => my => fm =>
  Chain.chain(mx) (x => Chain.chain(fm(x)) (gm => Chain.chain(my) (gm)));


export const chain3 = Chain => mx => my => mz => fm =>
  Chain.chain(mx) (x =>
    Chain.chain(fm(x)) (gm =>
      Chain.chain(my) (y =>
        Chain.chain(gm(y)) (hm =>
          Chain.chain(mz) (hm)))));


export const chainn = Chain => (...ms) => fm => function go(gm, i) {
  if (i === ms.length) return gm;
  else return Chain.chain(ms[i]) (x => Chain.chain(gm(x)) (hm => go(hm, i + 1)));
} (fm, 0);


// collapse two monadic contexts (of the same type)

export const join = Chain => mmx => Chain.chain(mmx) (id);


/*
█████ Kleisli Composition █████████████████████████████████████████████████████*/


// composing of monadic actions: `a -> m a`


export const komp = Chain => fm => gm => x => Chain.chain(fm(x)) (gm);


export const kipe = Chain => gm => fm => x => Chain.chain(fm(x)) (gm);


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ MONAD ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// (b -> a -> m b) -> b -> t a -> m b
export const foldlM = (Foldable, Monad) => fm => init => mx =>
  Foldable.foldr(x => gm => acc =>
    Monad.chain(fm(acc) (x)) (gm)) (Monad.of) (mx) (init);


// (a -> b -> m b) -> b -> t a -> m b
export const foldrM = (Foldable, Monad) => fm => init => mx =>
  Foldable.foldl(gm => x => acc =>
    Monad.chain(fm(x) (acc)) (gm)) (Monad.of) (mx) (init);


// Monad -> (s -> m (Maybe [a, s])) -> s -> m [a]
export const unfoldrM = Monad => fm => function go(seed) {
  return Monad.chain(fm(seed)) (pair => {
    const t = intro(pair);
    
    if (t === null) return [];

    else return liftA2(Monad) (A.cons)
      (Monad.of(pair[0]))
        (lazy(() => go(pair[1])));
  });
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TYPES ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ FUNCTION ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const F = {}; // shortcut


/*
█████ Applicators █████████████████████████████████████████████████████████████*/


export const app = f => x => f(x);


export const app_ = x => f => f(x);


export const appr = (f, y) => x => f(x) (y);


export const applyObj = f => o => Object.values(o)
  .reduce((acc, v) => acc(v), f);


export const applyObj_ = f => o => f(...Object.values(o));


export const applyTuple = f => xs => xs.reduce((acc, x) => acc(x), f);


export const applyTuple_ = f => xs => f(...xs);


export const cont = f => x => k => k(f(x));


export const curry = f => x => y => f(x, y);


export const flip = f => y => x => f(x) (y);


// enable let bindings as expressions in a succinct form

export const _let = (...args) => ({in: f => f(...args)});


/* Avoid function call nesting. There are two forms depending on the `first`
argument:

  true:  (x, f, y, g, z) => g(f(x) (y)) (z)
  false: (x, f, y, g, z) => g(z) (f(x) (y))

Classic function composition composes operators `comp`/`pipe` compose in their
first argument just like applicative `ap`. Functorial `map`, however, composes
in its second argument. */

const _infix = first => (...args) => {
  if (args.length === 0) throw new Err("no argument found");

  let i = 1, x = args[0];

  while (i < args.length) {
    if (i === 1) x = args[i++] (x) (args[i++]);
    else if (first) x = args[i++] (x) (args[i++]);
    else x = args[i++] (args[i++]) (x);
  }

  return x;
};


export const infix = _infix(true);


export const infix_ = _infix(false);


// more readable immediately invoked functon expression

export const scope = f => f();


export const uncurry = f => (x, y) => f(x) (y);


/*
█████ Category ████████████████████████████████████████████████████████████████*/


export const id = x => x;


F.Category = () => {
  comp,
  id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


export const comp = f => g => x => f(g(x));


export const comp3 = f => g => h => x => f(g(h(x)));


export const compSnd = f => g => x => y => f(x) (g(y));


export const compThd = f => g => x => y => z => f(x) (y) (g(z));


export const compBin = f => g => x => y => f(g(x) (y));


export const compBoth = f => g => x => y => f(g(x)) (g(y));


export const liftFst = f => g => x => g(f(x)) (x); // chain


export const liftSnd = f => g => x => f(x) (g(x)); // ap


export const liftBoth = f => g => h => x => f(g(x)) (h(x));


export const pipe = g => f => x => f(g(x));


export const pipe3 = h => g => f => x => f(g(h(x)));


/* Create a queue of functions that can be applied in sequence in a stack-safe
manner. You can not only get the final result but recover all intermediate
results by consuming the generator with `Array.from`. */

export const seq = fs => function* (x) {
  for (let i = 0; i < fs.length; i++) {
    x = fs[i] (x);
    yield x;
  }

  return x;
};


// variant implemented as a stack, not a queue

export const seq_ = fs => function* (x) {
  for (let i = fs.length - 1; i >= 0; i--) {
    x = fs[i] (x);
    yield x;
  }

  return x;
};


/*
█████ Contravariant ███████████████████████████████████████████████████████████*/


F.contramap = () => pipe;


F.Contra = () => {contramap: F.contramap};


/*
█████ Debugging ███████████████████████████████████████████████████████████████*/


// debug after a (sub-)expression is evaluated

export const debug = expr => {
  debugger;
  return expr;
};


// debug before a function call

export const debugf = f => (...args) => {
  debugger;
  return f(...args);
};


export const debugIf = p => expr => {
  if (p(expr)) debugger;
  return expr;
};


export const debugIfF = p => f => (...args) => {
  if (p(...args)) debugger;
  return f(...args);
};


export const log = (x, tag = "") => {
  if (tag) console.log(tag, x);
  else console.log(x);
  return x;
};


export const trace = x => {
  console.log(x);
  console.log("JSON:", JSON.stringify(x));
  return x;
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


F.map = comp;


F.Functor = {map: F.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


// identical to Chain


F.ap = liftSnd;


F.Apply = {
  ...F.Functor,
  ap: F.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


export const _const = x => y => x;


export const const_ = x => y => y;


F.of = _const;


F.Applicative = {
  ...F.Apply,
  of: F.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* Encodes the effect of implicitly threading an argument through a large
function composition. */ 


F.chain = liftFst;


F.Chain = {
  ...F.Apply,
  chain: F.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


F.join = f => x => f(x) (x);


F.Monad = {
  ...F.Applicative,
  chain: F.chain
};


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


F.extend = Semigroup => f => g => x => f(y => g(Semigroup.append(x) (y)));


F.Extend = {
  ...F.Functor,
  extend: F.extend
};


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


F.extract = Monoid => f => f(Monoid.empty);


F.Comonad = {
  ...F.Extend,
  extract: F.extract
};


/*
█████ Functor :: Profunctor ███████████████████████████████████████████████████*/


/* bimap/dimap comparison:

  bimap :: (a -> b) -> (c -> d) -> bifunctor  a c -> bifunctor  b d
            ^^^^^^
  dimap :: (b -> a) -> (c -> d) -> profunctor a c -> profunctor b d
  (phrase -> [word]) -> ([word] -> phrase) -> ([word] -> [word]) -> (phrase -> phrase) */


F.dimap = h => g => f => x => g(f(h(x)));
          

F.lmap = pipe;


F.rmap = comp;


F.Profunctor = {
  ...F.Functor,
  dimap: F.dimap,
  lmap: F.lmap,
  rmap: F.rmap
};


/*
█████ Impure ██████████████████████████████████████████████████████████████████*/


export const eff = f => x => (f(x), x);


/* Takes an arbitrary number of expressions or statements and returns an array
of evaluated values of each one. Useful if statements are mixed with expressions
or destructive operations return a value but also modify the initial reference
value (e.g. `effs(xs.pop(), xs)`). */

export const enumEffs = (...exps) => exps;


// like `effs` but only returns the first evaluated value

export const enumEffsFirst = (...exps) => exps[0];


// like `effs` but only returns the last evaluated value

export const enumEffsLast = (...exps) => exps[exps.length - 1];


// introspection

export const intro = x =>
  Object.prototype.toString.call(x).slice(8, -1);


// introduce state
  
export const introState = state => f => f(state);


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


F.append = Semigroup => f => g => x => Semigroup.append(f(x)) (g(x));


F.Semigroup = {append: F.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


F.empty = Monoid => _ => Monoid.empty;


F.Monoid = {
  ...F.Semigroup,
  empty: F.empty
};


/*
█████ Transducer ██████████████████████████████████████████████████████████████*/


export const drop = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, acc)
      : append(acc) (x);
};


export const dropk = n => append => { 
  let m = 0;

  return acc => x => k =>
      m < n
        ? (m++, k(acc))
        : append(acc) (x) (k)
};


export const dropr = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, acc)
      : append(x) (acc);
};


export const dropWhile = p => append => {
  let drop = true;

  return acc => x => 
    drop && p(x)
      ? acc
      : (drop = false, append(acc) (x));
};


export const dropWhilek = p => append => {
  let drop = true;

  return acc => x => k =>
    drop && p(x)
      ? k(acc)
      : (drop = false, append(acc) (x) (k))
};


export const dropWhiler = p => append => {
  let drop = true;

  return x => acc =>
    drop && p(x)
      ? acc
      : (drop = false, append(x) (acc));
};


export const filter = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


export const filterk = p => append => acc => x => k =>
  p(x)
    ? append(acc) (x) (k)
    : k(acc);


export const filterr = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


export const map = f => append => acc => x =>
  append(acc) (f(x));


export const mapk = f => append => acc => x => k =>
  append(acc) (f(x)) (k);


export const mapr = f => append => x => acc =>
  append(f(x)) (acc);


export const take = n => append => { 
  let m = 0;

  return acc => x =>
    m < n
      ? (m++, append(acc) (x))
      : acc;
};


export const takek = n => append => { 
  let m = 0;

  return acc => x => k =>
    m < n
      ? (m++, append(acc) (x) (k))
      : acc;
};


export const taker = n => append => { 
  let m = 0;

  return x => acc =>
    m < n
      ? (m++, append(x) (acc))
      : acc;
};


export const takeWhile = p => append => acc => x =>
  p(x)
    ? append(acc) (x)
    : acc;


export const takeWhilek = p => append => acc => x => k =>
  p(x)
    ? append(acc) (x)(k)
    : acc;


export const takeWhiler = p => append => x => acc =>
  p(x)
    ? append(x) (acc)
    : acc;


export const transducel = (Semigroup, Foldable) => f =>
  Foldable.foldl(f(Semigroup.append));


export const transducer = (Semigroup, Foldable) => f =>
  Foldable.foldr(f(Semigroup.append));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


F.Category = F.Category();


F.contramap = F.contramap();


F.Contra = F.Contra();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ ARRAY ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Enocodes the effect of computations that may have no, one or several results.
Array is not a functional data type, because it has a non recursive definition.
While it has a valid monad instance, there is no valid transformer. Use list or
streams instead. */


export const A = {}; // shortcut


/*
█████ Cloning █████████████████████████████████████████████████████████████████*/


A.clone = xs => xs.concat();


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


A.fromAit = () => comp(S.fromPromise) (async function (ix) {
  const xs = [];
  for await (const pair of ix) xs.push(pair);
  return xs;
});


A.fromAitKeys = () => comp(S.fromPromise) (async function (ix) {
  const xs = [];
  for await (const [k] of ix) xs.push(k);
  return xs;
});


A.fromAitValues = () => comp(S.fromPromise) (async function (ix) {
  const xs = [];
  for await (const [, v] of ix) xs.push(v);
  return xs;
});


/* Parse csv data with and without headings. Consider an optional header for
additional, file-wide meta data. Consecutive double or triple delimiters are
considered as escaped and thus part of the content, not the syntax. Separators
within delimiters are alos considered as part of the content, not the syntax. */

A.fromCsv = ({sep, delim, header, headings}) => csv => {
  const csv2 = csv.trim()
    .replaceAll(new RegExp(`${delim}{2,3}`, "gv"), "<delim/>");
  
  const xs = csv2.split(new RegExp(`(${delim})`));

  if (csv[0] === delim) xs.shift();
  if (csv[csv.length - 1] === delim) xs.pop();

  const ys = xs.map(s => {
    if (s[0] !== sep) {
      if (s[s.length - 1] === sep) throw new Err("invalid csv data");
      else return s.replaceAll(new RegExp(sep, "g"), "<sep/>");
    }

    else return s;
  });

  const table = ys.join("")
    .replaceAll(new RegExp(`${delim}${sep}`, "g"), sep)
    .replaceAll(new RegExp(`${sep}${delim}`, "g"), sep)
    .replaceAll(new RegExp(`^${delim}`, "gm"), "")
    .replaceAll(new RegExp(`${delim}$`, "gm"), "")
    .replaceAll("<delim/>", delim)
    .split(/\r?\n/)
    .map(row => row.split(sep)
      .map(col => col.replaceAll(/<sep\/>/g, sep)));

  if (header) table.meta = table.shift();

  if (headings) {
    const names = table.shift();

    return table.map(cols =>
      cols.reduce((acc, col, i) => (acc[names[i]] = col, acc), {}));
  }

  else return table;
};


A.fromIt = ix => {
  const xs = [];
  for (const pair of ix) xs.push(pair);
  return xs;
};


A.fromItKeys = ix => {
  const xs = [];
  for (const [k] of ix) xs.push(k);
  return xs;
};


A.fromItValues = ix => {
  const xs = [];
  for (const [, v] of ix) xs.push(v);
  return xs;
};


A.fromList = () => L.foldl(acc => x => (acc.push(x), acc))
  (Object.defineProperty(() => [], NEW, {value: true}));


A.fromListF = f => L.foldl(acc => x => (acc.push(f(x)), acc)) ([]);


A.fromQueue = () => ([fw, bw]) => {
  const fw2 = L.foldl(acc => x => (acc.push(x), acc)) ([]) (fw),
    bw2 = L.foldl(acc => x => (acc.unshift(x), acc)) ([]) (bw);

  return A.pushn(bw2) (fw2);
};


A.fromQueueF = f => ([fw, bw]) => {
  const fw2 = L.foldl(acc => x => (acc.push(f(x)), acc)) ([]) (fw),
    bw2 = L.foldl(acc => x => (acc.unshift(f(x)), acc)) ([]) (bw);

  return A.pushn(bw2) (fw2);
};


A.fromStr = s => s.split("");


A.fromTable = xss => xss.flat();


A.fromTableBy = f => xs => xs.reduce((acc, x) => f(acc) (x), []);


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


A.cons = x => xs => [x].concat(xs);


A.cons_ = xs => x => [x].concat(xs);


A.head = xs => xs.length === 0 ? null : xs[0];


A.headOr = x => xs => xs.length === 0 ? x : xs[0];


A.index = i => xs => (i in xs) ? xs[i] : null;


A.indexOr = x => i => xs => (i in xs) ? xs[i] : x;


A.init = xs => xs.length === 0 ? null : xs.slice(0, -1);


A.last = xs => xs.length === 0 ? null : xs[xs.length - 1];


A.lastOr = x => xs => xs.length === 0 ? x : xs[xs.length - 1];


A.push = x => xs => (xs.push(x), xs);


A.pushn = ys => xs => (xs.push.apply(xs, ys), xs);


A.push_ = xs => x => (xs.push(x), xs);


A.pushn_ = xs => ys => (xs.push.apply(xs, ys), xs);


A.pop = xs => Pair(xs.length === 0 ? null : xs.pop(), xs);


A.shift = xs => Pair(xs.length === 0 ? null : xs.shift(), xs);


A.singleton = x => [x];


A.snoc = x => xs => xs.concat([x]);


A.snoc_ = xs => x => xs.concat([x]);


A.tail = xs => xs.length === 0 ? null : xs.slice(1);


A.uncons = xs => Pair(xs.length === 0 ? null : xs[0], xs.slice(1));


A.unshift = x => xs => (xs.unshift(x), xs);


A.unshiftn = ys => xs => (xs.unshift.apply(xs, ys), xs);


A.unshift_ = xs => x => (xs.unshift(x), xs);


A.unshiftn_ = xs => ys => (xs.unshift.apply(xs, ys), xs);


A.unsnoc = xs => Pair(
  xs.length === 0 ? null : xs[xs.length - 1],
  xs.slice(-1));


/*
█████ Eq ██████████████████████████████████████████████████████████████████████*/


A.eq = Eq => xs => ys => {
  if (xs.length !== ys.length) return false;

  else return Loop(i => {
    if (i === xs.length) return Loop.base(true);

    else {
      const b = Eq.eq(xs[i]) (ys[i]);
      return b === true ? Loop.rec(i + 1) : Loop.base(false);
    }
  }) (0);
};


A.Eq = {eq: A.eq};


/*
█████ Focus ███████████████████████████████████████████████████████████████████*/


/* Sets a focus over a range of elements of an existing array and provides the
usual getters and setters for this range. Allows reduction/enlargment of the
range but the latter only without gaps. */

A.focus = (i, j = i) => xs => {
  return {
    del: i2 => {
      if (i2 + i <= j) (xs.splice(i2 + i, 1), j--);
      return xs;
    },

    has: i2 => i2 + i <= j,
    get: i2 => xs[i2 + i],

    get getCtx() {
      const o = {
        left: xs.slice(0, i),
        right: xs.slice(i)
      };

      delete this.getCtx;
      this.getCtx = o;
      return o;
    },

    set: (i2, v) => {
      if (i2 + i > j) (xs.splice(i2 + i, 0, ...v), j++);
      else xs[i2 + i] = v;
      return xs;
    },
    
    upd: (i2, f) => {
      if (i2 + i <= j) xs[i2 + i] = f(xs[i2 + i]);
      return xs;
    },

    [Symbol.iterator]: function*() {
      for (let i2 = i2 + i; i2 <= j; i2++) yield xs[i2];
    },
  };
};


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


A.filter = p => xs => xs.filter(x => p(x));


A.Filterable = {filter: A.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


A.foldl = f => init => xs => {
  let acc = init?.[NEW] ? init() : init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


// uncurried

A.foldl_ = f => acc => xs => {
  for (let i = 0; i < xs.length; i++)
    acc = f(acc, xs[i]);

  return acc;
};


A.foldl1 = f => xs => {
  let acc = xs.length === 0
    ? _throw(new Err("empty array")) : xs[0];

  for (let i = 1; i < xs.length; i++)
    acc = f(acc) (xs[i]);

  return acc;
};


// variant that incorporates the running index

A.foldi = f => init => xs => {
  let acc = init;

  for (let i = 0; i < xs.length; i++)
    acc = f(acc) (xs[i], i);

  return acc;
};


/* A fold with `f` encoded in continuation passing style so that the function
argument can decide whether to continue or abort the right-associative fold. */

A.foldk = f => init => xs =>
  Loop2((acc, i) =>
    i === xs.length
      ? Loop2.base(acc)
      : f(xs[i]) (acc) (acc2 => Loop2.rec(acc2, i + 1)))
        (init, 0);


// strict, right-associative and yet stack-safe fold

A.foldr = f => acc => xs => Stack(i => {
  if (i === xs.length) return Stack.base(acc);

  else return Stack.call(
    f(xs[i]),
    Stack.rec(i + 1));
}) (0);


// not stack-safe

A.foldr_ = f => acc => xs => function go(i) {
  if (i === xs.length) return acc;
  else return f(xs[i]) (go(i + 1));
} (0);


// only stack-safe if `f` is non-strict in its second argument

A._foldr = f => acc => xs => function go(i) {
  if (i === xs.length) return acc;
  else return f(xs[i]) (lazy(() => go(i + 1)));
} (0);


A.foldr1 = f => xs => Stack(i => {
  let acc = xs.length === 0
    ? _throw(new Err("empty array")) : xs[0];

  if (i === xs.length) return Stack.base(acc);

  else return Stack.call(
    f(xs[i]),
    Stack.rec(i + 1));
}) (0);


// fold pairwise

A.foldBin = f => acc => xs => {
  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc = f(acc) (Pair(xs[i], xs[j]));

  return acc;
};


// uncurried

A.foldBin_ = f => acc => xs => {
  for (let i = 0, j = 1; j < xs.length; i++, j++)
    acc = f(acc, xs[i], xs[j]);

  return acc;
};


// map followed by folding the resulting monoid

A.foldMap = Monoid => f => xs => {
  let acc = Monoid.empty;

  for (let i = 0; i < xs.length; i++)
    acc = Monoid.append(acc) (f(xs[i]));

  return acc;
};


A.sum = acc => A.foldl(m => n => m + n) (acc);


A.sum_ = acc => A.foldl_((m, n) => m + n) (acc);


A.Foldable = {
  foldl: A.foldl,
  foldl1: A.foldl1,
  foldr: A.foldr,
  foldr1: A.foldr1
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


A.mapA = Applicative => ft => {
  const liftA2_ = liftA2(Applicative);

  return A.foldl(acc => x =>
    liftA2_(A.push) (ft(x)) (acc))
      (Applicative.of([]));
};


A.seqA = Applicative =>
  A.foldl(liftA2(Applicative) (A.push_)) (Applicative.of([]));


A.Traversable = () => ({
  ...A.Foldable,
  ...A.Functor,
  mapA: A.mapA,
  seqA: A.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


A.map = f => tx => tx.map(f);


A.Functor = {map: A.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


A.alt = () => A.append;


A.Alt = () => ({
  ...A.Functor,
  alt: A.alt
});


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Object.defineProperty(A, "zero", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


A.Plus = {
  ...A.Alt
};


Object.defineProperty(A.Plus, "zero", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


/*
█████ Functor :: Apply (Non-Determinism) ██████████████████████████████████████*/


A.ap = fs => xs =>
  fs.reduce((acc, f) =>
    (acc.push.apply(acc, xs.map(x => f(x))), acc), []);


A.Apply = {
  ...A.Functor,
  ap: A.ap
};


/*
█████ Functor :: Apply (ZipArr) ███████████████████████████████████████████████*/


A.ZipArr = {}; // namespace


A.ZipArr.ap = () => A.zipWith(app);


/*
█████ Functor :: Apply :: Applicative (Non-Determinism) ███████████████████████*/


/* There is no applicative `ZipArr` instance because we cannot construct an
infinite array for the minimal context. */


A.of = A.singleton;


A.Applicative = {
  ...A.Apply,
  of: A.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


A.chain = xs => fm =>
  xs.reduce((acc, x) =>
    (acc.push.apply(acc, fm(x)), acc), []);


A.Chain = {
  ...A.Apply,
  chain: A.chain
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


A.Alternative = {
  ...A.Plus,
  ...A.Applicative
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


A.Monad = {
  ...A.Applicative,
  chain: A.chain
};


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


// there seems to be no useful instance


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


// there seems to be no useful instance


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


A.entries = m => m[Symbol.iterator] ();


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


/*
█████ Getter ██████████████████████████████████████████████████████████████████*/


A.at = i => xs => xs[i]; // curried `at` non-reliant on `this`


/*
█████ Indexing ████████████████████████████████████████████████████████████████*/


A.indicesOf = s => xs => {
  const ys = [];

  while (true) {
    const i = xs.indexOf(s, ys.length ? ys[ys.length - 1] + 1 : 0);
    if (i === NOT_FOUND) break;
    else ys.push(i);
  }

  return ys;
};


/*
█████ Recursion Schemes ███████████████████████████████████████████████████████*/


// eager arrays don't comply with lazy recursion schemes


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


A.append = xs => ys => xs.concat(ys);


A.Semigroup = {append: A.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Object.defineProperty(A, "empty", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


A.Monoid = {
  ...A.Semigroup
};


Object.defineProperty(A.Monoid, "empty", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


/*
█████ Special Folds ███████████████████████████████████████████████████████████*/


/* mapAccum isn't required for arrays because the last element representing the
final value can be easily accessed through its index. */


A.scanl = f => init => A.foldl(acc => x =>
  (acc.push(f(acc[acc.length - 1]) (x)), acc)) ([init]);


A.scanr = f => init => A.foldr(x => acc =>
  (acc.unshift(f(x) (acc[0])), acc)) ([init]);


/*
█████ Set Operations ██████████████████████████████████████████████████████████*/


A.dedupe = xs => Array.from(new Set(xs));


// ignores duplicates 

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


/*
█████ Subarrays ███████████████████████████████████████████████████████████████*/


// `slice` method is used instead of `A.drop`


A.dropWhile = p => xs => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else return p(xs[i]) ? Loop2.rec(acc, i + 1) : Loop2.base(xs.slice(i));
}) ([], 0);


// `slice` method is used instead of `A.take`


A.takeWhile = p => xs => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else return p(xs[i]) ? Loop2.rec((acc.push(xs[i]), acc), i + 1) : Loop2.base(acc);
}) ([], 0);


/*
█████ Transformation ██████████████████████████████████████████████████████████*/


// binary parition function

A.collate = p => xs => xs.reduce((pair, x)=> {
  if (p(x)) return (pair[0].push(x), pair);
  else return (pair[1].push(x), pair);
}, Pair([], []));


/* A more general partition function that allows dynamic key generation and
value combination. */

A.collateBy = f => g => xs => xs.reduce((acc, x) => {
  const k = f(x);
  return acc.set(k, g(acc.has(k) ? acc.get(k) : null) (x));
}, new Map());


// collect all consecutive elements of a certain length

A.consecs = chunkLen => f => xs => {
  const ys = [];

  if (chunkLen > xs.length) return ys;

  else {
    for (let i = 0; i + chunkLen <= xs.length; i++)
      ys.push(f(xs.slice(i, i + chunkLen)));
  }

  return ys;
};


/* Groups all consecutive elements by applying a binary predicate to the
pervious/current element. If the predicate fails, a new subgroup is created
otherwise the element is pushed on the current subgroup. */

A.groupBy = p => xs => Loop2((acc, i) => {
  if (i >= xs.length) return Loop2.base(acc);
  if (acc.length === 0) acc.push([xs[0]]);

  if (p(xs[i - 1]) (xs[i])) {
    acc[acc.length - 1].push(xs[i]);
    return Loop2.rec(acc, i + 1);
  }
  
  else {
    acc.push([xs[i]]);
    return Loop2.rec(acc, i + 1);
  }
}) ([], 1);


/* Determines permutations of a given array. If an array includes duplicates,
so will the list of array permutations. Stack-safety isn't required because a
large array would exhaust the heap before the call stack. */

A.perms = xs => {
  if (xs.length === 0) return [[]];
  
  else return xs.flatMap((x, i) =>
    A.perms(xs.filter((y, j) => i !== j))
      .map(ys => [x, ...ys]));
};


/* Collects all possible subsequences of an array. If it includes duplicates,
so will the list of array subsequences. Stack-safety isn't required because a
large array would exhaust the heap before the call stack. */

A.subseqs = xs => function go(i) {
  if (i === xs.length) return [[]];
  
  else {
    const yss = go(i + 1);

    const zss = yss.map(ys => {
      const zs = [xs[i]];
      return (zs.push.apply(zs, ys), zs);
    });

    return (zss.push.apply(zss, yss), zss);
  }
} (0);


A.transpose = xss =>
  xss.reduce((acc, xs) =>
    xs.map((x, i) => {
      const ys = acc[i] || [];
      return (ys.push(x), ys);
    }), []);


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


// left associative, eager unfold due to non-recursive array data type

A.unfold = f => seed => {
  let acc = [], x = seed;

  while (true) {
    const r = f(x);

    if (strict(r) === null) break;

    else {
      const [y, z] = r;

      x = z;
      acc.push(y);
    }
  }

  return acc;
};


A.Unfoldable = {unfold: A.unfold};


/*
█████ Zipping █████████████████████████████████████████████████████████████████*/


A.zip = () => xs => ys => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else if (i === ys.length) return Loop2.base(acc);

  else {
    acc.push(Pair(xs[i], ys[i]));
    return Loop2.rec(acc, i + 1);
  }
}) ([], 0);


A.zipWith = f => xs => ys => Loop2((acc, i) => {
  if (i === xs.length) return Loop2.base(acc);
  else if (i === ys.length) return Loop2.base(acc);
  else return Loop2.rec((acc.push(f(xs[i]) (ys[i])), acc), i + 1);
}) ([], 0);


A.unzip = () => A.foldl(([x, y]) => ([xs, ys]) =>
  Pair((xs.push(x), xs), (ys.push(y), ys))) (Pair([], []));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


A.alt = A.alt();


A.Alt = A.Alt();


A.Traversable = A.Traversable();


A.ZipArr.ap = A.ZipArr.ap();


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ ARRAY :: LIST ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// immutable stack (FILO) implemented as single linked list


export const List = {}


export const L = List;


L.cons = head => tail => [head, tail];


L.cons_ = tail => head => [head, tail];


L.nil = [];


/* TODO:
take
takeWhile
drop
dropWhile
span
break
zip
zipWith
unzip
*/


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


L.head = xs => xs[0];


L.headOr = x => xs => xs.length === 0 ? x : xs[0];


L.tail = xs => xs.length === 0 ? [] : xs[1];


L.uncons = xs => xs.length === 0 ? [null, []] : [xs[0], xs[1]];


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


L.fromAit = () => comp(S.fromPromise) (async function (ix) {
  let xs = [];
  const root = xs;

  for await (const x of ix) (xs[0] = x, xs[1] = [], xs = xs[1]);
  return root;
});


L.fromArr = xs => {
  let ys = [];

  for (let i = xs.length - 1; i >= 0; i--) ys = [xs[i], ys];
  return ys;
};


L.fromIt = ix => {
  let xs = [];
  const root = xs;

  for (const x of ix) (xs[0] = x, xs[1] = [], xs = xs[1]);
  return root;
};


L.fromQueue = ([xs, ys]) => L.append(xs) (L.reverse(ys));


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


/* Mind the side effect in the accumulator, which is performed for the sake of
performance. */

L.foldl = f => init => xs => {

  // use a thunk if you don't want to share mutations

  let acc = init?.[NEW] ? init() : init;

  while (true) {
    if (xs.length === 0) break;

    else {
      acc = f(acc) (xs[0]);
      xs = xs[1];
    }
  }

  return acc;
};


// stack-safe even if the passed function is strict in its second argument

L.foldr = f => acc => Stack(xs => {
  if (xs.length === 0) return Stack.base(acc);
  else return Stack.call(f(xs[0]), Stack.rec(xs[1]));
});


// not stack-safe

L.foldr_ = f => acc => function go(xs) {
  if (xs.length === 0) return acc;
  else return f(xs[0]) (go(xs[1]));
};


// only stack-safe if `f` is non-strict in its second argument

L._foldr = f => acc => function go(xs) {
  if (xs.length === 0) return acc;
  else return f(xs[0]) (lazy(() => go(xs[1])));
};


L.Foldable = {
  foldl: L.foldl,
  foldr: L.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


L.mapA = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.cons_);
  return f => L.foldr(x => acc => liftA2_(f(x)) (acc)) (Applicative.of([]));
};


L.mapA_ = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.cons_);
  return f => L.foldr_(x => acc => liftA2_(f(x)) (acc)) (Applicative.of([]));
};


L.seqA = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.cons_);
  return L.foldr(x => acc => liftA2_(x) (acc)) (Applicative.of([]));
};


L.seqA_ = Applicative => {
  const liftA2_ = liftA2(Applicative) (L.cons_);
  return L.foldr_(x => acc => liftA2_(x) (acc)) (Applicative.of([]));
};


L.Traversable = () => ({
  ...L.Foldable,
  ...L.Functor,
  mapA: L.mapA,
  seqA: L.seqA
});


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


L.map = f => L.foldr(x => acc => [f(x), acc]) ([]);


L.Functor = {map: L.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


L.alt = () => L.append;


L.Alt = () => ({
  ...L.Functor,
  alt: L.alt
});


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Object.defineProperty(L, "zero", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


L.Plus = {
  ...L.Alt
};


Object.defineProperty(L.Plus, "zero", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


L.ap = tf => tx =>
  L.foldr(f => acc =>
    L.append(L.map(f) (tx)) (acc)) ([]) (tf);


L.Apply = {
  ...L.Functor,
  ap: L.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


L.of = x => [x, []];


L.Applicative = {
  ...L.Apply,
  of: L.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


L.chain = mx => fm => L.foldr(x => acc =>
  L.append(fm(x)) (acc)) ([]) (mx);


L.Chain = {
  ...L.Apply,
  chain: L.chain
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


L.Alternative = {
  ...L.Plus,
  ...L.Applicative
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


L.Monad = {
  ...L.Applicative,
  chain: L.chain
};


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


L.extend = () => L.tails;


L.Extend = {
  ...L.Functor,
  extend: L.extend
};


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


L.extract = xs => xs[0];


L.Comonad = {
  ...L.Extend,
  extract: L.extract
};


/*
█████ Infinity ████████████████████████████████████████████████████████████████*/


L.iterate = f => function go(x) {
  return [x, lazy(() => go(f(x)))];
};


L.repeat = x => [x, lazy(() => repeat(x))];


L.replicate = n => x => function go(m) {
  if (m === 0) return [x, L.Nil];
  else return [x, lazy(() => go(m - 1))];
} (n);


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


L.append = flip(L.foldr(L.cons));


L.Semigroup = {append: L.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Object.defineProperty(L, "empty", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


L.Monoid = {
  ...L.Semigroup
};


Object.defineProperty(L.Monoid, "empty", { // to avoid mutation sharing
  get() {return []},
  configurable: true,
  enumerable: true
});


/*
█████ Special Folds ███████████████████████████████████████████████████████████*/


// like a fold but additionally holds the intermediate results

// (b -> a -> b) -> b -> [a] -> [b]
L.scanl = f => init => xs => {
  let acc = [init, []], prev = acc;
  const root = acc;
  acc = acc[1];

  while (true) {
    if (xs.length === 0) break;

    else {
      const x = f(prev[0]) (xs[0]);

      acc[0] = x;
      acc[1] = [];
      prev = acc;
      acc = acc[1];
      xs = xs[1];
    }
  }

  return root;
};


// stack-safe right associative version

// (a -> b -> b) -> b -> [a] -> [b]
L.scanr = f => acc => Stack(xs => {
  if (xs.length === 0) return Stack.base([acc, []]);

  else return Stack.call(
    ys => [f(xs[0]) (ys[0]), ys],
    Stack.rec(xs[1]));
});


L.mapAccuml = f => init => xs => {
  let acc = [init, []], prev = acc, final;
  const root = acc;
  acc = acc[1];

  while (true) {
    if (xs.length === 0) {
      final = prev[0];

      // mutation to get rid of the last cons

      prev.length = 0;
      break;
    }

    else {
      const x = f(prev[0]) (xs[0]);

      acc[0] = x;
      acc[1] = [];
      prev = acc;
      acc = acc[1];
      xs = xs[1];
    }
  }

  return Pair(final, root);
};


// L.mapAccumr isn't supplied since you can just compose `L.scanr` with `L.decons`


L.tails = Stack(xs => {
  if (xs.length === 0) return Stack.base([]);

  else return Stack.call(
    ys => [xs, ys],
    Stack.rec(xs[1]));
});


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


// lazy unfold

L.unfold = f => function go(y) {
  const pair = strict(f(y));

  if (pair === null) return [];
  else return new [pair[0], lazy(() => go(pair[1]))];
};


L.Unfoldable = {unfold: L.unfold};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


L.take = n => tx => {
  let acc = [];
  const root = acc;

  while (tx.length === 2) {
    acc[0] = tx[0];
    acc[1] = [];
    acc = acc[1];

    if (--n === 0) break;
    else tx = tx[1];
  }

  return root;
};


L.takeWhile = p => tx => {
  let acc = [];
  const root = acc;

  while (tx.length === 2) {
    if (!p(tx[0])) break;

    else {
      acc[0] = tx[0];
      acc[1] = [];
      acc = acc[1];
      tx = tx[1];
    }
  }

  return root;
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


L.reverse = L.foldl(x => y => [y, x])
  (Object.defineProperty(() => [], NEW, {value: true}));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


L.alt = L.alt();


L.Alt = L.Alt();


L.extend = L.extend();


L.Traversable = L.Traversable();


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ ARRAY :: LIST :: DLIST ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// difference list for more efficient append operation


export const DList = f => ({
  [TAG]: "DList",
  run: f
});


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


DList.cons = x => xss => DList(comp(L.Cons(x)) (xss));


DList.singleton = comp(DList) (L.Cons_);


DList.snoc = x => xss => DList(comp(xss) (L.Cons_(x)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


DList.fromList = xss => comp(DList) (L.append);


DList.fromArr = xs => comp(DList) (A.append);


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


DList.append = xss => yss => DList(comp(xss) (yss));


DList.Semigroup = {append: DList.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


DList.empty = DList(id);


DList.Monoid = {
  ...DList.Semigroup,
  empty: DList.empty
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ ARRAY :: QUEUE ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// immutable queue (FIFO) implemented as two single linked lists


export const Queue = {};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Queue.fromArr = xs => [L.fromArr(xs), []];


/*
█████ Queue Operations ████████████████████████████████████████████████████████*/


Queue.en = x => ([fw, bw]) => {
  if (bw.length === 0 && fw.length === 0) return [[x, fw], bw];
  else return [fw, [x, bw]];
};


Queue.de = ([fw, bw]) => {
  if (fw.length === 2) return [fw[0], [fw[1], bw]];
  else if (bw.length === 0) return null;

  else {
    const fw2 = L.reverse(bw);
    return [fw2[0], [fw2[1], []]];
  }
};


/*
█████ Deque Operations ████████████████████████████████████████████████████████*/


// use the queue as a combined immutable stack/queue


Queue.push = x => ([fw, bw]) => [fw, [x, bw]];


Queue.pop = x => ([fw, bw]) => {
  if (bw.length === 2) return [bw[0], [fw, bw[1]]];

  else {
    const bw2 = L.reverse(fw);
    return [bw2[0], [[], bw2[1]]]
  }
};


Queue.unshift = x => ([fw, bw]) => {
  if (bw.length === 0 && fw.length === 0) return [[x, fw], bw];
  else return [fw, [x, bw]];
};


Queue.shift = ([fw, bw]) => {
  if (fw.length === 2) return [fw[0], [fw[1], bw]];
  else if (bw.length === 0) return null;

  else {
    const fw2 = L.reverse(bw);
    return [fw2[0], [fw2[1], []]];
  }
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Queue.map = f => tx => [
  L.map(f) (tx[0]),
  L.map(f) (tx[1])
];


Queue.Functor = {map: Queue.map};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


Queue.foldl = f => acc => tx => {
  const ty = L.foldl(f) (acc) (tx[0]);
  return L.foldl(f) (ty) (tx[1]);
};


Queue.foldr = f => acc => tx => {
  const ty = L.foldr(f) (acc) (tx[0]),
    tz = L.foldr(f) (acc) (tx[1]);

  return f(ty) (f(tz) (acc));
};


Queue.Foldable = {
  foldl: Queue.foldl,
  foldr: Queue.foldr
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Queue.ap = tf => tx => [
  L.ap(tf[0]) (tx[0]),
  L.ap(tf[1]) (tx[1])
];


Queue.Apply = {
  ...Queue.Functor,
  ap: Queue.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Queue.of = x => [[x], []];


Queue.Applicative = {
  ...Queue.Apply,
  of: Queue.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


Queue.Alternative = {
  ...Queue.Plus,
  ...Queue.Applicative
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Queue.chain = mx => fm => [
  L.chain(fm) (mx[0]),
  L.chain(fm) (mx[1])
];


Queue.Chain = {
  ...Queue.Apply,
  chain: Queue.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Queue.Monad = {
  ...Queue.Applicative,
  chain: Queue.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Queue.append = tx => ty => [
  L.append(
    L.append(
      L.append(tx[0]) (L.reverse(tx[1])))
        (ty[0]))
          (L.reverse(ty[1])),
  []
];


Queue.Semigroup = {append: Queue.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Queue.empty = [[], []];


Queue.Monoid = {
  ...Queue.Semigroup,
  empty: Queue.empty
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ BEHAVIOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encode time changing values. Such a value is asynchronously mutated over time
by the events it has subscribed to. As opposed to `Observable`, a `Behavior` has
a continuous value over its entire lifespan. It has the following properties:

  * multicast
  * async
  * push
  * lazy

A `Behavior` takes an initial value and a function that in turn takes this
initial value and returns an intermediate object. The intermediate object (A)
must have two properties holding the state (A) and a nullary cancellation
function (B). Here is a simple example:

  const secCounter = Behavior(0) (init => {
    const state = {run: init}, // (B)
      id = setInterval(state2 => state2.run++, 1000, state); // event source

    return {state, cancel: () => clearInterval(id)}; // (A)
  });

As behaviors are multicast, cancelation is an issue because other parts of the
code might rely on them. Usually, cancelation just means the behavior keeps
holding the value of the last processed event. It is more safe to throw an
exception in case of post cancellation access, though. This can be easily
defined inside the nullary `cancel` function. */


// smart constructor

export const Behavior = init => behave => {
  const o = {
    get run() {
      delete this.run;
      const  {state, cancel} = behave(init);

      Object.defineProperty(this, "run", {
        get() {return state.run}
      });
      
      this.cancel = cancel;
      return init;
    },

    cancel() {}
  };

  Object.defineProperty(o, TAG, {value: "Behavior"});
  return o;
};


export const Be = Behavior; // shortcut


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ BIT █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


const popCount = n => {
  let bits = 0;

  while (n !== 0n) {
    bits += Number(n & 1n);
    n >>= 1n;
  }

  return bits;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ COMPOSE ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the composition of functors


export const Comp = type("Comp");


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Comp.map = (Functor, Functor2) => f => ttx =>
  Comp(Functor.map(Functor2.map(f)) (ttx));


Comp.Functor = {map: Comp.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Comp.ap = (Apply, Apply2) => ttf => ttx =>
  Comp(Apply.ap(Apply.map(Apply2.ap) (ttf)) (ttx));


Comp.Apply = {
  ...Comp.Functor,
  ap: Comp.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Comp.of = (Applicative, Applicative2) => x =>
  Comp(Applicative.of(Applicative2.of(x)));


Comp.Applicative = {
  ...Comp.Apply,
  of: Comp.of
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ CONST ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes constant behavior in the realm of functors/monads


export const Const = type("Const");


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Const.map = const_;


Const.Functor = {map: Const.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Const.ap = Semigroup => tf => tx =>
  Const(Semigroup.append(tf.const) (tx.const));


Const.Apply = {
  ...Const.Functor,
  ap: Const.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Const.of = Monoid => _ => Const(Monoid.empty);


Const.Applicative = {
  ...Const.Apply,
  of: Const.of
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ CONTINUATION █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encode stack-safe continuation passing style using a trampoline


export const Cont = type("Cont");


Cont.eval = tx => tx.cont(id);


Cont.run = f => tx => tx.cont(f);


/*
█████ Binary ██████████████████████████████████████████████████████████████████*/


Cont.binary = mx => my => Cont(k => mx.cont(x => my.cont(y => k(x, y))));


/*
█████ Category ████████████████████████████████████████████████████████████████*/


Cont.comp = f => g => Cont(k => x =>
  g(x).cont(f).cont(Cont.Tramp.call_(k)));


Cont.id = tx => tx.cont(id);


Cont.Category = {
  comp: Cont.comp,
  id: Cont.id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// (r -> r) -> Cont r t -> Cont r t
Cont.mapCont = f => tx => Cont(k => f(tx.cont(Cont.Tramp.call_(k))));


Cont.pipe = g => f => Cont(k => x =>
  g(x).cont(f).cont(Cont.Tramp.call_(k)));


// ((s -> r) -> t -> r) -> Cont r t -> Cont r s
Cont.withCont = f => tx => Cont(k => tx.cont(f(Cont.Tramp.call_(k))));


/*
█████ Delimited Continuations █████████████████████████████████████████████████*/


/* Delimited continuation expecting a monad in their codomain: (a => m r) => m r
If you only need pure values just pass the identity monad's type dictionary. */


// Cont r r -> Cont s r
Cont.reset = tx => Cont(k => k(tx.cont(id)));

// ((t -> r) -> Cont r r) -> Cont r t
Cont.shift = ft => Cont(k => ft(k).cont(id));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Cont.map = f => tx => Cont(k => tx.cont(x => Cont.Tramp.call(k, f(x))));


Cont.Functor = {map: Cont.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Cont.ap = tf => tx => Cont(k =>
  tf.cont(f => tx.cont(x => Cont.Tramp.call(k, f(x)))));


Cont.Apply = {
  ...Cont.Functor,
  ap: Cont.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


// applicative map but discard the second result


Cont.apEff1 = tx => ty => Cont(k =>
  Cont.Tramp.call(k, Cont.ap(Cont.map(_const) (tx)) (ty)));


// applicative map but discard the first result

Cont.apEff2 = tx => ty => Cont(k =>
  Cont.Tramp.call(k, Cont.ap(Cont.map(const_) (tx)) (ty)));


Cont.of = x => Cont(k => Cont.Tramp.call(k, x));


Cont.Applicative = {
  ...Cont.Apply,
  of: Cont.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* The mother of all chains: Take a continuation (the previous computation) and
a CPS function (the next computation yielding another continuation) and feed
the CPS function into the previous continuation as soon as the next continuation
is provided. */

Cont.chain = mx => fm => Cont(k => mx.cont(x => fm(x).cont(Cont.Tramp.call_(k))));


Cont.Chain = {
  ...Cont.Apply,
  chain: Cont.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Cont.join = mmx => Cont(mmx.cont(id));


Cont.Monad = {
  ...Cont.Applicative,
  chain: Cont.chain
};


/*
█████ Lifting █████████████████████████████████████████████████████████████████*/


Cont.lift = f => x => Cont(k => k(f(x)));


Cont.lift2 = f => x => y => Cont(k => k(f(x) (y)));


/*
█████ Profunctor ██████████████████████████████████████████████████████████████*/


Cont.dimap = h => g => f => Cont(k =>
  x => h(x).cont(f).cont(g).cont(Cont.Tramp.call_(k)));


Cont.lmap = Cont.pipe;


Cont.rmap = Cont.comp;


Cont.Profunctor = {
  ...Cont.Functor,
  dimap: Cont.dimap,
  lmap: Cont.lmap,
  rmap: Cont.rmap
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Cont.append = Semigroup => tx => ty => Cont(k =>
  tx.cont(x => ty.cont(y => Cont.Tramp.call(k, Semigroup.append(x) (y)))));


Cont.Semigroup = {append: Cont.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Cont.empty = Monoid => Cont(k => Cont.Tramp.call(k, Monoid.empty));


Cont.Monoid = {
  ...Cont.Semigroup,
  empty: Cont.empty
};


/*
█████ Short Circuiting █████████████████████████████████████████████████████████*/


Cont.abrupt = x => Cont(k => x);


/* Short circuit mechanism (unwinds the whole stack). Usage:

  Cont.callcc(shortCircuit => Cont.chain(shortCircuit(0))
    (x => Cont.of(x * x))).cont(x => x); */

Cont.callcc = f => Cont(k => f(x => Cont(_ => k(x))).cont(k));


/*
█████ Trampoline ██████████████████████████████████████████████████████████████*/


// stack-safe invocation of the deferred function call tree using a trampoline

Cont.Tramp = {};


// strictly call the deferred function call tree

Cont.Tramp.pogo = tx => {
  while (tx?.tag === "call") {
    tx = tx.f(tx.x);
  }

  return tx;
};


// non-strictly call the deferred function call tree

Cont.Tramp.step = function* interpret_(tx) {
  while (tx?.tag === "call") {
    yield tx.x;
    tx = tx.f(tx.x);
  }

  yield tx;
};


Cont.Tramp.call = function call(f, x) {
  return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call, f, x};
};


Cont.Tramp.call2 = function call2(f, x, y) {
  return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call2, f, x, y};
};


Cont.Tramp.call_ = function call_(f) {
  return function call_(x) {
    return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call, f, x};
  };
};


Cont.Tramp.call2_ = function call2_(f) {
  return function call2_(x) {
    return function call2_(y) {
      return {[TAG]: "Cont.Tramp", constructor: Cont.Tramp.call2, f, x, y};
    };
  };
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Cont.get = tx => Cont(k => Cont.Tramp.call(k, tx.cont));


Cont.reify = k => x => Cont(_ => k(x));


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ DATE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const DateTime = {}; // namespace


export const D = DateTime; // shortcut


/*
█████ Constants ███████████████████████████████████████████████████████████████*/


D.secInMs = 1000;


D.minInMs = 60000;


D.hourInMs = 3600000;


D.dayInMs = 86400000;


D.weekInMs = 604800000;


/*
█████ Calculation █████████████████████████████████████████████████████████████*/


D.calcMonthInMs = y => m => new Date(y, m, 0).getDate() * D.dayInMs;


D.calcYearInMs = y =>
  ((year % 4 === 0 && y % 100 > 0) || y %400 == 0)
    ? 366 * D.dayInMs : 365 * D.dayInMs;


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


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


/*
█████ Serialization ███████████████████████████████████████████████████████████*/


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


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


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


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ EITHER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// either left or right (used for short circuiting)


export const Either = variant("Either") (unary("Left"), unary("Right"));


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ EXCEPT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Short circuit computations if they fail and stack contingent exceptions
along the way. */


export const Except = {}; // namespace


export const E = Except; // shortcut


E.cata = x => tx => tx?.constructor?.name === "Exception" ? x : tx;


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

E.map = f => tx => tx?.constructor?.name === "Exception" ? tx : f(tx);


E.Functor = {map: E.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


// pick with left bias

E.alt = tx => ty => {
  if (tx?.constructor?.name === "Exception") {
    if (ty?.constructor?.name === "Exception")
      return (ty.prev = tx, ty);

    else return ty;
  }

  else return tx;
};


E.Alt = {
  ...E.Functor,
  alt: E.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


E.zero = new Ex();


E.Plus = {
  ...E.Alt,
  zero: E.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


E.ap = tf => tx => {
  if (tf?.constructor?.name === "Exception") {
    if (tx?.constructor?.name === "Exception") return (tx.prev = tf, tx);
    else return tf;
  }

  else if (tx?.constructor?.name === "Exception") return tx;
  else return tf(tx);
};


E.Apply = {
  ...E.Functor,
  ap: E.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


E.of = x => {
  if (x?.constructor?.name === "Exception")
    throw new Err("invalid value");

  else return x;
}


E.Applicative = {
  ...E.Apply,
  of: E.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


E.Alternative = {
  ...E.Plus,
  ...E.Applicative
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


E.chain = mx => fm => mx?.constructor?.name === "Exception" ? mx : fm(mx);


E.Chain = {
  ...E.Apply,
  chain: E.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


E.Monad = {
  ...E.Applicative,
  chain: E.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


E.append = Semigroup => tx => ty => {
  if (tx?.constructor?.name === "Exception") {
    if (ty?.constructor?.name === "Exception")
      return (ty.prev = tx, ty);
    
    else return tx;
  }

  else if (ty?.constructor?.name === "Exception") return ty;
  else return Semigroup.append(tx) (ty);
};


E.Semigroup = {append: E.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


E.empty = Monoid => Monoid.empty;


E.Monoid = {
  ...E.Semigroup,
  empty: E.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


E.throwOnErr = tx => {
  if (tx?.constructor?.name === "Exception") throw tx;
  else return tx;
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ FREE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Of course you wanna be free, who wouldn't? `Free` separates program
construction from its evaluation. Usage:

// Monad m -> ListT m a
const nil = dict => dict.of([]);

// Monad m -> a -> ListT m a -> ListT m a
const cons = dict => head => tail => dict.of([head, tail]);

// Number -> a -> ListT Free a
const replicate = n => x => n
  ? cons(Free.Monad) (x) (Free.thunk(() => replicate(n - 1) (x)))
  : nil(Free.Monad);

// Number -> Free Number -> Free Number
const add = x => Free.map(y => x + y);

// Free Number
const tx = Eff.T.Fold.list(Free.Monad) (add)
  (Free.of(0))
    (replicate(1000000) (1));

Free.interpret(tx); // yields 1000000 */


export const Free = {};


/*
█████ Constructors ████████████████████████████████████████████████████████████*/


// (() -> Free a) -> Free a
Free.thunk = eval_ => ({constructor: Free.thunk, eval: eval_});


/*
█████ Interpretation ██████████████████████████████████████████████████████████*/


// Free a -> a
Free.interpret = expression => {
  let expr = expression, stack = null;

  while (true) {
    switch (expr.constructor) {
      case Free.of: {
        if (stack === null) return expr.value;
        expr = stack.fm(expr.value);
        stack = stack.stack;
        break;
      }

      case Free.chain: {
        stack = { fm: expr.fm, stack };
        expr = expr.monad;
        break;
      }

      // deferring thunks

      case Free.thunk: {
        expr = expr.eval();
        break;
      }

      // lazy evaluated thunks

      case Thunk: {
        expr = strict(expr);
        break;
      }

      default: throw new Err(
        `unknown constructor "${expr?.constructor?.name}"`);
    }
  }
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


// (a -> b) -> Free a -> Free b
Free.map = f => mx => Free.chain(mx) (x => Free.of(f(x)));


Free.Functor = {map: Free.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


// Free (a -> b) -> Free a -> Free b
Free.ap = mf => mx => Free.chain(mf) (f =>
  Free.chain(mx) (x => f(t)));


Free.Apply = {
  ...Free.Functor,
  ap: Free.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


// a -> Free a
Free.of = value => ({constructor: Free.of, value});


Free.Applicative = {
  ...Free.Apply,
  of: Free.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


// Free a -> (a -> Free b) -> Free b
Free.chain = mx => fm => ({constructor: Free.chain, monad: mx, fm});


Free.Chain = {
  ...Free.Apply,
  chain: Free.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Free.Monad = {
  ...Free.Applicative,
  chain: Free.chain
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ ID ██████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes the absence of any effects in the realm of functors/monads


export const Id = type("Id");


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Id.map = f => tx => Id(f(tx.id));


Id.Functor = {map: Id.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Id.ap = tf => tx => Id(tf.id(tx.id));


Id.Apply = {
  ...Id.Functor,
  ap: Id.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Id.of = Id;


Id.Applicative = {
  ...Id.Apply,
  of: Id.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Id.chain = mx => fm => fm(mx.id);


Id.Chain = {
  ...Id.Apply,
  chain: Id.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Id.Monad = {
  ...Id.Applicative,
  chain: Id.chain
};


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ ITERATOR ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Iterators defer execution which isn't sufficient for lazy evaluation because
it lacks sharing. You cannot share an iterator since every invocation of `next`
destructively changes the iterator's state. For this reason, scriptum provides
a wrapper that renders native iterators idempotent.

Some basic rules on working with impure iterators:

* it is the responsibiliy of the mapper to maintain the outermost structure of
  the return value across generator function calls, e.g. with `[k, v]` the key
  or value may change inside `[]` but not the array itself
* strict functions must not be passed to `comp`/`pipe` as an argument but always
  be the outermost function call
* folds are the only means of `It` to exhaust lazy iterators (you can exhaust
  an iterator by converting it using one of the `fromIt` combinators of a
  suitbale data type) */


export const It = {};


/*
█████ Alternation █████████████████████████████████████████████████████████████*/


It.alternate = ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else (yield o.value, yield p.value);
  }
};


// interpolate a string into a stream

It.interpolate = s => function* (ix) {
  for (const t of ix) {
    yield t;
    yield s;
  }
};


// interpolate a string into an array

It.interpolateArr = s => function* (xs) {
  for (let i = 0; i < xs.length; i++) {
    yield xs[i];
    yield s;
  }
};


/*
█████ Cloning █████████████████████████████████████████████████████████████████*/


/* Mimic a cloned iterator by keeping track of the original iterator's consumed
values. Interferes with garbage collection and thus only be used cautiously. */

It.cloneable = ix => {
  const xs = [];

  return function make(n) {
    return {
      next(arg) {
        const len = xs.length;
        if (n >= len) xs[len] = it.next(arg);
        return xs[n++];
      },

      clone() {return make(n)},
      throw(e) {if (it.throw) it.throw(e)},
      return(v) {if (it.return) it.return(v)},
      [Symbol.iterator]() {return this}
    };
  } (0);
};


/*
█████ Con-/Deconstruction █████████████████████████████████████████████████████*/


It.cons = x => function* (ix) {
  yield x;

  while (true) {
    const o = ix.next();
    if (done) return undefined;
    else yield o.value;
  }
};


It.cons_ = ix => function* (x) {
  yield x;

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


It.head = function* (ix) {
  const o = ix.next();
  if (o.done) return undefined;
  else yield o.value;
};


It.snoc = x => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) yield x;
    else yield o.value;
  }
};


It.snoc_ = ix => function* (x) {
  while (true) {
    const o = ix.next();
    if (o.done) yield x;
    else yield o.value;
  }
};


It.tail = function* (ix) {
  ix.next();

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


// from iterable

It.from = x => x[Symbol.iterator] ();


It.fromList = function* (xs) {
  while (xs.length) {
    yield xs[0]
    xs = xs[1];
  }
};


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


/* Yield the current element provided it and the next one satisfy the given
predicate or short circuit the stream. */

It.and = pred => function* (ix) {
  let o = ix.next();

  if (o.done || !p(o.value)) return undefined;

  while (true) {
    const p = ix.next();

    if (p.done || !pred(p.value)) return undefined;
  
    else {
      yield o.value;
      o = p;
    }
  }
};


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


/* Yield either the current or the next element provided one of them satisfies
the given predicate or short circuit the stream. */

It.or = pred => function* (ix) {
  while (true) {
    const o = ix.next();

    if (o.done) return undefined;
    else if (p(o.value)) yield o.value;

    else {
      const p = ix.next();

      if (p.done || !pred(p.value)) return undefined;
      else yield p.value;
    }
  }
};


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


It.filter = p => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else if (p(o.value)) yield o.value;
  }
};


It.Filterable = {filter: It.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// strict left-associative fold

It.foldl = f => acc => ix => {
  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = f(acc) (o.value);
  }
};


// uncurried

It.foldl_ = f => acc => ix => {
  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = f(acc, o.value);
  }
};


// strict, right-associative and yet stack-safe fold

It.foldr = f => acc => ix => function (stack) {
  while (true) {
    const o = ix.next();
    if (o.done) break;
    else stack.push(o.value);
  }

  for (let i = stack.length - 1; i >= 0; i--)
    acc = f(acc) (stack[i]);

  return acc;
} ([]);


// uncurried

It.foldr_ = f => acc => ix => function (stack) {
  while (true) {
    const o = ix.next();
    if (o.done) break;
    else stack.push(o.value);
  }

  for (let i = stack.length - 1; i >= 0; i--)
    acc = f(acc, stack[i]);

  return acc;
} ([]);


// strict map followed by folding the resulting monoid

It.foldMap = Monoid => f => ix => {
  let acc = Monoid.empty;

  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = Monoid.append(acc) (f(o.value));
  }
};


// exhaustive sum

It.sum = acc => ix => {
  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = acc + o.value;
  }
};


It.Foldable = {
  foldl: It.foldl,
  foldr: It.foldr
};


/*
█████ Foldable :: Traversable █████████████████████████████████████████████████*/


// no meaningful implementation


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


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


It.Functor = {map: It.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


It.alt = ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done === false) yield o.value;
    else if (p.done === false) yield p.value;
    else return undefined;
  };
};


It.Alt = {
  ...It.Functor,
  alt: It.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


It.zero = function* () {} ();


It.Plus = {
  ...It.Alt,
  zero: It.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


It.ap = _if => function* (ix) {
  while (true) {
    const o = _if.next(), p = ix.next();
    if (o.done || p.done) return undefined;
    else yield o.value(p.value);
  }
};


It.Apply = {
  ...It.Functor,
  ap: It.ap
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


It.chain = mx => function* (fm) {
  while (true) {
    const o = mx.next();
    if (o.done) return undefined;
    else yield* fm(o.value);
  }
};


It.Chain = {
  ...It.Apply,
  chain: It.chain
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


It.of = function* (x) {yield x};


It.Applicative = {
  ...It.Apply,
  of: It.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


It.Alternative = {
  ...It.Plus,
  ...It.Applicative
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


// kleisli composition


// (b -> Iterator c) -> (a -> Iterator b) -> a -> Iterator c
It.komp = f => g => function* (x) {
  for (let y of g(x)) {
    yield* f(y);
  }
};


// (b -> Iterator c) -> (a -> Iterator b) -> Iterator a -> Iterator c
It.komp_ = f => g => function* (ix) {
  for (let x of ix) {
    for (let y of g(x)) {
      yield* f(y);
    }
  }
};


It.Monad = {
  ...It.Applicative,
  chain: It.chain
};


/*
█████ Infinite ████████████████████████████████████████████████████████████████*/


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


/*
█████ Recursion Schemes ███████████████████████████████████████████████████████*/


// lazy recursion schemes are suitable to be encoded using native iterators


// anamorphism

It.ana = () => It.unfold;


// apomorhism: anamorphism plus extra short circuit mechanism

It.apo = f => function* (seed) {
  let x = seed;

  while (true) {
    const pair = f(x);
    
    if (strict(pair) === null) return undefined;
    
    else {
      const [y, z] = pair;

      if (intro(z) === "Error") {
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


// catamorphism

It.cata = It.foldr;


It.para = f => source => acc => function* (ix) {
  while (true) {
    const o = ix.next();

    if (o.done) return undefined;
    
    else {
      acc = f(o.value) (source) (acc);
      yield acc;
    }
  } 
};


// hylomorphism: anamorphism and immediately following catamorphism

It.hylo = f => g => function* (seed) {
  const ix = It.ana(f) (seed);

  for (const x of ix) yield* It.cata(g) (x);
};


/* Zygomorphism: fold that depends on another fold. Example: Check whether the
length of the list is even or odd and how long it actual is at the same time. */

It.zygo = f => g => acc => acc2 => function* (ix) {
  for ([value, done] of It.cata(x => pair =>
    Pair(f(x) (pair[0]), g(x) (pair[0]) (pair[1]))) (Pair(acc, acc2))) {
      yield value[1];
  }
};



// mutumorphism: two folds that depend on each other (mutual recursion asa fold)

It.mutu = f => g => acc => acc2 => function* (ix) {
  for ([value, done] of It.cata(x => pair =>
    Pair(f(x) (pair[0]) (pair[1]), g(x) (pair[0]) (pair[1]))) (Pair(acc, acc2))) {
      yield value[1];
  }
};


// TODO: It.histo


// TODO: It.futu


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


It.append = ix => function* (iy) {
  while (true) {
    const o = ix.next();
    if (o.done) break;
    else yield o.value;
  }

  while (true) {
    const p = iy.next();
    if (p.done) return undefined;
    else yield p.value;
  }
};


It.Semigroup = {append: It.append};


/*
█████ Semigroup (Alignment) ███████████████████████████████████████████████████*/


It.Align = {};


It.Align.append = Semigroup => ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else yield Semigroup.append(o.value) (p.value);
  }
};


It.Align.Semigroup = {append: It.Align.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


It.empty = function* () {} ();


It.Monoid = {
  ...It.Semigroup,
  empty: It.empty
};


/*
█████ Semigroup :: Monoid (Alignment) █████████████████████████████████████████*/


It.Align.empty = function* (Monoid) {yield Monoid.empty};


It.Align.Monoid = {
  ...It.Align.Semigroup,
  empty: It.Align.empty
};


/*
█████ Special Folds/Maps ██████████████████████████████████████████████████████*/


It.foldi = f => acc => ix => {
  let i = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = f(acc) (o.value, i++);
  }
};


// uncurried

It.foldi_ = f => acc => ix => {
  let i = 0;
  
  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc = f(acc, o.value, i++);
  }
};


It.fold3 = f => acc => ix => {
  let prev = null,
    curr = {value: "", done: false},
    next = ix.next();

  while (true) {
    prev = curr;
    curr = next;
    next = ix.next();
    
    if (next.done) break;
    else acc = f(acc, prev.value, curr.value, next.value);
  }

  return f(acc) (prev.value, curr.value, "");
};


// uncurried

It.fold3_ = f => acc => ix => {
  let prev = null,
    curr = {value: "", done: false},
    next = ix.next();

  while (true) {
    prev = curr;
    curr = next;
    next = ix.next();
    
    if (next.done) break;
    else acc = f(acc, prev.value, curr.value, next.value);
  }

  return f(acc, prev.value, curr.value, "");
};


It.mapi = f => function* (ix) {
  let i = 0;

  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield f(o.value, i++);
  }
};


/*
█████ Sublists ████████████████████████████████████████████████████████████████*/


/* sublist combinators are supplied in strict and non-strict form. Non-scrict
combinators only specify the quantity but not the data structure that ultimately
contains it. */


It.drop = n => ix => {
  const acc = [];

  while (n-- > 0) {
    const o = ix.next();
    if (o.done) return acc;
  };

  while (true) {
    const o = ix.next();
    if (o.done) break;
    else acc.push(o.value);
  }

  return acc;
};


// non-strict

It.drop_ = n => function* (ix) {
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


It.dropWhile = p => ix => {
  const acc = [];

  while (true) {
    const o = ix.next();

    if (o.done) return acc;

    else if (!p(o.value)) {
      acc.push(o.value);
      break;
    }
  };

  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else acc.push(o.value);
  }

  return acc;
};


// non-strict

It.dropWhile_ = p => function* (ix) {
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


It.take = n => ix => {
  const acc = [];

  while (n-- > 0) {
    const o = ix.next();
    if (o.done) return acc;
    else acc.push(o.value);
  }

  return acc;
};


// non-strict

It.take_ = n => function* (ix) {
  while (n-- > 0) {
    const o = ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


It.takeWhile = p => ix => {
  const acc = [];

  while (true) {
    const o = ix.next();
    if (o.done) return acc;
    else if (p(o.value)) acc.push(o.value);
    else return acc;
  }

  return acc;
};


// non-strict

It.takeWhile_ = p => function* (ix) {
  while (true) {
    const o = ix.next();
    if (o.done) return undefined;
    else if (p(o.value)) yield o.value;
    else return undefined;
  }
};


/*
█████ Transformation ██████████████████████████████████████████████████████████*/


It.collate = p => ix => {
  const iy = It.cloneable(ix),
    iz = iy.clone();

  return Pair(
    function* () {
      while (true) {
        const o = iy.next();

        if (o.done) return undefined;
        else if (!p(o.value)) yield o.value;
      }
    } (),

    function* () {
      while (true) {
        const o = iz.next();

        if (o.done) return undefined;
        else if (p(o.value)) yield o.value;
      }
    } ()
  );
};


It.flatten = function* (iix) {
  while (true) {
    const o = iix.next();

    if (o.done) return undefined;

    while (true) {
      const p = o.value.next();

      if (p.done) break;
      else yield p.value;
    }
  }
};


/*
█████ Unfoldable ██████████████████████████████████████████████████████████████*/


/* Lazy, potentially infinite unfold that always needs to be at the beginning
of the iterator chain. */

It.unfold = f => function* (seed) {
  let x = seed;

  while (true) {
    const pair = f(x);
    
    if (strict(pair) === null) return undefined;
    
    else {
      const [y, z] = pair;

      x = z;
      yield y;
    }
  }
};


/*
█████ Unzipping ███████████████████████████████████████████████████████████████*/


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


/*
█████ Zipping █████████████████████████████████████████████████████████████████*/


It.zip = ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else yield Pair(o.value, p.value);
  }
};


It.zipWith = f => ix => function* (iy) {
  while (true) {
    const o = ix.next(), p = iy.next();
    if (o.done || p.done) return undefined;
    else yield f(o.value) (p.value);
  }
};


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


It.ana = It.ana();


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ ITERATOR :: ASYNC ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Asynchronous iterators are an abstraction for data streams and API calls.
Associated combinators return promises. It is the calling site to wire them
with the more lawful asynchronous types of this library. */


export const Ait = {};


/*
█████ Alternation █████████████████████████████████████████████████████████████*/


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

Ait.interpolate = s => async function* (ix) {
  for await (const t of ix) {
    yield t;
    yield s;
  }
};


// interpolate a string into an array

Ait.interpolateArr = s => async function* (xs) {
  for (let i = 0; i < xs.length; i++) {
    const t = await xs[i];
    yield t
    yield s;
  }
};


/*
█████ Chunking ████████████████████████████████████████████████████████████████*/


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


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


Ait.and = ix => async function* (iy) {
  for await (const x of ix) yield x;
  for await (const y of iy) yield y;
};


Ait.all = async function* (xs) {
  for (const ix of xs) {
    for await (const x of ix) yield x
  }
};


/*
█████ Consumption █████████████████████████████████████████████████████████████*/


Ait.consume = async function (ix) {
  let acc;
  for await (const acc2 of ix) acc = acc2;
  return acc;
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Ait.from = x => x[Symbol.asyncIterator] ();


/*
█████ Filterable ██████████████████████████████████████████████████████████████*/


Ait.filter = p => async function* (ix) {
  for await (const x of ix) if (p(x)) yield x;
};


Ait.Filterable = {filter: Ait.filter};


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// strict left-associative fold

Ait.foldl = f => acc => async function (ix) {
  for await (const x of ix) acc = f(acc) (x);
  return acc;
};


// uncurried

Ait.foldl_ = f => acc => async function (ix) {
  for await (const x of ix) acc = f(acc, x);
  return acc;
};


// strict, right-associative and yet stack-safe fold

Ait.foldr = f => acc => ix => async function (stack) {
  for await (const x of ix) stack.push(x);

  for (let i = stack.length - 1; i >= 0; i--)
    acc = f(stack[i]) (acc);

  return acc;
} ([]);


// uncurried

Ait.foldr_ = f => acc => ix => async function (stack) {
  for await (const x of ix) stack.push(x);

  for (let i = stack.length - 1; i >= 0; i--)
    acc = f(stack[i], acc);

  return acc;
} ([]);


// strict map followed by folding the resulting monoid

Ait.foldMap = Monoid => f => async function (ix) {
  let acc = Monoid.empty;
  for await (const x of ix) acc = Monoid.append(acc) (f(x));
  return acc;
};


Ait.Foldable = {
  foldl: Ait.foldl,
  foldr: Ait.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Ait.map = f => async function* (ix) {
  for await (const x of ix) yield f(x);
};


// bifunctor-like

Ait.bimap = p => f => g => async function* (ix) {
  for await (const x of ix) {
    if (p(x)) yield f(x);
    else yield g(x);
  }
};


// map effects but discard values

Ait.mapEff = f => async function* (ix) {
  for await (const x of ix) (f(x), yield x);
};


Ait.Functor = {map: Ait.map};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Ait.append = Ait.and;


Ait.Semigroup = {append: Ait.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Ait.empty = async function* () {} ();


Ait.Monoid = {
  ...Ait.Semigroup,
  empty: Ait.empty
};


/*
█████ Sublists ████████████████████████████████████████████████████████████████*/


/* sublist combinators are supplied in strict and non-strict form. Non-scrict
combinators only specify the quantity but not the data structure that ultimately
contains it. */


Ait.drop = n => ix => S(k => function go(acc, m) {
  return ix.next().then(({value, done}) => {
    if (done) return k(acc);
    else if (m > 0) return go(acc, m - 1);
    else return go((acc.push(value), acc), 0);
  });
} ([], n));


// non-strict

Ait.drop_ = n => async function* (ix) {
  for (let i = n; i > 0; i--) {
    const o = await ix.next();
    if (o.done) return undefined;
  }

  for await (const x of ix) yield x;
};


Ait.dropWhile = p => ix => S(k => function go(acc) {
  return ix.next().then(({value, done}) => {
    if (done) return k(acc);
    else if (p(value)) return go(acc);
    else return go((acc.push(value), acc));
  });
} ([]));


// non-strict

Ait.dropWhile_ = p => async function* (ix) {
  for await (const x of ix) {
    if (!p(x)) {
      yield x;
      break;
    }
  }

  for await (const x of ix) yield x;
};


Ait.take = n => ix => S(k => function go(acc, m) {
  return ix.next().then(({value, done}) => {
    if (done) return k(acc);
    else if (m === 0) return k(acc);
    else return go((acc.push(value), acc), m - 1);
  });
} ([], n));


// non-strict

Ait.take_ = n => async function* (ix) {
  for (let i = 0; i < n; i++) {
    const o = await ix.next();
    if (o.done) return undefined;
    else yield o.value;
  }
};


Ait.takeWhile = p => ix => S(k => function go(acc) {
  return ix.next().then(({value, done}) => {
    if (done) return k(acc);
    else if (p(value)) return go((acc.push(value), acc));
    else return k(acc);
  });
} ([]));


// non-strict

Ait.takeWhile_ = p => async function* (ix) {
  for await (const x of ix) {
    if (p(x)) yield x;
    else break;
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ ITERATOR :: IDEMPOTENT ████████████████████████████
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
  let iy = {
    value: null,
    done: false,
    prev: null,

    next() {
      const iz = ix.next();

      Object.defineProperty(iz, TAG, {value: "IdempotentIterator"});
      iz.next = iy.next;
      iz.prev = iy;
      delete iy.next;
      iy.next = () => iz;
      iy = iz;
      return iz;
    }
  };

  Object.defineProperty(iy, TAG, {value: "IdempotentIterator"});
  return iy;
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


// from iterable

Iit.from = x => Iit(x[Symbol.iterator] ());


/*
█████ Sublists ████████████████████████████████████████████████████████████████*/


// resumable after the generator is forwarded n times

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


// resumable after the generator is forwarded x times

Iit.takeWhile = p => function* (ix) {
  while (true) {
    const iy = ix.next();

    if (iy.done) return undefined;
    else if (p(iy.value)) yield ix.value;
    else return ix;
    ix = iy;
  }
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


// clear the previous iterator result chain to reduce memory leak

Iit.clear = ix => (ix.prev = null, ix);


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ MAP █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Map = {}; // namespace


/*
█████ Clone ███████████████████████████████████████████████████████████████████*/


_Map.clone = m => new Map(m);


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


_Map.fromAit = () => comp(S.fromPromise) (async function (ix) {
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


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


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


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


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


/*
█████ Mappings ████████████████████████████████████████████████████████████████*/


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


/*
█████ Set Operations ██████████████████████████████████████████████████████████*/


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
███████████████████████████████ MAP :: MULTIMAP ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Map variant maintaining 1:n-relations between its key/value pairs and thus
introducing ambiguity on the value side. Some accessor functions expect a
predicate as an additional argument. This predicate returns the first value it
is satisfied by. */


export class MultiMap extends Map {
  constructor() {
    super();
    Object.defineProperty(this, TAG, {value: "MultiMap"});
  }


  /*
  █████ Conversion ████████████████████████████████████████████████████████████*/


  static get fromAit() {
    return comp(S.fromPromise) (async function (ix) {
      const m = new MultiMap();
      for await (const [k, v] of ix) m.addItem(k, v);
      return m;
    });
  };


  static fromIt = ix => {
    const m = new MultiMap();
    for (const [k, v] of ix) m.addItem(k, v);
    return m;
  };


  // `k` must be unqiue

  static fromTable(xss, k) {
    const m = new MultiMap();

    for (const cols of xss) m.addItem(cols[k], cols);
    return m;
  }


  // key is dynamically generated by the passed function

  static fromTableBy(xss, f) {
    const m = new MultiMap();

    for (const cols of xss) m.addItem(f(cols), cols);
    return m;
  }


  /*
  █████ Getters/Setters ███████████████████████████████████████████████████████*/


  // rely on reference identity

  addItem(k, v) {
    if (this.has(k)) {
      const s = this.get(k);
      s.add(v);
      return this;
    }

    else {
      this.set(k, new Set([v]));
      return this;
    }
  }


  delItem(k, pred) {
    const s = this.get(k);

    for (const v of s) {
      if (pred(v)) {
        s.delete(v);
        break;
      }
    }

    if (s.size === 0) this.delete(k);
    return this;
  }


  getItem(k, pred) {
    const s = this.get(k);

    if (s === undefined) return s;

    else {
      for (const v of s) {
        if (pred(v)) return v;
      }

      return undefined;
    }
  }


  setItem(k, v, pred) {
    const s = this.get(k);
    let exists = false;

    for (const v2 of s) {
      if (pred(v2)) {
        s.delete(v2);
        s.add(v);
        exists = true;
        break;
      }
    }

    if (!exists) s.add(v);
    return this;
  }


  upd(k, f) {
    const s = this.get(k),
      s2 = new Set();

    if (s === undefined) return s;

    else {
      for (const v of s) s2.add(f(v));
      this.set(k, s2);
      return this;
    }
  }


  updItem(k, f, pred) {
    const s = this.get(k);

    if (s === undefined) return s;

    else {
      for (const v of s) {
        if (pred(v)) {
          s.delete(v);
          s.add(f(v));
          break;
        }
      }

      return this;
    }
  }


  /*
  █████ Iterator ██████████████████████████████████████████████████████████████*/


  // default

  *[Symbol.iterator]() {
    for (const [k, s] of super[Symbol.iterator]()) {
      for (const v of s) yield Pair(k, v);
    }
  }

  // do not abstract from multiple mapped datasets

  *iterate() {
    for (const [k, s] of super[Symbol.iterator]()) yield Pair(k, s);
  }
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ NUMBER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Num = {}; // namespace


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


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


/*
█████ Decimal Places ██████████████████████████████████████████████████████████*/


/* Note: All combinators may fail for large positive numbers encoded in
scientific notation. */


Num.ceil = places => n => {
  const n2 = Math.abs(n),
    sign = n < 0 ? "-" : "";

  const n3 = n2 * Number(1 + "0".repeat(places)),
    frac = n3 % 1;

  let s;

  if (n3 < Number("0." + "0".repeat(places) + "1")) return 0;
  else if (frac === 0) s = String(n3).split(".") [0];
  
  else {
    if (sign === "-") s = String(n3).split(".") [0];
    else s = String(n3 + 1).split(".") [0];
  }

  if (s[0] === "-") s = s.slice(1);

  if (s.length < places) return Number(sign + "0." + s.padStart(places, "0"));
  else if (s.length === places) return Number(sign + "0." + s);

  else {
    const intLen = String(n2).split(".") [0].length,
      s2 = s.slice(0, intLen) + "." + s.slice(intLen, intLen + places);

    return Number(sign + s2);
  }
};


Num.floor = places => n => {
  const n2 = Math.abs(n),
    sign = n < 0 ? "-" : "";

  const n3 = n2 * Number(1 + "0".repeat(places)),
    frac = n3 % 1;

  let s;

  if (n3 < Number("0." + "0".repeat(places) + "1")) return 0;
  else if (frac === 0) s = String(n3).split(".") [0];
  
  else {
    if (sign === "-") s = String(n3 + 1).split(".") [0];
    else s = String(n3).split(".") [0];
  }

  if (s[0] === "-") s = s.slice(1);

  if (s.length < places) return Number(sign + "0." + s.padStart(places, "0"));
  else if (s.length === places) return Number(sign + "0." + s);

  else {
    const intLen = String(n2).split(".") [0].length,
      s2 = s.slice(0, intLen) + "." + s.slice(intLen, intLen + places);

    return Number(sign + s2);
  }
};


Num.round = places => n => {
  const n2 = Math.abs(n),
    sign = n < 0 ? "-" : "";

  const n3 = n2 * Number(1 + "0".repeat(places)),
    frac = n3 % 1;

  let s;

  if (n3 < Number("0." + "0".repeat(places) + "5")) return 0;
  else if (frac < 0.5) s = String(n3).split(".") [0];
  else s = String(n3 + 1).split(".") [0];

  if (s[0] === "-") s = s.slice(1);

  if (s.length < places) return Number(sign + "0." + s.padStart(places, "0"));
  else if (s.length === places) return Number(sign + "0." + s);

  else {
    const intLen = String(n2).split(".") [0].length,
      s2 = s.slice(0, intLen) + "." + s.slice(intLen, intLen + places);

    return Number(sign + s2);
  }
};


Num.round2 = Num.round(2);


// equivalent to `floor` for positive numbers

Num.trunc = places => n => {
  const [int, frac] = String(n).split(".");

  if (frac.length < places)
    return n;

  else if (frac.length > places)
    return Number(int + "." + frac.slice(0, places));
    
  else return n;
};


/*
█████ GCD/LCM █████████████████████████████████████████████████████████████████*/


// greatest common denominator

Num.gcd = (m, n) => n === 0 ? m : Num.gcd(n, m % n);


// least common multiplicator

Num.lcm = (m, n) => m === 0 && n === 0
  ? _throw("invalid zeros")
  : m / Num.gcd(m, n) * n;


// add two fractions

Num.addFracs = frac => frac2 => {
  const lcm = Num.lcm(frac[1], frac2[1]);

  const ntor = lcm / frac[1] * frac[0],
    ntor2 = lcm / frac2[1] * frac2[0];

  const gcd = Num.gcd(ntor + ntor2, lcm);

  return Pair(
    Num.round2((ntor + ntor2) / gcd),
    Num.round2(lcm / gcd)
  );
};


/* Caluclate the average of two fractions. Relies on rounding to avoid exploding
factions. */

Num.avgFracs = frac => frac2 => {
  const lcm = Num.lcm(frac[1], frac2[1]);

  const dtor = Num.round(0) (lcm / frac[1] * frac[0]),
    dtor2 = Num.round(0) (lcm / frac2[1] * frac2[0]);

  const frac3 = Pair(Num.round(0) ((dtor + dtor2) / 2), lcm);

  const gcd = Num.gcd(frac3[0], frac3[1]);

  frac3[0] = Num.round(0) (frac3[0] / gcd);
  frac3[1] = Num.round(0) (frac3[1] / gcd);

  return frac3;
};


/*
█████ Serialization ███████████████████████████████████████████████████████████*/


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


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████ NUMBER :: NATURAL ██████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/



export const Natural = {}; // namespace


export const Nat = Natural; // shortcut


/* Educational implementation of a catamorphism as the eleminaton rule of the
natural number type. In this fashion, you can almost eliminate any type in a
stack-safe manner:

  const fib = comp(Pair.fst) (Nat.cata({
    zero: Pair(0, 1),
    succ: ([a, b]) => Pair(b, a + b)
  }));

  fib(10); // yields 55 */


Nat.cata = ({zero, succ}) => n => {
  let r = zero;

  while (n > 0) {
    r = succ(r);
    n -= 1;
  }

  return r;
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OBJECT ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const O = {};


/*
█████ Cloning █████████████████████████████████████████████████████████████████*/


// cloning without losing getters/setters

O.clone = o => {
  const p = {};

  for (const k of objKeys(o))
    Object.defineProperty(
      p, k, Object.getOwnPropertyDescriptor(o, k));

  return p;
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


O.fromAit = () => comp(S.fromPromise) (async function (ix) {
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


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


O.del = k => o => (delete o[k], o);


O.del_ = k => o => {
  const p = Object.assign({}, o);
  delete p[k];
  return p;
};


O.get = k => o => k in o ? o[k] : null;


// use getters to either throw or supply a default value on missing properties

O.getPath = (...getters) => o => {
  for (const getter of getters) {
    if (o) o = getter(o);
    else break;
  }

  return o;
};


O.getPath_ = getters => o => {
  for (const getter of getters) {
    if (o) o = getter(o);
    else break;
  }

  return o;
};


// getter meant to be used with `O.getPath_`

O.getPathOrThrow = k => o => k in o
  ? o[k] : _throw(`missing property "${k}"`);


O.getPathOr = x => (...ks) => o => {
  for (const k of ks) {
    if (o) o = o[k];
    else return x;
  }

  return o === undefined ? x : o;
};


O.getOr = x => k => o => k in o ? o[k] : x;


O.set = (k, v) => o => (o[k] = v, o);


O.set_ = (k, v) => o => Object.assign({}, o, {[k]: v});


O.upd = (k, f) => o => {
  if (k in o) return (o[k] = f(o[k]));
  else return o;
};


O.upd_ = (k, f) => o => {
  if (k in o) return Object.assign({}, o, {[k]: f(o[k])});
  else return o;
};


O.updOr = (k, v, f) => o => {
  if (k in o) return (o[k] = f(o[k])) (v);
  else return (o[k] = v, o);
};


O.updOr_ = (k, v, f) => o => {
  if (k in o) return Object.assign({}, o, {[k]: f(o[k]) (v)});
  else return Object.assign({}, o, {[k]: v});
};


/*
█████ Iterable ████████████████████████████████████████████████████████████████*/


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


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


// create lazy property that shares its result

O.lazyProp = k => thunk => o => {
  return Object.defineProperty(o, k, {
    get() {delete o[k]; return o[k] = thunk()},
    configurable: true,
    enumerable: true
  });
};


O.lazyProps = dtors => o => Object.defineProperties(o, ...dtors);


// self referencing during object creation

export const reify = f => f({});


O.reify = reify;


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ OPTIC ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Defines a focus inside a data structure using composable pairs of getters
and setters to allow deep modifications without losing the reference to the data
structure itself. Normal function composition is used to define foci several
layers deep. The type implicitly holds a description how to reconstruct the data
structure up to its outer layer. It depends on the used setters whether an optic
is destructive or non-destructive.

const o = {foo: {bar: 5}};

// set operation

const tx = comp(
  Optic.focus(O.get("bar"), O.set("bar")))
    (Optic.focus(O.get("foo"), O.set("foo")))
      (Optic.of(o));

Optic.defocus(Optic.set(55) (tx)); // {foo: {bar: 55}}

// update operation

const ty = comp(
  Optic.focus(O.get("bar"), O.upd("bar")))
    (Optic.focus(O.get("foo"), O.set("foo")))
      (Optic.of(o));

Optic.defocus(Optic.set(x => x * x) (ty)); // {foo: {bar: 25}}

// delete operation

const tz = comp(
  Optic.focus(O.get("bar"), _const(O.del("bar"))))
    (Optic.focus(O.get("foo"), O.set("foo")))
      (Optic.of(o));

Optic.defocus(tz); // {foo: {}} */


export const Optic = type("Optic", "opt");


/*
█████ Defocus █████████████████████████████████████████████████████████████████*/


// reconstruct the data structure with the specified modifications

Optic.defocus = tx =>
  tx.parent === null ? tx : Optic.defocus(tx.parent(tx.opt));


// only reconstructs a single layer

Optic.defocus1 = tx =>
  tx.parent === null ? tx : tx.parent(tx.opt);


/*
█████ Focus ███████████████████████████████████████████████████████████████████*/


// set a composable focus on a sub element of a data structure

Optic.focus = (getter, setter) => tx => Optic(
  getter(tx.opt),
  x => Optic(setter(x) (tx.opt), tx.parent));


// try to focus on the specified element or use a default value

Optic.tryFocus = x => (getter, setter) => tx => Optic(
  tx.opt === null ? getter(x) : getter(tx.opt),
  y => Optic(setter(y) (tx.opt === null ? y : tx.opt), tx.parent));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Optic.map = f => tx => Optic(f(tx.opt), tx.parent);


Optic.Functor = {map: Optic.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


/* Lift a binary function into an applicative functor. There is an ambiguity
regarding which object propert is to be updated with the final result value. */


Optic.ap = tf => tx => Optic(tf.opt(tx.opt), tf.parent); // left-biased


Optic.ap_ = tf => tx => Optic(tf.opt(tx.opt), tx.parent); // right-biased


Optic.Apply = {
  ...Optic.Functor,
  ap: Optic.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Optic.of = x => Optic(x, null);


Optic.Applicative = {
  ...Optic.Apply,
  of: Optic.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


/* Discards the parent of the next monadic computation but takes the current
one. Dunno whether this is meaningful in any way. */

Optic.chain = mx => fm => {
  const my = fm(mx.opt);
  return Optic(my.opt, mx);
}


Optic.Chain = {
  ...Optic.Apply,
  chain: Optic.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Optic.Monad = {
  ...Optic.Applicative,
  chain: Optic.chain
};


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


/* Auxiliary helpers to avoid lambdas when running an optic. delete operation
is skipped because it doesn't need a lambda in the first place. */


Optic.add = Semigroup => x => tx =>
  Optic(Semigroup.append(tx.opt) (x), tx.parent);


Optic.set = x => tx => Optic(x, tx.parent);


Optic.upd = f => tx => Optic(f(tx.opt), tx.parent);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ OPTION ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// handle computations that may yield no result


export const Option = {}; // namespace


export const Opt = Option; // shortcut


Opt.cata = x => tx => tx === null ? x : tx;


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Opt.map = f => tx => tx === null ? null : f(tx);


Opt.Functor = {map: Opt.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


Opt.alt = tx => ty => tx === null ? ty : tx;


Opt.Alt = {
  ...Opt.Functor,
  alt: Opt.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Opt.zero = null;


Opt.Plus = {
  ...Opt.Alt,
  zero: Opt.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Opt.ap = tf => tx =>
  tf === null ? null
    : tx === null ? null
    : tf(tx);


Opt.Apply = {
  ...Opt.Functor,
  ap: Opt.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


/* Since the type isn't defined as a sum type some imperative introspection is
required. */

Opt.of = x => x === null ? _throw("invalid value") : x;


Opt.Applicative = {
  ...Opt.Apply,
  of: Opt.of
};


/*
█████ Functor :: Apply :: Applicative :: Alternative ██████████████████████████*/


Opt.Alternative = {
  ...Opt.Plus,
  ...Opt.Applicative
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Opt.chain = mx => fm => mx === null ? null : fm(mx);


Opt.Chain = {
  ...Opt.Apply,
  chain: Opt.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Opt.Monad = {
  ...Opt.Applicative,
  chain: Opt.chain
};


/*
█████ List Operations █████████████████████████████████████████████████████████*/


Opt.cat = xs => {
  const acc = [];

  for (const x of xs) {
    if (x === null) continue;
    else acc.push(x);
  }
};


Opt.mapCat = f => xs => {
  const acc = [];

  for (const x of xs) {
    if (x === null) continue;
    else acc.push(f(x));
  }
};


Opt.singleton = xs => xs.length === 0 ? [] : [xs[0]];


Opt.singleton_ = xs => xs.length === 0 ? [] : [xs[xs.length - 1]];


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Opt.append = Semigroup => tx => ty =>
  tx === null ? tx
    : ty === null ? tx
    : Semigroup.append(tx) (ty);


Opt.Semigroup = {append: Opt.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Opt.empty = null;


Opt.Monoid = {
  ...Opt.Semigroup,
  empty: Opt.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Opt.run = x => f => tx => tx === null ? x : f(tx);


Opt.toNecessary = tx => {
  if (tx === null) throw new Err("missing value");
  else return tx;
}


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ PARALLEL ███████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Just like `Serial` but evaluated in parallel. See `Serial` for more
comprehensive information. */


// smart constructor

export const Parallel = k => {
  const o = {
    par: k,

    parSafe: f => { // stack-safe
      if (asyncCounter > 100) {
        asyncCounter = 0;
        return Promise.resolve(null).then(_ => k(f));
      }

      else {
        asyncCounter++;
        return k(f);
      }
    }
  };

  Object.defineProperty(o, TAG, {value: "Parallel"});
  return o;
};


export const P = Parallel; // shortcut


/*
█████ Category ████████████████████████████████████████████████████████████████*/


P.comp = f => g => P(k => x => g(x).opt.par(f).par(k));


P.id = tx => tx.par(id);


P.Category = {
  comp: P.comp,
  id: P.id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// (r -> r) -> P r t -> P r t
P.mapCont = f => tx => P(k => f(tx.par(k)));


P.pipe = g => f => P(k => x =>
  g(x).par(f).par(k));


// ((s -> r) -> t -> r) -> P r t -> P r s
P.withCont = f => tx => P(k => tx.par(f(k)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


P.fromSerial = tx => P(tx.ser);


// no error handling

P.fromPromise = px => P(k => px.then(x => k(x)).catch(e => k(e)));


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


P.and = tx => ty => {
  return P(k => {
    const pair = Array(2);
    let i = 0;

    return [tx, ty].map((tz, j) => {
      return tz.par(z => {
        if (i < 2) {
          if (pair[j] === undefined) {
            pair[j] = z;
            i++;
          }

          if (i === 2) return k(Pair(pair[0], pair[1]));
          else return null;
        }

        else return k(Pair(pair[0], pair[1]));
      });
    });
  });
};


P.allArr = () =>
  A.seqA({
    map: P.map,
    ap: P.ap,
    of: P.of});


P.allObj = o => {
  const keys = Object.keys(o);

  return P(k => {
    const xs = Array(keys.length),
      p = Object.assign({}, o); // preserve prop order

    let i = 0;

    return keys.map((key, j) => {
      return o[key].par(x => {
        if (i < keys.length) {
          if (xs[j] === undefined) {
            p[key] = x;
            xs[j] = null;
            i++;
          }

          if (i === keys.length) return k(p);
          else return null;
        }

        else return null;
      });
    });
  });
};


/*
█████ Debugging ███████████████████████████████████████████████████████████████*/


P.async = f => msecs => x => P(k => setTimeout(comp(k) (f), msecs, x));


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


P.or = tx => ty => {
  return P(k => {
    let done = false;

    return [tx, ty].map(tz => {
      return tz.par(z => {
        if (!done) {
          done = true;
          return k(z);
        }

        else return null;
      });
    });
  });
};


P.anyArr = () =>
  A.foldl(acc => tx =>
    P.Race.append(acc) (tx))
      (P.Race.empty);


P.anyObj = o =>
  A.foldl(acc => tx =>
    P.Race.append(acc) (tx))
      (P.Race.empty)
        (Object.values(o));


/*
█████ Excaption Handling ██████████████████████████████████████████████████████*/


P.tryCatch = k2 => tx => P(k => tx.par(x => {
  if (intro(x) === "Error") return k2(x);
  else return k(x);
}));


P.tryThrow = tx => P(k => tx.par(x => {
  if (intro(x) === "Error") throw x;
  else return k(x);
}));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


P.map = f => tx =>
  P(k => tx.par(x => k(f(x))));


P.Functor = {map: P.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


P.ap = tf => tx => P(k =>
  P.and(tf) (tx).par(([f, x]) =>
    k(f(x))));


P.Apply = {
  ...P.Functor,
  ap: P.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


P.of = x => P(k => k(x));


P.Applicative = {
  ...P.Apply,
  of: P.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


// please note that Chain diverges from Apply in terms of evaluation order


P.chain = mx => fm =>
  P(k => mx.par(x => fm(x).par(k)));


P.Chain = {
  ...P.Apply,
  chain: P.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


// please note that Monad diverges from Applicative in terms of evaluation order


P.Monad = {
  ...P.Applicative,
  chain: P.chain
};


/*
█████ Profunctor ██████████████████████████████████████████████████████████████*/


P.dimap = h => g => f => P(k => x => h(x).par(f).par(g).par(k));


P.lmap = P.pipe;


P.rmap = P.comp;


P.Profunctor = {
  ...P.Functor,
  dimap: P.dimap,
  lmap: P.lmap,
  rmap: P.rmap
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


P.append = Semigroup => tx => ty => P(k =>
  P.and(tx) (ty).par(([x, y]) =>
    k(Semigroup.append(x) (y))));


P.Semigroup = {append: P.append};

  
/*
█████ Semigroup (Race) ████████████████████████████████████████████████████████*/


P.Race = {};


P.Race.append = P.or;


P.Race.Semigroup = {append: P.Race.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


P.empty = Monoid => P(k => k(Monoid.empty));


P.Monoid = {
  ...P.Semigroup,
  empty: P.empty
};


/*
█████ Semigroup :: Monoid (Race) ██████████████████████████████████████████████*/


P.Race.empty = P(k => null);


P.Race.Monoid = {
  ...P.Race.Semigroup,
  empty: P.Race.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


P.reify = k => x => P(_ => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


P.allArr = P.allArr();


P.anyArr = P.anyArr();


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ PARSER ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Stateless parser combinators meant to be used with idempotent iterators. Look
into the respetive section on `Iit` to get more information. Features:

* parse forward
* parse backward
* look behind
* look ahead

For the time being parser only return descriptive error messages without
indicating the causal portion of the stream. This will change in a future
version.

If you need a stateful parser built your own one suitable for the task at hand.
You can examine examples in the stateful subsection of the parser composition
section.

Heads up: scruptum's parser combinator are powerful enough to create inifinite
loops. Best practice is to create interim parsers from existing ones, give them
descriptive names and use them to create more complex parsers. This way, it is
less hard to comprehend complex parser compositions. */


export const Parser = type("Parser", "parse");
  

export const Parsed = variant("Parsed")
  (binary_("Valid"), binary_("Invalid"), binary_("Done"));


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ PARSER :: FIRST ORDER ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// consume streams directly


/*
█████ Characters ██████████████████████████████████████████████████████████████*/


// parse a specific character

Parser.char = c => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else if (c === iy.value) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(`character "${c}" expected >>`), ix);
});


Parser.charBehind = c => Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else if (c === iy.value) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(`<< character "${c}" expected`), ix);
});


// parse not a specific character

Parser.notChar = c => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else if (c !== iy.value) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(`character "${c}" received >>`), ix);
});


Parser.notCharBehind = c => Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else if (c !== iy.value) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(`<< character "${c}" received`), ix);
});


// parse a desired character case insensitive

Parser.charCi = c => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else if (c.toLowerCase() === iy.value.toLowerCase()) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(`character "${c}" expected >>`), ix);
});


Parser.charCiBehind = c => Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else if (c.toLowerCase() === iy.value.toLowerCase()) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(`<< character "${c}" expected`), ix);
});


/*
█████ No Consumption ██████████████████████████████████████████████████████████*/


// reject any input

Parser.reject = msg => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else return Parsed.Invalid(new Err(msg), ix);
});


Parser.rejectBehind = msg => Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else return Parsed.Invalid(new Err(msg), ix);
});


/*
█████ Position Based ██████████████████████████████████████████████████████████*/


// parse beginning of line (nl, crnl or beginning of input)

Parser.bol = Monoid => Parser(ix => {
  if (ix.value === null) return Parsed.Valid(Monoid.empty, ix);

  else if (ix.value === "\n") {
    const iy = ix.prev;
    if (iy.value === "\r") return Parsed.Valid("\r\n", iy);
    else return Parsed.Valid("\n", ix);
  }
  
  else return Parsed.Invalid(new Err("beginning of line expected"), ix);
});


Parser.boi = Monoid => Parser(ix => {
  if (ix.value === null) return Parsed.Valid(Monoid.empty, ix);
  else return Parsed.Invalid(new Err("beginning of input expected"), ix);
});


// boolean based beginning of line

Parser.isBol = Parser(ix => {
  if (ix.value === null) return true
  else if (ix.value === "\n") return true
  else return false;
});


// boolean based beginning of input

Parser.isBoi = Parser(ix => {
  if (ix === null) return true;
  else return false;
});


// parse end of line (nl, crnl or end of input)

Parser.eol = Monoid => Parser(ix => {
  const iy = ix.next();

  if (iy.done) return Parsed.Valid(Monoid.empty, ix);
  
  else if (iy.value === "\r") {
    const iz = iy.next();

    if (iz.value === "\n") return Parsed.Valid("\r\n", iz);
    else return Parsed.Invalid(new Err("end of line expected"), ix);
  }

  else if (iy.value === "\n") return Parsed.Valid("\n", iy);
  else return Parsed.Invalid(new Err("end of line expected"), ix);
});


Parser.eoi = Monoid => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Valid(Monoid.empty, ix);
  else return Parsed.Invalid(new Err("end of input expected"), ix);
});


// boolean based end of line

Parser.isEol = Parser(ix => {
  const iy = ix.next();

  if (iy.done) return true;
  
  else if (iy.value === "\r") {
    const iz = iy.next();

    if (iz.value === "\n") return true;
    else return false;
  }

  else if (iy.value === "\n") return true;
  else return false;
});


// boolean based end of input

Parser.isEoi = Parser(ix => {
  const iy = ix.next();
  if (iy.done) return true;
  else return false;
});


/*
█████ Predicate-Based █████████████████████████████████████████████████████████*/


// parse input that satisfies a predicate

Parser.satisfy = (p, msg = "predicate unmet") => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else if (p(iy.value)) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(msg), ix);
});


Parser.satisfyBehind = (p, msg = "predicate unmet") => Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else if (p(iy.value)) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err(msg), ix);
});


/*
█████ Set-Based ███████████████████████████████████████████████████████████████*/


/* Parse any character that is in the given set. Use `_Set.atoz` etc. to define
character ranges. */

Parser.includes = s => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else if (s.has(iy.value)) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err("input is not included"), ix);
});


Parser.includesBehind = s => Parser(ix => {
  const iy = ix.prev;
  if (iy.done) return Parsed.Done("boi", ix);
  else if (s.has(iy.value)) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err("input is not included"), ix);
});


Parser.excludes = s => Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else if (!s.has(iy.value)) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err("input is excluded"), ix);
});


Parser.excludesBehind = s => Parser(ix => {
  const iy = ix.prev;
  if (iy.done) return Parsed.Done("boi", ix);
  else if (s.has(iy.value)) return Parsed.Valid(iy.value, iy);
  else return Parsed.Invalid(new Err("input is excluded"), ix);
});


/*
█████ Unconditional ███████████████████████████████████████████████████████████*/


// drop any input

Parser.drop = Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else return Parsed.Valid(null, iy);
});


Parser.dropBehind = Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else return Parsed.Valid(null, iy);
});


// accept any input

Parser.take = Parser(ix => {
  const iy = ix.next();
  if (iy.done) return Parsed.Done("eoi", ix);
  else return Parsed.Valid(iy.value, iy);
});


// accept any previous input

Parser.takeBehind = Parser(ix => {
  const iy = ix.prev;
  if (iy === null) return Parsed.Done("boi", ix);
  else return Parsed.Valid(iy.value, iy);
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ PARSER :: HIGHER ORDER ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// take n parsers and apply them instead of consuming streams directly


/*
█████ Combining (Logical) █████████████████████████████████████████████████████*/


// try both parsers and fail if one fails

Parser.and = Semigroup => tx => ty => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => ty.parse(iy).parsed.run({
      Valid: (v2, iz) => Parsed.Valid(Semigroup.append(v) (v2), iz),
      Invalid: (e, _) => Parsed.Invalid(e, ix),
      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  });
});


// indeterministic and

Parser.all = Monoid => (...ts) => Parser(ix => {
  let o = Parsed.Valid(null, ix),
    acc = Monoid.empty;

  for (const tx of ts) {
    o = tx.parse(o.parsed.val[1]);
    
    if (o.parsed.tag === "invalid")
      return Parsed.Invalid(o.parsed.val[0], ix);

    else if (o.parsed.tag === "done")
      return Parsed.Done(o.parsed.val[0], ix);

    else acc = Monoid.append(acc) (o.parsed.val[0]);
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


// try the first parser and the second on failure

Parser.or = tx => ty => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(v, iy),

    Invalid: (e, _) => ty.parse(ix).parsed.run({
      Valid: (v, iy) => Parsed.Valid(v, iy),
      Invalid: (e2, _) => Parsed.Invalid(Ex.aggregate(e, e2), ix),
      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Done: (s, _) => Parsed.Done(s, ix)
  });
});


// indeterministic or

Parser.any = (...ts) => Parser(ix => {
  for (const tx of ts) {
    const o = tx.parse(ix);
    if (o.parsed.tag === "valid") return o;
  }

  return Parsed.Invalid(Ex("no matching parser"), ix);
});


// consume the stream on failure but not on success (weird?)

Parser.not = Monoid => tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Invalid(new Err("logical not"), iy),
    Invalid: (e, _) => Parsed.Valid(Monoid.empty, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  });
});


// try the first and second parser and fail if both fail or both succeed

Parser.xor = tx => ty => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => ty.parse(iy).parsed.run({
      Valid: (v2, _) => Parsed.Invalid(new Err("both parser succeeded"), ix),
      Invalid: (e, iz) => Parsed.Valid(v, iz),
      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Invalid: (e, iy) => ty.parse(iy).parsed.run({
      Valid: (v, iz) => Parsed.Valid(v, iz),

      Invalid: (e2, _) => Parsed.Invalid(
        Ex.aggregate(e, e2, new Err("both parser failed")), ix),

      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Done: (s, _) => Parsed.Done(s, ix)
  });
});


/* Try the first and second parser and succeed if both fail or bot succeed
(xnor a.k.a. if and only if). */

Parser.iff = Monoid => tx => ty => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => ty.parse(iy).parsed.run({
      Valid: (v2, iz) => Parsed.Valid(Monoid.append(v) (v2), iz),

      Invalid: (e, _) => Parsed.Invalid(Ex.aggregate(
        new Err("first parser succeeded but second one failed"), e), ix),

      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Invalid: (e, iy) => ty.parse(iy).parsed.run({
      Valid: (v, _) => Parsed.Invalid(Ex.aggregate(
        new Err("first parser failed but second one succeeded"), e), ix),

      Invalid: (e2, iz) => Parsed.Valid(Monoid.empty, iz),
      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Done: (s, _) => Parsed.Done(s, ix)
  });
});


/*
█████ Combining (Quantitative) ████████████████████████████████████████████████*/


// parse the given pattern at least min or more times

// min..n (n=dynamic)
Parser.min = Monoid => n => tx => Parser(ix => {
  const acc = [];
  let o = Parsed.Valid(null, ix);

  while (true) {
    o = tx.parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") acc.push(o.parsed.val[0]);
    else break;
  }

  if (acc.length < n) return Parsed.Invalid(new Err(
    `pattern less than ${n} times received`,
    {cause: o.parsed.val[0]}), ix);

  else return Parsed.Valid(
    acc.reduce((acc2, v) =>
      Monoid.append(acc2) (v), Monoid.empty), o.parsed.val[1]);
});


// parse the given pattern at least once or more times

// 1..n (n=dynamic)
Parser.min1 = Monoid => Parser.min(Monoid) (1);


// parse the given pattern zero or max times

// 0..max
Parser.max = Monoid => n => tx => Parser(ix => {
  const acc = [];
  let o = Parsed.Valid(null, ix);

  while (true) {
    o = tx.parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") acc.push(o.parsed.val[0]);
    else break;
  }

  if (acc.length > n) return Parsed.Invalid(new Err(
    `pattern more than ${n} times received`,
    {cause: o.parsed.val[0]}), ix);

  else return Parsed.Valid(
    acc.reduce((acc2, v) =>
      Monoid.append(acc2) (v), Monoid.empty), o.parsed.val[1]);
});


// parse the given pattern zero times or once

// 0..1
Parser.max1 = Monoid => Parser.max(Monoid) (1);


// parse the given pattern at least min times but not more than max times

// m..n (m=static, n=static)
Parser.minMax = Monoid => (m, n = m) => tx => Parser(ix => {
  const acc = [];
  let o = Parsed.Valid(null, ix);

  while (n > 0) {
    o = tx.parse(o.parsed.val[1]);
    
    if (o.parsed.tag === "valid") {
      if (acc.length <= n) {
        if (acc.length < n) acc.push(o.parsed.val[0]);
        if (acc.length === n) break;
      }
      
      else return Parsed.Invalid(new Err(
        `pattern more than ${n} times received`,
        {cause: o.parsed.val[0]}), ix);
    }
    
    else break;
  }

  if (acc.length < m) return Parsed.Invalid(new Err(
    `pattern less than ${m} times received`,
    {cause: o.parsed.val[0]}), ix);

  else return Parsed.Valid(
    acc.reduce((acc2, v) =>
      Monoid.append(acc2) (v), Monoid.empty), o.parsed.val[1]);
});


/* Parse the given pattern as often as possible. It must occur at least min
times but not more than max times. */

// m..n (m=static, n=static)
Parser.minMaxOnly = Monoid => (m, n = m) => tx => Parser(ix => {
  const acc = [];
  let o = Parsed.Valid(null, ix);

  while (n > 0) {
    o = tx.parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") acc.push(o.parsed.val[0]);
    else break;
  }

  if (acc.length < m) return Parsed.Invalid(new Err(
    `pattern less than ${m} times received`,
    {cause: o.parsed.val[0]}), ix);

  else if (acc.length > n) return Parsed.Invalid(new Err(
    `pattern more than ${n} times received`,
    {cause: o.parsed.val[0]}), ix);

  else return Parsed.Valid(
    acc.reduce((acc2, v) =>
      Monoid.append(acc2) (v), Monoid.empty), o.parsed.val[1]);
});


// parse the given pattern n times

// n (n=static)
Parser.times = Parser.minMax;


// parse the given pattern n times and only n times

// n (n=static)
Parser.timesOnly = Parser.minMaxOnly;


/* Parse the given pattern once. Isn't derived from `Parser.times` because
of the redundant monoid constraint. */

// 1
Parser.once = tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(v, iy),
    Invalid: (e, _) => Parsed.Invalid(new Err("pattern not once received"), ix),
    Done: (s, _) => Parsed.Done(s, ix)
  });
});


// parse the pattern once and only once

// 1
Parser.onceOnly = tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => tx.parse(iy).parsed.run({
      Valid: (v2, _) => Parsed.Invalid(new Err("pattern more than once received"), ix),
      Invalid: (e, _) => Parsed.Valid(v, iy),
      Done: (s, _) => Parsed.Valid(v, iy)
    }),

    Invalid: (e, _) => Parsed.Invalid(new Err("pattern not once received"), ix),
    Done: (s, _) => Parsed.Done(s, ix)
  });
});


// parse the given pattern not once

// 0
Parser.none = Monoid => tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, _) => Parsed.Invalid(new Err("pattern once received"), ix),
    Invalid: (e, iy) => Parsed.Valid(Monoid.empty, iy),
    Done: (s, _) => Parsed.Valid(Monoid.empty, ix)
  });
});


// parse as many repetitions of the pattern as possible

// 0..n (n=dynamic)
Parser.many = Monoid => Parser.min(Monoid) (0);


// parse all occurrences of the given pattern but only return the last one

// 1
Parser.last = tx => Parser(ix => {
  let o = Parsed.Valid(null, ix), once = false;

  while (true) {
    o = tx.parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") once = true;
    else break;
  }

  if (once) return o;

  else return Parsed.Invalid(
    new Err(
      "pattern not once received",
      {cause: o.parsed.val[0]}), ix);
});


// parse all occurrences of the given pattern but only return the nth one

// 1
Parser.nth = n => tx => Parser(ix => {
  const acc = [];
  let o = Parsed.Valid(null, ix);

  while (true) {
    o = tx.parse(o.parsed.val[1]);

    if (o.parsed.tag === "valid") {
      acc.push(o.parsed.val[0]);
      if (n in acc) return Parsed.Valid(acc[n], o.parsed.val[1]);
    }
    
    else break;
  }

  return Parsed.Invalid(new Err(
    `pattern less than ${n} times received`,
    {cause: o.parsed.val[0]}), ix);
});


/*
█████ Look Behind/Ahead ███████████████████████████████████████████████████████*/


// look ahead or behind depending on the supplied parser

Parser.look = tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(v, ix),
    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  });
});


/*
█████ Result Modification █████████████████████████████████████████████████████*/


// omit the result on success

Parser.ignore = Monoid => tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(Monoid.empty, iy),
    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  })
});


// replace the result with a default value on success

Parser.replace = x => tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(x, iy),
    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  })
});


// take eihter the input or a default value on failure

Parser.optional = x => tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(v, iy),
    Invalid: (e, _) => Parsed.Valid(x, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  })
});


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████ PARSER :: TYPE CLASSES ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


// lift a function into the parser context

Parser.map = f => tx => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => Parsed.Valid(f(v), iy),
    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  })
});


Parser.Functor = {map: Parser.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


Parser.alt = Parser.or;


Parser.Alt = ({
  ...Parser.Functor,
  alt: Parser.alt
});


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


Parser.zero = Parser.reject("zero parser");


Parser.Plus = {
  ...Parser.Alt,
  zero: Parser.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


// lift an n-ary function into another parser context

Parser.ap = tf => tx => Parser(ix => {
  return tf.parse(ix).parsed.run({
    Valid: (f, iy) => tx.parse(iy).parsed.run({
      Valid: (v, iz) => Parsed.Valid(f(v), iz),
      Invalid: (e, _) => Parsed.Invalid(e, ix),
      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  })
});


Parser.Apply = {
  ...Parser.Functor,
  ap: Parser.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


// put a pure value in a parser context

Parser.of = x => Parser(ix => Parsed.Valid(x, ix));


Parser.Applicative = {
  ...Parser.Apply,
  of: Parser.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Parser.Chain = {
  ...Parser.Apply,
  chain: Parser.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


/* Conditionally sequence two parsers so that the second parser depends on the
result value of the first one. */

Parser.chain = Semigroup => tx => fm => Parser(ix => {
  return tx.parse(ix).parsed.run({
    Valid: (v, iy) => fm(v).parse(iy).parsed.run({
      Valid: (v2, iz) => Parsed.Valid(Semigroup.append(v) (v2), iz),
      Invalid: (e, _) => Parsed.Invalid(e, ix),
      Done: (s, _) => Parsed.Done(s, ix)
    }),

    Invalid: (e, _) => Parsed.Invalid(e, ix),
    Done: (s, _) => Parsed.Done(s, ix)
  });
});


Parser.Monad = {
  ...Parser.Applicative,
  chain: Parser.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Parser.append = Parser.and;


Parser.Semigroup = {append: Parser.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Parser.empty = Parser.reject("empty rejection");


Parser.Monoid = {
  ...Parser.Semigroup,
  empty: Parser.empty
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████ PARSER :: COMPOSITION ████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/*
█████ CSV █████████████████████████████████████████████████████████████████████*/


/* Parse CSV with an optional header and optional headings, where fields are
either nested in quotation marks or not. Parser can handle masked quotation
marks in the form of '"""' and separators occurring within fields nested in
quotation marks. The CSV format is more complex than you might think. A CSV
parser has to distinguish the following 12 cases:

  "…";
  "";
  "…"[EOL]
  ""[EOL]
  "…"[EOI]
  ""[EOI]
  …;
  ;
  …[EOL]
  [EOL]
  …[EOI]
  [EOI] */

Parser.csv = settings => Parser(ix => {
  const parse = (mode, p) => {
    if (settings[mode] || mode === "dataset") {
      if (mode === "dataset" && Parser.isEoi.parse(p.parsed.val[1]))
        return Pair([], p);

      else p = Parser.line.parse(p.parsed.val[1]);
      
      if (p.parsed.tag === "valid") {

        // replace masked quotation marks (""") with a placeholder

        const line = p.parsed.val[0].replaceAll(
          new RegExp(settings.quote.repeat(3), "g"), "${qm}");

        // parse patterns `"…";` or `…;`

        const p2 = parseFieldsPerLine.parse(Iit.from(line));

        if (p2.parsed.tag !== "valid") throw new Err(
          `invalid csv ${mode} structure received`,
          {cause: p2.parsed.val[0]});

        // parse trailing patterns `…[EOI]`, `[EOI]` if any

        const p3 = Parser.or(quotedFieldEoi) (fieldEoi)
          .parse(p2.parsed.val[1]);

        if (p3.parsed.tag !== "valid") throw new Err(
          `invalid csv ${mode} structure received`,
          {cause: p3.parsed.val[0]});

        else {
          p2.parsed.val[0].push(p3.parsed.val[0]);

          return Pair(
            p2.parsed.val[0].map(s =>
              s.replaceAll(new RegExp(Rex.escape("${qm}"), "g"), settings.quote)
                .replaceAll(new RegExp(Rex.escape("${sp}"), "g"), settings.sep)),
            p);
        }
      }

      else throw new Err(`csv ${mode} expected`, {cause: p.parsed.val[0]});
    }

    else return Pair([], p);
  };

  // interim parsers

  const field = Parser.many(Str.Monoid) (Parser.notChar(settings.sep));

  const quotedField = Parser.delimitedBy(Str.Monoid)
    (c => c === settings.sep ? "${sp}" : c)
      (settings.quote);

  const ignoreSep = Parser.ignore(Str.Monoid) (Parser.char(settings.sep));

  const fieldSep = Parser.and(Str.Semigroup) (field) (ignoreSep);

  const fieldEoi = Parser.and(Str.Semigroup) (field) (Parser.eoi(Str.Monoid));

  const quotedFieldSep = Parser.and(Str.Semigroup) (quotedField) (ignoreSep);

  const quotedFieldEoi = Parser.and(Str.Semigroup) (quotedField) (Parser.eoi(Str.Monoid));

  const parseFieldsPerLine = Parser.min1(A.Monoid) (
    Parser.or(quotedFieldSep) (fieldSep));

  // csv header/headings

  const [header, o] = parse("header", Parsed.Valid(null, ix)),
    [headings, o2] = parse("headings", o);

  // csv datasets

  const len = headings.length ? headings.length : 0, acc = [];
  let o3 = o2;

  while (true) {
    const [xs, o4] = parse("dataset", o3);
    
    if (xs.length === 0) break;
    else o3 = o4;

    // impose uniform number of fields

    if (xs.length !== len)
      throw new Err(`received "${xs.length}" fields but "${len}" expected`);

    // conditionally transform to object using the headings, if any

    if (headings.length && settings.toObj) {
      const headings2 = _Map.fromArr(headings);
      acc.push(O.fromArr(headings2) (xs));
    }

    else acc.push(xs);
  }

  return Parsed.Valid({header, headings, datasets: acc}, o3.parsed.val[1]);
});


/*
█████ Date ████████████████████████████████████████████████████████████████████*/


// YYYY-MM-DD
// YY-MM-DD
// YYYYMMDD
// YYMMDD
// MM-DD
// DD.MM.YYYY
// DD.MM.YY
// DDMMYYYY
// DDMMYY
// DD.MM


/*
█████ Enumeration █████████████████████████████████████████████████████████████*/


// 1, 2, 3
// 1,2,3
// 1 + 2 + 3
// 1+2+3
// 1 & 2 & 3
// 1&2&3
// 1, 2 & 3
// 1,2&3
// 1000/11/12
// 1000+11+12
// 1000&11&12


/*
█████ Financial ███████████████████████████████████████████████████████████████*/


// Parser.bic


// Parser.iban


/*
█████ Line/Paragraph ██████████████████████████████████████████████████████████*/


Parser.line_ = whole => Parser(ix => {
  if (whole && Parser.isBol.parse(ix) === false)
    return Parsed.Invalid("beginning of line expected", ix);

  let o = Parsed.Valid(null, ix), acc = "";

  while (true) {
    o = Parser.eol(Str.Monoid).parse(o.parsed.val[1]);

    if (o.parsed.tag === "valid") break;
    
    else {
      o = Parser.take.parse(o.parsed.val[1]);
      acc += o.parsed.val[0];
    }
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


Parser.line = Parser.line_(true);


Parser.toEol = Parser.line_(false);


/*
█████ Natural Language ████████████████████████████████████████████████████████*/


// Parser.sentence


// Parser.SentenceBehind


// parse any word composed of characters of the supplied codeset

Parser.word = codeset => Parser(ix => {
  const tx = scope(() => {
    switch (codeset) {
      case "ascii": return Parser.asciiLetter;
      case "latin1": return Parser.latin1Letter;
      case "utf8": return Parser.utf8Letter;
      default: throw new Err(`unknown codeset "${codeset}"`);
    }
  });

  let o = Parsed.Valid(null, ix), acc = "";

  while (true) {
    o = tx.parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") acc += o.parsed.val[0];
    else break;
  }

  if (acc.length) return Parsed.Valid(acc, o.parsed.val[1]);
  
  else if (o.parsed.tag === "invalid")
    return Parsed.Invalid(new Err(`${codeset}-encoded word expected`), ix);

  else return Parsed.Done(o.parsed.val[0], ix);
});


Parser.wordBehind = codeset => Parser(ix => {
  const tx = scope(() => {
    switch (codeset) {
      case "ascii": return Parser.asciiLetterBehind;
      case "latin1": return Parser.latin1LetterBehing;
      case "utf8": return Parser.utf8LetterBehing;
      default: throw new Err(`unknown codeset "${codeset}"`);
    }
  });

  let o = Parsed.Valid(null, ix), acc = "";

  while (true) {
    o = tx.parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") o.parsed.val[0] += acc;
    else break;
  }

  if (acc.length) return Parsed.Valid(acc, o.parsed.val[1]);
  
  else if (o.parsed.tag === "invalid")
    return Parsed.Invalid(new Err(`${codeset}-encoded word expected`), ix);

  else return Parsed.Done(o.parsed.val[0], ix);
});


/*
█████ Number ██████████████████████████████████████████████████████████████████*/


// Parser.natural


// Parser.integer


// Parser.float


// Parser.number


// Parser.zipcode


// Parser.phone


/*
█████ Period ██████████████████████████████████████████████████████████████████*/


// Dezember/2024
// Dez./2024
// Dez/2024
// Dez./24
// Dez/24
// Dez. 2024
// Dez 2024
// Dez. 24
// Dez 24
// Dez.2024
// Dez2024
// Dez.24
// Dez24


/*
█████ Range ███████████████████████████████████████████████████████████████████*/


// 1-10
// 1..10
// 1 to 10
// 1 bis 10


/*
█████ Section █████████████████████████████████████████████████████████████████*/


/* Take all characters between an open and close pattern, where open and close
can be the same or different parsers. */


/*
█████ String ██████████████████████████████████████████████████████████████████*/


// parse a desired string

Parser.string = s => Parser(ix => {
  let o = Parsed.Valid(null, ix), acc = "";

  for (let i = 0; i < s.length; i++) {
    o = Parser.char(s[i]).parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") acc += o.parsed.val[0];

    else if (o.parsed.tag === "invalid")
      return Parsed.Invalid(new Err(`"${s}" expected`), ix);

    else return Parsed.Done(o.parsed.val[0], ix);
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


Parser.stringBehind = s => Parser(ix => {
  let o = Parsed.Valid(null, ix), acc = "";

  for (let i = s.length - 1; i >= 0; i--) {
    o = Parser.charBehind(s[i]).parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") o.parsed.val[0] += acc;

    else if (o.parsed.tag === "invalid") 
      return Parsed.Invalid(new Err(`"${s}" expected`), ix);

    else return Parsed.Done(o.parsed.val[0], ix);
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


// parse a desired string case insensitive

Parser.stringCi = s => Parser(ix => {
  let o = Parsed.Valid(null, ix), acc = "";

  for (let i = 0; i < s.length; i++) {
    o = Parser.charCi(s[i]).parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") acc += o.parsed.val[0];
    
    else if (o.parsed.tag === "invalid")
      return Parsed.Invalid(new Err(`"${s}" expected`), ix);

    else return Parsed.Done(o.parsed.val[0], ix);
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


Parser.stringCiBehind = s => Parser(ix => {
  let o = Parsed.Valid(null, ix), acc = "";

  for (let i = s.length - 1; i >= 0; i--) {
    o = Parser.charCiBehind(s[i]).parse(o.parsed.val[1]);
    if (o.parsed.tag === "valid") o.parsed.val[0] += acc;
    
    else if (o.parsed.tag === "invalid")
      return Parsed.Invalid(new Err(`"${s}" expected`), ix);
    
    else return Parsed.Done(o.parsed.val[0], ix);
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


/*
█████ Stateful ████████████████████████████████████████████████████████████████*/


/* Parse a nested pattern up to max level of nestings and either capture or
discard the open/close patterns themselves. Use stop characters to further
limit nestings so that they can't span lines, for instance. Apply a trans-
formation to the input depending on the accumulator and the level of nesting. */

Parser.nestedIn = Monoid => ({maxLevel, captureNesting = false, stopChars = new Set(), transform = id}) => (open, close) => Parser(ix => {
  let o = Parsed.Valid(null, ix), acc = Monoid.empty, level = 0;
  
  do {
    o = open.parse(o.parsed.val[1]);

    if (o.parsed.tag === "valid") {
      if (level + 1 > maxLevel)
        return Parsed.Invalid(new Err("further nesting received"), ix);
      
      else {
        level++;

        if (captureNesting) acc = Monoid.append(acc) (transform({
          acc,
          value: o.parsed.val[0],
          level
        }));
      }
    }

    else if (o.parsed.tag === "done") return Parsed.Invalid(new Err(
      "incomplete nesting received", {cause: o.parsed.val[0]}), ix);

    else {
      o = close.parse(o.parsed.val[1]);

      if (o.parsed.tag === "valid") {
        if (level - 1 < 0)
          return Parsed.Invalid(new Err("malformed nesting received"), ix);

        else {
          if (captureNesting) acc = Monoid.append(acc) (transform({
            acc,
            value: o.parsed.val[0],
            level
          }));

          level--;
        }
      }

      else if (o.parsed.tag === "done") return Parsed.Invalid(new Err(
        "incomplete nesting received", {cause: o.parsed.val[0]}), ix);

      else {
        o = Parser.take.parse(o.parsed.val[1]);
        
        if (stopChars.has(o.parsed.val[0]))
          return Parsed.Invalid(new Err("incomplete nesting received"), ix);

        else acc = Monoid.append(acc) (transform({
          acc,
          value: o.parsed.val[0],
          level
        }));
      }
    }
  } while (level > 0);

  return Parsed.Valid(acc, o.parsed.val[1]);
});


/* Parse the next input delimited by a left and right separator. Separators can
be single characters or strings. Apply a transformation to the parsed result
before it is appended to the accumulator. */

Parser.delimitedBy = Monoid => transform => (left, right = left) => Parser(ix => {
  let o = Parser.string(left).parse(ix), acc = Monoid.empty;

  if (o.parsed.tag !== "valid")
    return Parsed.Invalid(new Err(
      `separator "${left}" expected`,
      {cause: o.parsed.val[0]}), ix);

  while (true) {

    // don't allow nested separators

    if (left !== right) {
      const p = Parser.string(left).parse(o.parsed.val[1]);
  
      if (p.parsed.tag === "valid")
        return Parsed.Invalid(
          new Err(`nested separator "${left}" received`, ix));
    }

    o = Parser.string(right).parse(o.parsed.val[1]);

    if (o.parsed.tag === "valid") break;

    else if (o.parsed.tag === "done")
      return Parsed.Invalid(new Err(
        "unclosed delimitation received",
        {cause: o.parsed.val[0]}), ix);

    else {
      o = Parser.take.parse(o.parsed.val[1]);
      
      if (o.parsed.tag === "valid")
        acc = Monoid.append(acc) (transform(o.parsed.val[0]));

      else return Parsed.Invalid(new Err(
        "unclosed delimitation received",
        {cause: o.parsed.val[0]}), ix);
    }
  }

  return Parsed.Valid(acc, o.parsed.val[1]);
});


/*█████████████████████████████████████████████████████████████████████████████
██████████████████████████████████ PREDICATE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// dynamic predicates


export const Pred = type("Pred");


/*
█████ Boolean Logic ███████████████████████████████████████████████████████████*/


Pred.iff = tx => ty => Pred(x => {
  if (tx.pred(x) === true && ty.pred(x) === true)
    return true;

  else if (tx.pred(x) === false && ty.pred(x) === false)
    return true;

  else return false;
});


Pred.imply = tx => ty => Pred(x => {
  if (tx.pred(x) === true && ty.pred(x) !== true)
    return false;

  else return true;
});


Pred.not = tx => Pred(x => !tx.pred(x));


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


Pred.all = xs => Pred(x => {
  for (const tx of xs)
    if (tx.pred(x) === false) return false;

  return true;
});


Pred.and = tx => ty => Pred(x => tx.pred(x) && ty.pred(x));


/*
█████ Constant ████████████████████████████████████████████████████████████████*/


Pred.then = x => true;


Pred.else = x => false;


/*
█████ Disjunction █████████████████████████████████████████████████████████████*/


Pred.any = preds => Pred(x => {
  for (const tx of xs)
    if (tx.pred(x) === true) return true;

  return false;
});


Pred.or = tx => ty => Pred(x => tx.pred(x) || ty.pred(x));


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Pred.append = Pred.and;


Pred.Semigroup = {append: Pred.append};


/*
█████ Semigroup (Disjunction) █████████████████████████████████████████████████*/


Pred.Disjunct = {};


Pred.Disjunct.append = Pred.or;


Pred.Disjunct.Semigroup = {append: Pred.Disjunct.append};


/*
█████ Monoid ██████████████████████████████████████████████████████████████████*/


Pred.empty = Pred.then;


Pred.Monoid = {
  ...Pred.Semigroup,
  empty: Pred.empty
};


/*
█████ Monoid (Disjunction) ████████████████████████████████████████████████████*/


Pred.Disjunct.empty = Pred.else;


Pred.Disjunct.Monoid = {
  ...Pred.Disjunct.Semigroup,
  empty: Pred.Disjunct.empty
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████ REGULAR EXPRESSIONS █████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Regular expresions work best with complex strings using a divide & conquer
strategy. First, determine the bounds of the region of interest in the string
and than extract individual subpatterns within this region independently of
each other. Accumulate all necessary subpatterns and feed them to a downstream
function along with the original string to take the context into account. */


export const Rex = {};


/*
█████ Bounds ██████████████████████████████████████████████████████████████████*/


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


/*
█████ Character Classes ███████████████████████████████████████████████████████*/


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


/*
█████ Extracting ██████████████████████████████████████████████████████████████*/


/* Take an object with properties holding regular expressions and apply each
to the provided string. Store each match under the respective property. */

Rex.extract = o => s =>
  O.fromIt(It.map(([k, rx]) => [k, Rex.matchFirst(rx) (s)]) (O.entries(o)));


/*
█████ Matching ████████████████████████████████████████████████████████████████*/


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


/*
█████ Patterns ████████████████████████████████████████████████████████████████*/


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


/*
█████ Replacing ███████████████████████████████████████████████████████████████*/


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


/*
█████ Searching ███████████████████████████████████████████████████████████████*/


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


/*
█████ Slicing █████████████████████████████████████████████████████████████████*/


// composable combinators to slice substrings of greater strings


Rex.sliceFrom = f => s => {
  const is = f(s);
  if (is.length === 0) return s;
  else return s.slice(is[0]);
};


// excluding the delimiter

Rex.sliceFrom_ = f => s => {
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

Rex.sliceUpTo_ = f => s => {
  const is = f(s);
  if (is.length === 0) return s;
  else return s.slice(0, is[0]);
};


/*
█████ Splitting ███████████████████████████████████████████████████████████████*/


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


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


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


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ SERIAL ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encode asynchronous I/O computations evaluated in serial. Use..

  * `Parallel` for asynchronous computations in parallel
  * `Cont` for synchronous computations in CPS

The type has the following properties:

  * pure core/impure shell concept
  * asynchronous, serial evaluation
  * deferred nested function calls
  * stack-safe due to asynchronous calls
  * non-reliable return values
  * base monad (no transformer)

`Serial` isn't asynchronous by default, i.e. the next continuation (invocation
of the next `then` handler in `Promise` lingo) may be in the same microtask of
Javascript's event loop. Hence an alternative mechanism is needed to provide
stack-safety in the context of long synchronous chains. `runSafe` intersperses
`Promise` into the chain. This process is completely transparent to the caller
because `Serial` doesn't rely on return values.

`Serial` is based on multi-shot continuations, i.e. its continuation can be
invoked several times and thus the corresponding async computation is evaluated
several times. If you need sharing, provide a function scope in applicative or
monadic style that provides the only once evaluated expressions.

The type doesn't handel exceptions but you need take care of them yourself. */


// smart constructor

export const Serial = k => {
  const o = {
    ser: k,

    // stack-safe

    serSafe: f => {
      if (asyncCounter > 100) {
        asyncCounter = 0;
        return Promise.resolve(null).then(_ => k(f));
      }

      else {
        asyncCounter++;
        return k(f);
      }
    }
  };

  Object.defineProperty(o, TAG, {value: "Serial"});
  return o;
};


export const S = Serial; // shortcut


/*
█████ Category ████████████████████████████████████████████████████████████████*/


S.comp = f => g => S(k => x => g(x).ser(f).ser(k));


S.id = tx => tx.ser(id);


S.Category = {
  comp: S.comp,
  id: S.id
};


/*
█████ Composition █████████████████████████████████████████████████████████████*/


// (r -> r) -> S r t -> S r t
S.mapCont = f => tx => S(k => f(tx.ser(k)));


S.pipe = g => f => S(k => x =>
  g(x).ser(f).ser(k));


// ((s -> r) -> t -> r) -> S r t -> S r s
S.withCont = f => tx => S(k => tx.ser(f(k)));


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


S.fromParallel = tx => S(tx.par);


// no error handling

S.fromPromise = px => S(k => px.then(x => k(x)).catch(e => k(e)));


/*
█████ Conjunction █████████████████████████████████████████████████████████████*/


S.and = tx => ty =>
  S(k =>
    tx.ser(x =>
      ty.ser(y =>
        k(Pair(x, y)))));


S.allArr = () =>
  A.seqA({
    map: S.map,
    ap: S.ap,
    of: S.of});


S.allObj = o => {
  return Object.keys(o).reduce((acc, key) => {
    return S(k =>
      acc.ser(p =>
        o[key].ser(x =>
          k((p[key] = x, p)))));
  }, S.of({}));
};


/*
█████ Debugging ███████████████████████████████████████████████████████████████*/


S.async = f => msecs => x => S(k => setTimeout(comp(k) (f), msecs, x));


/*
█████ Excaption Handling ██████████████████████████████████████████████████████*/


S.tryCatch = k2 => tx => S(k => tx.ser(x => {
  if (intro(x) === "Error") return k2(x);
  else return k(x);
}));


S.tryThrow = tx => S(k => tx.ser(x => {
  if (intro(x) === "Error") throw x;
  else return k(x);
}));


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


S.foldl = f => acc => tx =>
  S(k => tx.ser(it => {
    for (const x of it) acc = f(acc) (x);
    return k(acc);
  }));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


S.map = f => tx =>
  S(k => tx.ser(x => k(f(x))));


S.Functor = {map: S.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


S.ap = tf => tx => S(k =>
  S.and(tf) (tx).ser(([f, x]) =>
    k(f(x))));


S.Apply = {
  ...S.Functor,
  ap: S.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


S.of = x => S(k => k(x));


S.Applicative = {
  ...S.Apply,
  of: S.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


S.chain = mx => fm =>
  S(k => mx.ser(x => fm(x).ser(k)));


S.Chain = {
  ...S.Apply,
  chain: S.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


S.Monad = {
  ...S.Applicative,
  chain: S.chain
};


/*
█████ Profunctor ██████████████████████████████████████████████████████████████*/


S.dimap = h => g => f => S(k => x => h(x).ser(f).ser(g).ser(k));


S.lmap = S.pipe;


S.rmap = S.comp;


S.Profunctor = {
  ...S.Functor,
  dimap: S.dimap,
  lmap: S.lmap,
  rmap: S.rmap
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


S.append = Semigroup => tx => ty => S(k =>
  S.and(tx) (ty).ser(([x, y]) =>
    k(Semigroup.append(x) (y))));


S.Semigroup = {append: S.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


S.empty = Monoid => S(k => k(Monoid.empty));


S.Monoid = {
  ...S.Semigroup,
  empty: S.empty
};


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


S.reify = k => x => S(_ => k(x));


/*
█████ Resolve Deps ████████████████████████████████████████████████████████████*/


S.allArr = S.allArr();


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SET █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const _Set = {}; // namespace


/*
█████ Clone ███████████████████████████████████████████████████████████████████*/


_Set.clone = s => new Set(s);


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


_Set.fromAit = comp(S.fromPromise) (async function (ix) {
  const s = new Set();
  for await (const k of ix) s.add(k);
  return s;
});


_Set.fromAitKeys = comp(S.fromPromise) (async function (ix) {
  const s = new Set();
  for await (const [k,] of ix) s.add(k);
  return s;
});


_Set.fromAitValues = comp(S.fromPromise) (async function (ix) {
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


/*
█████ Generators ██████████████████████████████████████████████████████████████*/


_Set.entries = s => s[Symbol.iterator] ();


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


_Set.del = k => s => s.delete(k);


_Set.has = k => s => s.has(k);


_Set.set = k => s => s.add(k);


/*
█████ Ranges ██████████████████████████████████████████████████████████████████*/


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


/*
█████ Set Operations ██████████████████████████████████████████████████████████*/


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
███████████████████████████████████ STREAM ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* There is no stream implementation because streams are a generalized lists
and requires monads, transformers and lazy evaluation tha Javascript lacks. */


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ STRING ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Str = {}; // namespace


/*
█████ Casing ██████████████████████████████████████████████████████████████████*/


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


/*
█████ Concatenization █████████████████████████████████████████████████████████*/


Str.catWith = s => (...xs) => xs.join(s);


Str.cat = Str.catWith("");


Str.cat_ = Str.catWith(" ");


/*
█████ Counting ████████████████████████████████████████████████████████████████*/


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


/*
█████ Diffing █████████████████████████████████████████████████████████████████*/


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


/*
█████ Distance ████████████████████████████████████████████████████████████████*/


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


/*
█████ Normalizing █████████████████████████████████████████████████████████████*/


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


/*
█████ Ordering ████████████████████████████████████████████████████████████████*/


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


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


Str.append = s => t => "" + s + t;


Str.Semigroup = {append: Str.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


Str.empty = "";


Str.Monoid = {
  ...Str.Semigroup,
  empty: Str.empty
};


/*
█████ Splitting ███████████████████████████████████████████████████████████████*/


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


/*
█████ Misc. ████████████████████████████████████████████████████████████████*/


/* Plain applicator but with a telling name. Intended use:

  Str.template(o => `Happy ${o.foo}, ${o.bar}!`)
    ({foo: "Thanksgiving", bar: "Muad'dib"})

Yields "Happy Thanksgiving, Muad'dib!" */

Str.template = f => o => f(o);


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


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ THESE ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// encodes logical (A & B) || A || B


export const These = variant("These") (
  unary("This"),
  unary("That"),
  binary("Both"));


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


These.map = f => tx => tx.these.run({
  this: x => These.This(f(x)),
  that: _ => tx,
  both: x => y => These.Both(f(x)) (y)
});


These.Functor = {map: These.map};


/*
█████ Functor :: Alt ██████████████████████████████████████████████████████████*/


These.alt = tx => ty => tx.these.run({
  this: _ => tx,
  that: _ => ty,
  both: x => _ => These.This(x)
});


These.Alt = {
  ...These.Functor,
  alt: These.alt
};


/*
█████ Functor :: Alt :: Plus ██████████████████████████████████████████████████*/


These.zero = Monoid => These.That(Monoid.empty);


These.Plus = {
  ...These.Alt,
  zero: These.zero
};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


These.ap = Semigroup => tf => tx => tf.these.run({
  this: f => tx.these.run({
    this: x => These.This(f(x)),
    that: y => These.Both(f) (y),
    both: x => y => These.Both(f(x)) (y)
  }),

  that: y => tx.these.run({
    this: x => These.Both(x) (y),
    that: y2 => These.That(Semigroup.append(y) (y2)),
    both: x => y => These.Both(x) (Semigroup.append(y) (y2))
  }),

  both: f => y => tx.these.run({
    this: x => These.Both(f(x)) (y),
    that: y => These.Both(f) (y),
    both: x => y2 => These.Both(f(x)) (Semigroup.append(y) (y2))
  })
});


These.Apply = {
  ...These.Functor,
  ap: These.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


These.of = These.That;


These.Applicative = {
  ...These.Apply,
  of: These.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


These.chain = Semigroup => mx => fm => mx.these.run({
  this: x => fm(x),
  that: _ => mx,

  both: x => y => fm(x).these.run({
    this: x2 => These.Both(x2) (y),
    that: y2 => These.Both(x) (Semigroup.append(y) (y2)),
    both: x2 => y2 => These.Both(x2) (Semigroup.append(y) (y2))
  })
});


These.Chain = {
  ...These.Apply,
  chain: These.chain
};


/*
█████ Functor :: Applicative :: Monad █████████████████████████████████████████*/


These.Monad = {
  ...These.Applicative,
  chain: These.chain
};


/*
█████ Semigroup ███████████████████████████████████████████████████████████████*/


These.append = (Semigroup, Semigroup2) => tx => ty => tx.these.run({
  this: x => ty.these.run({
    this: x2 => These.This(Semigroup.append(x) (x2)),
    that: y => These.Both(x) (y),
    both: x2 => y => These.Both(Semigroup.append(x) (x2)) (y),
  }),

  that: y => ty.these.run({
    this: x => These.Both(x) (y),
    that: y2 => These.That(Semigroup2.append(y) (y2)),
    both: x => y2 => These.Both(x) (Semigroup2.append(y) (y2)),
  }),

  both: x => y => ty.these.run({
    this: x2 => These.Both(Semigroup.append(x) (x2)) (y),
    that: y2 => These.Both(x) (Semigroup2.append(y) (y2)),
    both: x2 => y2 => These.Both(Semigroup.append(x) (x2)) (Semigroup2.append(y) (y2)),
  })
});


These.Semigroup = {append: These.append};


/*
█████ Semigroup :: Monoid █████████████████████████████████████████████████████*/


These.empty = Monoid => These.That(Monoid.empty);


These.Monoid = {
  ...These.Semigroup,
  empty: These.empty
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ TRAMPOLINE ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Allow stack-safe monad recursion through the trampoline mechanism. The type
is the less powerful version of the continuation monad. Due to its structure
consisting of an imperative loop and tagged objects the `Trampoline` type
doesn't have a monad transformer but must be used as the outermost base monad
of a transformer stack. */


export const Trampoline = o => {
  while (o.constructor === Trampoline.bounce) o = o.f(o.x);

  if (o.constructor === Trampoline.return) return o.x;
  else return o;
};


export const Tramp = Trampoline;


Tramp.bounce = x => f => ({constructor: Tramp.bounce, f, x});


Tramp.bounce_ = f => x => ({constructor: Tramp.bounce, f, x});


Tramp.return = x => ({constructor: Tramp.return, x});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████████ TREE █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* 2-3 tree binary search tree implementation as the foundation of persistent
data structures. */


const Tree = {};


// smart constructor

Tree.Empty = reify(o => {
  Object.defineProperty(o, TAG, {value: "Tree"});
  o.tag = "Empty";
  return o;
});


Tree.Leaf = x => {
  const o = {height: 0, size: 1, min: x, x, tag: "Leaf"};
  Object.defineProperty(o, TAG, {value: "Tree"});
  return o;
};


Tree.Node2 = (height, size, min, left, right) => {
  const o = {height, size, min, left, right, tag: "Node2"};
  Object.defineProperty(o, TAG, {value: "Tree"});
  return o;
};


Tree.Node3 = (height, size, min, left, middle, right) => {
  const o = {height, size, min, left, middle, right, tag: "Node3"};
  Object.defineProperty(o, TAG, {value: "Tree"});
  return o;
};


Tree.node2 = (left, right) =>
  Tree.Node2(left.height + 1, left.size + right.size, left.min, left, right);


Tree.node3 = (left, middle, right) =>
  Tree.Node3(left.height + 1, left.size + middle.size + right.size, left.min, left, middle, right);


/*
█████ Implementation Details ██████████████████████████████████████████████████*/


Tree.levelUp = args => {
  switch(args.length) {
    case 2: return [Tree.node2(...args)];
    case 3: return [Tree.node3(...args)];  
    case 4: return [Tree.node2(args[0], args[1]), Tree.node2(args[2], args[3])];
    default: throw new Err("unexpected number of arguments");
  }
}


Tree.levelHeight = (left, right) => {
  if (left.height < right.height) {
    if (right.tag === "Node2") {
      const xs = Tree.levelHeight(left, right.left)
        .concat(right.right);

      return Tree.levelUp(xs);
    }

    else {
      const xs = Tree.levelHeight(left, right.left)
        .concat([right.middle, right.right]);

      return Tree.levelUp(xs);
    }
  }

  else if (left.height > right.height) {
    if (left.tag === "Node2") {
      const xs = [left.left]
        .concat(Tree.levelHeight(left.right, right));

      return Tree.levelUp(xs);
    }

    else {
      const xs = [left.left, left.middle]
        .concat(Tree.levelHeight(left.right, right));

      return Tree.levelUp(xs);
    }    
  }

  else return [left, right];
};


Tree.merge = (left, right) => {
  if (left.tag === "Empty") return right;
  else if (right.tag === "Empty") return left;

  else {
    const xs = Tree.levelHeight(left, right);

    if (xs.length === 1) return xs[0];
    else return Tree.node2(...xs);
  }
};


Tree.split = (tree, f) => {
  if (tree.tag === "Empty") return [Tree.Empty, Tree.Empty];

  else if (tree.tag === "Leaf") {
    if (f(tree.x)) return [Tree.Empty, Tree.Leaf(tree.x)];
    else return [Tree.Leaf(tree.x), Tree.Empty];
  }

  else if (tree.tag === "Node2") {
    if (f(tree.right.min)) {
      const [left, right] = Tree.split(tree.left, f);
      return [left, Tree.merge(right, tree.right)];
    }

    else {
      const [left, right] = Tree.split(tree.right, f);
      return [Tree.merge(tree.left, left), right];
    }
  }

  else {
    if (f(tree.middle.min)) {
      const [left, right] = Tree.split(tree.left, f);
      return [left, Tree.merge(right, Tree.node2(tree.middle, tree.right))];
    }

    if (f(tree.right.min)) {
      const [left, right] = Tree.split(tree.middle, f);
      return [Tree.merge(tree.left, left), Tree.merge(right, tree.right)];
    }

    else {
      const [left, right] = Tree.split(tree.right, f);
      return [Tree.merge(Tree.node2(tree.left, tree.middle), left), right];
    }
  }
};


/*
█████ Catamorphism ████████████████████████████████████████████████████████████*/


// catamorphism (structural fold)

Tree.cata = ({empty, leaf, node2, node3}) => function go(tree) {
  switch (tree.tag) {
    case "Empty": return empty();
    case "Leaf": return leaf(tree.x);

    case "Node2": return node2(
      tree.height,
      tree.min,
      go(tree.left),
      go(tree.right))

    case "Node3": return node3(
      tree.height,
      tree.min,
      go(tree.left),
      go(tree.middle),
      go(tree.right))
  }
};


/*
█████ Conversion ██████████████████████████████████████████████████████████████*/


Tree.fromArr = xs => xs.reduce((acc, x) => Tree.ins(acc, x), Tree.Empty)


Tree.prepend = (tree, xs) => {
  if (tree.tag === "Empty") return xs;
  else if (tree.tag === "Leaf") return (xs.unshift(tree.x), xs);
  
  else if (tree.tag === "Node2")
    return Tree.prepend(tree.left, Tree.prepend(tree.right, xs));

  else if (tree.tag === "Node3")
    return Tree.prepend(tree.left, Tree.prepend(tree.middle, Tree.prepend(tree.right, xs)));
};


Tree.toArr = tree => Tree.prepend(tree, []);


/*
█████ Foldable ████████████████████████████████████████████████████████████████*/


// left fold in ascending order

Tree.foldl = f => acc => Tree.cata({
  empty: () => acc,
  leaf: id,
  node2: (height, min, left, right) => f(f(acc) (left)) (right),
  node3: (height, min, left, middle, right) => f(f(f(acc) (left)) (middle)) (right)
});


// left fold in descending order

Tree.foldl_ = f => acc => Tree.cata({
  empty: () => acc,
  leaf: id,
  node2: (height, min, right, left) => f(f(acc) (left)) (right),
  node3: (height, min, right, middle, left) => f(f(f(acc) (left)) (middle)) (right)
});


// right fold in ascending order

Tree.foldr = f => function go(acc) {
  return tree => {
    switch (tree.tag) {
      case "Empty": return acc;
      case "Leaf": {return f(tree.x) (acc);}
      case "Node2": return go(go(acc) (tree.right)) (tree.left);
      case "Node3": return go(go(go(acc) (tree.right)) (tree.middle)) (tree.left);
    }
  };
};


// right fold in descending order

Tree.foldr_ = f => function go(acc) {
  return tree => {
    switch (tree.tag) {
      case "Empty": return acc;
      case "Leaf": {return f(tree.x) (acc);}
      case "Node2": return go(go(acc) (tree.left)) (tree.right);
      case "Node3": return go(go(go(acc) (tree.left)) (tree.middle)) (tree.right);
    }
  };
};


Tree.Foldable = {
  foldl: Tree.foldl,
  foldr: Tree.foldr
};


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Tree.map = f => Tree.cata({
  empty: () => Tree.Empty,
  leaf: x => Tree.Leaf(f(x)),

  node2: (height, min, left, right) =>
    Tree.Node2(height, left.size + right.size, f(min), left, right),

  node3: (height, min, left, middle, right) =>
    Tree.Node3(height, left.size + middle.size + right.size, f(min), left, middle, right)
});


Tree.Functor = {map: Tree.map};


/*
█████ Getter/Setter ███████████████████████████████████████████████████████████*/


/* The underscore versions compose an additional function `f`. It must be passed
as an argument and is called before the relational function, so that the actual
data `y` can be transformed for the latter. */


Tree.has = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x);

  if (right.tag === "Empty") return false;
  else return right.min === x;
};


Tree.has_ = (tree, f, x) => {
  const [left, right] = Tree.split(tree, y => (z => z >= x) (f(y)));

  if (right.tag === "Empty") return false;
  else return right.min === x;
};


Tree.ins = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x);
  return Tree.merge(Tree.merge(left, Tree.Leaf(x)), right);
};


Tree.ins_ = (tree, f, x) => {
  const [left, right] = Tree.split(tree, y => (z => z >= x) (f(y)));
  return Tree.merge(Tree.merge(left, Tree.Leaf(x)), right);
};


Tree.del = (tree, x) => {
  const [left, right] = Tree.split(tree, y => y >= x),
    [, right2] = Tree.split(right, y => y > x);

  return Tree.merge(left, right2);
};


Tree.del_ = (tree, f, x) => {
  const [left, right] = Tree.split(tree, y => (z => z >= x) (f(y))),
    [, right2] = Tree.split(right, y => (z => z > x) (f(y)));

  return Tree.merge(left, right2);
};


/*
█████ Meta Information ████████████████████████████████████████████████████████*/


Tree.leafs = Tree.cata({
  empty: () => 0,
  leaf: _ => 1,
  node2: (height, min, left, right) => left + right,
  node3: (height, min, left, middle, right) => left + middle + right
});


Tree.nodes = Tree.cata({
  empty: () => 0,
  leaf: _ => 0,
  node2: (height, min, left, right) => 1 + left + right,
  node3: (height, min, left, middle, right) => 1 + left + middle + right,
});


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ TUPLE :: PAIR ████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// smart constructor

export const Pair = (x, y) => {
  const o = {
    0: x, 1: y, length: 2,

    [Symbol.iterator]: function*() {
      yield x;
      yield y;
    }
  };

  Object.defineProperty(o, TAG, {value: "Pair"});
  return o;  
};


// smart constructor to define lazy getters

export const Pair_ = o => {
  Object.defineProperty(o, TAG, {value: "Pair"});
  o.length = 2;

  o[Symbol.iterator] = function*() {
    yield o[0];
    yield o[1];
  };

  return o;
};


/*
█████ Extracting ██████████████████████████████████████████████████████████████*/


Pair.fst = tx => tx[0];


Pair.snd = tx => tx[1];


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Pair.map = f => ({1: x, 2: y}) => Pair(x, f(y));


Pair.Functor = {map: Pair.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Pair.ap = Semigroup => ({1: x, 2: f}) => ({1: y, 2: z}) =>
  Pair(Semigroup.append(x) (y), f(z));


Pair.Apply = {
  ...Pair.Functor,
  ap: Pair.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Pair.of = Monoid => x => Pair(Monoid.empty, x);


Pair.Applicative = {
  ...Pair.Apply,
  of: Pair.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Pair.chain = Semigroup => fm => ({1: x, 2: y}) => {
  const {1: x2, 2: y2} = fm(y);
  return Pair(Semigroup.append(x) (x2), y2);
};


Pair.Chain = {
  ...Pair.Apply,
  chain: Pair.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Pair.Monad = {
  ...Pair.Applicative,
  chain: Pair.chain
};


/*
█████ Functor :: Bifunctor ████████████████████████████████████████████████████*/


/* bimap/dimap comparison:

  bimap :: (a -> b) -> (c -> d) -> bifunctor  a c -> bifunctor  b d
            ^^^^^^
  dimap :: (b -> a) -> (c -> d) -> profunctor a c -> profunctor b d
            ^^^^^^                                                  */


Pair.bimap = f => g => tx => Pair(f(tx[0]), g(tx[1]));


Pair.Bifunctor = ({
  ...Pair.Functor,
  bimap: Pair.bimap
});


/*
█████ Functor :: Extend ███████████████████████████████████████████████████████*/


// w a -> w (w a)
Pair.duplicate = wx => Pair(wx[0], wx);


// (w a -> b) -> w a -> w b
Pair.extend = fw => wx => Pair(wx[0], fw(wx));


Pair.Extend = {
  ...Pair.Functor,
  extend: Pair.extend
};


/*
█████ Functor :: Extend :: Comonad ████████████████████████████████████████████*/


// w a -> a
Pair.extract = Pair.snd;


Pair.Comonad = {
  ...Pair.Extend,
  extract: Pair.extract
};


/*
█████ Getters/Setters █████████████████████████████████████████████████████████*/


Pair.setFst = x => tx => Pair(x, tx[1]);


Pair.setSnd = x => tx => Pair(tx[0], x);


/*
█████ Misc. ███████████████████████████████████████████████████████████████████*/


Pair.mapFst = f => tx => Pair(f(tx[0]), tx[1]);


Pair.swap = tx => Pair(tx[1], tx[0]);


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████ TUPLE :: TRIPLE ███████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// smart constructor

export const Triple = (x, y, z) => {
  const o = {
    0: x, 1: y, 2: z, length: 3,

    [Symbol.iterator]: function*() {
      yield x;
      yield y;
      yield z;
    }
  };

  Object.defineProperty(o, TAG, {value: "Triple"});
  return o;  
};


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ YONEDA ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Encodes dynamic function composition within a functor. Useful in cases when
the composition cannot be defined manually upfront but only at runtime. */


export const Yoneda = type("Yoneda", "yo");


export const Yo = Yoneda; // shortcut


/*
█████ Functor █████████████████████████████████████████████████████████████████*/


Yo.map = f => tx => Yo(g => tx.yo(comp(g) (f)));


Yo.Functor = {map: Yo.map};


/*
█████ Functor :: Apply ████████████████████████████████████████████████████████*/


Yo.ap = Apply => tf => tx => Yo(f => Apply.ap(tf.yo(comp(f))) (tx.yo(id)));


Yo.Apply = {
  ...Yo.Functor,
  ap: Yo.ap
};


/*
█████ Functor :: Apply :: Applicative █████████████████████████████████████████*/


Yo.of = Applicative => x => Yo(f => Applicative.of(f(x)));


Yo.Applicative = {
  ...Yo.Apply,
  of: Yo.of
};


/*
█████ Functor :: Apply :: Chain ███████████████████████████████████████████████*/


Yo.chain = Chain => mx => fm =>
  Yo(f => Chain.chain(mx.yo(id)) (x => fm(x).yo(f)));
    

Yo.Chain = {
  ...Yo.Apply,
  chain: Yo.chain
};


/*
█████ Functor :: Apply :: Applicative :: Monad ████████████████████████████████*/


Yo.Monad = {
  ...Yo.Applicative,
  chain: Yo.chain
};


/*
█████ Lift/Unlift █████████████████████████████████████████████████████████████*/


Yo.lift = Functor => tx => Yo(f => Functor.map(f) (tx));


Yo.lower = tx => tx.yo(id);


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ VALIDATION ██████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


/* Strings of date, datetime and numbers are not validated because such values
are meant to be used encoded by their native types `Number`, `BigInt` or `Date`.
If you need a string, simply convert. */


export const Validate = {};


// TODO: Validate.cardinality
// TODO: Validate.order
// TODO: Validate.structuralIntegrity


// count data (and calculate its sum afterwards)

Validate.batchTotal = xs => x => {
  xs.push(x);
  return xs;
};


Validate.bic = s =>
  /^([A-Z]{6}[A-Z2-9][A-NP-Z1-9])(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?$/.test(s);


Validate.charset = charset => s => {
  switch (charset) {

    // ASCII

    case "ascii": {
      if (new RegExp(Str.cat(
        "^(?:",
        "[a-z0-9]",
        "|",
        Rex.classes.ascii.punct.rex.source,
        "|",
        Rex.classes.ascii.ctrl.rex.source,
        ")+$"), "i").test(s))
          return {valid: true};

      else return {reasons: ["non-ascii character(s)"], valid: false};
    }

    case "asciiLetter": {
      if (/^[a-z]$/i.test(s)) return {valid: true};
      else return {reasons: ["non-ascii letter(s)"], valid: false};
    }

    case "asciiLcl": {
      if (/^[a-z]$/.test(s)) return {valid: true};
      else return {reasons: ["non-ascii lower-case letter(s)"], valid: false};
    }

    case "asciiUcl": {
      if (/^[A-Z]$/.test(s)) return {valid: true};
      else return {reasons: ["non-ascii upper-case letter(s)"], valid: false};
    }

    // Latin1 (ISO-8859-1)

    case "latin1": {
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
          return {valid: true};

      else return {reasons: ["non-latin1 characters"], valid: false};
    }

    case "latin1Letter": {
      if (new RegExp(`^${Rex.classes.latin1.letter.rex.source}+$`, "iv").test(s)) return {valid: true};
      else return {reasons: ["non-latin1 letter(s)"], valid: false};
    }

    case "latin1Lcl": {
      if (new RegExp(`^${Rex.classes.latin1.lcl.rex.source}+$`, "v").test(s)) return {valid: true};
      else return {reasons: ["non-latin1 lower-case letter(s)"], valid: false};
    }

    case "latin1Ucl": {
      if (new RegExp(`^${Rex.classes.latin1.ucl.rex.source}+$`, "v").test(s)) return {valid: true};
      else return {reasons: ["non-latin1 upper-case letter(s)"], valid: false};
    }

    // UTF-8

    case "utf8": return {valid: true};

    case "utf8Letter": {
      if (/^\p{L}+$/v.test(s)) return {valid: true};
      else return {reasons: ["non-utf8 letter(s)"], valid: false};
    }

    case "utf8Lcl": {
      if (/^\p{Ll}+$/v.test(s)) return {valid: true};
      else return {reasons: ["non-utf8 lower-case letter(s)"], valid: false};
    }

    case "utf8Ucl": {
      if (/^\p{Lu}+$/v.test(s)) return {valid: true};
      else return {reasons: ["non-utf8 upper-case letter(s)"], valid: false};
    }

    default: throw new Err(`unknown charset "${charset}"`);
  }
};


Validate.date = ([from, to]) => d => {
  if (intro(d) !== "Date")
    return {reasons: ["date expected"], valid: false};

  else if (d < from || d > to)
    return {reasons: ["date out of range"], valid: false};

  else return {valid: true};
};


Validate.decimal = ([from, to]) => n => {
  const [int, dec] = String(n).split(/\./);

  if (dec.length < from) return {reasons: ["out of range"], valid: false};
  else if (dec.length > to) return {reasons: ["out of range"], valid: false};
};


Validate.empty = x => {
  const tag = intro(x);

  if (tag === "Array") {
    if (x.length === 0) return {valid: true};
  }

  if (tag === "Number") {
    if (x === 0) return {valid: true};
  }
    
  if (tag === "Object") {
    if (Object.keys(x).length === 0) return {valid: true};
  }
    
  if (tag === "String") {
    if (x === "") return {valid: true};
  }
  
  return {reasons: ["not empty"], valid: false};
};


Validate.iban = s => {
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

  return checksum === 1;
};


Validate.integer = n => {
  if (typeof n !== "number") 
    return {reasons: ["natural expected"], valid: false};

  else if (n % 1 !== 0)
    return {reasons: ["natural expected"], valid: false};

  else return {valid: true};
};


Validate.length = ([from, to]) => x => {
  if (x.length < from) return {reasons: ["out of range"], valid: false};
  else if (x.length > to) return {reasons: ["out of range"], valid: false};
  else return {valid: true};
};


Validate.member = s => x => {
  if (s.has(x)) return {valid: true};
  else return {reasons: [`no member "${x}"`], valid: false};
};


Validate.natural = n => {
  if (typeof n !== "number") 
    return {reasons: ["natural expected"], valid: false};

  else if (n <= 0)
    return {reasons: ["natural expected"], valid: false};

  else if (n % 1 !== 0)
    return {reasons: ["natural expected"], valid: false};

  else return {valid: true};
};


Validate.negative = n => {
  if (typeof n !== "number")
    return {reasons: ["negative number expected"], valid: false};

  else if (n >= 0)
    return {reasons: ["negative number expected"], valid: false};

  else return {valid: true};
};


Validate.number = n => {
  if (typeof n === "number") return {valid: true};
  else return {reasons: ["number expected"], valid: false};
};


Validate.pattern = rx => s => {
  if (rx.test(s) === true) return {valid: true};
  else return {reasons: [`pattern mismatch "${rx.source}"`], valid: false};
};


Validate.range = ([from, to]) => n => {
  if (n < from) return {reasons: ["out of range"], valid: false};
  else if (n > to) return {reasons: ["out of range"], valid: false};
  else return {valid: true};
};


Validate.scheme = scheme => s => {
  switch (scheme) {
    case "decimal": {
      if (/[0-9.,\-+e]/.test(s)) return {valid: true};
      else return {reasons: ["non-decimal-number character(s)"], valid: false};
    }

    case "digits": {
      if (/^\d+$/.test(s)) return {valid: true};
      else return {reasons: ["non-digit character(s)"], valid: false};
    }

    case "phone": {
      if (/(\(?([\d \-\)\+\/\(]+){6,}\)?([ .\-–\/]?)([\d]+))/.test(s))
        return {valid: true};

      else return {reasons: ["non-phone character(s)"], valid: false};
    }

    case "poBox": {
      if (/^[\d ]+$/.test(s)) return {valid: true};
      else return {reasons: ["non-po-box character(s)"], valid: false};
    }

    case "properName": {
      if (/^[\p{L} \-'.]+$/v.test(s)) return {valid: true};
      else return {reasons: ["non-proper-name character(s)"], valid: false};
    }

    case "street": {
      if (/^[\p{L}\d \-./]+$/.test(s)) return {valid: true};
      else return {reasons: ["non-street character(s)"], valid: false};
    }

    case "email": {
      if (/^[\p{L}\d\-.@_']+$/.test(s)) return {valid: true};
      else return {reasons: ["non-digit character(s)"], valid: false};
    }

    default: throw new Err(`unknown charset "${charset}"`);
  }
};


Validate.unique = s => x => {
  if (s.has(x)) return {reasons: [`not unique "${x}"`], valid: false};

  else {
    s.add(x);
    return {valid: true};
  }
};


Validate.value = x => {
  if (x === undefined)
    return {reasons: ["type error"], valid: {valid: false}};

  else if (x === null) return {reasons: ["missing result"], valid: false};
  else if (x !== x) return {reasons: ["not a number"], valid: false};
  else if (isNaN(x)) return {reasons: ["invalid date"], valid: false};
  
  else if (typeof x === "number") {
    if (!Number.isFinite(x))
      return {reasons: ["infinite number"], valid: false};

    else if (!Number.isSafeInteger(x))
      return {reasons: ["integer out of range"], valid: false};

    else return {valid: true};
  }

  else return {valid: true};
};


Validate.with = p => s => {
  const r = p(s);
  if (r === true) return {valid: true};
  else if (typeof r === "string") return {reasons: [r], valid: false};
  else return {reasons: ["unmet predicate"], valid: false};
};


/*
█████ Accumulate ██████████████████████████████████████████████████████████████*/


Validate.accum = (...os) => {
  const reasons = [];

  for (const o of os)
    if (o.valid === false) A.pushn(o.reasons) (reasons);

  if (reasons.length === 0) return {valid: true};
  else return {reasons, valid: false};
};


/*
█████ Logic ███████████████████████████████████████████████████████████████████*/


Validate.and = (f, g) => s => {
  const o = f(s), p = g(s), reasons = [];

  if (o.valid === false) A.pushn(o.reasons) (reasons);
  if (p.valid === false) A.pushn(p.reasons) (reasons);

  if (reasons.length === 0) return {valid: true};
  else return {reasons, valid: false};
};


Validate.all = (...fs) => s => {
  const reasons = [];

  for (const f of fs) {
    const o = f(s);
    if (o.valid === false) A.pushn(o.reasons) (reasons);
  }

  if (reasons.length === 0) return {valid: true};
  else return {reasons, valid: false};
};


Validate.or = (f, g) => s => {
  const o = f(s), p = g(s), reasons = [];

  if (o.valid) return {valid: true};
  else A.pushn(o.reasons) (reasons);

  if (p.valid) return {valid: true};
  else A.pushn(p.reasons) (reasons);

  return {reasons, valid: false};
};


Validate.any = (...fs) => s => {
  const reasons = [];

  for (const f of fs) {
    const o = f(s);

    if (o.valid) return {valid: true};
    else A.pushn(o.reasons) (reasons);
  }

  return {reasons, valid: false};
};


/*█████████████████████████████████████████████████████████████████████████████
████████████████████████████████ RESOLVE DEPS █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


A.fromAit = A.fromAit();


A.fromAitKeys = A.fromAitKeys();


A.fromAitValues = A.fromAitValues();


A.fromList = A.fromList();


A.fromQueue = A.fromQueue();


A.unzip = A.unzip();


Eff.A.trampOf = Eff.A.trampOf();


Eff.Fold.array = Eff.Fold.array();


Eff.Fold.list = Eff.Fold.list();


Eff.Trav.array = Eff.Trav.array();


Eff.Trav.arraySeq = Eff.Trav.arraySeq();


Eff.Trav.list = Eff.Trav.list();


Eff.Trav.listSeq = Eff.Trav.listSeq();


L.fromAit = L.fromAit();


_Map.fromAit = _Map.fromAit();


O.fromAit = O.fromAit();


/*█████████████████████████████████████████████████████████████████████████████
███████████████████████████████████ VECTOR ████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


export const Vector = {};


Vector.cosine = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("same length expected");
  else if (xs.length === 0) return 0;

  let n = 0, n2 = 0, n3 = 0;

  for (let i = 0; i < xs.length; i++) {
    n += xs[i] * ys[i];
    n2 += xs[i] * xs[i];
    n3 += ys[i] * ys[i];
  }
  
  return n / (Math.sqrt(n2) * Math.sqrt(n3));
};


Vector.dotProduct = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("same length expected");

  let n = 0;
  for (let i = 0; i < xs.length; i++) n += xs[i] * ys[i];
  return n;
};


Vector.euclidean = (xs, ys) => {
  if (xs.length !== ys.length) throw new Err("same length expected");
  else if (xs.length === 0) return 0;

  let n = 0;

  for (let i = 0; i < xs.length; i++) {
    const diff = xs[i] - ys[i];
    n += diff * diff;
  }

  return Math.sqrt(n);
};


Vector.manhattan = (xs, ys) => {
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

Node.Child = Cons => {
  const o = {};

  o.handle = reify(p => {
    p.exec = cmd => Cons(k =>
      nodeChild.exec(cmd, (e, stdout, stderr) => {
        if (e) return k(new Err(e));
        else if (stderr) return k(new Err(stderr));
        else return k(stdout);
      }));

    return p;
  });

  o.throw = reify(p => {
    p.exec = cmd => Cons(k =>
      nodeChild.exec(cmd, (e, stdout, stderr) => {
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


Node.Crypto.createKey256 = () => crypto.randomBytes(32).toString("base64");


/* decrypt a cypther text:

  const plaintext = Node.Crypto.decryptSym(key, ciphertext, iv, tag); */

Node.Crypto.decryptSym = (key, ciphertext, iv, tag) => {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm", 
    Buffer.from(key, "base64"),
    Buffer.from(iv, "base64")
  );
  
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let plaintext = decipher.update(ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");
  return plaintext;
}


/* encrypt a plain text:

  const key = Node.Crypto.createKey256();
    {ciphertext, iv, tag} = Node.Crypto.encryptSym(key, plaintext); */

Node.Crypto.encryptSym = (key, plaintext) => {
  const iv = crypto.randomBytes(12).toString("base64"),
    cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");
  
  const tag = cipher.getAuthTag();
  return { ciphertext, iv, tag };
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████ FILE SYSTEM █████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// pass an asynchronous type (`Serial`/`Parallel`) to get a file system instance

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
      Node.fs.copyFile(src, dest, e =>
        e ? k(new Err(e)) : k(null)));

    p.move = src => dest =>
      Cons.chain(p.copy(src) (dest)) (e =>
        e?.constructor?.name === "Exception" ? Cons.of(e) : p.unlink(src));

    p.read = opt => path => Cons(k =>
      Node.fs.readFile(path, opt, (e, x) =>
        e ? k(new Err(e)) : k(x)));

    p.scanDir = opt => path => Cons(k =>
      Node.fs.readdir(path, opt, (e, xs) =>
        e ? k(new Err(e)) : k(xs)));

    p.stat = path => Cons(k =>
      Node.fs.stat(path, (e, p) =>
        e ? k(new Err(e)) : k(p)));

    p.unlink = path => Cons(k =>
      Node.fs.unlink(path, e =>
        e ? k(new Err(e)) : k(null)));

    p.write = opt => path => s => Cons(k =>
      Node.fs.writeFile(path, s, opt, e =>
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
      Node.fs.copyFile(src, dest, e =>
        e ? _throw(e) : k(null)));

    p.move = src => dest =>
      Cons.chain(p.copy(src) (dest)) (_ =>
        p.unlink(src));

    p.read = opt => path => Cons(k =>
      Node.fs.readFile(path, opt, (e, x) =>
        e ? _throw(e) : k(x)));

    p.scanDir = opt => path => Cons(k =>
      Node.fs.readdir(path, opt, (e, xs) =>
        e ? _throw(e) : k(xs)));

    p.stat = path => Cons(k =>
      Node.fs.stat(path, (e, p) =>
        e ? _throw(e) : k(p)));

    p.unlink = path => Cons(k =>
      Node.fs.unlink(path, e =>
        e ? _throw(e) : k(null)));

    p.write = opt => path => s => Cons(k =>
      Node.fs.writeFile(path, s, opt, e =>
        e ? _throw(e) : k(s)));

    return p;
  });

  return o;
};


/*█████████████████████████████████████████████████████████████████████████████
█████████████████████████████████████ SQL █████████████████████████████████████
███████████████████████████████████████████████████████████████████████████████*/


// pass an asynchronous type (`Serial`/`Parallel`) to get a SQL instance

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
