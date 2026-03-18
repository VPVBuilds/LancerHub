require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Job      = require('../models/Job');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...\n');

  // Clear existing
  await Promise.all([User.deleteMany(), Job.deleteMany()]);
  console.log('🗑  Cleared existing data');

  // ── Create users ──────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const hash = (pw) => bcrypt.hash(pw, salt);

  const users = await User.insertMany([
    {
      name: 'Alex Kumar', email: 'alex@example.com',
      password: await hash('password123'), role: 'freelancer',
      title: 'Full-Stack Developer & UI Designer',
      bio: 'Building scalable web apps for 6+ years. React, Node.js, AWS.',
      location: 'Mumbai, India', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Figma', 'AWS'],
      hourlyRate: 65, availability: 'available', avgRating: 4.9, totalReviews: 148,
      jobsCompleted: 148, totalEarned: 48000, isVerified: true,
    },
    {
      name: 'Priya Sharma', email: 'priya@example.com',
      password: await hash('password123'), role: 'freelancer',
      title: 'Full-Stack Developer',
      bio: 'Passionate about clean code and great UX.',
      location: 'Bangalore, India', skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      hourlyRate: 70, availability: 'available', avgRating: 4.9, totalReviews: 112,
      jobsCompleted: 98, isVerified: true,
    },
    {
      name: 'James Lee', email: 'james@example.com',
      password: await hash('password123'), role: 'freelancer',
      title: 'UI/UX Designer',
      bio: 'Crafting pixel-perfect interfaces since 2015.',
      location: 'Seoul, South Korea', skills: ['Figma', 'Adobe XD', 'Branding', 'Motion'],
      hourlyRate: 60, availability: 'available', avgRating: 5.0, totalReviews: 87,
      jobsCompleted: 73, isVerified: true,
    },
    // Clients
    {
      name: 'Sarah Chen', email: 'sarah@techcorp.com',
      password: await hash('password123'), role: 'client',
      location: 'San Francisco, USA', isVerified: true,
    },
    {
      name: 'Marcus Rivera', email: 'marcus@novabrand.com',
      password: await hash('password123'), role: 'client',
      location: 'New York, USA', isVerified: true,
    },
  ]);

  console.log(`✅ Created ${users.length} users`);

  const [, , , sarah, marcus] = users;

  // ── Create jobs ───────────────────────────────
  const jobs = await Job.insertMany([
    {
      title: 'Build a React Dashboard with Charts & Analytics',
      description: 'We need a skilled developer to build a comprehensive analytics dashboard using React and Recharts. Integration with REST API required. Mobile-first responsive design.',
      client: sarah._id, category: 'development',
      skills: ['React', 'TypeScript', 'Charts', 'REST API'],
      budgetType: 'fixed', budgetMin: 2000, budgetMax: 3000,
      duration: '2_4_weeks', status: 'open',
    },
    {
      title: 'Logo & Brand Identity Design for SaaS Startup',
      description: 'Looking for a creative designer to create a modern logo and full brand identity kit including color palette, typography, and brand guidelines.',
      client: marcus._id, category: 'design',
      skills: ['Logo Design', 'Branding', 'Figma', 'Adobe Illustrator'],
      budgetType: 'fixed', budgetMin: 600, budgetMax: 1000,
      duration: '1_2_weeks', status: 'open',
    },
    {
      title: 'Full-Stack E-Commerce App (Next.js + Stripe)',
      description: 'Build a complete e-commerce platform with product listings, cart, checkout via Stripe, and admin dashboard. PostgreSQL backend.',
      client: sarah._id, category: 'development',
      skills: ['Next.js', 'Stripe', 'PostgreSQL', 'Tailwind CSS'],
      budgetType: 'fixed', budgetMin: 4000, budgetMax: 6000,
      duration: '1_3_months', status: 'open',
    },
    {
      title: 'Technical Blog Writer — AI & Machine Learning',
      description: 'Produce 2–3 high-quality blog posts per week on ML trends, data science, and AI tools. Must have strong technical background.',
      client: marcus._id, category: 'writing',
      skills: ['Technical Writing', 'AI/ML', 'SEO', 'Content Strategy'],
      budgetType: 'hourly', budgetMin: 40, budgetMax: 60,
      duration: '3_plus_months', status: 'open',
    },
    {
      title: 'Social Media Manager — Instagram & LinkedIn',
      description: 'Manage and grow our social media presence across Instagram and LinkedIn. Create content calendars, write captions, run ad campaigns.',
      client: sarah._id, category: 'marketing',
      skills: ['Social Media', 'Content Creation', 'Paid Ads', 'Analytics'],
      budgetType: 'hourly', budgetMin: 25, budgetMax: 40,
      duration: '3_plus_months', status: 'open',
    },
  ]);

  console.log(`✅ Created ${jobs.length} jobs\n`);
  console.log('🎉 Seed complete!\n');
  console.log('── Login credentials ──────────────────────');
  console.log('Freelancer:  alex@example.com     / password123');
  console.log('Freelancer:  priya@example.com    / password123');
  console.log('Client:      sarah@techcorp.com   / password123');
  console.log('Client:      marcus@novabrand.com / password123');
  console.log('───────────────────────────────────────────\n');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
