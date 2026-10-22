import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import mongoose from "mongoose";

async function verify() {
  await dbConnect();
  const roomsCol = mongoose.connection.collection("rooms");
  const itemsCol = mongoose.connection.collection("items");

  const hotelIds = [
    new mongoose.Types.ObjectId("6ad4861d43c3b607c03f6a8b"), // Saraswati Inn
    new mongoose.Types.ObjectId("6ad45ad0ea2b47b2212768c9"), // Gargee Surya Vihar
    new mongoose.Types.ObjectId("6ad4861c43c3b607c03f6a81"), // US Residency
    new mongoose.Types.ObjectId("6ad4862043c3b607c03f6b34"), // Amit Rest House
    new mongoose.Types.ObjectId("6ad4861f43c3b607c03f6afd"), // Rinkesh Grand
    new mongoose.Types.ObjectId("6ad4862143c3b607c03f6b64"), // Janakpuri
    new mongoose.Types.ObjectId("6ad45acfea2b47b2212768b3"), // Raj Residency
    new mongoose.Types.ObjectId("6ada6f1b90929c2b275ce108"), // The Haweli Resorts
  ];

  console.log("================================================================================");
  console.log("🔍 VERIFYING ROOMS FOR ALL 8 HOTELS");
  console.log("================================================================================\n");

  for (const hId of hotelIds) {
    const hotel = await itemsCol.findOne({ _id: hId });
    const rooms = await roomsCol.find({ hotel: hId }).toArray();
    console.log(`🏨 [${hotel?.title}] (ID: ${hId}) - Starting Price: ₹${hotel?.price}`);
    console.log(`   Found ${rooms.length} room(s):`);
    for (const r of rooms) {
      console.log(`   • "${r.name}" | ${r.roomType} | ₹${r.pricePerNight}/night | Max ${r.maxGuests} Guests | ${r.bedType}`);
      console.log(`     Facilities: ${r.facilities?.join(", ")}`);
      console.log(`     Photo URL : ${r.images?.[0]}`);
    }
    console.log();
  }

  process.exit(0);
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
