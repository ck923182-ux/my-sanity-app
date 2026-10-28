
"use server";

export async function sayHello(
  previousState: string,
  formData: FormData
): Promise<string> {
  const name = formData.get("name");

  if (typeof name !== "string" || !name.trim()) {
    return "Please enter your name.";
  }
 
  if(name.trim().length>10){
    return("letter must 10");
  }
   
  console.log("Server Action executed!");
  console.log("Name received:", name);

  return `Hello, ${name}!`;
}
