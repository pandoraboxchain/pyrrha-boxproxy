# Pyrrha-boxproxy architecture overview

## Description
Boxproxy is a database server and API wich representing and providing instant and fast access to data and states of the [pyrrha-consensus](https://github.com/pandoraboxchain/pyrrha-consensus) smart-contract.  

## Use cases
- the external application gets an access to actual data and states of the pyrrha-consensus smart-contract entities (kernels, datasets, workers, jobs) without the need for special smart-contracts oriented software  
- the external application is searching thru data by searchable properties like address, description, state, etc.  
- the external application is sorting data by sortable properties like id, state, progress (etc.) in ascending or descending order  
- the external application receives real-time updates of data  

The external application makes requests via http and receives data in JSON format.

## Structure of the components  
![boxproxy-architecture](./images/boxproxy-architecture.png)  

## Choosing a database
The main reason why SQLite has been chosen is the way of how boxproxy will be used in other apps.  
There are two cases where boxproxy can be used for:  
1. Public server for instant access to data of pyrrha-consensus smart-contract  
2. Embedded (local) server for the desktop application  

The second case is related to electron.js-based desktop application which will be called "Pandora Market". This application will provide a reach UI for pyrrha-consensus features. [electron.js](https://electronjs.org/) - is a platform for a building of cross platform desktop application based on web technologies and it has its own limitations on how to persist data in the app. For now, the only way to provide an efficient way to persist data in the electron.js app - is SQLite. SQLite can be embedded and bundled with application and users will be relieved of the need to install the database separately from the application. So that's why SQLite was chosen.

In production, the "public server" version of boxproxy will be moved to using of PostgreSQL database. This will be completed easily because of used ORM ([sequelizejs](http://docs.sequelizejs.com/)) is allowing it (we need just switch a dialect in the [configuration file](../src/db/db.js)). 

## RESTful API
RESTful server is based on [express.js](http://expressjs.com)  
- API routes are configured at [./src/routes.js](../src/routes.js)  
- API endpoints are described in details in the [restfulapi.md](./restfulapi.md)

## WS API
For now, websocket API is a simple "pushing" API. All actions from the Database manager (see below) just synchronously "pushing" to the socket.

## Database manager 
This is the central communication component. On the one hand, the database manager processes messages received from the Pandora synchronizer, monitors its status and initiates interaction with the smart contract. On the other hand, it manages the database, adds new entries and updates existing ones.  
The configuration of the Database manager and logic of working with events and data from other components is based on tasks. [PandoraDb](../src/db/index.js) is a main class of the Database manager has a special method for tasks setup.  

### Main concepts
- Database manager and Pandora synchronizer are event-based components. Each event containing a message with command and data.
- **Baseline**: is the data set which initially obtained from the smart-contract  
- **Action**: reaction to the event. Processing of the event message, transformation of its data, interaction with the database
- **Subscription**: is a state of the Pandora synchronizer in which it listening for the special event from the smart-contract. Subscription is created and canceled by special commands  

### Database manager events API
- `initialized` 
- `stopped`
- `beforeAction`  
```json
"beforeAction" message:
{
    name: {String},// Task name
    event: {String},// Event name which initiated the action
    data: {Object}// Data which will be sent to the action
}
```
- `action`
```json
// The same as at the "beforeAction"
```
- `error` 
```json
// message containing the error object
```

### Tasks management 
Tasks are doing the following things:
- Enable listening to special events  
- Defines the **action** should be taken when this event is received  
- Runs the some code on the task initialisation (usually this is a check of the initial state and sending the necessary commands in accordance with this state)  
  
Here the example of the [task configuration](../src/index.js):
```javascript
db.addTask({
    name: 'addJobs',     // Name of the task
    source: pandora,     // Events source object 
                         // (from where all data messages comes)
    event: 'jobsRecords',// Listen this event on the source
    action: 'jobs.add',  // Run this action on event 
                         // (actions are described in the Database API part)
    initEvent: 'started',// Special event name on "source" which will
                         // ininiate first communication with Pandora synchronizer
    isInitialized: 'initialized',
    init: async (config) => {

        try {
            // Obtaining of jobs baseline state
            // If baseline has been obtained before
            // we will gets the "true" as result
            const isBaseline = await db.api.system.isBaseline('jobsBaseline');
            log.debug(`"${config.name}" task has been initialized with baseline value: ${isBaseline}`);
        
            if (isBaseline) {

                // If the baseline has been obtained before
                // we just get saved block number
                const blockNumber = await db.api.system.getBlockNumber('jobs');

                // and start a subscription to the smart-contract events
                pandora.emit('subscribeJobs', { blockNumber });
                pandora.emit('subscribeJobStateChanged', { blockNumber });
                return;
            }
            
            // If jobs baseline not detected 
            // send the command to get it
            pandora.emit('getJobs');

        } catch (err) {

            // If something happened 
            // emit the error
            db.emit('error', err);
        }        
    },
});
```

## Database models and API 
Database models are defined in the folder: [`./src/db/models`](../src/db/models)   
Each subset of database methods ([kernels.*](../src/db/api/kernels.js), [datasets.*](../src/db/api/datasets.js), [workers.*](../src/db/api/workers.js), [jobs.*](../src/db/api/jobs.js)) contains three main functions:
- `add`
- `remove`
- `getAll`

These methods are created by related factories which are defined in the file [./src/db/api/utils/factories.js](../src/db/api/utils/factories.js). Factories are allowing to create methods using the following options:
- `add`
```javascript
// Example from the jobs API
module.exports.add = addRecordsFactory(Jobs, // Model object
{
    baselineFlag: 'jobsBaseline', // Name of baseline
    subscribeEvent: ['subscribeJobs', 'subscribeJobStateChanged'], // Array of commands for subscriptions creation
    formatRecord: record => ({ // Data transformation callback
        address: record.address, 
        activeWorkers: record.activeWorkers.join(';'), 
        dataset: record.dataset, 
        kernel: record.kernel,
        kernelIpfs: record.kernelIpfs,
        datasetIpfs: record.datasetIpfs,
        description: record.description, 
        ipfsResults: record.ipfsResults.join(';'), 
        state: record.state, 
        jobType: record.jobType, 
        progress: record.progress
    })
});
```
- `remove`
```javascript
// Example from the jobs API
module.exports.remove = removeRecordByAddressFactory(Jobs);// Just the Model object
```
- `getAll`
```javascript
module.exports.getAll = getAllFactory(Jobs);// Just the model object
```
### System subset
[This subset](../db/api/system.js) is dedicated to service functions of the application:
- `isAlreadySeeded` Allows you to detect whether the application database is set up  
- `saveBlockNumber` Just save the current block number
- `getBlockNumber` Get saved block number from the database
- `isBaseline` Allows to detect whether the baseline data is saved for speciffic target
- `getContactsAddresses` Get contract addresses that are has been saved during initial setup
- `fixBaseline` Set the the baseline flag for speciffic target
- `clearBaseline` Unset the the baseline flag for speciffic target

## Pandora synchronizer
[This component](../src/pandora/index.js) acts as the node.js **child process**. This way is chosen because of the need to separate code that actively uses the network from the main process. This will be extremely important when boxproxy will be used as the basis for a desktop (electron.js) application.  

Main parts of the synchronizer:
- `stateManager` State machine
- `pjsConnector` Connection manager
- `subscriptionsManager` Events subscriptions manager (based on Queue)
- `worker` Messages manager

Pandora synchronizer communicates with Database manager via server messages. The following is a brief description of these messages. Common message template look like:  
```json
{
    cmd: {String},// Command name
    ...{Mixed} additional data
}
```
### Incoming messages API
Handled at [./src/pandora/worker.js](../src/pandora/worker.js)
- `start` Start the syncing
- `stop` Stop the syncing and close 
- `state` Get current synchronizer state 
- `getKernelsRecords` Fetch kernels baseline
- `subscribeKernels` Subscribe to `KernelAdded` and `KernelRemoved` events
- `getDatasetsRecords` Fetch datasets baseline
- `subscribeDatasets` Subscribe to `DatasetAdded` and `DatasetRemoved` events
- `getJobsRecords` Fetch jobs baseline
- `subscribeJobs` Subscribe to `CognitiveJobCreated` event
- `subscribeJobStateChanged` Subscribe to `JobStateChanged` and `CognitionProgressed` events
- `getWorkersRecords` Fetch workers baseline
- `subscribeWorkers` Subscribe to `WorkerNodeCreated` event
- `subscribeWorkerAddress` Subscribe to `StateChanged` event by worker address
- `unsubscribeWorkerAddress` Unsubscribe `StateChanged`
- `getSubscriptionsList` Get all subscriptions list
### Outgoing messages API 
Handled at [./src/pandora/index.js](../src/pandora/index.js)  
- `started` Pandora synchronizer is started and ready for commands  
- `stopped` Synchronizer has been stopped and closed  
- `error` Error message
- `state` Current state
- `connected` Pandora synchronizer has been connected to the network
- `disconnected` Connection to the netowrk has been lost and reconnection started
- `kernelsRecords` Kernels records (baseline: true|false option indicates the kind of records)
- `kernelsRecordsRemove` Set of kernels records for removal
- `datasetsRecords` Datasets records (baseline: true|false option indicates the kind of records)
- `datasetsRecordsRemove` Set of datasets records for removal
- `jobsRecords` Jobs records (baseline: true|false option indicates the kind of records)
- `jobsRecordsUpdate` (deprecated)
- `workersRecords` Workers records (baseline: true|false option indicates the kind of records)
- `workersRecordsUpdate` (deprecated)
- `subscriptionsList` List of all subscriptions
- `lastBlockNumber` Last block number obtained from connection manager

## Pyrrha-js  
Higher order functions library which provides a standardized set of methods to work with the [pyrrha-consensus](https://github.com/pandoraboxchain/pyrrha-consensus) smart contract and built on top of [web3.js (1.x)](https://github.com/ethereum/web3.js). This library is used as API to the smart-contract data for a Pandora synchronizer.
The repository of the library on GitHub:  [https://github.com/pandoraboxchain/pyrrha-js](https://github.com/pandoraboxchain/pyrrha-js)