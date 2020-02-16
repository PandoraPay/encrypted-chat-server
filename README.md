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
node start-node.js --masterCluster:serverCluster:httpServer:port 9092 --encryptedChatServer:createNewTestNet true --dbPublic:redisDB:db 11 --settings:networkType 1 --captcha:privateKey e9e42d28ecec38726ebdf3337415306552300ded3bf7058fb1a5a6326cf8e51b --captcha:publicKey 038d6ac60175b557ea2ab8f5651a698b84365c93f1e063d09d108d780960633f69
```

