const  {Helper} = global.kernel.helpers;
const {describe} = global.kernel.tests;
const {DBConstructor} = global.kernel.marshal.db;
const cluster = require('cluster');

/**
 *
 * UNIT TESTING FOR REDIS
 *
 */

export default async function run () {


    describe("Redis Chain Test", {

        'Redis Chain Connect': async function () {

            this.db = await DBConstructor.createDB(
                Helper.merge( this._scope, {
                    argv: {
                        db:{
                            ...this._scope.argv.dbPublic,
                            selectedDB: "redis",
                            redisDB:{
                                ...this._scope.argv.dbPublic.redisDB,
                                db: this._scope.argv.dbPublic.redisDB.db,
                            }
                        }
                    }
                }, true )
            );

            await this.db.connectDB();


            if (!cluster.worker)
                await this.db.client.destroy();

        },

    });


}
