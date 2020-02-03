const Kernel = global.kernel;
const Network = global.networking;
const Crytopgrahy = global.cryptography;
const {NetworkTypeEnum} = global.kernel.enums;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

import Argv from "bin/argv/argv"

import EncryptedChatCommonSocketRouterPlugin from "./sockets/protocol/encrypted-chat-common-socket-router-plugin"

import Tests from 'tests/tests/tests-index';
import MainSettings from "./main-settings/main-settings"

export default class App extends Kernel.utils.App {

    constructor(args){
        super(args);
    }

    async createMainSettings(scope = this._scope, merge = {} ){

        //stop the forging on the previous
        const mainSettings = new this._scope.MainSettings(  Helper.merge( scope, merge, true )  );

        this.setScope( { _scope: scope }, "mainSettings", mainSettings);

        if ( await scope.mainSettings.initializeMainSettings()  === false)
            throw new Exception(this, "MainSettings couldn't be initialized");

        await this.events.emit("start/main-settings-created", scope);

        return mainSettings;


    }

    setAdditionalEvents(){

        Crytopgrahy.app.setAdditionalEvents.call(this);
        Network.app.setAdditionalEvents.call(this);

        this.events.on("start/argv-set", () =>{

            if ( !this._scope.MainSettings ) this._scope.MainSettings = MainSettings;

            this._scope.argv = Argv(this._scope.argv);

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


        this.events.on("master-cluster/started", async (masterCluster) => {

            await this.createMainSettings(  {
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


}