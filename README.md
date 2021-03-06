# light-game
This project is a 2D Web-based multiplayer game. The premise of the game resolves around 1 player trying to avoid being seen by the other player, who is given a flashlight to find the other player in the room. Both players will have abilities to manipulate light (for example: moving the light source, reflection, refraction, electro-magnetism) in order to either catch the other person or survive long enough in the dark.

## Team
I am looking for 1-2 other teammates to join this project.

## Relational Database
Likely using SQLite with ~4 tables to start (user, rooms, user_credentials, user_abilities).

## NoSQL Database
Likely MongoDB or DynamoDB, if we would like to host this in AWS.

## Business
I'm looking to keep this as a private project between collaborators for now.

## Legal
I'm not sure yet. Currently no plans for making this open-source yet, but may move to LLC if there is lots of traction/interest.

## Technical
The following represents the major steps for this project:
* Build a working MVP of the web-based application for 1 device, running locally
* Build a working MVP of the web-based application for 2+ devices on local network
* Design and create the database tables and schemas (relational & NoSQL)
* Design and build a backend API to handle business logic of user logins, room creation/joins (likely in Typescript or JVM language such as Scala)
* Build a simple authentication layer for different user accounts (likely with JWT)
* If there is time, add additional functionality on top of the MVP (user abilities, powerups, etc.)
* If there is time, update the visuals to make the game more appealing and interesting to play

Currently, the technical stack will be:
* Frontend: Typescript, Phaser Framework
* Backend: Typescript/JVM language (Scala)
