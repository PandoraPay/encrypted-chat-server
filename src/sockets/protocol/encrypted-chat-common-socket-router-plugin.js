import ChatConversations from "../../data/chat-conversations";
import ChatConversationMessages from "../../data/chat-conversation-messages"

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
                descr: "Returns how many conversations a public key has"
            },

            "encrypted-chat/conversations/content-ids": {
                handle:  this._getEncryptedConversationsContentIds,
                maxCallsPerSecond:  30,
                descr: "Returns all conversations ids "
            },

            "encrypted-chat/conversations/content": {
                handle:  this._getEncryptedConversationsContent,
                maxCallsPerSecond:  30,
                descr: "Returns all conversations"
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

        const out = await ChatConversationMessages.count( this._scope.db, undefined, "converMsgs:"+publicKeys[0]+"_"+publicKeys[1]);

        return out;

    }

    async _getEncryptedConversationMessagesContentIds({ publicKey1, publicKey2, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxConversationMessagesIds }){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2].sort( (a,b) => a.localeCompare(b) );

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxConversationMessagesIds) );

        const obj = new ChatConversationMessages(this._scope);

        const elements = await this._scope.db._scanMiddleware( obj, '', "converMsgs:"+publicKeys[0]+"_"+publicKeys[1],  index, limit, undefined );
        const out  = elements.filter ( obj => obj );

        return out;
    }

    async _getEncryptedConversationMessagesContent({ publicKey1, publicKey2, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxConversationMessages, type = "buffer"  }){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2].sort( (a,b) => a.localeCompare(b) );

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxConversationMessages ) );

        const out = await this._scope.db.scan( ChatConversationMessages, '', "converMsgs:"+publicKeys[0]+"_"+publicKeys[1],  index, limit, undefined );

        return out;
    }

    /***
     * Conversations
     */

    async _getEncryptedConversationsContentCount({publicKey}){

        if (Buffer.isBuffer(publicKey)) publicKey = publicKey.toString("hex");

        const out = await ChatConversationMessages.count( this._scope.db, undefined, "convers:"+publicKey );

        return out;

    }

    async _getEncryptedConversationsContentIds({ publicKey, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxConversationsIds }){

        if (Buffer.isBuffer(publicKey)) publicKey = publicKey.toString("hex");

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxConversationsIds) );

        const obj = new ChatConversations(this._scope);

        const elements = await this._scope.db._scanMiddleware( obj, '', "convers:"+publicKey,  index, limit, undefined );
        const out  = elements.filter ( obj => obj );

        return out;
    }

    async _getEncryptedConversationsContent({ publicKey, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxConversations }){

        if (Buffer.isBuffer(publicKey)) publicKey = publicKey.toString("hex");

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxConversations) );

        const out = await this._scope.db.scan( ChatConversations, index, limit, '', "convers:"+publicKey, undefined );

        return out;
    }


    async _newEncryptedMessage({ encryptedMessage, captcha}, res, socket){

        const encryptedMessageObject = this._scope.cryptography.encryptedMessageValidator.validateEncryptedMessage(encryptedMessage);
        const hash = encryptedMessageObject.hash().toString("hex");

        this._scope.logger.warn(this, "new encrypted message received", { hash });

        if (this._encryptedChatDownloading[hash]) return this._encryptedChatDownloading[hash];

        let resolver, rejecter, out, err, promise;
        promise = this._encryptedChatDownloading[hash] = new Promise( (resolve, reject) => { resolver = resolve; rejecter = reject });

        try{
            out = await this._scope.mainChat.newEncryptedMessage( captcha, encryptedMessageObject, true, true, socket);
        }catch(error){

            err = error;
            rejecter(err)

        }finally{

            if (!err) resolver(!!out);

        }

        delete this._encryptedChatDownloading[hash];

        return promise;
    }

    async _newEncryptedMessageId({encryptedMessageId, captcha}, res, socket){

        if ( Buffer.isBuffer(encryptedMessageId) ) encryptedMessageId = encryptedMessageId.toString("hex");

        if (this._encryptedChatDownloading[encryptedMessageId]) return this._encryptedChatDownloading[encryptedMessageId];

        let resolver, rejecter, out, err, promise;
        promise = this._encryptedChatDownloading[encryptedMessageId] = new Promise( (resolve, reject) => { resolver = resolve; rejecter = reject });

        try{

            const encryptedMessage = await socket.emitAsync("encrypted-chat/get-message", { encryptedMessageId }, 0);
            const encryptedMessageObject = this._scope.cryptography.encryptedMessageValidator.validateEncryptedMessage(encryptedMessage);

            out = await this._scope.mainChat.newEncryptedMessage( captcha, encryptedMessageObject, true, true, socket);

        }catch(error){
            err = error;
            rejecter(err)
        }finally{

            if (!err) resolver(!!out);

        }

        delete this._encryptedChatDownloading[encryptedMessageId];

        return promise;

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

        socket.subscribe(`encrypted-chat/${publicKey}`, notify );

        return true;

    }


}