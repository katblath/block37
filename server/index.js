//setup
const {
  client,
  createTables,
  createUser,
  createItem,
  createReview,
  createReviewComment,
  fetchUsers,
  fetchItems,
  fetchReviews,
  fetchItemReviews,
  fetchSingleReview,
  fetchMyReviews,
  updateReview,
  deleteReview,
  fetchReviewComments,
  deleteReviewComment,
  fetchItem,
  //   deleteReview,
  //     updateComment,
  //     updateReview,
  authenticate,
  findUserByToken,
  //     createUserAndGenerateToken,
} = require("./db");

//create a service using express
const express = require("express");
//the app in the service
const app = express();
//body parser
app.use(express.json());

//are they logged in, yo?
const isLoggedIn = async (req, res, next) => {
  try {
    console.log("req.headers", req.headers.authorization);
    req.headers.authorization = req.headers.authorization.replace(
      "Bearer ",
      ""
    );
    req.user = await findUserByToken(req.headers.authorization);
    next();
  } catch (error) {
    next(error);
  }
};

//--------------------routes--------------------
//login- ------------REQUIRED ROUTE: 4
app.post("/api/auth/login", async (req, res, next) => {
  try {
    console.log("req.body", req.body);
    res.send(await authenticate(req.body));
  } catch (ex) {
    next(ex);
  }
});

