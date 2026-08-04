"use server";

import { client } from "@/lib/sanity";
import { get } from "http";
import { z } from "zod";

const ContactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().optional(),
  email: z.email("Invalid email address"),
  message: z.string().min(10, "Message should be at least 10 characters"),
});

export type FormState = {
  success: boolean;
  message: string;
  errors?: {
    firstName?: string[];
    email?: string[];
    message?: string[];
  };
};


export async function NewsFormAction (prevState: FormState,formData: FormData
){

  const values = {
     firstName: formData.get("firstName"),
     lastName: formData.get("lastName"),
     email: formData.get("email"),
     message: formData.get("message"),
   };
 
   const validated = ContactSchema.safeParse(values);
 
   if (!validated.success) {
     return {
       success: false,
       message: "Please fix the errors below.",
       errors: validated.error.flatten().fieldErrors,
     };
   }
 
   try {
     await client.create({
       _type: "form",
       formName: "Contact Form Entry",
       firstname: validated.data.firstName,
       lastname: validated.data.lastName,
       email: validated.data.email,
       message: validated.data.message,
     });
 
     return {
       success: true,
       message: "Form submitted successfully.",
     };
   } catch {
     return {
       success: false,
       message: "Something went wrong.",
     };
   }
}
