import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function consolidate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const itemsCol = mongoose.connection.collection('items');
  const roomsCol = mongoose.connection.collection('rooms');
  const usersCol = mongoose.connection.collection('users');

  const masterHotelId = new mongoose.Types.ObjectId('6ad4862143c3b607c03f6b64');
  const masterVendorId = new mongoose.Types.ObjectId('6ad4862143c3b607c03f6b63');

  const duplicateHotelId = new mongoose.Types.ObjectId('6ad4862143c3b607c03f6b75');
  const duplicateVenueId = new mongoose.Types.ObjectId('6ad4862143c3b607c03f6b7d');
  const duplicateVendorId = new mongoose.Types.ObjectId('6ad4862143c3b607c03f6b74');

  // 1. Delete all rooms pointing to duplicate hotel
  await roomsCol.deleteMany({ hotel: duplicateHotelId });
  console.log('Deleted rooms of duplicate hotel');

  // 2. Set up clean rooms for master hotel: Standard (₹1,500), Deluxe AC (₹2,500), Royal Palace Suite (₹3,400)
  await roomsCol.deleteMany({ hotel: masterHotelId });
  
  const masterHotel = await itemsCol.findOne({ _id: masterHotelId });
  const img = masterHotel?.images?.[0] || 'https://res.cloudinary.com/dvvpsnea0/image/upload/v1792316232/flipsaura/hotels/hotel_JANAKPURI_PALACE_HOTEL_AND_RESORT_1792316231778.avif';

  await roomsCol.insertMany([
    {
      hotel: masterHotelId,
      vendor: masterVendorId,
      name: 'Standard Room',
      roomType: 'Standard Room',
      pricePerNight: 1500,
      availableRooms: 6,
      maxGuests: 2,
      bedType: '1 Queen Bed',
      numberOfBeds: 1,
      facilities: [
        'Air Conditioning (AC)',
        'High-Speed Wi-Fi',
        'Attached Bathroom',
        'Geyser / 24x7 Hot Water',
        'Daily Housekeeping'
      ],
      description: 'Comfortable standard accommodation with queen bed, attached private bathroom, and 24x7 hot water.',
      images: [img],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      hotel: masterHotelId,
      vendor: masterVendorId,
      name: 'Deluxe AC Room',
      roomType: 'Deluxe Room',
      pricePerNight: 2500,
      availableRooms: 8,
      maxGuests: 2,
      bedType: '1 King Bed',
      numberOfBeds: 1,
      facilities: [
        'Air Conditioning (AC)',
        'High-Speed Wi-Fi',
        'Attached Bathroom',
        'Geyser / 24x7 Hot Water',
        'Flat-screen / Smart TV',
        'Room Service',
        'Daily Housekeeping'
      ],
      description: 'Spacious deluxe room featuring luxury king-sized bed, flat-screen LED TV, and prompt in-room service.',
      images: [img],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      hotel: masterHotelId,
      vendor: masterVendorId,
      name: 'Royal Palace Suite',
      roomType: 'Suite',
      pricePerNight: 3400,
      availableRooms: 3,
      maxGuests: 4,
      bedType: '2 King Beds',
      numberOfBeds: 2,
      facilities: [
        'Air Conditioning (AC)',
        'High-Speed Wi-Fi',
        'Attached Bathroom',
        'Geyser / 24x7 Hot Water',
        'Flat-screen / Smart TV',
        'Room Service',
        'Complimentary Breakfast',
        'Balcony / Garden View'
      ],
      description: 'Grand royal palace suite offering expansive space, dual king bedding, plush seating, and scenic resort views.',
      images: [img],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
  console.log('Created 3 curated rooms for master hotel');

  // 3. Update master hotel price to lowest room tariff (1500)
  await itemsCol.updateOne(
    { _id: masterHotelId },
    { $set: { price: 1500 } }
  );

  // 4. Delete duplicate hotel and duplicate venue items
  await itemsCol.deleteOne({ _id: duplicateHotelId });
  await itemsCol.deleteOne({ _id: duplicateVenueId });
  console.log('Deleted duplicate hotel and venue items');

  // 5. Delete duplicate vendor
  await usersCol.deleteOne({ _id: duplicateVendorId });
  console.log('Deleted duplicate vendor');

  console.log('Successfully consolidated Janakpuri into 1 master hotel and 1 master venue.');
  process.exit(0);
}

consolidate().catch(err => {
  console.error(err);
  process.exit(1);
});
