const db = require("../db/connection.js");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app");
const request = require("supertest");

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe("/api", () => {
  it("returns json file detailing all developed endpoints", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        for (let key in body) {
          expect(body[key].description).not.toBe(null);
        }
      });
  });
});

describe("/api/topics", () => {
  describe("GET", () => {
    it("get request to /api/topics will return a status 200 and an array of objects with each topic", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.topics)).toBe(true);
          body.topics.forEach((topic) => {
            expect(topic).toEqual(
              expect.objectContaining({
                slug: expect.any(String),
                description: expect.any(String),
              })
            );
          });
        });
    });
    it("returns a 404 and a message when path is incorrect", () => {
      return request(app)
        .get("/api/topic")
        .expect(404)
        .catch((err) => console.log(err));
    });
  });
});

describe("/api/articles/:articleId", () => {
  describe("GET", () => {
    it("server responds with 200 response and the test article", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body }) => {
          expect(body).toEqual({
            author: "butter_bridge",
            title: "Living in the shadow of a great man",
            article_id: 1,
            body: "I find this existence challenging",
            topic: "mitch",
            created_at: "2020-07-09T21:11:00.000Z",
            votes: 100,
            comment_count: 11,
          });
        });
    });
    it("returns with 400 status and sends back message when trying to access an article that does not exist", () => {
      return request(app)
        .get("/api/articles/99999")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Article does not exist");
        });
    });
    it("returns with 400 status and sends back message when trying to use invalid value for articleId parameter", () => {
      return request(app)
        .get("/api/articles/apple")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid input");
        });
    });
  });
  describe("PATCH", () => {
    it("Returns a 201 status and the updated article when receiving positive vote", () => {
      const voteInc = { inc_votes: 10 };
      return request(app)
        .patch("/api/articles/1")
        .send(voteInc)
        .expect(201)
        .then(({ body }) => {
          expect(body).toEqual({
            author: "butter_bridge",
            title: "Living in the shadow of a great man",
            article_id: 1,
            body: "I find this existence challenging",
            topic: "mitch",
            created_at: "2020-07-09T21:11:00.000Z",
            votes: 110,
          });
        });
    });
    it("Returns a 201 status and the updated article when receiving negative vote", () => {
      const voteInc = { inc_votes: -150 };
      return request(app)
        .patch("/api/articles/1")
        .send(voteInc)
        .expect(201)
        .then(({ body }) => {
          expect(body).toEqual({
            author: "butter_bridge",
            title: "Living in the shadow of a great man",
            article_id: 1,
            body: "I find this existence challenging",
            topic: "mitch",
            created_at: "2020-07-09T21:11:00.000Z",
            votes: -50,
          });
        });
    });
    it("returns with 400 status and sends back message when trying to update an article that does not exist", () => {
      const vote = { inc_votes: 40 };
      return request(app)
        .patch("/api/articles/99999")
        .send(vote)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Article does not exist");
        });
    });
    it("returns with 400 status and sends back message when trying to use invalid value for articleId parameter", () => {
      const vote = { inc_votes: 40 };
      return request(app)
        .patch("/api/articles/apple")
        .send(vote)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid input");
        });
    });
    it("returns with 400 status and psql error when trying to update with incorrect value data type", () => {
      const vote = { inc_votes: "honey" };
      return request(app)
        .patch("/api/articles/1")
        .send(vote)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid input");
        });
    });
    it("returns with 400 status and invalid field error when sending a body with the wrong field name", () => {
      const vote = { this_is_wrong: 1 };
      return request(app)
        .patch("/api/articles/1")
        .send(vote)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid field body");
        });
    });
  });
});

