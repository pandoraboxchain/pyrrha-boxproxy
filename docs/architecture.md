# Pyrrha-boxproxy architecture overview

## Description
Boxproxy is a database server and API wich representing and providing instant and fast access to data and states of the pyrrha-consensus smart-contract.  

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

## 