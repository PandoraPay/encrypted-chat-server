const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

export default class EncryptedChatCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._offersDownloading = {};

        this._scope.events.on("start/main-settings-created", ()=>{

            // this._scope.mainSettings.on( "exchange/offer-included", ( {data, senderSockets } ) => {
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
                descr: "Returns an chat message. "
            },

            "encrypted-chat/new-message":{
                handle:  this._newEncryptedChatMessage,
                maxCallsPerSecond:  20,
                descr: "A new encrypted message"
            },

        }

    }

    async _getEncryptedChatContentCount({publicKey}){

        const array = this._scope.exchange.getExchangeData(offerType).array;
        return array.length;

    }

    _getEncryptedChatContentIds({ publicKey, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxMessagesIds }){

        if (typeof index !== "number") return null;
        if (typeof limit !== "number") return null;

        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxMessagesIds) );

        const array = this._scope.exchange.getExchangeData(offerType).array;

        index = Math.min( index, array.length );
        const startIndex = Math.max(0, index-limit );

        const out = {};

        for (let i=startIndex; i < index; i++){

            const offer = array[i].data;
            const hash = offer.hash().toString("hex");
            out[hash] = true;

        }

        return {
            out,
            next: startIndex > 0 ? startIndex-1 : 0,
        };
    }

    _getEncryptedChatContent({publicKey, index = Number.MAX_SAFE_INTEGER, limit = this._scope.argv.encryptedChatServer.protocolMaxMessages, type = "buffer"  }){

        if (typeof limit !== "number") return null;
        limit = Math.max( 1, Math.min(limit, this._scope.argv.encryptedChatServer.protocolMaxMessages ) );

        const ids = this._getEncryptedChatContentIds({publicKey, index, limit});
        if (!ids) return false;

        const map = this._scope.exchange.getExchangeData(publicKey).map;

        for (const hash in ids.out){

            const offer = map[hash].data;
            ids.out[hash] = offer.toType(type);

        }

        return ids;
    }

    async _newEncryptedChatMessage({encryptedMessage}, res, socket){

        const offerObject = this._scope.exchange.exchangeOfferValidator.validateExchangeOffer(offer);
        const offerId = offerObject.hash().toString("hex");

        this._scope.logger.warn(this, "new offer received", { offerId });

        let resolver;
        this._offersDownloading[offerId] = new Promise( resolve => resolver = resolve);

        let out;

        try{
            out = await this._scope.exchange.newExchangeOffer( offerObject, true, true, socket);
        }catch(err){
            if (this._scope.argv.debug.enabled)
                this._scope.logger.error(this, "newExchange raised an error", err);
        }

        resolver(!!out);

        delete this._offersDownloading[offerId];

        return !!out;
    }

    async _getEncryptedChatMessage({encryptedMessageHash, offerType, type = "buffer" }, res, socket){

        const map = this._scope.exchange.getExchangeData(offerType).map;

        const out = map[offerHash];

        if ( out ) return out.data.toType(type);

    }

}