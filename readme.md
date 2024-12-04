# Portal Setup Instructions

## Prerequisites

- Install `nodemon`. Ensure it is installed globally or as a development dependency.

## Steps to Run the Portal

### 1. Initialize the Project

Initialize the project by setting up your `package.json` file.

### 2. Create an `.env` File

In the root directory, create a file named `.env` and add the following variables:

- `DATABASE_URL`: Your Firebase Realtime Database URL. This can be found in your Firebase project under **Realtime Database** (you may need to create one if it doesn’t exist).
- `SESSION_SECRET`: A secret key for sessions. You can either create one yourself or generate it using a key generator like [this one](https://theorangeone.net/projects/django-secret-key-generator/).

**Example `.env` file:**
DATABASE_URL=<Your Firebase Database URL>
SESSION_SECRET=<Your Generated Session Key>

### 3. Generate Firebase Service Account Key

1. Go to **Firebase Console** → **Project Settings** → **Service Accounts**.
2. Click **Generate New Private Key** to download the key as a JSON file.
3. Save the file to your project directory and rename it to:

### 4. Run the Project

Start the application using `node index.js`. Ensure all the required setup steps are complete before running the project.
