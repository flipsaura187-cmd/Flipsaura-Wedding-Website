import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function populate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const itemsCol = mongoose.connection.collection('items');
  const roomsCol = mongoose.connection.collection('rooms');
  const categoriesCol = mongoose.connection.collection('categories');

  const hotelCat = await categoriesCol.findOne({ slug: 'hotels' });
  const hotelCatId = hotelCat ? hotelCat._id : null;

  // 1. Consolidate Raaj Rasoi
  const raajMasterId = new mongoose.Types.ObjectId('6ace6893a7bd197b31a2bde0');
  const raajVendorId = new mongoose.Types.ObjectId('6ace08716fe880d53d2b2aca');
  
  // Update Raaj Rasoi master title & category
  await itemsCol.updateOne(
    { _id: raajMasterId },
    { 
      $set: { 
        title: 'Hotel Raaj Rasoi – Daudnagar',
        category: hotelCatId || undefined,
        city: 'Daudnagar'
      } 
    }
  );

  // Check if rooms already exist for Raaj Rasoi
  const existingRaajRooms = await roomsCol.countDocuments({ hotel: raajMasterId });
  if (existingRaajRooms === 0) {
    const raajMaster = await itemsCol.findOne({ _id: raajMasterId });
    const img = raajMaster?.images?.[0] || '/images/categories/hotels.jpg';

    await roomsCol.insertMany([
      {
        hotel: raajMasterId,
        vendor: raajVendorId,
        name: 'Standard AC Room',
        roomType: 'Standard Room',
        pricePerNight: 1499,
        availableRooms: 6,
        maxGuests: 2,
        bedType: '1 Queen Bed',
        numberOfBeds: 1,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water', 'Daily Housekeeping'],
        description: 'Comfortable air-conditioned standard room with queen-sized bed, clean linens, and 24x7 hot water.',
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hotel: raajMasterId,
        vendor: raajVendorId,
        name: 'Deluxe AC Room',
        roomType: 'Deluxe Room',
        pricePerNight: 1500,
        availableRooms: 8,
        maxGuests: 2,
        bedType: '1 King Bed',
        numberOfBeds: 1,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water', 'Flat-screen TV', 'Room Service'],
        description: 'Spacious deluxe room with premium king-size bed, work desk, flat-screen TV, and room service.',
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hotel: raajMasterId,
        vendor: raajVendorId,
        name: 'Super Deluxe Room',
        roomType: 'Super Deluxe Room',
        pricePerNight: 1999,
        availableRooms: 4,
        maxGuests: 3,
        bedType: '1 King Bed + 1 Single Bed',
        numberOfBeds: 2,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water', 'Flat-screen TV', 'Room Service', 'Complimentary Breakfast'],
        description: 'Executive super deluxe room with generous living space, luxury bedding, and complimentary breakfast.',
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('Created 3 rooms for Hotel Raaj Rasoi');

    // Remove the two duplicate items
    await itemsCol.deleteMany({
      _id: { $in: [new mongoose.Types.ObjectId('6ace1e0599b101c129c3d391'), new mongoose.Types.ObjectId('6ace64dda7bd197b31a2bddf')] }
    });
    console.log('Cleaned up duplicate Raaj Rasoi items');
  }

  // 2. Anshu business - Add Standard & Suite rooms
  const anshuHotelId = new mongoose.Types.ObjectId('6ad557c4182b38f0ed4ab999');
  const anshuVendorId = new mongoose.Types.ObjectId('6ad4ce15f87ea8c94887b71b');
  const anshuRoomCount = await roomsCol.countDocuments({ hotel: anshuHotelId });
  if (anshuRoomCount === 1) {
    const anshuHotel = await itemsCol.findOne({ _id: anshuHotelId });
    const img = anshuHotel?.images?.[0] || '/images/categories/hotels.jpg';

    await roomsCol.insertMany([
      {
        hotel: anshuHotelId,
        vendor: anshuVendorId,
        name: 'Standard Comfort Room',
        roomType: 'Standard Room',
        pricePerNight: 1800,
        availableRooms: 6,
        maxGuests: 2,
        bedType: '1 Queen Bed',
        numberOfBeds: 1,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water'],
        description: 'Clean and budget-friendly standard room with all essential amenities.',
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hotel: anshuHotelId,
        vendor: anshuVendorId,
        name: 'Executive Suite',
        roomType: 'Suite',
        pricePerNight: 3500,
        availableRooms: 3,
        maxGuests: 4,
        bedType: '2 King Beds',
        numberOfBeds: 2,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water', 'Flat-screen TV', 'Room Service', 'Complimentary Breakfast', 'Mini Fridge'],
        description: 'Premium suite with separate seating area, two king beds, mini fridge, and complimentary breakfast.',
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('Added Standard & Suite rooms for anshu business');
  }

  // 3. For all other hotel accommodation items in DB
  const hotelItems = await itemsCol.find({
    $or: [
      { category: hotelCatId },
      { title: { $regex: /Hotel Accommodation/i } }
    ]
  }).toArray();

  console.log(`Checking ${hotelItems.length} hotel accommodation items...`);

  for (const h of hotelItems) {
    const count = await roomsCol.countDocuments({ hotel: h._id });
    if (count > 0) {
      console.log(`Hotel "${h.title}" already has ${count} rooms.`);
      continue;
    }

    const basePrice = h.price && h.price > 300 ? h.price : 1500;
    const deluxePrice = Math.round((basePrice * 1.35) / 50) * 50;
    const img = h.images?.[0] || '/images/categories/hotels.jpg';
    const vendorId = h.vendor || new mongoose.Types.ObjectId('6ad4ce15f87ea8c94887b71b');

    await roomsCol.insertMany([
      {
        hotel: h._id,
        vendor: vendorId,
        name: `${h.title.split('–')[0].trim()} Standard Room`,
        roomType: 'Standard Room',
        pricePerNight: basePrice,
        availableRooms: 5,
        maxGuests: 2,
        bedType: '1 Queen Bed',
        numberOfBeds: 1,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water', 'Daily Housekeeping'],
        description: `Standard room at ${h.title.split('–')[0].trim()} with cozy queen bed, clean attached bathroom, and 24x7 hot water.`,
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hotel: h._id,
        vendor: vendorId,
        name: `${h.title.split('–')[0].trim()} Deluxe AC Room`,
        roomType: 'Deluxe Room',
        pricePerNight: deluxePrice,
        availableRooms: 4,
        maxGuests: 3,
        bedType: '1 King Bed',
        numberOfBeds: 1,
        facilities: ['Air Conditioning (AC)', 'High-Speed Wi-Fi', 'Attached Bathroom', 'Geyser / 24x7 Hot Water', 'Flat-screen TV', 'Room Service', 'Daily Housekeeping'],
        description: `Deluxe air-conditioned room at ${h.title.split('–')[0].trim()} featuring a king bed, LED television, and room service.`,
        images: [img],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(`Created 2 rooms for "${h.title}" (₹${basePrice} & ₹${deluxePrice})`);
  }

  console.log('Finished populating hotel rooms successfully.');
  process.exit(0);
}

populate().catch(err => {
  console.error(err);
  process.exit(1);
});
