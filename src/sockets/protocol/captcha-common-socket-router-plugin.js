const {SocketRouterPlugin} = global.networking.sockets.protocol;
const {Helper, Exception, StringHelper, EnumHelper} = global.kernel.helpers;

export default class EncryptedChatCommonSocketRouterPlugin extends SocketRouterPlugin {

    constructor(scope){

        super(scope);

        this._scope.events.on("master-cluster/started", ()=> this.initializePluginMasterCluster() );

    }

    async initializePluginMasterCluster(){

    }

    getOneWayRoutes(){

        return {

            "captcha/get-captcha":{
                handle:  this._getCaptcha,
                maxCallsPerSecond:  100,
                descr: "Return a captcha",
            },

        }

    }

    getTwoWaysRoutes(){

        return {



        }

    }

    _getEncryptedChatInfo(){

        return {
            index: this._scope.mainChat.data.index,
            timestamp: this._scope.mainChat.data.timestamp,
            target: this._scope.mainChat.data.target,
        }

    }

    async _getCaptcha( { }, res, socket){

        const out = await this._scope.captcha.createCaptcha();
        return out;

    }

}