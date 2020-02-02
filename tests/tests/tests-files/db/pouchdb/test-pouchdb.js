const {describe} = global.kernel.tests;
const {DBConstructor} = global.kernel.marshal.db;
const cluster = require('cluster');

/**
 *
 * UNIT TESTING FOR POUCH DB
 *
 */

export default async function run() {

    describe("PouchDB Chain Test", {

        'PouchDB Chain Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db: {
                            ...this._scope.argv.dbPublic,
                            selectedDB: "pouch",
                            pouchDB:{
                                ...this._scope.argv.dbPublic.pouchDB,
                                path: this._scope.argv.dbPublic.pouchDB.path+"_test" + (cluster.worker ? process.env.SLAVE_INDEX : 'master'), //necessary to include
                            }
                        }
                    }
                }, true )
            );

            await this.db.connectDB();

            await this.db.client.destroy();

        },

    });


}
