const Kernel = global.kernel;
const Network = global.networking;
const Crytopgrahy = global.cryptography;
const {NetworkTypeEnum} = global.kernel.enums;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

import Argv from "bin/argv/argv"

import EncryptedChatCommonSocketRouterPlugin from "./sockets/protocol/encrypted-chat-common-socket-router-plugin"

import Tests from 'tests/tests/tests-index';
import MainChat from "./main-chat/main-chat"
import Captcha from "src/captcha/captcha"

export default class App extends Kernel.utils.App {

    constructor(args){
        super(args);
    }

    async createMainChat(scope = this._scope, merge = {} ){

        //stop the forging on the previous
        const mainChat = new this._scope.MainChat(  Helper.merge( scope, merge, true )  );

        this.setScope( { _scope: scope }, "mainChat", mainChat);

        if ( await scope.mainChat.initializeMainChat()  === false)
            throw new Exception(this, "MainChat couldn't be initialized");

        await this.events.emit("start/main-chat-created", scope);

        return mainChat;


    }

    setAdditionalEvents(){

        Crytopgrahy.app.setAdditionalEvents.call(this);
        Network.app.setAdditionalEvents.call(this);

        this.events.on("start/argv-set", () =>{

            if ( !this._scope.MainChat ) this._scope.MainChat = MainChat;
            if ( !this._scope.Captcha ) this._scope.Captcha = Captcha;

            this._scope.argv = Argv(this._scope.argv);

            if (!this._scope.captcha) this._scope.captcha = new this._scope.Captcha(this._scope);
        });

        this.events.on("start/tests-args-middleware", ()=>{

            this._scope.argv = Tests.argvTests( this._scope.argv );
            this._scope.tests.unshift( Tests.tests );


        });


        this.events.on("start/args-processed", async ()=>{

        });

        this.events.on("start/databases-connected", async ()=>{

        });

        this.events.on("master-cluster/initialized", async (masterCluster) => {

            if (masterCluster) {
                const commonSocketRouterPlugins = [];

                const checkPlugin = async (plugins, pluginClass) => {

                    for (let i = 0; i < plugins.length; i++)
                        if (plugins[i] instanceof pluginClass) {
                            await plugins[i].stop();
                            plugins[i]._scope = masterCluster._scope;
                            plugins[i].clear();
                            return;
                        }

                    plugins.push(new pluginClass(masterCluster._scope));
                };

                await Promise.all([
                    checkPlugin(commonSocketRouterPlugins, EncryptedChatCommonSocketRouterPlugin),
                ]);

                //setting the clusters for clients and server
                this.setScope({_scope: masterCluster._scope}, "commonSocketRouterPlugins", commonSocketRouterPlugins);

            }

        });


        this.events.on("master-cluster/initialized", async (masterCluster) => {

            await this.createMainChat(  {
                ...this._scope,
                masterCluster: this._scope.masterCluster,
            },  );

        });

        this.events.on("master-cluster/closed", async () => {

        });

        this.events.on("start/init-processed", async () => {
            
            this._scope.logger.info(`Status`, `Chat Server has been started`);

        });

    }

    get cryptography(){  return this._scope.cryptography }

}