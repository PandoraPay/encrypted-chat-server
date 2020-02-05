import EncryptedMessageConversationMessages from "../../data/encrypted-message-conversation-messages";

const {EncryptedMessage} = global.cryptography.encryption;
const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

export default class EncryptedChatCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._encryptedChatDownloading = {};

        this._scope.events.on("master-cluster/started", ()=> this.initializePluginMasterCluster() );

    }

    async initializePluginMasterCluster(){

    }

    getOneWayRoutes(){

        return {

            "encrypted-chat/get-info":{
                handle:  this._getEncryptedChatInfo,
                maxCallsPerSecond:  100,
                descr: "Returns basic information",
            },

            "encrypted-chat/conversation-messages/content-count": {
                handle:  this._getEncryptedConversationMessagesContentCount,
                maxCallsPerSecond:  10,
                descr: "Returns how many offers are in the exchange"
            },

            "encrypted-chat/conversation-messages/content-ids": {
                handle:  this._getEncryptedConversationMessagesContentIds,
                maxCallsPerSecond:  30,
                descr: "Returns all encrypted messages ids "
            },

            "encrypted-chat/conversation-messages/content": {
                handle:  this._getEncryptedConversationMessagesContent,
                maxCallsPerSecond:  10,
                descr: "Returns encrypted messages."
            },

            "encrypted-chat/conversations/content-count": {
                handle:  this._getEncryptedConversationsContentCount,
                maxCallsPerSecond:  10,
                descr: "Returns how conversations a public key has"
            },

            "encrypted-chat/get-message": {
                handle:  this._getEncryptedMessage,
                maxCallsPerSecond:  50,
                descr: "Returns an encrypted message. "
            },

            "encrypted-chat/new-message":{
                handle:  this._newEncryptedMessage,
                maxCallsPerSecond:  20,
                descr: "A new encrypted message"
            },

            "encrypted-chat/new-message-id":{
                handle:  this._newEncryptedMessageId,
                maxCallsPerSecond:  20,
                descr: "A new encrypted message id"
            },

        }

    }

    getTwoWaysRoutes(){

        return {

            "encrypted-chat/subscribe/new-message":{
                handle:  this._subscribeNewMessage,
                maxCallsPerSecond:  50,
                descr: "Allows to get a notification when a new message is being processed with a specific publicKey"
            },

        }

    }

    _getEncryptedChatInfo(){

        return {
            index: this._scope.mainChat.data.index,
            timestamp: this._scope.mainChat.data.timestamp,
            target: this._scope.mainChat.data.target,
        }

    }

    /***
     * Conversations Messages
     */

    async _getEncryptedConversationMessagesContentCount({publicKey1, publicKey2}){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2].sort( (a,b) => a.localeCompare(b) );

        const out = await EncryptedMessageConversationMessages.count( this._scope.db, undefined, "encryptMsgConvMsg:"+publicKeys[0]+"_"+publicKeys[1]);

        return out;

    }

    async _getEncryptedConversationMessagesContentIds({ publicKey1, publicKey2, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxMessagesIds }){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2].sort( (a,b) => a.localeCompare(b) );

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxMessagesIds) );

        const startIndex = Math.max(0, index-limit);

        const obj = new EncryptedMessageConversationMessages(this._scope);

        const elements = await this._scope.db._scanMiddleware( obj, '', "encryptMsgConvMsg:"+publicKeys[0]+"_"+publicKeys[1],  startIndex, limit, undefined );
        const out  = elements.filter ( obj => obj );


        return {
            out ,
            next: startIndex > 0 ? startIndex : -1,
        };
    }

    async _getEncryptedConversationMessagesContent({ publicKey1, publicKey2, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxMessages, type = "buffer"  }){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2].sort( (a,b) => a.localeCompare(b) );

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxMessages ) );

        const startIndex = Math.max(0, index-limit);

        const out = await this._scope.db.scan( EncryptedMessageConversationMessages, '', "encryptMsgConvMsg:"+publicKeys[0]+"_"+publicKeys[1],  startIndex, limit, undefined );

        return {
            out ,
            next: startIndex > 0 ? startIndex : -1,
        };
    }

    /***
     * Conversations
     */

    async _getEncryptedConversationsContentCount({publicKey}){

        if (Buffer.isBuffer(publicKey)) publicKey = publicKey.toString("hex");

        const out = await EncryptedMessageConversations.count( this._scope.db, undefined, "encryptMsgConv:"+publicKey );

        return out;

    }

    async _newEncryptedMessage({encryptedMessage}, res, socket){

        const encryptedMessageObject = this._scope.cryptography.encryptedMessageValidator.validateEncryptedMessage(encryptedMessage);
        const hash = encryptedMessageObject.hash().toString("hex");

        this._scope.logger.warn(this, "new encrypted message received", { hash });

        let resolver;
        this._encryptedChatDownloading[hash] = new Promise( resolve => resolver = resolve);

        let out;

        try{
            out = await this._scope.mainChat.newEncryptedMessage( encryptedMessageObject, true, true, socket);
        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "newExchange raised an error", err);
        }

        resolver(!!out);
        delete this._encryptedChatDownloading[hash];

        return !!out;
    }

    async _newEncryptedMessageId({encryptedMessageId}, res, socket){

        if ( Buffer.isBuffer(encryptedMessageId) ) encryptedMessageId = encryptedMessageId.toString("hex");

        let resolver;
        this._encryptedChatDownloading[encryptedMessageId] = new Promise( resolve => resolver = resolve);

        let out;

        try{

            const encryptedMessage = await socket.emitAsync("encrypted-chat/get-message", { encryptedMessageId }, 0);
            const encryptedMessageObject = this._scope.cryptography.encryptedMessageValidator.validateEncryptedMessage(encryptedMessage);

            out = await this._scope.mainChat.newEncryptedMessage( encryptedMessageObject, true, true, socket);

        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "newExchange raised an error", err);
        }

        resolver(!!out);
        delete this._encryptedChatDownloading[encryptedMessageId];

        return !!out;

    }

    async _getEncryptedMessage({encryptedMessageId, type = "buffer" }, res, socket){

        if (Buffer.isBuffer(encryptedMessageId)) encryptedMessageId = encryptedMessageId.toString("hex");

        const encryptedMessage = new EncryptedMessage(this._scope, );;
        encryptedMessage.id = encryptedMessageId;

        await encryptedMessage.load();

        return encryptedMessage.toType(type);

    }



    async _subscribeNewMessage( { publicKey }, cb, notify, socket ){

        if ( Buffer.isBuffer(publicKey) ) publicKey = publicKey.toString("hex");

        console.log("publicKey", publicKey);

        socket.subscribe(`encrypted-chat/${publicKey}`, notify );

        console.log("Hello");

        return true;

    }


}