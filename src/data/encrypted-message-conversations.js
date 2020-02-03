const {EncryptedMessage} = global.cryptography.encryption;
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

export default class EncryptedMessageConversations extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "encryptMsgConv",
                        fixedBytes: 14+33,
                    },

                    id:{
                        fixedBytes: 66,
                    },

                    destinationPublicKey:{
                        type: "buffer",
                        fixedBytes: 33,

                        position: 100,
                    }

                },

                saving:{
                    indexableById: true,
                },

            },
            schema, false), data, type, creationOptions);

    }



}