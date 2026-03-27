# Artisant – Artisanal E-commerce & Management Platform

## Overview
This project was developed as part of the **PIDEV – 4th Year Engineering Program (4TWIN1)** at **Esprit School of Engineering** (Academic Year 2025–2026). 
Artisant is a comprehensive full-stack application designed by **NextGen Devs** to empower artisans, manufacturers, and experts by providing a platform for marketplace interactions, product management, and efficient order tracking.

## Features
- **Role-Based Access Control**: Secure login/registration for Artisans, Manufacturers, Experts, and Admins.
- **Dynamic Marketplace**: Exploration and listing of artisanal products.
- **Order Management System**: Full lifecycle tracking from creation through status updates and history.
- **Product Management**: Robust tools for manufacturers and admins to manage their catalogs.
- **Accessibility & Inclusivity**: Built with Gesture Control and Screen Reader optimizations.
- **Analytics Dashboards**: Insightful monitoring for both users and administrators.

## Tech Stack
### Frontend
- **React 19** with **Vite**
- **Tailwind CSS** for modern, responsive styling
- **Zustand** for state management
- **Framer Motion** for smooth animations
- **Lucide-React** for iconography
- **React-Router-DOM** for navigation

### Backend
- **Node.js** & **Express** (API framework)
- **MongoDB** with **Mongoose** (Database)
- **JWT** (Authentication)
- **Bcrypt.js** (Security)
- **Morgan** (Logging)

## Architecture
Artisant follows a **MERN stack** architecture with a clear separation between the client and server. The backend exposes a RESTful API consumed by the React-based single-page application (SPA).

## Contributors
- **NextGen Devs**

## Academic Context
Developed at **Esprit School of Engineering – Tunisia**  
PIDEV – 4TWIN1 | 2025–2026  
*Project Group: NextGen Devs*


## Getting Started
### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### Installation
1. Clone the repository:
   ```bash
   git clone [your-github-url-here]
   ```
2. Setup Backend:
   ```bash
   cd server
   npm install
   # Create a .env file with PORT, MONGODB_URI, JWT_SECRET
   npm run dev
   ```
3. Setup Frontend:
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

## Acknowledgments
We would like to thank **Esprit School of Engineering** for providing the academic framework and tools to build this project. Special thanks to the mentors and the engineering community for their support.
