const {BN} = global.kernel.utils;
const {Events} = global.kernel.helpers.events;
const {Exception} = global.kernel.helpers;
const {MarshalData} = global.kernel.marshal;
const {DBSchema} = global.kernel.marshal.db;

import SettingsData from "./settings-data"
import ChatConversationMessages from "../data/chat-conversation-messages"
import ChatConversations from "../data/chat-conversations"

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

        this.data = new SettingsData({
            ...this._scope,
            mainChat: this,
        });

        this.data.__changes["index"] = true;

        await this.data.save();

        this._scope.logger.warn(this, "Main Chain data cleared");

    }


    async newEncryptedMessage(captcha, encryptedMessage, validateEncryptedMessage, propagateSockets, senderSockets){

        let out, lock, err;
        try {


            if (this._scope.db.isSynchronized)
                lock = await this.data.lock(-1,);

            out = await this._newEncryptedMessage(captcha, encryptedMessage, validateEncryptedMessage, propagateSockets, senderSockets);

        }
        catch(error){

            this._scope.logger.error(this, "newEncryptedMessage raised an error", error);

            err = error;
        }
        finally{

            if (lock) lock();

        }


        if (err) throw err;

        return out;

    }

    async _newEncryptedMessage(captcha, encryptedMessage, validateEncryptedMessage, propagateSockets = true, senderSockets){

        const hash = encryptedMessage.hash();
        const hashId = hash.toString("hex");

        if (validateEncryptedMessage){
            //TODO
        }

        const publicKeys = [
            encryptedMessage.senderPublicKey.toString("hex"),
            encryptedMessage.receiverPublicKey.toString("hex"),
        ].sort( (a,b) => a.localeCompare(b) );
        const count = await ChatConversationMessages.count( this._scope.db, undefined, "converMsgs:"+publicKeys[0]+"_"+publicKeys[1]);

        if ( count === 0 || count % 5 === 0 || encryptedMessage )
            await this._scope.captcha.solveCaptcha( captcha || {} );

        encryptedMessage.id = encryptedMessage.hash().toString("hex");
        if (await encryptedMessage.exists() )
            return false; //already exists

        await encryptedMessage.save();

        this.data.index = this.data.index + 1;
        await this.data.save();

        const conversation1 = new ChatConversations(this._scope, undefined, {
            table: "convers:"+encryptedMessage.senderPublicKey.toString("hex"),
            id: encryptedMessage.receiverPublicKey.toString("hex"),
            receiverPublicKey: encryptedMessage.receiverPublicKey,
        } );

        await conversation1.exists();//loading ids

        conversation1.count = count+1;
        conversation1.encryptedMessage = encryptedMessage.hash();

        await conversation1.save();

        const conversation2 = new ChatConversations(this._scope, undefined, {
            table: "convers:"+encryptedMessage.receiverPublicKey.toString("hex"),
            id: encryptedMessage.senderPublicKey.toString("hex"),
            receiverPublicKey: encryptedMessage.senderPublicKey,
            count,
            encryptedMessage: encryptedMessage.hash(),
        } );

        await conversation2.exists(); //loading ids

        conversation2.count = count+1;
        conversation2.encryptedMessage = encryptedMessage.hash();

        await conversation2.save();


        const conversationMessage = new ChatConversationMessages(this._scope, undefined, {
            table: "converMsgs:"+publicKeys[0]+"_"+publicKeys[1],
            id: encryptedMessage.hash().toString("hex"),
            count,
        } );

        await conversationMessage.save();

        if (propagateSockets)
            this._scope.masterCluster.broadcast("encrypted-chat/new-message-id", {captcha, encryptedMessageId: hash}, senderSockets);

        await this.emit("main-chat/new-encrypted-message", {
            data: { encryptedMessage, encryptedMessageId: hashId},
        });

        await this._scope.events.emit(`subscriptions/encrypted-chat/${publicKeys[0]}`, encryptedMessage.toBuffer() );
        await this._scope.events.emit(`subscriptions/encrypted-chat/${publicKeys[1]}`, encryptedMessage.toBuffer() );

        return true;
    }

}