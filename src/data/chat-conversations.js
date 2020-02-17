const {EncryptedMessage} = global.cryptography.encryption;
const {DBSchema} = global.kernel.marshal.db;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

export default class ChatConversations extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "convers",
                        fixedBytes: 7+1+66+1+66,
                    },

                    id:{
                        fixedBytes: 66,
                    },

                    version:{
                        type: "number",

                        validation(version){
                            return version === 0;
                        },

                        position: 100,
                    },

                    receiverPublicKey:{
                        type: "buffer",
                        fixedBytes: 33,

                        position: 101,
                    },

                    update:{
                        type: "number",

                        sorts :{

                            updatesort:{

                                score(){
                                    return this.update;
                                },

                            }
                        },

                        position: 102,
                    },

                    count:{
                        type: "number",

                        position: 103,
                    },

                    encryptedMessage:{
                        type: "buffer",
                        fixedBytes: 32,

                        position: 104,
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