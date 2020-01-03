const express = require("express");
const cors = require("cors");
const keys = require("./keys");

const app = express();
app.use(cors());
app.use(express.json());

// postgre client setup
const { Pool } = require("pg");

const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort
});

pgClient.on("error", () => {
  console.log("Lost PG connection.");
});

pgClient
  .query("CREATE TABLE IF NOT EXISTS values (number INT)")
  .catch(error => console.log("ERROR on creating table :", error));

// redis client setup
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const redisPublisher = redisClient.duplicate();

// express route handlers
app.get("/", (req, res) => {
  res.send("hi");
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * FROM values");
  // send database rows.
  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  // reach redis, calculate fibo values.

  // look at hash and get all the information from it.
  redisClient.hgetall("values", (err, values) => {
    if (err) {
      console.log("error : ", err);
    }
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;

  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high.");
  }

  redisClient.hset("values", index, "Nothing yet!");
  redisPublisher.publish("insert", index);
  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]); // store index to postgre.

  res.send({ working: true });
});

app.listen(5000, err => {
  console.log("Listening on 5000");
});
