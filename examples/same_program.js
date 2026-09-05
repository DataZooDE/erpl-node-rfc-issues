// One program, run twice: once against SAP's node-rfc and the NW RFC SDK, once
// against erpl-node-rfc. Whatever it prints must be identical.
//
// The package name is the only difference between the two runs, which is why
// it comes from the environment rather than being written twice -- a second
// copy of this file would drift, and a drifted copy makes the diff meaningless.
const rfc = require(process.env.RFC_PACKAGE);

function env(name, fallback) {
    return process.env[name] || fallback;
}

const abapSystem = {
    user: process.env.SAP_USER,
    passwd: process.env.SAP_PASSWD,
    ashost: env("SAP_ASHOST", "localhost"),
    sysnr: env("SAP_SYSNR", "00"),
    client: env("SAP_CLIENT", "001"),
    lang: env("SAP_LANG", "EN"),
};

// One value per line, named. Printing an object directly would put key
// iteration order into the diff as a difference that is not one.
function show(label, value) {
    console.log(`${(label + ":").padEnd(30)} ${JSON.stringify(value)}`);
}

function showObject(label, object, keys) {
    for (const key of keys || Object.keys(object).sort()) {
        show(`${label}.${key}`, object[key]);
    }
}

async function main() {
    const client = new rfc.Client(abapSystem);
    await client.open();
    show("alive", client.alive);

    const info = client.connectionInfo;
    for (const key of ["client", "user", "language", "isoLanguage", "sysNumber", "rfcRole", "type", "partnerType"]) {
        show(`info.${key}`, info[key]);
    }

    const echo = await client.call("STFC_CONNECTION", { REQUTEXT: "side by side" });
    show("echotext", echo.ECHOTEXT);

    const structure = await client.call("STFC_STRUCTURE", {
        IMPORTSTRUCT: {
            RFCCHAR1: "A",
            RFCCHAR2: "BC",
            RFCCHAR4: "DEFG",
            RFCINT1: 7,
            RFCINT2: 1234,
            RFCINT4: 56789,
        },
        RFCTABLE: [
            { RFCCHAR4: "ROW1", RFCINT4: 1 },
            { RFCCHAR4: "ROW2", RFCINT4: 2 },
        ],
    });
    show("reply keys", Object.keys(structure));
    showObject("echostruct", structure.ECHOSTRUCT, [
        "RFCCHAR1", "RFCCHAR2", "RFCCHAR4", "RFCINT1", "RFCINT2", "RFCINT4",
    ]);
    show("rfctable rows", structure.RFCTABLE.length);
    structure.RFCTABLE.forEach((row, i) => {
        show(`rfctable[${i}].RFCCHAR4`, row.RFCCHAR4);
        show(`rfctable[${i}].RFCINT4`, row.RFCINT4);
    });

    // An error is part of the surface: its type, name and key.
    try {
        await client.call("Z_NO_SUCH_FUNCTION_MODULE_AT_ALL", {});
        show("unknown function", "no error");
    } catch (ex) {
        show("unknown function name", ex.name);
        show("unknown function key", ex.key);
    }

    // The ABAP error taxonomy, field by field. RFC_RAISE_ERROR is the
    // reference's own vehicle for it, and every field here is one its specs
    // assert on -- so a difference is a difference in *our* decoding, and an
    // agreement means an expectation that still fails is the test system's
    // content, not a bug. The X case deallocates the conversation (spec
    // PRO-12), so each attempt gets a connection of its own.
    // A short dump that is not MESSAGE-raised. Its T100 is the ABAP runtime's
    // generic dump wrapper, 00/341, whose variable is the dump's own name --
    // the same identity the reference's `RFC_RAISE_ERROR` X case reports on
    // SAP's system, where that call dumps and here it does not. Which of the
    // two the T100 belongs to is the whole question, so both are asked.
    for (const fm of ["STFC_SAPGUI"]) {
        const c = new rfc.Client(abapSystem);
        await c.open();
        try {
            await c.call(fm, {});
            show(`dump.${fm}`, "no error");
        } catch (ex) {
            for (const f of [
                "name", "key", "code", "codeString", "group", "message",
                "abapMsgClass", "abapMsgType", "abapMsgNumber", "abapMsgV1",
            ]) {
                show(`dump.${fm}.${f}`, ex[f]);
            }
        }
        try { await c.close(); } catch { /* gone with the dump */ }
    }

    const raiseCases = [];
    for (const t of ["X", "A", "E", "I", "W"]) {
        for (const m of ["0", "1", "2", "3", "4", "5"]) {
            raiseCases.push({ METHOD: m, MESSAGETYPE: t });
        }
    }
    for (const args of raiseCases) {
        const tag = `raise.${args.METHOD}${args.MESSAGETYPE}`;
        const c = new rfc.Client(abapSystem);
        await c.open();
        try {
            await c.call("RFC_RAISE_ERROR", args);
            show(tag, "no error");
        } catch (ex) {
            for (const f of [
                "name", "key", "code", "codeString", "group", "message",
                "abapMsgClass", "abapMsgType", "abapMsgNumber",
                "abapMsgV1", "abapMsgV2", "abapMsgV3", "abapMsgV4",
            ]) {
                show(`${tag}.${f}`, ex[f]);
            }
        }
        try { await c.close(); } catch { /* the X case is already gone */ }
    }

    show("alive after error", client.alive);
    await client.close();
    show("alive after close", client.alive);

    // The language table, which is pure computation and must agree exactly.
    for (const iso of ["EN", "DE", "DA", "SV", "ZH", "ZF", "6N"]) {
        show(`lang.${iso}`, rfc.languageIsoToSap(iso));
    }
}

main().then(
    () => process.exit(0),
    (ex) => {
        console.log("FAILED:", ex.message);
        process.exit(1);
    }
);
