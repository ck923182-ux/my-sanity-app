import { defineField,defineType } from "sanity";

export const meeturTeam = defineType({
    name:"meetourteam",
    title:"Meet Our Team",
    type:"object",
    fields:[
        defineField({
            name:"title",
            title:"Title",
            type:"string",
        }),
        defineField({
            name:"content",
            title:"Content",
            type:"string",
        }),
        defineField({
            name:"image",
            title:"Image",
            type:"image",
        }),
        defineField({
            name:"name",
            title:"Name",
            type:"string",
        }),
        defineField({
            name:"designation",
            title:"Designation",
            type:"string",
        }),
        defineField({
            name:"socailmedia",
            title:"Social Media",
            type:"feature",
        })
    ]
})