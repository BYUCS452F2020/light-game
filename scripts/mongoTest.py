import pymongo

client = pymongo.MongoClient("mongodb://node:bruceconrad@34.222.92.7/lightgame_db") # defaults to port 27017

db = client.lightgame_db

# print the number of documents in a collection
print(db)