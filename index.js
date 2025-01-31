const express = require("express");
const app = express();
const bcrypt = require("bcrypt");

require("dotenv").config();
const port = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.PASS}@cluster0.oeipnk8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const myDB = client.db("FileVault");
    const userColl = myDB.collection("registeredUser");

    //user registration api
    app.post("/user", async (req, res) => {
      const userData = req.body;
      const plainPass = userData.passCode;

      const saltRounds = 10;
      const hashedPass = await bcrypt.hash(plainPass, saltRounds);

      // Check if the username or email already exists
      const existingUser = await userColl.findOne({
        $or: [{ username: userData.username }, { email: userData.email }],
      });

      if (existingUser) {
        if (existingUser.username === userData.username) {
          return res.status(400).send({ message: "Username already exists" });
        }
        if (existingUser.email === userData.email) {
          return res.status(400).send({ message: "Email already exists" });
        }
      }

      // Prepare the new user data to insert
      const addData = {
        username: userData.username,
        email: userData.email,
        passcode: hashedPass,
      };

      try {
        const result = await userColl.insertOne(addData);
        res.status(201).send({
          success: true,
          message: "User created successfully",
          data: result,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Internal server error" });
      }
    });

    //user login API
    app.get("/user", async (req, res) => {
      const { email, passcode } = req.query;
      console.log(`email: ${email}`);

      const userServerData = await userColl.findOne({ email: email });

      const storedHash = userServerData.passcode;
      bcrypt.compare(passcode, storedHash, (err, result) => {
        if (err) {
          return res.status(500).send({ message: "Internal server error" });
        }

        if (result) {
          res.status(200).send({ message: "Login successful", user: userServerData });
        } else {
          res.status(401).send({ message: "Invalid passcode" });
        }
      });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
