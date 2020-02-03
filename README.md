# Encrypted Chat Server

End to End Encrypted Chat Server using Elliptic Curves.

Later on we can implemented a simple Delegated POS blockchain that allows pruning old blocks.

##### Specify port

```
--masterCluster:serverCluster:httpServer:port 4005
```

##### Connect to test net

```
--settings:networkType 1
```

##### Start staking

```
--forging:start true
```

##### Deploy your own test net

To deploy your own test net, you need to configure a new test net

Node parameters to set up a testnet network

```
--settings:networkType 1 --encryptedChatServer:createNewTestNet true
```

Run CLI command

```
node start-node.js --masterCluster:serverCluster:httpServer:port 4005 --encryptedChatServer:createNewTestNet true
```