describe("/api/articles", () => {
  describe("GET", () => {
    describe("Ordering and sortby", () => {
      describe("General use testing", () => {
        it("returns a 200 response and an array of article objects when no parameters given", () => {
          return request(app)
            .get("/api/articles")
            .expect(200)
            .then(({ body }) => {
              expect(Array.isArray(body.articles)).toBe(true);
              expect(body.articles.length > 0).toBe(true);
              body.articles.forEach((article) => {
                expect(article).toEqual(
                  expect.objectContaining({
                    author: expect.any(String),
                    title: expect.any(String),
                    article_id: expect.any(Number),
                    topic: expect.any(String),
                    created_at: expect.any(String),
                    votes: expect.any(Number),
                    comment_count: expect.any(Number),
                  })
                );
              });
            });
        });
        it("By default function returns an array sorted by created_at in descending order", () => {
          return request(app)
            .get("/api/articles")
            .expect(200)
            .then(({ body }) => {
              expect(body.articles).toBeSortedBy("created_at", {
                descending: true,
              });
            });
        });
        it("function sorts by provided sort_by query param in descending order", () => {
          return request(app)
            .get("/api/articles?sort_by=article_id")
            .expect(200)
            .then(({ body }) => {
              expect(body.articles).toBeSortedBy("article_id", {
                descending: true,
              });
            });
        });
        it("function sorts by created_at in order of provided order query param", () => {
          return request(app)
            .get("/api/articles?order=asc")
            .expect(200)
            .then(({ body }) => {
              expect(body.articles).toBeSortedBy("created_at");
            });
        });
        it("function sorts by both sortBy and in order of provided query params", () => {
          return request(app)
            .get("/api/articles?sort_by=votes&order=asc")
            .expect(200)
            .then(({ body }) => {
              expect(body.articles).toBeSortedBy("votes");
            });
        });
      });
      describe("Error testing", () => {
        it("Function returns a 400 and an error message when provided a sort_by field that does not exist", () => {
          return request(app)
            .get("/api/articles?sort_by=apple")
            .expect(400)
            .then(({ body }) => {
              expect(body.message).toBe("Invalid sort field");
            });
        });
        it("Function returns a 400 and an error message when provided an invalid order value", () => {
          return request(app)
            .get("/api/articles?order=lemon")
            .expect(400)
            .then(({ body }) => {
              expect(body.message).toBe("Invalid order field");
            });
        });
      });
    });
    describe("Filtering by topic", () => {
      it("function returns a 200 response and an array of articles object with filtered topic", () => {
        return request(app)
          .get("/api/articles?topic=mitch")
          .expect(200)
          .then(({ body }) => {
            body.articles.forEach((article) => {
              expect(article.topic).toBe("mitch");
            });
          });
      });
      it("function returns a 400 response and an error message when providing invalid topic value", () => {
        return request(app)
          .get("/api/articles?topic=milk")
          .expect(400)
          .then(({ body }) => {
            expect(body.message).toBe("Invalid topic value");
          });
      });
    });
    it("function can use all query params and sends back a 200 response with an array of articles", () => {
      return request(app)
        .get("/api/articles?sort_by=article_id&topic=mitch&order=asc")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.articles)).toBe(true);
          expect(body.articles.length > 0).toBe(true);
          expect(body.articles).toBeSortedBy("article_id");
          body.articles.forEach((article) => {
            expect(article.topic).toBe("mitch");
          });
        });
    });
  });
});

