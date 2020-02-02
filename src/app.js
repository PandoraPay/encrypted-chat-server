const Kernel = global.kernel;
const Network = global.networking;
const Crytopgrahy = global.cryptography;
const {NetworkTypeEnum} = global.kernel.enums;
const {Helper, Exception, BufferHelper} = global.kernel.helpers;

import Argv from "bin/argv/argv"

import Tests from 'tests/tests/tests-index';

export default class App extends Kernel.utils.App {

    constructor(args){
        super(args);
    }

    setAdditionalEvents(){

        Crytopgrahy.app.setAdditionalEvents.call(this);
        Network.app.setAdditionalEvents.call(this);

        this.events.on("start/argv-set", () =>{

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
                    //checkPlugin(commonSocketRouterPlugins, ExchangeCommonSocketRouterPlugin),
                ]);

                //setting the clusters for clients and server
                this.setScope({_scope: masterCluster._scope}, "commonSocketRouterPlugins", commonSocketRouterPlugins);

            }

        });


        this.events.on("master-cluster/started", async (masterCluster) => {

        });

        this.events.on("master-cluster/closed", async () => {

        });

        this.events.on("start/init-processed", async () => {
            
            this._scope.logger.info(`Status`, `Chat Server has been started`);

        });

    }


}