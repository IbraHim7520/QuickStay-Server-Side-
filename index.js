const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json())
app.use(cors());
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.rmuhrjn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
app.get('/', (req, res) => {
    res.send("Hello From Hote Booking Website Backend")
})
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})
async function run() {
    try {
        await client.connect()
        await client.db('admin').command({ ping: 1 });
        const database = client.db('Hotel-Room');
        const RoomCollection = database.collection("Rooms");

        app.get("/roomDetails", async (req, res) => { //Get Highest Rating 6 Room Details
            const RoomsInfo = await RoomCollection.find().sort({roomRating: -1}).limit(6).toArray();
            res.send(RoomsInfo);
        })
        app.get('/getRooms', async(req, res)=>{
            const roomData = await RoomCollection.find().toArray()
            res.send(roomData);
        })
        app.get("/get_oneroom/:roomID", async(req , res)=>{
            const id = req.params.roomID;
            const filter = {_id: new ObjectId(id)};

            const result = await RoomCollection.findOne(filter);
            res.send(result);

        })
        app.patch( '/room_booking/:id', async(req , res)=>{
            const {id} = req.params
            const filter = {_id : new ObjectId(id)}
            const singleRoom = await RoomCollection.findOne(filter);
            const {email , date}= req.body
            const updateDoc = {

                $addToSet:{
                    defaultDate : date,
                    BookedBy: email,
                }
            }

            const update = await RoomCollection.updateOne(filter , updateDoc);
            res.send(update)
           
        } )

        console.log("Connected");
    } finally {

    }
}
run().catch(console.dir)
app.listen(port, () => {
    console.log("Server Runing")
})