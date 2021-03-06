jest.useFakeTimers();

const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");

const api = supertest(app);

const initialUser = {
  username: "test",
  name: "John",
  password: "hunter8",
};

const initialBlogs = [
  {
    title: "First blog",
    url: "http://localhost:1234/1-blog",
    likes: 5,
  },
  {
    title: "Next blog",
    url: "http://localhost:1234/next-blog",
  },
  {
    title: "Other thing posted here",
    url: "http://localhost:1234/other-thing-posted-here",
  },
];

let user = null;
let token = null;

beforeAll(async () => {
  await User.deleteMany({});
  const createUser = await api.post("/api/users").send(initialUser);
  user = createUser.body;
  const response = await api
    .post("/api/login")
    .send({ username: initialUser.username, password: initialUser.password });
  token = response.body.token;
});

beforeEach(async () => {
  await Blog.deleteMany({});

  await Promise.all(
    initialBlogs
      .map((blog) => new Blog({ ...blog, author: user.id }))
      .map((blog) => blog.save())
  );
});

describe("blogs", () => {
  test("are returned as JSON", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("there is a proper number of blogs returned", async () => {
    const response = await api.get("/api/blogs");
    const blogs = response.body;
    expect(blogs).toHaveLength(3);
  });

  test("each blog has an ID defined", async () => {
    const response = await api.get("/api/blogs");
    const blogs = response.body;

    blogs.forEach((blog) => {
      expect(blog.id).toBeDefined();
    });
  });
});

describe("creating a post", () => {
  test("is possible", async () => {
    const response = await api
      .post("/api/blogs")
      .send({
        title: "New blog",
        author: user.id,
        url: "http://localhost:1234/new-blog",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(201);

    const count = await Blog.countDocuments({});
    expect(count).toBe(4);
  });

  test("is not possible without token", async () => {
    const response = await api.post("/api/blogs").send({
      title: "New blog",
      author: user.id,
      url: "http://localhost:1234/new-blog",
    });

    expect(response.status).toBe(401);

    const count = await Blog.countDocuments({});
    expect(count).toBe(3);
  });

  test("and ommiting the like field makes it a default 0", async () => {
    const result = await api
      .post("/api/blogs")
      .send({
        title: "New blog",
        author: user.id,
        url: "http://localhost:1234/new-blog",
      })
      .set("Authorization", `Bearer ${token}`);

    const blog = result.body;

    expect(blog.likes).toBeDefined();
    expect(blog.likes).toBe(0);
  });

  test("and ommiting either title or URL gives response with HTTP 400", async () => {
    const result = await api
      .post("/api/blogs")
      .send({
        author: user.id,
        url: "http://localhost:1234/new-blog",
      })
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(400);
  });
});

describe("removing a post", () => {
  test("works", async () => {
    const response = await api.get("/api/blogs");
    const blogs = response.body;

    const result = await api
      .delete(`/api/blogs/${blogs[0].id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(result.status).toBe(204);
  });

  test("doesn't work for not logged in", async () => {
    const response = await api.get("/api/blogs");
    const blogs = response.body;

    const result = await api.delete(`/api/blogs/${blogs[0].id}`);

    expect(result.status).toBe(401);
  });
});

describe("updating a post", () => {
  test("properly increases number of likes", async () => {
    const response = await api.get("/api/blogs");
    const blogs = response.body;

    const firstPost = await api.get(`/api/blogs/${blogs[0].id}`);

    expect(firstPost.body.likes).toBe(5);

    const result = await api.put(`/api/blogs/${blogs[0].id}`).send({
      title: "First blog",
      author: user.id,
      url: "http://localhost:1234/1-blog",
      likes: 15,
    });

    expect(result.body.likes).toBe(15);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
