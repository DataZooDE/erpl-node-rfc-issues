# Migrating from SAP node-rfc

One page: what runs unchanged, what is deliberately absent, and where behaviour
differs.

## Supported

| node-rfc surface | Status |
|---|---|
| `Client`: `open`, `close`, `ping`, `call`, `invoke`, `connect`, `cancel` | works |
| Call options `timeout` and `notRequested` | works; `notRequested` as below |
| `client.alive`, `id`, `connectionHandle`, `config`, `connectionInfo` | works |
| `client.RStrip` / client options | works |
| Promise and callback forms of every method | works |
| `Pool`: `acquire`, `release`, `ready`, `closeAll`, `status`, `config` | works |
| `Throughput`: `setOnConnection`, `removeFromConnection`, `status`, `reset` | works |
| `Server`: `start`, `stop`, `addFunction`, `removeFunction`, `getFunctionDescription` | works |
| `setIniFileDirectory`, `reloadIniFile`, `languageIsoToSap`, `languageSapToIso` | works |
| `sapnwrfc.ini` destinations (`{ dest: "..." }`) | works — parsed by this package |
| The `RfcError` / `ABAPError` / `RfcLibError` shapes, with `code`, `key`, `group` | works |

Type mapping is unchanged: `string`, `number`, `Buffer`, `Decimal`, `Date`,
objects for structures and arrays for tables.

**`notRequested` behaves as in SAP's node-rfc**, measured with
`examples/run_both.sh` (spec PRO-8a):
- An export it names is not requested, so ABAP sees `IS REQUESTED` false, and
  it comes back as its initial value.
- **A table or structure it names is not sent either, even when you pass it.**
  A table comes back as the rows you passed.
- A scalar import or `CHANGING` parameter you pass is unaffected.
- Names match exactly. An array item that is not a string is skipped.
- Anything but an array, `null` and an explicit `undefined` included, rejects
  with `Error: Invalid argument`.

## The one gap

**`RfcServerOptions.bgRfcHandlers` raises.** Inbound bgRFC has never been
captured for this library, and the outbound direction is still refused by the
server against a payload byte-identical to the reference's
(`docs/spec/20-bgrfc.md`, BGR-5, open). Accepting the five handlers and never
calling them would be the dishonest option, so passing them is an error that
names the reason. Everything else on `Server` works, the auth handler included.

node-rfc's client has no bgRFC surface at all, so this affects only a server
receiving units.

## Where behaviour differs

**`bluebird` is still the exported `Promise`.** node-rfc depends on it and its
own suite asserts the version, so it is kept — even though the reference's
client has the import commented out and uses the platform's.

**Errors carry their fields on the Error object.** `name`, `message`, `code`,
`codeString`, `group` and `key`, as the reference's do.

**The ABAP message text is not yet substituted.** A `MESSAGE`-raised failure
arrives with its T100 template rather than the rendered sentence — `"&STRING&:
&STRING&"` where the reference gives `"Division by 0 (type I or INT8)"` — and
the dump name is not yet reported as `key` for that case. A *declared*
exception's key is correct, which is what the differential checks. This is the
one place the reference is presently better, and it is recorded rather than
hidden.

## Requirements that are gone

No SAP NW RFC SDK. No ICU. No `SAPNWRFC_HOME`, no `LD_LIBRARY_PATH`, no
node-gyp, no Python toolchain, no Visual C++ redistributable. `npm install` and
`require` — that is all.
