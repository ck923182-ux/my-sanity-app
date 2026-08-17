import { defineField,defineType } from "sanity";

export const timeLine = defineType({
    name:"timeline",
    title:"Time Line",
    type:"object",
    fields:[
        defineField({
           name:"title",
           title:"Title",
           type:"string",
        }),
        defineField({
            name:"icon",
            title:"Icon",
            type: 'icon.manager',
        }),
        defineField({
            name:"year",
            title:"Year",
            type:"string",
        }),
        defineField({
            name:"heading",
            title:"Heading",
            type:"headingComponent",
        })
    ]
})