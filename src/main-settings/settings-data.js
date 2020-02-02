const {Helper, Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;
const {DBSchema} = global.kernel.marshal.db;

export default class SettingsData extends DBSchema {

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "settingsData",
                        fixedBytes: 12,
                    },

                    version: {
                        type: "number",
                        default: 0,

                        position: 100,
                    },

                    /**
                     * Number of messages
                     */
                    index: {
                        type: "number",
                        default: 0,

                        position: 101,
                    },

                    timestamp: {
                        type: "number",
                        default: 0,

                        position: 102,
                    },

                    target: {

                        type: "buffer",

                        // minsize: 0,
                        // maxsize: 2^256,

                        position: 103,
                    },


                }

            },
            schema, false), data, type, creationOptions);

    }

    async loadData(){

        if ( await this.exists() )
            await this.load();

        return true;
    }

    async clearData(){

        if ( await this.exists() )
            await this.delete();

    }


}