//auth me route------------REQUIRED ROUTE: 5
app.get("/api/auth/me", isLoggedIn, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

//register route------------REQUIRED ROUTE: 3
app.post("/api/auth/register", async (req, res, next) => {
  try {
    res.send(await createUser(req.body));
  } catch (ex) {
    next(ex);
  }
});

//get items not logged in------------REQUIRED ROUTE: 1
app.get("/api/items", async (req, res, next) => {
  try {
    res.send(await fetchItems());
  } catch (ex) {
    next(ex);
  }
});

//get a single item by param id not logged in ------------REQUIRED ROUTE: 2
app.get("/api/items/:id", async (req, res, next) => {
  try {
    console.log("req.params.id", req.params.id);
    res.send(await fetchItem(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

// ---------------------------------------------REVIEW routes notlogged in
//get reviews for an item not logged in------------REQUIRED ROUTE: 6
app.get("/api/items/:id/reviews", async (req, res, next) => {
  try {
    res.send(await fetchItemReviews(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

//get a single review for an item not logged in------------REQUIRED ROUTE: 7
app.get("/api/items/:itemId/reviews/:id", async (req, res, next) => {
  // console.log("req.params", req.params);
  try {
    res.send(
      await fetchSingleReview({ itemId: req.params.itemId, id: req.params.id })
    );
  } catch (ex) {
    next(ex);
  }
});

// ------------------------------------------------------------------REVIEW routes LOGGED-IN
//create a review against an item and IS loggedIn REQUIRED ------------REQUIRED ROUTE: 8
app.post("/api/items/:itemId/reviews", isLoggedIn, async (req, res, next) => {
  console.log("req.user", req.user);
  // console.log("req.params.itemId", req.params.itemId);
  try {
    res.status(201).send(
      await createReview({
        ...req.body,
        userId: req.user.id,
        itemId: req.params.itemId,
      })
    );
  } catch (error) {
    next(error);
  }
});

// get all my reviews-------------------------REQUIRED ROUTE: 9
app.get("/api/reviews/me", isLoggedIn, async (req, res, next) => {
  console.log("req.user", req.user.id);
  try {
    res.send(await fetchMyReviews(req.user.id));
  } catch (ex) {
    next(ex);
  }
});

//allow logged in user to edit a review they created------------REQUIRED ROUTE: 10
app.put(
  "/api/users/:userId/reviews/:id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      res.send(
        await updateReview({
          ...req.body,
          userId: req.user.id,
          id: req.params.id,
        })
      );
    } catch (ex) {
      next(ex);
    }
  }
);

//allow logged in user to delete a review they created------------REQUIRED ROUTE: 11
app.delete(
  "/api/users/:userId/reviews/:id",
  isLoggedIn,
  async (req, res, next) => {
    try {
      await deleteReview({ id: req.params.id, userId: req.user.id });
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
);

// all the comment making editing and deleting while logged in shall be below
//create a comment against a review------------REQUIRED ROUTE: 12
app.post(
  "/api/items/:id/reviews/:id/comments",
  isLoggedIn,
  async (req, res, next) => {
    try {
      res.status(201).send(
        await createReviewComment({
          ...req.body,
          userId: req.user.id,
          reviewId: req.params.id,
          itemsId: req.params.id,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

//error stuff
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message || err });
});

//init it
const init = async () => {
  const port = process.env.PORT || 3000;

  await client.connect();
  //await the create tables
  await createTables();
  console.log("tables exist meow");

  //create the data now, oy
  const [
    geologistgovern,
    giganticugly,
    artistetnt,
    amanda,
    betty,
    carly,
    dyson,
    edison,
    frankfurter,
    washer,
    dryer,
    peacock,
    troll,
    hearts,
    eyes,
    pinkies,
  ] = await Promise.all([
    createUser({ username: "geologistgovern", password: "password" }),
    createUser({ username: "giganticugly", password: "password" }),
    createUser({ username: "artistetnt", password: "password" }),
    createUser({ username: "amanda", password: "password" }),
    createUser({ username: "betty", password: "password" }),
    createUser({ username: "carly", password: "password" }),
    createUser({ username: "dyson", password: "password" }),
    createUser({ username: "edison", password: "password" }),
    createUser({ username: "frankfurter", password: "password" }),
    createItem({
      name: "washer",
      category: "clothes",
      price: 1.99,
      avgScore: 5,
    }),
    createItem({
      name: "dryer",
      category: "clothes",
      price: 2.99,
      avgScore: 4,
    }),
    createItem({
      name: "peacock",
      category: "animal",
      price: 3.99,
      avgScore: 3,
    }),
    createItem({
      name: "troll",
      category: "human",
      price: 4.99,
      avgScore: 2,
    }),
    createItem({
      name: "hearts",
      category: "bodypart",
      price: 5.99,
      avgScore: 1,
    }),
    createItem({
      name: "eyes",
      category: "bodypart",
      price: 6.99,
      avgScore: 10,
    }),
    createItem({
      name: "pinkies",
      category: "bodypart",
      price: 7.99,
      avgScore: 0,
    }),
  ]);
  //fetch what we made
  const users = await fetchUsers();
  // console.log("fetched-users", users);

  const items = await fetchItems();
  // console.log("fetched-items", items);

  //more creating data for a database in code
  const [review1, review2, review3, review4, review5, review6, review7] =
    await Promise.all([
      createReview({
        review: `good enough to eat`,
        score: 5,
        itemId: washer.id,
        userId: geologistgovern.id,
      }),
      createReview({
        review: `hard time flushing it`,
        score: 4,
        itemId: dryer.id,
        userId: giganticugly.id,
      }),
      createReview({
        review: `tastes great`,
        score: 9,
        itemId: dryer.id,
        userId: artistetnt.id,
      }),
      createReview({
        review: `less filling`,
        score: 6,
        itemId: dryer.id,
        userId: betty.id,
      }),
      createReview({
        review: `not worth the time`,
        score: 3,
        itemId: peacock.id,
        userId: artistetnt.id,
      }),
      createReview({
        review: `not worth the money`,
        score: 2,
        itemId: troll.id,
        userId: amanda.id,
      }),
      createReview({
        review: `not worth the effort`,
        score: 1,
        itemId: hearts.id,
        userId: betty.id,
      }),
      createReview({
        review: `not worth the energy`,
        score: 10,
        itemId: eyes.id,
        userId: carly.id,
      }),
      createReview({
        review: `not worth the pain`,
        score: 0,
        itemId: pinkies.id,
        userId: dyson.id,
      }),
    ]);
  //fetch some more stuff
  const reviews = await fetchReviews();
  // console.log("fetched-reviews", reviews);

  //create comments against reviews via CODE! oy
  const [comment1, comment2, comment3, comment4, comment5, comment6, comment7] =
    await Promise.all([
      createReviewComment({
        comment: `liar`,
        itemsId: washer.id,
        userId: geologistgovern.id,
        reviewId: review1.id,
      }),
      createReviewComment({
        comment: `i agree`,
        itemsId: dryer.id,
        userId: giganticugly.id,
        reviewId: review2.id,
      }),
      createReviewComment({
        comment: `never has someone been more wrong`,
        itemsId: dryer.id,
        userId: artistetnt.id,
        reviewId: review3.id,
      }),
      createReviewComment({
        comment: `why me`,
        itemsId: dryer.id,
        userId: amanda.id,
        reviewId: review4.id,
      }),
      createReviewComment({
        comment: `will i ever know my bio-dad`,
        itemsId: peacock.id,
        userId: betty.id,
        reviewId: review5.id,
      }),
      createReviewComment({
        comment: `how many pigs are needed for a poke`,
        itemsId: hearts.id,
        userId: carly.id,
        reviewId: review6.id,
      }),
      createReviewComment({
        comment: `until we meet again`,
        itemsId: eyes.id,
        userId: dyson.id,
        reviewId: review7.id,
      }),
    ]);
  // await deleteReviewComment({ id: comment1.id, userId: geologistgovern.id });

  //connect that yo
  app.listen(port, () => {
    console.log(`creeping on port ${port}`);
  });
};
init();
