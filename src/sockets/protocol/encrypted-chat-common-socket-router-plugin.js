import EncryptedMessageConversationMessages from "../../data/encrypted-message-conversation-messages";

const {EncryptedMessage} = global.cryptography.encryption;
const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

export default class EncryptedChatCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._encryptedChatDownloading = {};

        this._scope.events.on("start/main-chat-created", ()=>{

            // this._scope.mainChat.on( "exchange/offer-included", ( {data, senderSockets } ) => {
            //
            //     /**
            //      * Sending notification that a new offer was included
            //      */
            //
            //     this._scope.masterCluster.broadcast("exchange/new-offer", { offer: data.offer.toBuffer() }, senderSockets);
            //
            // });

        });

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

            "encrypted-chat/content-count": {
                handle:  this._getEncryptedChatContentCount,
                maxCallsPerSecond:  10,
                descr: "Returns how many offers are in the exchange"
            },

            "encrypted-chat/content-ids": {
                handle:  this._getEncryptedChatContentIds,
                maxCallsPerSecond:  10,
                descr: "Returns all encrypted messages ids "
            },

            "encrypted-chat/content": {
                handle:  this._getEncryptedChatContent,
                maxCallsPerSecond:  10,
                descr: "Returns encrypted messages."
            },

            "encrypted-chat/get-message": {
                handle:  this._getEncryptedChatMessage,
                maxCallsPerSecond:  50,
                descr: "Returns an encrypted message. "
            },

            "encrypted-chat/new-message":{
                handle:  this._newEncryptedChatMessage,
                maxCallsPerSecond:  20,
                descr: "A new encrypted message"
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

    async _getEncryptedChatContentCount({publicKey1, publicKey2}){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2];
        publicKeys.sort( (a,b) => a.localeCompare(b) );

        const out = await EncryptedMessageConversationMessages.count( this._scope.db, undefined, "encryptMsgConvMsg"+publicKeys[0]+"_"+publicKeys[1]);

        return out ? Number.parseInt(out) : undefined;

    }

    async _getEncryptedChatContentIds({ publicKey1, publicKey2, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxMessagesIds }){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2];
        publicKeys.sort( (a,b) => a.localeCompare(b) );

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxMessagesIds) );

        const startIndex = Math.max(0, index-limit);

        const obj = new EncryptedMessageConversationMessages(this._scope);

        const elements = await this._scope.db._scanMiddleware( obj, '', "encryptMsgConvMsg"+publicKeys[0]+"_"+publicKeys[1],  startIndex, limit, undefined );
        const out  = elements.filter ( obj => obj );


        return {
            out ,
            next: startIndex > 0 ? startIndex : -1,
        };
    }

    async _getEncryptedChatContent({ publicKey1, publicKey2, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxMessages, type = "buffer"  }){

        if (Buffer.isBuffer(publicKey1)) publicKey1 = publicKey1.toString("hex");
        if (Buffer.isBuffer(publicKey2)) publicKey2 = publicKey2.toString("hex");

        const publicKeys = [publicKey1, publicKey2];
        publicKeys.sort( (a,b) => a.localeCompare(b) );

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxMessages ) );

        const startIndex = Math.max(0, index-limit);

        const out = await this._scope.db.scan( EncryptedMessageConversationMessages, '', "encryptMsgConvMsg"+publicKeys[0]+"_"+publicKeys[1],  startIndex, limit, undefined );

        return {
            out ,
            next: startIndex > 0 ? startIndex : -1,
        };
    }

    async _newEncryptedChatMessage({encryptedMessage}, res, socket){

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

    async _getEncryptedChatMessage({encryptedMessageHash, type = "buffer" }, res, socket){

        const encryptedMessage = new EncryptedMessage(this._scope, );
        encryptedMessage.id = encryptedMessageHash;

        await encryptedMessage.load();

        return encryptedMessage.toType(type);

    }

}