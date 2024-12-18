# Portal Setup Instructions

## Prerequisites

- Install `node`.

## Steps to Run the Portal

### 1. Initialize the Project

In your terminal, initialize the project by running:

```bash
npm install
```

### 2. Create an `.env` File

In the root directory, create a file named `.env` and add the following variables:

- `DATABASE_URL`: Your Firebase Realtime Database URL. This can be found in your Firebase project under **Realtime Database** (you may need to create one if it doesn’t exist).
- `SESSION_SECRET`: A secret key for sessions. You can either create one yourself or generate it using a key generator like [this one](https://theorangeone.net/projects/django-secret-key-generator/).

Example `.env` file:

```bash
DATABASE_URL=(Your Firebase Database URL)
SESSION_SECRET=(Your Generated Session Key)
```

### 3. Generate Firebase Service Account Key

1. Go to **Firebase Console** → **Project Settings** → **Service Accounts**.
2. Click **Generate New Private Key** to download the key as a JSON file.
3. Save the file to your project directory and rename it to: tentamina.json

### 4. Find Your IP Address

Make sure the computer running the server and the Android tablet are on the same network. Find your IP address as follows:

- Mac: Open your terminal and type:

```bash
ipconfig getifaddr en0
```

- Windows:

1. Open Command Prompt.
2. Run:

```bash
ipconfig
```

3. Look for the IPv4 Address under your active network connection.

### 5. Set Your IP Address

Update the IP address in the following locations:
In Android Studio:

1. Open the ServerHandler.kt file and update the HOST variable with your IP address.

```bash
private val HOST = "x"
```

2. Navigate to the res/xml/network_security_config.xml file and locate this line:

```bash
<domain includeSubdomains="true">x</domain>
```

- Replace x with your IP address.

### 6. Run the Project

Start the server by running the following command in your terminal:

```bash
node index.js
```

### 7. Create a Tenta

1. In your browser, go to: "localhost:3000"
2. Log in to the portal and create a tenta. (username: admin, password: notAdmin)
3. Verify in Firebase that the tenta has been successfully created.

### 8. Connect the Tablet to the Tenta

1. On the Android tablet, open the app and log in using the tenta name you created.
2. Use one of the hardcoded student credentials to log in.
