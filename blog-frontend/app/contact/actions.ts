"use server";

import { client } from "@/lib/sanity";
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

export async function FormEntry(prevState: FormState,formData: FormData
): Promise<FormState> {
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

export async function FormcEntryUpdate() {
  try {
    const result = await client
      .patch("Goo4u87ddslAuTxQldpUV8")
      .set({
        formName: "update the contact fomr 2 ck",
      })
      .commit();
    console.log("update form entry data" + result);
    return {
      success: true,
      message: "fomr updatesuccessfulyy",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Failed to update form",
    };
  }
}

export async function deleteEntry() {
  try {
    const result = await client.delete("Goo4u87ddslAuTxQldpUV8");
    console.log("delete form entry data" + result);
  } catch (error) {
    console.log(error);
  }
}
