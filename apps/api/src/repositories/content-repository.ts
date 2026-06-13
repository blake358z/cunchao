import type { ContentItem, Post } from "@cunchao/shared";
import { comments, contents, posts, travelGuides } from "../data/mock-store.js";

export class ContentRepository {
  listContent(): ContentItem[] {
    return contents;
  }

  getContent(id: string): ContentItem | undefined {
    return contents.find((item) => item.id === id);
  }

  listPosts(): Post[] {
    return posts;
  }

  getPost(id: string): Post | undefined {
    return posts.find((post) => post.id === id);
  }

  listComments() {
    return comments;
  }

  listTravelGuides() {
    return travelGuides;
  }
}
