import { defineType, defineField } from "sanity";

export const headingComponent = defineType({
  name: "headingComponent",
  title: "Heading",
  type: "object",
  fields: [
    defineField({
      name: "heading",
      type: "string",
    }),
    defineField({
      name: "headingTag",
      type: "string",
      options: {
        list: ["h1", "h2", "h3", "h4", "h5", "h6"],
      },
    }),
  ],
});
