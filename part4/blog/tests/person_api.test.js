jest.useFakeTimers();

const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/Blog");

const api = supertest(app);

const initialBlogs = [
  {
    title: "First blog",
    author: "Me",
    url: "http://localhost:1234/1-blog",
    likes: 5,
  },
  {
    title: "Next blog",
    author: "John Doe",
    url: "http://localhost:1234/next-blog",
  },
  {
    title: "Other thing posted here",
    author: "Me",
    url: "http://localhost:1234/other-thing-posted-here",
  },
];

beforeEach(async () => {
  await Blog.deleteMany({});
  await Promise.all(
    initialBlogs.map((blog) => new Blog(blog)).map((blog) => blog.save())
  );

  // TODO:
  // - fix the first test to actually expect a proper count of those
});

describe("blogs", () => {
  test("blogs are returned as JSON", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("there is a proper number of blogs returned", async () => {
    const response = await api.get("/api/blogs");
    const blogs = JSON.parse(response.text);
    expect(blogs).toHaveLength(3);
  });

  test("each blog has an ID defined", async () => {
    const response = await api.get("/api/blogs");
    const blogs = JSON.parse(response.text);

    blogs.forEach((blog) => {
      expect(blog.id).toBeDefined();
    });
  });

  test("creation of a new post is possible", async () => {
    // TODO
  });

  test("creating a post and ommiting the like field makes it a default 0", async () => {
    // TODO
  });

  test("creating a post and ommiting either title or URL gives response with HTTP 400", async () => {
    // TODO
  });
});

afterAll(() => {
  mongoose.connection.close();
});
