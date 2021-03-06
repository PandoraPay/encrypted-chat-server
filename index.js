if (!global.kernel) require('kernel');
if (!global.cryptography) require('cryptography');
if (!global.networking) require('networking');

const kernel = global.kernel;
const cryptography = global.cryptography;
const networking = global.networking;

const App = require('src/app').default;
const TestsFiles = require("tests/tests/tests-index").default;

const library = {

    ...kernel,
    ...cryptography,
    ...networking,

    app: new App({}),

    utils: {
        ...kernel.utils,
        ...cryptography.utils,
        ...networking.utils,
        App: App,
    },

    tests: {
        ...kernel.tests,
        ...cryptography.tests,
        ...networking.tests,
        TestsFiles,
    }

};



if (typeof window !== "undefined") {
    window.library = library;
    window.PandoraPay = window.app = library.app;
    window.chatserver = library;
}

if (typeof global !== "undefined"){
    global.library = library;
    global.PandoraPay = global.app = library.app;
    global.chatserver = library;
}

export default library;