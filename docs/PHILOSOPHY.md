# Philosophy

## 1. Explicit Control Flow

Every function has two distinct exit paths.

The first is the explicit success path. This is what you see in the definition. The function runs, calculates a result, and returns the data you asked for.

The second is the implicit failure path. At any moment, instead of returning a value, the function can throw an exception.

You cannot determine what a function might throw simply by reading its definition. The type signature tells you what the function hopes to do, not what it will do. It is too easy to assume success and overlook the failure path.

`result-try` captures the implicit failure path. It catches exceptions and converts them into a return value, forcing the caller to handle the result.

## 2. Defensive Consistency

It is better to handle an error at build time than to debug a crash in production.

`result-try` shifts the burden of error handling to the safest possible moment: right now, by treating failures as required checks rather than optional catch blocks. This makes handling failure a natural, automatic part of the development process.

## 3. Error Normalization & Introspection

In TypeScript, caught exceptions are typed as `unknown`. You cannot know the shape or the type of the value you have caught.

`result-try` eliminates this ambiguity.

It uses a robust inspection strategy to safely serialize thrown values into readable strings, regardless of their original type or structure.

This means that your Failure object will always contain meaningful debug data.

## 4. Boundary-First Design

`result-try` is built for the edges of your application.

It comes equipped with a comprehensive suite of standard error classes, from `BadRequestError` to `GatewayTimeoutError`, that mirror standard HTTP status codes.

Each class includes their semantic status code, a unique error code, and a default message.

This allows errors to travel from deep within your code base to the API layer without modification. A `NotFoundError` originating in the database maps automatically to a 404 response at the boundary, eliminating the need for manual translation logic.
