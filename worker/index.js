const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

sub.on("message", (channel, message) => {
  console.log("channel is : ", channel);
  console.log("message is : ", message);

  redisClient.hset("values", message, fib(parseInt(message)));
});

// any time someone inserts value to redis, this triggers.
sub.subscribe("insert");
