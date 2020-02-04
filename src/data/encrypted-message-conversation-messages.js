const {EncryptedMessage} = global.cryptography.encryption;
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

export default class EncryptedMessageConversationMessages extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "encryptMsgConvMsg",
                        fixedBytes: 17+1+66+1+66,
                    },

                    id:{
                        fixedBytes: 64,
                    },

                    index:{
                        type: "number",

                        position: 100,
                    }

                },

                saving:{
                    indexableById: true,
                    indexable: true,
                },

            },
            schema, false), data, type, creationOptions);

    }



}