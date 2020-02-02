import ArgvTest from "./argv/argv-test"
const {describeList} = global.kernel.tests;

import TestRedis from "./tests-files/db/redis/test-redis"
import TestPouchDB from "./tests-files/db/pouchdb/test-pouchdb"
import TestCouchDB from "./tests-files/db/couchdb/test-couchdb"

import TestsEncryptedMessagesHelper from "./tests-files/tests-encrypted-messages-helper"

export default {

    argvTests: ArgvTest,
    tests: async scope => {

        scope.logger.info(`Tests`, `Running Encrypted Chat Server tests`);

        scope.blockchain.testsBlockHelper = new TestsEncryptedMessagesHelper( scope );

        await TestRedis();
        await TestCouchDB();
        await TestPouchDB();


    }

}
