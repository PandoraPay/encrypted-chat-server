const {Helper} = global.kernel.helpers;

import ArgvEncryptedChatServer from "./modules/argv-encrypted-chat-server"
import ArgvCaptcha from "./modules/argv-captcha"

/**
 *
 * Encrypted Chat Server
 *
 */

export default (argv) => Helper.merge( argv, {

    encryptedChatServer: ArgvEncryptedChatServer,

    captcha: ArgvCaptcha,

});


