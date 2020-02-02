const {Helper} = global.kernel.helpers;

import ArgvEncryptedChatServer from "./modules/argv-encrypted-chat-server"

/**
 *
 * Encrypted Chat Server
 *
 */

export default (argv) => Helper.merge( argv, {

    encryptedChatServer: ArgvEncryptedChatServer,

});


