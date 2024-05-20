//hide the goods
require("dotenv").config();
//create a db client
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/items_block37"
);
// other stuff you gonna want declared
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT = process.env.JWT;

//create tables in a db from code
const createTables = async () => {
  const SQL = `--sql
    DROP TABLE IF EXISTS reviewComments;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users(
        id UUID PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL
      );

    CREATE TABLE items(
        id UUID PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC (7,2) NOT NULL,
        avgScore NUMERIC(4, 2)
    );

    CREATE TABLE reviews(
        id UUID PRIMARY KEY,
        review VARCHAR(1000) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
        itemId UUID REFERENCES items(id),
        userId UUID REFERENCES users(id),
        CONSTRAINT unique_review UNIQUE (itemId, userId)
    );
    CREATE TABLE reviewComments(
        id UUID PRIMARY KEY,
        comment VARCHAR(1000) NOT NULL,
        itemsId UUID REFERENCES items(id),
        userId UUID REFERENCES users(id),
        reviewId UUID REFERENCES reviews(id)
    );
`;
  await client.query(SQL);
};

//create user in db from code
const createUser = async ({ username, password }) => {
  const SQL = `--sql
      INSERT INTO users(id, username, password)
      VALUES ($1, $2, $3)
      RETURNING *;
      `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    await bcrypt.hash(password, 2),
  ]);
  return response.rows[0];
};

//create item in db from code
const createItem = async ({ name, category, price, avgScore }) => {
  const SQL = `--sql
    INSERT INTO items(id, name, category, price, avgScore)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;
  const response = await client.query(SQL, [
    uuid.v4(),
    name,
    category,
    price,
    avgScore,
  ]);
  return response.rows[0];
};

//create review in db from code, oy
const createReview = async ({ review, score, itemId, userId }) => {
  const SQL = `--sql
    INSERT INTO reviews(id, review, score, itemId, userId)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;
  const response = await client.query(SQL, [
    uuid.v4(),
    review,
    score,
    itemId,
    userId,
  ]);
  return response.rows[0];
};

//create a mechanism to update a review
const updateReview = async ({ review, score, userId, id }) => {
  // console.log("review", review, "score", score, "userId", userId);
  const SQL = `--sql
    UPDATE reviews
    SET review = $1, score = $2
    WHERE userId = $3 and id = $4
    RETURNING *;
    `;
  const response = await client.query(SQL, [review, score, userId, id]);
  return response.rows[0];
};

//delete a review that I created
const deleteReview = async ({ id, userId }) => {
  const dependentComments = await client.query(
    `SELECT COUNT(*) FROM reviewComments WHERE reviewId = $1`,
    [id]
  );
  if (dependentComments.rows[0].count > 0) {
    throw new Error("Cannot delete review with dependent comments");
  }
  const SQL = `--sql
    DELETE FROM reviews
    WHERE id = $1 and userId = $2
    `;
  await client.query(SQL, [id, userId]);
};

//create reviewComments in db from code, oy
const createReviewComment = async ({ comment, itemsId, userId, reviewId }) => {
  const SQL = `--sql
    INSERT INTO reviewComments(id, comment, itemsId, userId, reviewId)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;
  const response = await client.query(SQL, [
    uuid.v4(),
    comment,
    itemsId,
    userId,
    reviewId,
  ]);
  return response.rows[0];
};

//delete reviewComments in db from code, oy
const deleteReviewComment = async ({ id, userId }) => {
  const SQL = `--sql
    DELETE FROM reviewComments
    WHERE id = $1 and userId = $2
    RETURNING *;
    `;
  await client.query(SQL, [id]);
};

//update a COMMENT
const updateComment = async ({ comment, userId, id }) => {
  const SQL = `--sql
    UPDATE reviewComments
    SET comment = $1
    WHERE userId = $2 and id = $3
    RETURNING *;
    `;
  const response = await client.query(SQL, [comment, userId, id]);
  return response.rows[0];
};

//authenticate user
const authenticate = async ({ username, password }) => {
  const SQL = `--sql
      SELECT id, password
      FROM users
      WHERE username = $1
      `;
  const response = await client.query(SQL, [username]);
  if (
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) === false
  ) {
    const error = Error("you know you aint authorized");
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id }, JWT);
  console.log("this is token from db authenticate", token);
  return { token };
};

//find a user with a token
const findUserByToken = async (token) => {
  let id;
  try {
    const payload = await jwt.verify(token, JWT);
    console.log(`payload`, payload);
    id = payload.id;
  } catch (err) {
    const error = Error("you know you aint authorized");
    error.status = 401;
    throw error;
  }
  const SQL = `--sql
        SELECT * FROM users WHERE id = $1
        `;
  //use id instead of token, eh?
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("you know you aint authorized");
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

//--------------------fetching data from db--------------------
//fetch users
const fetchUsers = async () => {
  const SQL = `--sql
    SELECT * FROM users;
    `;
  const response = await client.query(SQL);
  return response.rows;
};

//fetch ALL items (no login)
const fetchItems = async () => {
  const SQL = `--sql
    SELECT * FROM items;
    `;
  const response = await client.query(SQL);
  return response.rows;
};

//fetch a SINGLE item  (no login)
const fetchItem = async (id) => {
  const SQL = `--sql
    SELECT * FROM items
    where id = $1
    `;
  const response = await client.query(SQL, [id]);
  return response.rows;
};

//------ALL---------fetch all reviews
const fetchReviews = async () => {
  const SQL = `--sql
    SELECT * FROM reviews;
    `;
  const response = await client.query(SQL);
  return response.rows;
};

//-----ONE item's reviewS------fetch all reviews for an item
const fetchItemReviews = async (itemId) => {
  const SQL = `--sql
    SELECT * FROM reviews
    WHERE itemId = $1;
    `;
  const response = await client.query(SQL, [itemId]);
  return response.rows;
};

//------ONE SINGLE REVIEW, who cares about the item id ... hahaha we do
const fetchSingleReview = async ({ itemId, id }) => {
  // console.log("itemId", itemId, "id", id);
  const SQL = `--sql
    SELECT * FROM reviews
    WHERE itemId = $1 and id = $2;
    `;
  const response = await client.query(SQL, [itemId, id]);
  return response.rows[0];
};

//--------ALL - fetch all review comments
fetchReviewComments = async () => {
  const SQL = `--sql
    SELECT * FROM reviewComments;
    `;
  const response = await client.query(SQL);
  return response.rows;
};

//--------ONE - fetch all JUST MY reviews
fetchMyReviews = async (userId) => {
  const SQL = `--sql
    SELECT * FROM reviews
    WHERE userId = $1;
    `;
  const response = await client.query(SQL, [userId]);
  return response.rows;
};

//get all my comments and the dependent reviewId and subdependent itemId dont matter
fetchMyComments = async (userId) => {
  const SQL = `--sql
    SELECT * FROM reviewComments
    WHERE userId = $1;
    `;
  const response = await client.query(SQL, [userId]);
  return response.rows;
};

//delete a comment that I created
const deleteComment = async ({ id, userId }) => {
  const SQL = `--sql
    DELETE FROM reviewComments
    WHERE id = $1 and userId = $2
    RETURNING *;
    `;
  await client.query(SQL, [id, userId]);
};

module.exports = {
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
  fetchReviewComments,
  fetchMyComments,
  deleteReviewComment,
  fetchItem,
  fetchMyReviews,
  updateReview,
  deleteReview,
  updateComment,
  authenticate,
  findUserByToken,
  deleteComment,
};
