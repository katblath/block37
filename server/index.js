//setup
const {
  client,
  createTables,
  createUser,
  createItem,
  createComment,
  createReview,
  fetchUsers,
  fetchItems,
  fetchComments,
  fetchReviews,
  authenticate,
  findUserWithToken,
  createUserAndGenerateToken,
  deleteComment,
  deleteReview,
  updateComment,
  updateReview,
} = require("./db");
const express = require("express");
const app = express();

const port = process.env.PORT || 3000;

const init = async () => {
  await client.connect();
  //await the create tables
  await createTables();
  console.log("tables exist meow");

  //connect that yo
  app.listen(port, () => {
    console.log(`creeping on port ${port}`);
  });
};
init();
