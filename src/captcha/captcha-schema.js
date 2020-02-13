const {DBSchema} = global.kernel.marshal.db;

export default class CaptchaSchema extends DBSchema{

    constructor(scope, schema = {}, data, type, creationOptions) {

        super(scope, Helper.merge({

                fields: {

                    table: {
                        default: "captcha",
                        fixedBytes: 7,
                    },

                    id:{
                        fixedBytes: 64,
                    },

                    date:{
                        type: "number",

                        position: 100,
                    },

                }

            },
            schema, false), data, type, creationOptions);

    }


}