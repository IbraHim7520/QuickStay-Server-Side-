const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json())
const jwt = require('jsonwebtoken');
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
        const Booked_Room_Collection = database.collection('Booked_Rooms')

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
            const id = req.params.id;
            const {Date , RoomID , BookedBy} = req.body;
            const Room = await RoomCollection.findOne({_id: new ObjectId(RoomID)})
            const Booked_Room_Doc = {
                Date,
                RoomID,
                BookedBy
            }
            const db_response = await Booked_Room_Collection.insertOne(Booked_Room_Doc);
            if (db_response.insertedId){
                const updte = {
                    $set:{
                        Booked : true
                    }
                }
                const response = RoomCollection.updateOne(Room, updte);
                if(response){
                    res.send(response)
                }
            }
        } )

        app.get(`/get_booked_room/:email`, async(req , res)=>{
            const {email} =  req.params;
            const data_filter = {BookedBy: email};
            const datas = await Booked_Room_Collection.find(data_filter).toArray()
        for (const data of datas){
            const id = data.RoomID;
            const roomInfo = await RoomCollection.findOne({_id: new ObjectId(id)});

            data.name = roomInfo.name
            data.price = roomInfo.pricePerNight
            data.image = roomInfo.image
            data.address = roomInfo.hotelLocation
            data.hotelName = roomInfo.hotelName
        }
        res.send(datas);
        })


        app.delete("/cancel_booking/:id", async(req , res)=>{
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const document = await Booked_Room_Collection.findOne(filter);
            const roomid = document?.RoomID
            if (!roomid) {
            return res.status(400).send({ error: "RoomID not found in booking." });
                }
            const result = await Booked_Room_Collection.deleteOne(filter);
            if (result.deletedCount == 1){
                const filter = {_id : new ObjectId(roomid)};
                const updateDoc = {
                    $set:{
                        Booked: false
                    }
                }
                const update_confirm = await RoomCollection.updateOne(filter , updateDoc);
                if(update_confirm.modifiedCount){
                    res.send(result)
                }
            }

        })

        app.get('/filtered_data/:filter', async(req , res)=>{
            const filter_text = req.params.filter;
            if( filter_text.includes('price high to low')){
                const pHightoLow = await RoomCollection.find().sort( {pricePerNight: -1}).toArray()
                res.send(pHightoLow);
            }else if (filter_text.includes("price low to high")){
                const pLowtoHigh = await RoomCollection.find().sort({pricePerNight: 1}).toArray();
                res.send(pLowtoHigh)
                
            }else if (filter_text.includes('rating high to low')){
                const rHightoLow = await RoomCollection.find().sort({roomRating: -1}).toArray();
                res.send(rHightoLow)
               
            }else if (filter_text.includes('ratng low to high')){
                const rLowtoHigh = await RoomCollection.find().sort({roomRating:1}).toArray();
                res.send(rLowtoHigh);
                
            }
        } )

        console.log("Connected");
    } finally {

    }
}
run().catch(console.dir)
app.listen(port, () => {
    console.log("Server Runing")
})