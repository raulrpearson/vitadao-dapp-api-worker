/*
 * Tells the IntelliSense to allow import of the following file extensions in
 * TypeScript.
 */

declare module "*.html" {
  const content: string;
  export default content;
}

declare module "*.sql" {
  const content: string;
  export default content;
}
