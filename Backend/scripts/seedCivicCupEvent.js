import "dotenv/config";
import { dbConnect } from "../lib/db.js";
import Event from "../models/Event.js";

async function seedCivicCup() {
  await dbConnect();
  console.log("Connected to MongoDB for Event Seeding...");

  const civicCupData = {
    title: "THE CIVIC CUP",
    slug: "the-civic-cup",
    type: "Quiz Competition",
    organizer: "Flipsaura × Marritcredence",
    venue: "Gyan Bhawan / S.K. Memorial Hall, Patna, Bihar",
    city: "Patna",
    state: "Bihar",
    date: "Sunday, November 15, 2026",
    startTime: "10:00 AM",
    endTime: "05:30 PM",
    registrationFee: 1000,
    currency: "INR",
    bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop",
    shortDescription: "A premier competitive quiz experience where knowledge, awareness, logic and quick thinking come together. Win prizes up to ₹25,000!",
    description: "Welcome to The Civic Cup, a premier competitive quiz championship hosted jointly by Flipsaura and Marritcredence. Designed for passionate thinkers, students, and quiz enthusiasts, this high-energy competition tests your mental agility, general knowledge, civic awareness, and strategic reasoning. Whether you want to battle it out individually or bring your dream squad of 3, The Civic Cup is your stage to showcase intellect and take home prestigious trophies and cash prizes.",
    participationTypes: ["Individual", "Team of 3"],
    prizes: [
      {
        position: "1st Prize",
        amount: "₹25,000",
        description: "Winner Trophy, Cash Prize & Gold Merit Certificates",
      },
      {
        position: "2nd Prize",
        amount: "₹15,000",
        description: "1st Runner-Up Trophy, Cash Prize & Silver Merit Certificates",
      },
      {
        position: "2nd Runner-Up",
        amount: "₹6,000",
        description: "2nd Runner-Up Trophy, Cash Prize & Bronze Merit Certificates",
      },
    ],
    benefits: [
      "Test knowledge and quick-thinking ability under competitive tournament conditions",
      "Compete with the sharpest students and quiz enthusiasts from across the region",
      "Build confidence and stage presence in a high-caliber competitive environment",
      "Meet, network, and connect with like-minded peers and industry professionals",
      "Showcase knowledge and skills to earn prestigious awards and certificates",
    ],
    eventFormat: [
      {
        roundNumber: "Round 1",
        title: "Preliminary Written Assessment",
        description: "30 objective questions covering Civic Affairs, History, Science, Arts, and Logic to rank all participants.",
      },
      {
        roundNumber: "Round 2",
        title: "Semi-Final Buzzer & Visual Round",
        description: "Top 12 qualifiers compete in an interactive audio-visual and rapid-fire stage.",
      },
      {
        roundNumber: "Round 3",
        title: "Grand Finale On-Stage Challenge",
        description: "Final 5 finalists battle it out in a multi-category buzzer and wager championship round.",
      },
    ],
    rules: [
      "Participation is open to all students, graduates, and quiz enthusiasts.",
      "Participants can register either as an Individual or as a Team of 3 members.",
      "For Team registrations, Member 1 is designated as the Team Leader / Primary Contact.",
      "Valid photo identification (College ID / Aadhaar / Govt ID) is mandatory on event day.",
      "Use of mobile phones, smartwatches, or external reference materials during competition rounds is strictly prohibited.",
      "The decisions of the Quizmaster and Jury panel are final and binding on all matters.",
      "Registration fee of ₹1,000 is per registration (covers Individual or full Team of 3).",
      "Registration is confirmed only after successful Razorpay payment verification.",
    ],
    faqs: [
      {
        question: "Can school and college students participate?",
        answer: "Yes! High school students, university undergraduates, postgraduates, and open quiz enthusiasts are all warmly welcomed.",
      },
      {
        question: "Does the ₹1,000 fee apply per person or per team?",
        answer: "The registration fee is ₹1,000 flat per registration — whether you register as a single Individual or as a complete Team of 3!",
      },
      {
        question: "Can team members be from different colleges or schools?",
        answer: "Yes, cross-institution and inter-college teams are completely allowed.",
      },
      {
        question: "Will all participants receive certificates?",
        answer: "Yes, all verified attendees will receive official Certificates of Participation from Flipsaura × Marritcredence.",
      },
      {
        question: "How do I show my registration at the venue?",
        answer: "Upon successful online payment, you will receive a unique Registration ID (e.g. CVC-XXXXXX) which you can print or display on your mobile phone at the reception desk.",
      },
    ],
    contactInformation: {
      email: "events@flipsaura.com",
      phone: "+91 98765 43210",
      supportPerson: "Flipsaura Events Helpdesk",
    },
    registrationOpen: new Date("2026-09-01"),
    registrationClose: new Date("2026-11-14T23:59:59.000Z"),
    registrationEnabled: true,
    status: "PUBLISHED",
    featured: true,
    terms: [
      "I confirm that all information provided is accurate and complete.",
      "I agree to follow the rules and regulations of The Civic Cup.",
      "I understand that the registration fee is ₹1,000.",
      "I understand that registration is confirmed only after successful payment.",
    ],
  };

  const existing = await Event.findOne({ slug: civicCupData.slug });
  if (existing) {
    await Event.updateOne({ slug: civicCupData.slug }, civicCupData);
    console.log("✅ Updated existing Civic Cup event in MongoDB.");
  } else {
    await Event.create(civicCupData);
    console.log("✅ Created new Civic Cup event in MongoDB.");
  }

  process.exit(0);
}

seedCivicCup().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
