"use server";


export async function sayHello(
    previousState:string,
    formData: FormData
): Promise<string> {
  const name = formData.get("name");
  console.log("server excutes successfully");
  console.log(`Name recived ${name}`);
  return `hello ${name}`
}
