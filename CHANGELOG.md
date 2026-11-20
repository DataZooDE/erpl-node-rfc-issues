# Changelog

All notable changes to `erpl-node-rfc`. Calendar versioning, `YYYY.M.D` — npm
takes it without complaint, unlike Go modules.

## 2026.11.20

Release gate run on 2026-11-20 against the a4h ABAP Platform Trial (release 816,
kernel 9.16):
- **`examples/run_both.sh`:** no differences across 351 lines against SAP's
  node-rfc 3.3.1.
- **jest:** 93 of 117 adapted specs pass live, unchanged from 2026.11.19, with
  the same attribution for the rest: 15 need ABAP a4h does not have
  (`ES_OUTPUT` fixtures, `EAM_TASKLIST_GET_DETAIL`); 2 assert the reference's
  own system's content (E3, X); 2 are the metadata round-trip gap in the
  throughput spec; 1 (`Getters`) is timing; 4 skip.
- **`cargo test --release`:** green. A bare `node:20-bookworm` container
  installs the main and `linux-x64-gnu` tarballs and loads the addon.

### Fixed

- **A short NUMC value reached ABAP as a different number.** NUMC was padded
  with blanks like CHAR, so `"0"` for a NUMC 5 went out as `"0    "`. It is now
  right-aligned and zero-padded (`"00000"`), as SAP's library does; a value
  wider than the field or text that is not digits is refused. (Shared with
  erpl-pyrfc 2026.11.20.)
- **Two systems in one process could share each other's metadata.** The
  caveat recorded for 2026.11.19 is gone: function descriptions are cached once
  per system (host and instance, or port, or wsRFC host), not once per process,
  so one system's layout is no longer used for another's function.
- **An ABAP callback (`DESTINATION 'BACK'`) was read as the reply.** The call
  then "succeeded" with no outputs and left the connection out of step with the
  server. This binding has no callback API, so the call now fails as SAP's
  library fails it: `RfcLibError`, `RFC_NOT_FOUND` (17), "Function <name> not
  found". As with SAP's library, that ends the conversation, and the call with
  it, rather than leaving it waiting for an answer.

## 2026.11.19

Release gate run on 2026-11-19 against the a4h ABAP Platform Trial (release 816,
kernel 9.16):
- **`examples/run_both.sh`:** no differences across 351 lines against SAP's
  node-rfc 3.3.1.
- **jest:** 93 of 117 adapted specs pass live, and every remaining failure is
  attributed: 15 need ABAP a4h does not have (`ES_OUTPUT` fixtures,
  `EAM_TASKLIST_GET_DETAIL`); 2 assert the reference's own system's content (E3,
  X); 2 are the known metadata round-trip gap in the throughput spec (87 calls
  for `BAPI_USER_GET_DETAIL`); 1 (`Getters`) asserts that `open()` has not
  finished, which is timing; 4 skip.
- **`cargo test --release`:** green.

### Fixed

