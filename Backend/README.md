# FlipsAura Backend

Simple Express + MongoDB backend.

## Structure

```text
backend/
├── index.js
├── .env
├── .env.example
├── package.json
│
├── routes/
│   ├── authRoutes.js
│   ├── itemRoutes.js
│   ├── categoryRoutes.js
│   ├── blogRoutes.js
│   ├── bookingRoutes.js
│   ├── reviewRoutes.js
│   ├── paymentRoutes.js
│   ├── adminRoutes.js
│   ├── vendorRoutes.js
│   ├── contactRoutes.js
│   └── uploadRoutes.js
│
├── controllers/
│   ├── authController.js
│   ├── itemController.js
│   ├── categoryController.js
│   ├── blogController.js
│   ├── bookingController.js
│   ├── reviewController.js
│   ├── paymentController.js
│   ├── adminController.js
│   ├── contactController.js
│   └── uploadController.js
│
├── middleware/
│   └── auth.js
│
├── models/
│   ├── User.js
│   ├── Item.js
│   ├── Category.js
│   ├── Blog.js
│   ├── Booking.js
│   └── Review.js
│
└── lib/
    ├── db.js
    ├── mailer.js
    ├── razorpay.js
    └── cloudinary.js
```

## Run

```bash
npm install
npm run dev
```

The server starts from `index.js`. There is no dynamic `route.js` scanner.
