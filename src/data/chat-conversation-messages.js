const {EncryptedMessage} = global.cryptography.encryption;
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

export default class ChatConversationMessages extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "converMsgs",
                        fixedBytes: 10+1+33,
                    },

                    id:{
                        fixedBytes: 64,
                    },

                    version:{
                        type: "number",

                        validation(version){
                            return version === 0;
                        },

                        position: 100,
                    },

                    count:{
                        type: "number",

                        position: 101,
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