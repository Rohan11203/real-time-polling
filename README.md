# Real-Time Polling Application Backend

This project is a backend service for a real-time polling application, built as part of the Move37 Ventures Backend Developer Challenge. It features a RESTful API for managing users, polls, and votes, along with a WebSocket layer for broadcasting live poll results to all connected clients.

## Technologies Used

* **Backend:** Node.js, Express.js, TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Real-time Communication:** WebSockets (`ws` library)

## Features

* **RESTful API:** Full CRUD functionality for Users, Polls, and Votes.
* **Database Schema:** A well-defined relational schema with one-to-many and many-to-many relationships.
* **Live Updates:** A WebSocket server pushes real-time vote count updates to clients subscribed to a specific poll.
* **Scalable Structure:** Organized into controllers, routes, and services for maintainability.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/en/) (v18.x or later recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js)
* [PostgreSQL](https://www.postgresql.org/download/)
* [Postman](https://www.postman.com/downloads/) (for testing the API and WebSockets)

## 1. Setup and Installation

Follow these steps to get your development environment set up.

**1. Clone the repository:**
```bash
git clone https://github.com/Rohan11203/real-time-polling
cd real-time-polling
```

**2. Install dependencies:**
```bash
npm install
```
**3. Set up environment variables:**
Create a .env file in the root of the project by copying the example file:
```bash
cp .env.example .env
```
Now, open the .env file and update the DATABASE_URL with your PostgreSQL connection string.
```bash
PORT=PORT
DATABASE_URL=YOUR_DATABASE_URL
```

**4. Run database migrations:**
This command will create the database (if it doesn't exist) and apply the schema defined in prisma/schema.prisma.
```bash
npx prisma migrate dev
```
It will also run prisma generate to create the typed Prisma Client for your project.

## 2. Running the Application

To start the development server, run the following command:
```bash
npm run dev
```

## 3. How to Test with Postman

This guide will walk you through the entire application flow.

### Step 1: Create a User

Create a new `POST` request in Postman.

* **URL:** `http://localhost:3000/api/users/create`
* **Body:** `raw` > `JSON`
* **Content:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123"
  }
* **Hit Send. You will get a response with the newly created user, including their id. Copy this id for the next step.**

### Step 2: Create a Poll

Create a new `POST` request.

* **URL:** `http://localhost:3000/api/polls/create`

* **Body:** `raw` > `JSON`

* **Content:** (Paste the user `id` you copied into `creatorId`)

  ```json
  {
    "question": "Best Frontend ?",
    "creatorId": "cmfikd2xj0000kfzseoer8qxq",
    "options": ["NExt", "React", "Vue"]
  }
  ```


* **Hit Send. The response will contain the poll and its options. Copy the poll id and one of the pollOption ids for later steps. **

### Step 3: Connect to the WebSocket

Now, let's listen for live updates for the poll you just created.

1.  In Postman, click the **New** button and select **WebSocket Request**.
2.  Enter the server URL: `ws://localhost:3000/`
3.  Click **Connect**. You should see a "Connected" status message.
4.  In the message composer at the bottom, enter the following JSON message to subscribe to your poll's updates. (Paste the poll `id` you copied).
    ```json
    {
      "type": "SUBSCRIBE",
      "pollId": "paste-poll-id-here"
    }
    ```
5.  Click **Send**. You will receive a confirmation message like `{"type":"SUBSCRIBED","pollId":"..."}`.

Keep this WebSocket connection open.

### Step 4: Cast a Vote

Go back to your HTTP requests and create a new `POST` request.

* **URL:** `http://localhost:3000/api/polls/paste-poll-id-here/vote` (Paste the poll id into the URL))
* **Body:** `raw` > `JSON`
* **Content:** (Paste the user `id` and the `pollOption` `id` you copied).
    ```json
    {
      "pollOptionId": "paste-poll-option-id-here",
      "userId": "paste-user-id-here"
    }
    ```
* Hit **Send**. You'll get a confirmation that the vote was cast.

### Step 5: See the Live Update!

Immediately after you cast the vote, switch back to your WebSocket Request tab in Postman. You will see a new message has arrived automatically in the "Messages" panel, showing the updated vote counts for your poll!

```json
{
    "type": "POLL_UPDATE",
    "pollId": "...",
    "results": [
        { "id": "...", "text": "JavaScript", "voteCount": 1 },
        { "id": "...", "text": "Python", "voteCount": 0 },
        { "id": "...", "text": "Rust", "voteCount": 0 }
    ]
}
```
* **You have successfully tested the entire real-time update flow!**

## API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/users/create` | Creates a new user. |
| `POST` | `/api/polls/create` | Creates a new poll with its options. |
| `POST` | `/api/polls/:pollId/vote` | Submits a vote for a poll option. |
| `GET` | `/api/polls/:pollId` | Retrieves a poll with vote counts. |
