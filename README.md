# Vzy Backend

## API Documentation

Explore the API documentation at - [API Postman Documentation](https://documenter.getpostman.com/view/24154143/2sA2r55RxV).

## Technologies Used

- MongoDB Atlas
- NestJS Framework
- Mongoose
- Stripe

## Features

1. **User Registration, Authorization, and Profile Update with JWT Token:**

   - Users can register for an account, authenticate using JWT tokens.
   - Users can update their information as needed.

2. **User Payment/Verification with Stripe Integration:**
   - Users can make payments through Stripe integration.
   - The application verifies successful payment events from Stripe.
   - Upon completion of a payment, the user's status is updated in the database.

## Getting Started

### Prerequisites

Ensure the following are installed locally:
1. [Git](https://git-scm.com)
2. [Node.js](https://nodejs.org/)
3. [NPM](https://www.npmjs.com/)

## Implementation Details

The project is implemented using NodeJS, NestJs, TypeScript, and Mongoose for database interactions. The chosen database is MongoDB Atlas.

### Setup Steps

1. **Clone the repo:**

   ```bash
   git clone https://github.com/ChuloWay/vzy-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create an env file:**

   - Duplicate the `.env.example` file in the project root.
   - Rename the duplicated file to `.env`.
   - Open the `.env` file and set your variables as shown in the example file.

   ```bash
   cp .env.example .env
   ```

   Ensure to fill in the necessary values in the `.env` file for a smooth configuration.

4. **Start your server:**

   ```bash
   npm run start:dev
   ```

### 🚀 Thank you for exploring the Vzy Backend! Happy coding!
