"use server";

import { client } from "@/lib/sanity";
import { z } from "zod";

const NewsSchema = z.object({
  fullname: z.string().min(1, "Name is required"),
  emailaddress: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  subscribedAt: z.coerce.date({
    message: "Please select a subscription date.",
  }),
  consent: z.preprocess(
    (value) => value === "on",
    z.boolean().refine(Boolean, {
      message: "You must agree to receive newsletters.",
    }),
  ),
});

export type FormState = {
  success: boolean;
  message: string;
  errors?: {
    fullname?: string[];
    emailaddress?: string[];
    consent?: string[];
    subscribedAt?: string[];
  };
};

export async function NewsFormAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = {
    fullname: formData.get("fullname"),
    emailaddress: formData.get("emailaddress"),
    consent: formData.get("consent"),
    subscribedAt: formData.get("subscribedAt"),
  };

  const validated = NewsSchema.safeParse(values);

  if (!validated.success) {
    return {
      success: false,
      message: "Please fix the errors below.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await client.create({
      _type: "newsletter",
      newslettername: "News Letter Form Entry",
      fullname: validated.data.fullname,
      emailaddress: validated.data.emailaddress,
      consent: validated.data.consent,
      subscribedAt: validated.data.subscribedAt,
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
