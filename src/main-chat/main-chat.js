const {BN} = global.kernel.utils;
const {Events} = global.kernel.helpers.events;
const {Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;
const {DBSchema} = global.kernel.marshal.db;

import SettingsData from "./settings-data"
import EncryptedMessageConversations from "../data/encrypted-message-conversations"
import EncryptedMessageConversationMessages from "../data/encrypted-message-conversation-messages"

export default class MainChat extends Events {

    constructor(scope) {

        super();

        this._scope = {
            ...scope,
            chain: this,
        };

        this.dataSubscription = new DBSchema(this._scope);

        this.data = new SettingsData({
            ...this._scope,
            mainChat: this,
        });

        this._init = false;
    }

    async initializeMainChat(){

        if ( this._init ) return true;

        this._scope.logger.log(this, "Initializing Main Settings");

        let cleared = false;

        try{

            await this._loadSettings();

        } catch (err){
            this._scope.logger.error(this, "Error loading Main Settings", err);
        }

        if (this._scope.argv.encryptedChatServer.createNewTestNet)
            if (!this._scope.db.isSynchronized || this._scope.masterCluster.isMasterCluster) {

                if (!cleared) {
                    cleared = true;
                    await this.clear();
                }

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


    async newEncryptedMessage(encryptedMessage, validateEncryptedMessage, propagateSockets, senderSockets){

        let lock;

        if (this._scope.db.isSynchronized )
            lock = await this.data.lock( -1,  );

        let out;
        try{

            out = await this._newEncryptedMessage(encryptedMessage, validateEncryptedMessage, propagateSockets, senderSockets);

        }catch(err){
            this._scope.logger.error(this, "newEncryptedMessage raised an error", err);
        }

        if (lock) lock();

        return out;

    }

    async _newEncryptedMessage(encryptedMessage, validateEncryptedMessage, propagateSockets = true, senderSockets){

        const hash = encryptedMessage.hash();
        const hashId = hash.toString("hex");

        if (validateEncryptedMessage){
            //TODO
        }

        encryptedMessage.id = encryptedMessage.hash().toString("hex");
        if (await encryptedMessage.exists() )
            return false; //already exists

        await encryptedMessage.save();

        this.data.index = this.data.index + 1;
        await this.data.save();

        const encryptedMessageConversation = new EncryptedMessageConversations(this._scope, undefined, {
            table: "encryptMsgConv"+encryptedMessage.senderPublicKey.toString("hex"),
            id: encryptedMessage.destinationPublicKey.toString("hex"),
            destinationPublicKey: encryptedMessage.destinationPublicKey
        } );

        await encryptedMessageConversation.save();

        const encryptedMessageConversation2 = new EncryptedMessageConversations(this._scope, undefined, {
            table: "encryptMsgConv"+encryptedMessage.destinationPublicKey.toString("hex"),
            id: encryptedMessage.senderPublicKey.toString("hex"),
            destinationPublicKey: encryptedMessage.senderPublicKey
        } );

        await encryptedMessageConversation2.save();

        const publicKeys = [
            encryptedMessage.senderPublicKey.toString("hex"),
            encryptedMessage.destinationPublicKey.toString("hex"),
        ];

        publicKeys.sort( (a,b) => a.localeCompare(b) );

        const encryptedMessageConversationMessage = new EncryptedMessageConversationMessages(this._scope, undefined, {
            table: "encryptMsgConvMsg"+publicKeys[0]+":"+publicKeys[1],
            id: encryptedMessage.hash().toString("hex"),
            index: 0
        } );

        await encryptedMessageConversationMessage.save();

        if (propagateSockets){

        }

        return true;
    }

}