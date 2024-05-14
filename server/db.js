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
        displayname VARCHAR(100),
        password VARCHAR(100) NOT NULL,
        token VARCHAR(100)
    );

    CREATE TABLE items(
        id UUID PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC (3,2) NOT NULL,
        avgScore NUMERIC(3, 2)
    );

    CREATE TABLE reviews(
        id UUID PRIMARY KEY,
        review VARCHAR(1000) NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
        itemId UUID REFERENCES items(id),
        userId UUID REFERENCES users(id),
        CONSTRAINT unique_review UNIQUE (itemId, userId)
    );
    CREATE TABLE reviewComments(
        id UUID PRIMARY KEY,
        comment VARCHAR(1000) NOT NULL,
        itemId UUID REFERENCES items(id),
        userId UUID REFERENCES users(id),
        reviewId UUID REFERENCES reviews(id),
        CONSTRAINT unique_comment UNIQUE (itemId, userId,reviewId)
    );
`;
  await client.query(SQL);
};

//create user in db from code
const createUser = async ({ username, password }) => {
  try {
    const SQL = `--sql
    INSERT INTO users(id, username, password, displayname, token)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `;
    const response = await client.query(SQL, [
      uuid.v4(),
      username,
      await bcrypt.hash(password, 10),
    ]);
    return response.rows[0];
  } catch (error) {
    throw error;
  }
};

//create item in db from code
const createItem = async ({ name, category, price, avgScore }) => {
  try {
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
  } catch (error) {
    throw error;
  }
};

module.exports = {
  client,
  createTables,
  //   createUser,
  //   createItem,
  //   createReviewComment,
  //   createReview,
  //   fetchUsers,
  //     fetchItems,
  //     fetchComments,
  //     fetchReviews,
  //     authenticate,
  //     findUserWithToken,
  //     createUserAndGenerateToken,
  //     deleteComment,
  //     deleteReview,
  //     updateComment,
  //     updateReview,
};