describe("/api/articles/:articleId/comments", () => {
  describe("GET", () => {
    it("returns a status of 200 and an array of comments for provided article id", () => {
      return request(app)
        .get("/api/articles/1/comments")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.comments)).toBe(true);
          expect(body.comments.length > 1).toBe(true);
          body.comments.forEach((comment) => {
            expect(comment).toEqual(
              expect.objectContaining({
                comment_id: expect.any(Number),
                votes: expect.any(Number),
                created_at: expect.any(String),
                author: expect.any(String),
                body: expect.any(String),
              })
            );
          });
        });
    });
    it("returns a status of 200 and an empty array of comments when article contains 0 comments", () => {
      return request(app)
        .get("/api/articles/7/comments")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.comments)).toBe(true);
          expect(body.comments.length === 0).toBe(true);
        });
    });
    it("returns with 400 status and sends back message when trying to access comments on an article that does not exist", () => {
      return request(app)
        .get("/api/articles/99999/comments")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Article does not exist");
        });
    });
    it("returns with 400 status and sends back message when trying to use invalid value for articleId parameter", () => {
      return request(app)
        .get("/api/articles/apple/comments")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid input");
        });
    });
  });
  describe("POST", () => {
    it("returns a 201 status and the newly created comment", () => {
      const newComment = {
        username: "icellusedkars",
        body: "This is a test",
      };
      return request(app)
        .post("/api/articles/1/comments")
        .send(newComment)
        .expect(201)
        .then(({ body }) => {
          expect(body).toEqual(
            expect.objectContaining({
              comment_id: expect.any(Number),
              author: newComment.username,
              article_id: 1,
              votes: 0,
              created_at: expect.any(String),
              body: newComment.body,
            })
          );
        });
    });
    it("returns a 400 status when sending a body that has a key that is invalid", () => {
      const badComment = {
        user: "icellusedkars",
        body: "This is a test",
      };

      return request(app)
        .post("/api/articles/1/comments")
        .send(badComment)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid field body");
        });
    });
    it("returns a 400 status when sending a post request to an article that does not exist", () => {
      const comment = {
        username: "icellusedkars",
        body: "This is a test",
      };

      return request(app)
        .post("/api/articles/12345678/comments")
        .send(comment)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Value/s violate foreign key restraint");
        });
    });
    it("returns a 400 status when sending a post request with a null value", () => {
      const badComment = {
        username: "icellusedkars",
        body: null,
      };

      return request(app)
        .post("/api/articles/1/comments")
        .send(badComment)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Fields cannot be null values");
        });
    });
    it("returns a 400 status when sending a post request with a username that does not exist", () => {
      const badComment = {
        username: "fakeName",
        body: "Something to write about",
      };

      return request(app)
        .post("/api/articles/1/comments")
        .send(badComment)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Value/s violate foreign key restraint");
        });
    });
    it("returns a 400 status when sending a post request with an invalid value for article_id", () => {
      const comment = {
        username: "icellusedkars",
        body: "This is a test",
      };

      return request(app)
        .post("/api/articles/apple/comments")
        .send(comment)
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid input");
        });
    });
  });
});

describe("/api/comments/:commentId", () => {
  describe("DELETE", () => {
    it("returns a 204 status and no body when deleting valid comment", () => {
      return request(app)
        .delete("/api/comments/1")
        .expect(204)
        .then((response) => {
          expect(response.body).toEqual({});
          return db.query("SELECT * FROM comments WHERE comment_id = 1");
        })
        .then((result) => {
          expect(result.rows.length).toBe(0);
        });
    });
    it("returns a 400 status and an error message when attempting to delete a comment that does not exist", () => {
      return request(app)
        .delete("/api/comments/999999")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Comment does not exist");
        });
    });
    it("returns a 400 status and an error message when attempting to delete a comment that does not exist", () => {
      return request(app)
        .delete("/api/comments/apple")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("Invalid input");
        });
    });
  });
});

describe("/api/users", () => {
  describe("GET", () => {
    it("returns a status of 200 and an array of user objects", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.users)).toBe(true);
          body.users.forEach((user) => {
            expect(user).toEqual(
              expect.objectContaining({
                username: expect.any(String),
              })
            );
          });
        });
    });
    it("returns a status of 404 when path is incorrect", () => {
      return request(app)
        .get("/api/user")
        .expect(404)
        .then(({ body }) => {
          expect(body.message).toBe("Path not found");
        });
    });
  });
});

describe("/api/users/:username", () => {
  describe("GET", () => {
    it("returns a status of 200 and the user object", () => {
      return request(app)
        .get("/api/users/rogersop")
        .expect(200)
        .then(({ body }) => {
          expect(body).toEqual({
            username: "rogersop",
            avatar_url:
              "https://avatars2.githubusercontent.com/u/24394918?s=400&v=4",
            name: "paul",
          });
        });
    });
    it("returns a status of 400 and an error message when attempting to retrieve a user that does not exist", () => {
      return request(app)
        .get("/api/users/MrBean")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("User does not exist");
        });
    });
    it("returns a status of 400 and an error message when attempting use an invalid value", () => {
      return request(app)
        .get("/api/users/1")
        .expect(400)
        .then(({ body }) => {
          expect(body.message).toBe("User does not exist");
        });
    });
  });
});
