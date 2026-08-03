import ContactForm from "./ContactForm";

export default function Page() {
  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-3xl font-bold mb-6">
        Contact Form
      </h1>

      <ContactForm />
    </div>
  );
}