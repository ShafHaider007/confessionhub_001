import mongoose from "mongoose";


type ConnectionObejct= {
    isConnected?: number;
    

}


const connection: ConnectionObejct = {};


async function dbconnect(): Promise<void> {
    if (connection.isConnected) {
        console.log("already connected to the database");
        return;
    }

    //use try catch to connect to the database

    try {
        const db = await mongoose.connect(process.env.MONGODB_URI as string);
        connection.isConnected = db.connections[0].readyState;
        console.log("connected to the database");
    } catch (error) {
        
        console.log("error connecting to the database", error);
        process.exit(1);
    }
    
    
}

export default dbconnect;