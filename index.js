const express = require("express");
const app = express();
const bcrypt = require('bcrypt');


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

    app.post("/users", async(req, res) => {
      const userData = req.body;

      const plainPass= userData.passCode;

      const saltRounds = 10; 
      const hashedPass = await bcrypt.hash(plainPass, saltRounds);

      // console.log(`Plain Password: ${plainPass}`);
      // console.log(`Hashed Password: ${hashedPass}`);
      const addData ={
        username: userData.username,
        email: userData.email,
        passcode: hashedPass
      }

      const result = await userColl.insertOne(addData)

      res.send(result);
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