- **Any instance number other than 00 was routed to instance 00.** The
  connection handshake announced `localhost`/`sapdp00` whatever `ashost` and
  `sysnr` were given, and the gateway routes to what the client announces: a
  system on instance 50 answered `partner ... not reached`. The handshake now
  matches SAP's library byte for byte. A gateway refusal is reported as
  `RFC_COMMUNICATION_FAILURE` with the gateway's text, and a `sysnr` that is
  not two digits is refused as `RFC_INVALID_PARAMETER`, as SAP's library refuses
  it. (Shared with erpl-pyrfc 2026.11.19, erpl-pyrfc-issues#3.)
- **An exception reported a message nobody raised.** Every call asked the ABAP
  dictionary about each parameter's type, scalars included. For a `STRING` that
  lookup fails, which cost a round trip on every call and left a `DO`/`410`
  message in the ABAP session for the next exception to carry. Every
  `RFC_RAISE_ERROR` method that raises without a `MESSAGE` then reported a T100
  SAP's node-rfc never shows. Only structured parameters are described now, and
  connections share one metadata cache per process, as SAP's node-rfc does. That
  cache is keyed by function name, so one process talking to two systems whose
  interfaces differ shares one system's descriptions.
- **A message of a type ABAP does not have** (`RFC_RAISE_ERROR MESSAGETYPE=0`)
  is a short dump with no T100 identity, as in SAP's library.
- **A basXML table had the wrong row width** when its row type ends short of its
  alignment: 734 bytes instead of the 736 the classic encoding gives.

## 2026.9.8

Metadata only. The description now names the siblings -- `erpl-pyrfc` on PyPI
and `github.com/DataZooDE/erpl-gorfc` -- because SAP archived all three of its
bindings and someone who found one of ours is likely to want another. The
README gains a table of the three against what each replaces, and a pointer to
erpl.io.

It also cuts both ways as discovery: a search for `pyrfc` or `gorfc` now has
something to match here, and vice versa once their own metadata says the same.

## 2026.9.7

Discoverability only, no code change. Someone looking for a way off SAP's
archived node-rfc searches for **node-rfc**, so that is now the first keyword
and the description leads with what the package *is* rather than what it
replaces: `SDK-free SAP RFC client for Node.js and TypeScript`. Added the terms
people actually type -- `sdk-free`, `nwrfc`, `saprfc`, `netweaver`, `bapi`,
`s4hana` -- and gave the README a comparison table, since the npm page is where
a searcher lands.

Worth being honest about the limit: npm ranks heavily on downloads, and no
metadata outweighs that for a package published the same day. Keywords decide
whether we are *findable*; time and use decide whether we are *near the top*.

## 2026.9.6

The first working release. **2026.9.5 is broken and deprecated**: its publish
job never ran a build, so the tarball was `LICENSE`, `README.md` and
`package.json` -- no `lib/`, no `native/` -- and `main` resolved to nothing.
Everything the package ships is build output and none of it is in git.

The `bare-container` job could not have caught it: it runs its own
`npm run build` before packing, so it tested a *different tarball* than the
publish job sent. The publish job now builds, and then asserts on the output of
`npm pack` -- the bytes `npm publish` would send -- rather than on the tree
they came from.

Also dropped `--provenance`: npm refuses it from a private source repository,
and this repository is private on purpose, which is the whole reason npm works
here where Go modules could not.

## 2026.9.5

Broken, deprecated, superseded by 2026.9.6. The first release. Built red/green against SAP's own jest suite and a live a4h
system.

### The ABAP error taxonomy, settled by measurement

Four bugs, all found by putting every error field of 30 `RFC_RAISE_ERROR`
variants through `examples/run_both.sh` rather than by reading the specs:

- **The message type cannot classify an error.** A `MESSAGE X` and a short dump
  are both type `X`; the reference calls the first `RFC_ABAP_MESSAGE` and the
  second `RFC_ABAP_RUNTIME_FAILURE`. What separates them is whether the server
  sent an `AbapExceptionKey`, which `Error::AbapException` now carries as
  `dump`, and whether a real T100 came with it.
- **Two T100 identities mean "no message"** -- `DO`/`410` with the variable
  `&STRING&`, and `00`/`341`, the runtime's generic dump wrapper. Both are type
  `X`, so passing them through made an error with no message look like a dump:
  a connection that was still good got thrown away on every plain `RAISE`.
  Filtered in `decode_call_result`, so every binding gets the fix.
- **A declared exception's message is the identity rendered**, not the text:
  `"ID:SR Type:E Number:006 Method = 1"`, or `" Number:000"` when there is no
  message at all.
- **A protocol error's `code` never reached JavaScript.** `classify` returned
  no numeric code, so every `RfcLibError` carried a 0 -- which the unpacking
  read as "no code" and dropped, leaving napi's own `GenericFailure` string
  where the reference has `2`.

### Settled before the release

- **`DataZooDE/erpl-node-rfc-issues`** is the public face: issues and docs only,
  like `erpl-pyrfc-issues`, because npm carries the distribution and the Rust
  stays private. `repository` and `bugs` point at it, on the main package and on
  all seven platform packages.
- **`bindings/node` is gone.** The older napi-rs crate -- unpublished, no CI, no
  workspace membership -- is superseded entirely. Worth recording that the
  reason Phase 0 gave for removing it was wrong: its npm name `erpl-proto` does
  not collide with anything here, since every package is `erpl-node-rfc*`. It
  went because nothing consumed it, not because of the collision.

### The packaging was not what the plan specified

Found by running `npm publish --dry-run`, which publishes nothing and should
have been run much earlier. The seven targets were declared in `napi.targets`,
but there were **no per-platform packages and no `optionalDependencies`**: the
tarball simply carried whatever `.node` happened to be in `native/` -- the
local Linux build -- so it was 780 kB, platform-specific, and would have failed
on macOS and Windows.

- `npm/<triple>/` generated for all seven, and `optionalDependencies` wired to
  them, so npm selects the right binary per platform.
- The main package no longer ships a binary at all: **780 kB to 25.8 kB**, and
  platform-independent. The loader already preferred a local `.node` and fell
  back to the platform package, so this is the shape it was written for.
- The bare-container smoke test now installs the main tarball **and** this
  platform's, as a real consumer does. Installing the main one alone would have
  proved only that the loader can fail to find a binary.
- A `publish` job, gated on a `node-rfc-v*` tag and on every other job passing,
  publishing the platform packages before the package that depends on them. It
  refuses to publish if any declared target's binary is missing, so a lost
  artifact fails there rather than for whoever installs it.

### `ping()` reports `false` as well as the error

On a closed connection the reference calls back with the error **and** `false`,
and its spec asserts both. A promise cannot reject and resolve at once, so the
value belongs in the callback wrapper rather than in the addon; `ON_FAILURE`
names it for the one method that has one.

### Two that this system cannot decide

Both are environment-dependent rather than defects, and neither is a gap in the
binding:

- **`client/direct.callback` "Getters"** asserts `client.alive === false` three
  tests after `beforeAll` fired `open()` *without waiting for it* -- so it holds
  only while the open is still in flight. Measured here: a fresh client reports
  `alive` false, still false immediately after `open()` is issued, and true
  after 14 ms, which is less than jest's own overhead between tests. The getter
  is right at every point; the reference's system is simply further away.
- **`errors/abap` "AbapRuntimeError X"** asserts the `00`/`341` dump identity
  its system produces where a4h raises `SR`/`006`. The reference's own library,
  run against a4h, reports what we report.

### Known gap: two metadata round trips per first call, and the lead on it

The reference resolves `STFC_CONNECTION`'s structure without a separate call --
its first `call()` in a fresh process counts 2, ours 4 -- while both count one
per call thereafter. No earlier call warms its cache, so the difference is real:
we fetch the interface with `RFC_GET_FUNCTION_INTERFACE` and then each
referenced structure with its own `DDIF_FIELDINFO_GET`.

`RFC_METADATA_GET` **exists on a4h**, and one call returning the interface and
the type definitions together is exactly a count of 2. That is the likely
explanation and the place to start; it would cut two or more round trips off
every first call, which is a performance argument rather than a test fix.
Worth confirming against the reference with the `LD_PRELOAD` capture shim
before building anything, since the metadata module a client uses is
observable. Not attempted here: it changes how metadata is fetched and cached,
which is its own piece of work.

### `cancel()`, and the per-call timeout

Neither existed on the addon: `cancel` was in the callback-wrapping list but
had no method behind it, so the reference's `Client.cancel()` threw
`this.__client.cancel is not a function` and both cancel specs failed on it.

A cancel is a bare 80-byte APPC record written to the conversation's own socket
while another thread is blocked reading it (spec CAN-1), so it needs no second
connection -- only the handle. That handle deliberately does **not** live in
the client's `State`: a call holds that lock for its whole duration, so a
`cancel()` that had to take it would block until the call it is meant to
interrupt had already finished. It goes in a slot beside it, filled for the
length of the call and cleared on every exit, so a cancel arriving after the
reply has nothing to cancel rather than writing a stray record into the next
conversation.

The conversation is over either way (CAN-2), so the connection is reopened from
the thread holding the lock -- the only one that can put a live connection back
-- and the caller finds the client alive on a different handle, which is what
the reference asserts. `Error::Canceled`'s text is now the reference's own,
`"Connection was canceled."`.

The suite's `sapnwrfc.ini` is now generated from the environment into a
temporary directory rather than committed. A destination is only useful with
credentials in it, and a committed file would either carry a password or be
unusable for the specs that connect by `dest` -- which is exactly why
`cancel/timeout.call`, which does, could not open a connection at all.

### A metadata lookup is a call, and is counted

The reference's throughput spec asserts 2 calls after the first
`STFC_CONNECTION`, 3 after the second and **87** for one
`BAPI_USER_GET_DETAIL` -- so it charges the caller for the interface and
structure lookups a call needs. `do_invoke` had been detaching the counter
around them, to bill only what the application asked for; that was an
assumption, and it disagreed with the reference and with `throughput.rs`'s own
documented intent. Now counted.

The counts still differ -- 4 where the reference reports 2 -- because we ask
for each referenced structure separately where the SDK resolves
`STFC_CONNECTION`'s from the interface reply. That is two round trips we do not
need on a first call, and it is an efficiency gap rather than a counting bug:
the shape agrees, and every later call adds exactly one on both sides.

### `client.release()`

The client binding had no `release`, so the reference's `Client.release()` --
which calls `release([this], cb)`, the client passing itself in a list -- threw
`this.__client.release is not a function`. Clients now reach the pool that lent
them through a registry keyed by `_pool_id`, and a second release is refused by
name: a released client keeps its connection, so nothing about the connection
says it is spent, and releasing twice would have decremented `leased` for a
client that was already back.

### Errors are plain objects, as the reference's are

Every error node-rfc's addon produces is a `Napi::Object`, never an `Error`
(`src/cpp/nwrfcsdk.cc`), so a node-rfc caller has never had `instanceof Error`
or a stack on an RFC failure. Its pool spec pins the difference -- it asserts
`rejects.toEqual({...})` against an object literal, and jest's `toEqual` never
matches an Error against one. The unpacking now returns the object rather than
decorating an Error, and applies every field it is given instead of filtering
by value: filtering could not tell a `code` the addon omitted from one that is
legitimately 0.

### Green

Run per file against a live a4h system:

| Adapted spec | Result |
|---|---|
| `addon.methods` | **3/3** |
| `client/direct.promise` | **4/4** |
| `client/direct.callback` | 8/10 |
| `concurrency/{await,promise,callback}` | **6/6** |
| `locking/callback` | **5/5** |
| `pool/options` | **3/3** |
| `pool/ready` | **2/2** |
| `pool/acquire-release` | 5/6 |
| `pool/errors` | **3/3** |
| `pool/acquire-release` | **6/6** |
| `throughput/client` | 7/9 |
| `errors/connect` | **4/4** |
| `errors/invoke` | 8/8 |
| `errors/promise` | 2/4 |
| `errors/abap` | 9/11 |
| `datatypes/all` | 17/26 |
| `datatypes/utclong` | 0/3 |
| `call_options/{promise,callback}` | 0/4 |
| `server/server` (ours) | 2/4, 2 skipped |

**94 of 117** adapted tests pass against a live a4h system, and
`examples/run_both.sh` reports **no differences across 351 lines** -- including
every error field of `RFC_RAISE_ERROR` over METHOD 0-5 x MESSAGETYPE X/A/E/I/W
and of `STFC_SAPGUI`.

**15 of the 28 that do not pass cannot pass here**: they call
`/COE/RBP_FE_DATATYPES`, `ZDATATYPES`, `ZLONG_STRING`, `ZFLTP` or
`EAM_TASKLIST_GET_DETAIL` -- ABAP that ships with SAP's own test system and is
absent from a4h, confirmed by asking `RFC_GET_FUNCTION_INTERFACE` for each.
Two more assert content that is that system's rather than a rule: its
`AbapRuntimeError X` expects the `00`/`341` dump identity, where the same call
on a4h raises `SR`/`006` -- and the reference's own library, run against a4h,
reports what we report.

The concurrency and locking specs are green, which is the point of them: they
are what a binding that blocks the event loop cannot pass, and they were the
reason for moving the work onto libuv.

Plus 9 Rust unit tests, and the TypeScript compiles under the reference's own
compiler settings.

### Two defects the suite found that nothing else would have

**`instanceof Error` is false under a test runner.** jest evaluates a suite in
its own vm context, so an `Error` the addon created belongs to a different
realm and `instanceof` fails there. The error-unpacking in
`noderfc-bindings.ts` was guarded by it, so every error field -- `name`,
`code`, `codeString`, `group`, `key` -- was applied correctly under `node` and
silently skipped under jest. It is duck-typed now. This is the worst shape of
bug available: right everywhere except where it is tested.

**Patching a native prototype twice double-wraps it.** The addon is cached by
Node, so its prototype is one object for the process, but jest gives each test
file a fresh module registry -- so `noderfc-bindings.ts` runs again and wrapped
its own wrapper. The second wrapper removed the callback from the arguments and
handed the rest to the first, which no longer found one and threw
synchronously. The patch carries a symbol marker now and is idempotent.

### The work now runs off the event loop

The addon's methods return promises backed by `napi::Task`: `compute` runs on
libuv's pool with no napi values in sight, `resolve` turns the result back into
JavaScript on the event-loop thread. A call's inputs are read into a plain Rust
`Payload` before the task is created, because a JavaScript object cannot leave
the thread that made it.

The reference's client calls `binding.open(cb)`, so `noderfc-bindings.ts` --
the one file rewritten rather than adapted -- wraps each promise back into a
callback. Two details cost time and are worth keeping:

- **The callback is not always the last argument.** The client calls
  `invoke(name, params, callback, callOptions)`, so the adapter finds the
  function rather than popping the end.
- **napi's `Error` carries one string, and it becomes the message**, so there
  is nowhere to put a JS `name`. The addon packs `name\u0001message` into it
  and the adapter splits them, because the reference's specs match on name and
  message together.

### Known: the callback spec is order-dependent

`test/client/direct.callback.spec.ts` is 7/10 alone and 0/10 when it runs after
the other files. Its `beforeAll` is

```js
beforeAll((done) => {
    client = direct_client();
    void client.open((err) => { return done(err); });   // unconditional
    done();
});
```

`done` is called twice by construction: once from the callback whether or not
there was an error, once after. That is a race in the reference's own hook, and
it only became visible once the callback became genuinely asynchronous -- which
is the correct behaviour. It is not a binding defect, but it does mean the file
cannot be trusted in a combined run until the hook is adapted, and adapting a
test to fit the implementation needs care: the point of reusing this suite is
that it is not ours to bend.

### Pool and Throughput

`Pool` keeps the two counts the reference exposes -- `ready`, connections
opened and waiting, and `leased`, the ones handed out -- rather than wrapping
`erpl_proto::Pool`, whose `max_size`/`min_idle` shape does not answer those
questions the same way. Clients it hands out carry a non-zero `_pool_id`,
which is how the reference's `Client` constructor tells a pooled binding from
a bag of connection parameters.

`Throughput` maps onto `erpl_proto::throughput::Throughput` and reports the
reference's seven counters in its names and units -- milliseconds, though the
measurements underneath are finer, because a caller comparing the two
libraries could not line up nanoseconds. The reference addresses connections
by handle rather than by object, so the addon keeps a weakly-held registry of
live client states to resolve one.

The pool's methods are synchronous behind a callback shim that defers the
callback; the client's work already runs on libuv. Moving the pool's onto it
too is the remaining half of that job.

### What is built

- The napi-rs addon: `Client` with `open`, `close`, `ping`, `invoke`,
  `connectionInfo`, and the `_id`/`_alive`/`_connectionHandle`/`_pool_id`/
  `_config` properties the TypeScript layer reads.
- The module surface: `languageIsoToSap`/`languageSapToIso` over the
  reference's own 76-entry table, `setIniFileDirectory`, `reloadIniFile`.
- `sapnwrfc.ini` parsing, ported from the Go binding — needed because most of
  the reference's specs connect by destination.
- The error shapes: a JS `name` (`nodeRfcError`, `ABAPError`, `RfcLibError`)
  alongside the message, which the reference's specs match on together.
- Structures and tables in both directions, driven by the interface rather than
  by the shape of the value — `describe` and `describe_structure` resolve the
  layouts, `invoke_with_table_inputs` carries the rows, and replies decode with
  `decode_ref` and never `decode_auto` (spec TBL-1).
- All seven of the reference's TypeScript files, adapted.
- **bluebird is a dependency after all.** It was dropped on the reasoning that
  the reference's own client has the import commented out — true, but its
  exported `Promise` *is* bluebird's and `direct.callback.spec.ts` asserts the
  version against the dependency. The test is the specification; the reasoning
  was about internal use and the contract is the exported surface.

### Server

`Server` registers a program ID, dispatches inbound calls to JavaScript
handlers and answers ABAP with what they return. It is the one place a napi
`ThreadsafeFunction` is unavoidable: the call arrives on a serving thread with
no access to the JavaScript heap, and the handler's answer has to come back to
that thread before the reply can be sent, so the serving thread blocks on a
channel while JavaScript runs. Inbound values are decoded by their declared
type through a client connection kept alongside the server, because a request
arrives one byte per character (spec SRV-7) and cannot be read as text without
knowing what each parameter is.

`bgRfcHandlers` raises, naming spec BGR-5. That is the single surface of
node-rfc this package does not implement.

**The two registering tests are skipped by default**, behind
`SAP_NODE_SERVER_TESTS=1`. Registering hung once, and a registration left
behind at the gateway poisons the *next* run with a failure naming a function
that run never mentions (CLAUDE.md, spec SRV-9). They are `test.skip`, not an
early return, so they read as skipped rather than as green -- a test that
returns before its first assertion passes having checked nothing, which is the
same trap as counting a skipped live test as a pass. Why start hangs is the
next thing to find.

### The differential: no differences

`examples/run_both.sh` runs one program under SAP's node-rfc 3.3.1 on the real
NW RFC SDK and under this package, and diffs the output. **No differences
across 35 lines** -- connection attributes, the echo and structure round trips,
a table with its rows, an ABAP error's name and key, the alive states, and the
language table.

It found one defect on its first run: an unknown function module came back with
`key: undefined` where the reference gives `FU_NOT_FOUND`, because the error
classification carried the key only as a prefix on the message and dropped the
field. That is what this harness is for.

The reference is hard-required through `SAPNWRFC_HOME`, so the script can never
quietly compare this package against itself and always report agreement.

### Packaging

`npm pack` produces a 758 KB tarball that installs and runs in a stock
`node:20-bookworm` container with no SDK, no ICU and no toolchain -- verified,
not asserted. `.github/workflows/bindings-node-rfc.yml` builds the addon for
seven targets, runs the suite on three operating systems, and repeats that
bare-container install as a job, because it is the whole pitch and a claim
about a machine we do not control.

### Values are encoded against the declared type, not guessed from the value

This is the encoding half of "decode by metadata, never by the value", and it
was missing: a string is a perfectly good CHAR and a perfectly bad INT1, and
only the interface can say which. Each value is now checked against the type
its parameter or field declares, and refused with the reference's own message
-- "Integer number expected from NodeJS for ABAP field of type 10", where 10 is
SAP's numeric code for INT1 and part of the asserted text.

The error carries the reference's `rfmPath` too: the function module, the
parameter, the structure and the field, so a rejected value says *where* it
sat. `datatypes/all` went from 3/26 to 9/26 on that alone.

### Wrong type, out of range, and unconvertible are three different things

The reference distinguishes them and its specs check the distinction, so this
does too:

- **Wrong type** -- a string where an integer belongs, or `Infinity`, which is
  not an integer at all: `nodeRfcError`, "Integer number expected from NodeJS
  for ABAP field of type 10, got Infinity", no code.
- **Out of range** -- a finite 256 into an INT1: "Overflow or other error when
  putting NodeJS value 256 into ABAP integer field of type 10".
- **Unconvertible** -- "A" for a FLOAT: `RfcLibError` with
  `RFC_CONVERSION_FAILURE` and code 22, naming the character position.

The first two are one word apart and easy to swap by accident; the suite tells
them apart, which is why it is worth running unmodified.

### Integer width, and the shape of a type error

An ABAP INT1 holds 0..255 and an INT2 -32768..32767. A value outside that is
refused here rather than narrowed on the way to the server, where it would
arrive as something the caller never wrote: "Overflow or other error when
putting NodeJS value 256 into ABAP integer field of type 10". Infinity and NaN
are reported the same way, with the value named.

A non-numeric string for a FLOAT or a decimal is refused with the position it
gave up at, as the reference does: "Cannot convert string value A at position 0
for the field RFCFLOAT to type RFCTYPE_FLOAT".

The `rfmPath` carries only the parts that apply -- `table` for a table
parameter, `structure` for a structure, never both -- plus `table_line`, which
is `-1` when the parameter itself was not an array. The specs compare the whole
object, so an empty field left in fails a comparison that should pass.

### A name the interface does not declare

A parameter, a structure field and a table-row field are all reported the same
way, with the reference's own text: `field 'XXX' not found`, key
`RFC_INVALID_PARAMETER`, code 20. It says "field" even for a parameter, which
is worth not tidying up -- a caller matching on the message is matching on
that. `errors/invoke` went to 8/8.

Closing an already-closed client is refused rather than quietly accepted. Two
closes in a row usually mean a caller has lost track of a connection's
lifetime, which is worth being told about, and the reference tells them.

### A Throughput counts the caller's calls, not the library's

`Throughput.getFromConnection` is a **static** on the class, not an instance
method, and answers with a handle the reference looks up in its own registry.

Describing a function module costs real round trips, and they belong to the
binding rather than to the application, so the counter is detached while the
metadata is fetched and restored afterwards. Without that, two calls measured
as four.

### What the remaining red actually is

Of the 46 still failing, a large share cannot pass on this system at all:

- `call_options` (4) needs `EAM_TASKLIST_GET_DETAIL`, a Plant Maintenance
  module.
- `datatypes/utclong` (3) and **6 of the 24 in `datatypes/all`** need
  `ZDATATYPES`, `ZLONG_STRING` or `ZFLTP` -- ABAP that ships with SAP's own
  test system.

That is 13 tests gated on ABAP rather than on this binding. Deploying a
`ZDATATYPES` matching SAP's interface would unlock them; this repository's
`Z_ERPL_DATATYPES` covers the same ground under different parameter names, so
it is a translation job rather than new ABAP.

The rest is real work: the remaining `datatypes/all` cases that do use
`STFC_STRUCTURE`, four `errors/*`, one pool case, three throughput, and two in
`client/direct.callback` that turn on the reference's suite assuming `open()`
is slower than two trivial tests -- true against a remote system, false against
localhost.

### Two fixtures the reference's suite needs and a4h does not have

`call_options` (0/4) needs `EAM_TASKLIST_GET_DETAIL`, a Plant Maintenance
module a4h does not have. `datatypes/utclong` (0/3) and six of the
`datatypes/all` cases call `ZDATATYPES`, `ZLONG_STRING` and `ZFLTP` -- ABAP that ships with SAP's own test system. They
fail with `FU_NOT_FOUND` rather than for any reason to do with this binding.
The rest of `datatypes/all` uses `STFC_STRUCTURE`, which a4h does have, so most
of that file is real coverage and worth pursuing. This repository has
`Z_ERPL_DATATYPES` covering the same ground under different parameter names
(`bindings/pyrfc/abap/`), so the choice is to deploy a `ZDATATYPES` matching
SAP's interface, or to cover those cases separately and mark these as
unrunnable here. Neither is done yet.

### The ABAP error taxonomy, and a fix in erpl-proto

`errors/abap` went from 0/11 to 7/11, and the fix was in the protocol library
rather than the binding.

Everything the reference reports was already on the wire and already parsed --
`AbapRuntimeId` carries `COMPUTE_INT_ZERODIVIDE`, `AbapErrorMessage` carries
"Division by 0 (type I or INT8)". `decode_call_result` was picking whichever of
three tags appeared **first in field order**, and a reply carries the T100
identity *before* the rendered text, so every message-raised failure came back
as its own template: `"&STRING&: &STRING&"`. It now prefers by tag, not by
position, and falls back to `AbapRuntimeId` for the key when no exception named
itself. 513 Rust tests still pass.

On top of that the binding maps the reference's taxonomy: a short dump is
`RFC_ABAP_RUNTIME_FAILURE` (3) keyed by the dump name, a `MESSAGE` with nothing
declared is `RFC_ABAP_MESSAGE` (4) keyed by the rendered text, and a declared
exception is `RFC_ABAP_EXCEPTION` (5) keeping its own name. The `abapMsgClass`,
`abapMsgType`, `abapMsgNumber` and `abapMsgV1`..`V4` fields travel with it.

**Reconnect is decided by the failure, not by the socket.** A MESSAGE-raised
error deallocates the conversation and nothing on the wire says so -- only the
next call finds out (spec PRO-12) -- so `conversation_lost()` is false at that
moment and cannot be the test. The error's own ABAP message type is.

The differential caught the one regression this introduced within a minute:
using the rendered text as the key whenever the type was `E` turned
`FU_NOT_FOUND` into the function's name. A declared exception keeps its key.

### What is next, in order

1. The ten reds in `test/client/direct.callback.spec.ts` (above), then
   `test/errors/**`.
3. `test/datatypes/**` — decimals as `Decimal`, dates, UTCLONG.
4. `test/call_options/**`, then `test/cancel/**`.
5. **`test/concurrency/**` and `test/locking/**`, which are the reason the
   binding must stop blocking the event loop.** Every native method runs its
   work inline today and hands the result to the callback through one function,
   `client::complete`, so moving it to a worker thread behind a threadsafe
   function is a change in one place rather than a rewrite. This is a known
   step, not an oversight.
6. `test/pool/**`, `test/throughput/**`, then Server (specs ours — the
   reference has none), with `bgRfcHandlers` raising per spec BGR-5.
7. The differential against node-rfc 3.3.1 on the real SDK, CI, and the
   per-platform npm packages.
