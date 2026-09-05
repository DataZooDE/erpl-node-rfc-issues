# erpl-node-rfc — SAP RFC for Node.js and TypeScript, with no SAP NW RFC SDK

[![npm](https://img.shields.io/npm/v/erpl-node-rfc)](https://www.npmjs.com/package/erpl-node-rfc)
[![node](https://img.shields.io/node/v/erpl-node-rfc)](https://www.npmjs.com/package/erpl-node-rfc)
[![platforms](https://img.shields.io/badge/prebuilt-linux%20%C2%B7%20macOS%20%C2%B7%20windows%20%C2%B7%20musl-informational)](https://www.npmjs.com/package/erpl-node-rfc?activeTab=code)
[![License](https://img.shields.io/badge/license-BUSL--1.1-blue)](https://spdx.org/licenses/BUSL-1.1.html)

**This repository is the public issue tracker for [`erpl-node-rfc`](https://www.npmjs.com/package/erpl-node-rfc).** The source is
not public; the bug tracker is. [Open an issue →](../../issues/new/choose)

```bash
npm install erpl-node-rfc
```

```js
const { Client } = require("erpl-node-rfc");

const client = new Client({ ashost: "…", sysnr: "00", client: "001", user: "…", passwd: "…" });
await client.open();
const res = await client.call("STFC_CONNECTION", { REQUTEXT: "hello" });
console.log(res.ECHOTEXT);
await client.close();
```

---

## Why this exists

SAP archived [node-rfc](https://github.com/SAP-archive/node-rfc). The repository is read-only, and the package was never
installable on its own: you first had to register with SAP, download the licence-gated **SAP NW RFC SDK**, keep it on the
loader path at run time, and have node-gyp and a Python toolchain available to build the C++ addon.

`erpl-node-rfc` removes all of that. It implements the RFC protocol in **pure Rust** and ships prebuilt binaries, so the
install is one command and nothing else.

| | node-rfc | erpl-node-rfc |
|---|---|---|
| SAP NW RFC SDK | required (licence-gated download) | **not needed** |
| ICU, `LD_LIBRARY_PATH` | required | **not needed** |
| node-gyp / Python toolchain | required | **not needed** |
| `npm install` alone works | no | **yes** |
| Platforms | build it yourself | 7 prebuilt: linux x64/arm64 (glibc + musl), macOS x64/arm64, windows x64 |

The API is node-rfc's: the same `Client`, `Pool`, `Throughput` and `Server`, the same promise/callback duality, the same
error shapes. See [MIGRATION.md](MIGRATION.md).

## How compatibility is established

Not by argument. `examples/run_both.sh` runs the same program twice — once under SAP's node-rfc 3.3.1 on the real SDK, once
under this package — and diffs the output field by field. It currently reports **no differences across 351 lines**, including
every error field of `RFC_RAISE_ERROR` over METHOD 0-5 × MESSAGETYPE X/A/E/I/W.

That harness is also what found the bugs: the ABAP message *type* cannot classify an error (a `MESSAGE X` and a short dump
are both type `X`), and two T100 identities — `DO`/`410` and `00`/`341` — mean "no message at all" and must not be reported.

The protocol specification is derived solely from our own packet captures of `libsapnwrfc` — never by reading another
implementation's source. Other implementations are used only as running black boxes to compare behaviour against.

## The same thing for other languages

SAP archived its PyRFC, gorfc and node-rfc bindings alike. ERPL replaces all three over one pure-Rust protocol
implementation, so wire behaviour, the ABAP error taxonomy and type handling agree wherever you call from:

| | Package | Replaces |
|---|---|---|
| **Node.js / TypeScript** | [`erpl-node-rfc`](https://www.npmjs.com/package/erpl-node-rfc) | SAP's node-rfc |
| **Python** | [`erpl-pyrfc`](https://pypi.org/project/erpl-pyrfc/) | SAP's PyRFC |
| **Go** | [`github.com/DataZooDE/erpl-gorfc`](https://pkg.go.dev/github.com/DataZooDE/erpl-gorfc) | SAP's gorfc |

More at [erpl.io](https://erpl.io).

## Reporting a problem

The most useful bug report says **what SAP's node-rfc did with the same input**. A behavioural difference is far more
actionable than a description of a symptom — and it is how every bug found so far was found.

Please redact credentials, hostnames and business data.

## Licence

BUSL-1.1. See [LICENSE](LICENSE), and [NOTICE](NOTICE) for the Apache-2.0 code adapted from SAP's node-rfc (its TypeScript
layer and jest suite).
