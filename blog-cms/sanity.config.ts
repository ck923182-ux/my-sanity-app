import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'
import { IconManager } from 'sanity-plugin-icon-manager' // 1. Update this import


export default defineConfig({
  name: 'default',
  title: 'blog-cms',

  projectId: 'lvbrpsfe',
  dataset: 'production',

  plugins: [structureTool({
    structure,
  }),
    IconManager({}), 
    visionTool()],

  schema: {
    types: schemaTypes,
  },
   document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === "global") {
        return prev.filter(
          (template) => template.templateId !== "homePage"
        )
      }

      return prev
    },
  },
})
