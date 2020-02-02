const {BN} = global.kernel.utils;
const {Events} = global.kernel.helpers.events;
const {Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;
const {DBSchema} = global.kernel.marshal.db;

import SettingsData from "./settings-data"

export default class MainSettings extends Events {

    constructor(scope) {

        super();

        this._scope = {
            ...scope,
            chain: this,
        };

        this.dataSubscription = new DBSchema(this._scope);

        this.data = new SettingsData({
            ...this._scope,
            mainSettings: this,
        });

        this._init = false;
    }

    async initializeMainSettings(){

        if ( this._init ) return true;

        this._scope.logger.log(this, "Initializing Main Settings");

        let cleared = false;

        try{

            await this._loadSettings();

        } catch (err){
            this._scope.logger.error(this, "Error loading Main Settings", err);
        }

        if (this._scope.argv.createNewTestNetEncryptedServer )
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {

                if (!cleared) {
                    cleared = true;
                    await this.clear();
                }

            }


        if ( this._scope.db.isSynchronized ) {

            await this.dataSubscription.subscribe();
            this.dataSubscription.subscription.on( async message => {

                if (message.name === "update-main-settings"){

                    this._scope.logger.warn(this, "update-main-settings", message.data.end-1 );

                    //this.data.prevKernelHash = Buffer.from( message.data.prevKernelHash );

                    this.emit("blocks/included", {
                        data: { end: this.data.end},
                        senderSockets: {},
                    });
                }

            });

        }

        //this._scope.logger.log(this, "Initialized successfully");

        this._init = true;
        return true;

    }

    async _loadSettings(){

        await this.data.loadData();

    }

    /**
     * Clear entire Blockchain
     */
    async clear(){

        await this.data.clearData();

        await this.data.save();

        this._scope.logger.warn(this, "Main Chain data cleared");

    }

}