# result-try

![npm version](https://img.shields.io/npm/v/result-try?style=flat-square&color=2563eb)
![zero dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/result-try?style=flat-square&color=2563eb)
![license](https://img.shields.io/npm/l/result-try?style=flat-square&color=2563eb)

> **Make Failure Predictable**
>
> `result-try` converts implicit exceptions into explicit, strongly-typed values.

## Quick Start


```bash
npm install result-try
# or
yarn add result-try
# or
pnpm add result-try
# or
bun add result-try
```

```typescript
import { tryResult, ResultError } from "result-try"

// BEFORE: Implicit, unchecked, unsafe
async function unsafeGet() {
  try {
     const user = await db.users.find(1) // Throws? Retur
     return user.name // Crashes if user is null
  } catch (error) {
    // 'error' is unknown. Cannot access error.message safely
  }
}

// AFTER: Explicit, checked, safe
async function safeGet() {
  // result: Result<User, ResultError>
  const result = await tryResult(db.users.find(1))

  if (!result.ok) {
    // Compiler forces you to handle the error path
    return console.error(result.error.message)
  }

  return result.value.name // Type-safe access
}

// Or with destructuring
async function go() {
  // user: User | null, error: ResultError | null
  const [user, error] = await tryResult(db.users.find(1))

  if (error) {
    // Compiler forces you to handle the error path
    return console.error(error.message)
  }

  return user.namem // Type-safe access
}
```

## The Problem

Even with TypeScript, **exceptions are invisible**.
1. **You don't know if a function throws.**
The type signature tells you what it returns, *not* what breaks it.
2. **You don't know what it throws.**
Caught errors are typed as `unknown`, forcing you to write defensive checks just to log a message.
3. **You inevitably forget to catch.**
And your app crashes in production.

## The Solution

`result-try` forces you to handle exceptions as data, ensuring no error is ever left unhandled.

1.  **Wraps** unstable code (Promises, async functions, sync blocks) safely.
2.  **Catches** every exception and converts it into a `Result` object.
3.  **Forces** you to handle the failure case before accessing the data.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/dunika/result-try/main/docs/images/diagram.png">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/dunika/result-try/main/docs/images/diagram.png">
  <img alt="Railway Oriented Programming Flow" src="https://raw.githubusercontent.com/dunika/result-try/main/docs/images/diagram.png">
</picture>

*Note*: This approach is often called [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/).
You stay on the "Success Track" until an error switches you to the "Failure Track", but the train never falls off the rails.

## Philosophy

- **Explicit Control Flow** - Make the implicit failure path explicit
- **Defensive Consistency** - Handle errors at build time, not in production
- **Error Normalization & Introspection** - Eliminate `unknown` error ambiguity
- **Boundary-First Design** - HTTP-friendly errors that travel seamlessly up the call stack

[See docs/PHILOSOPHY.md for more details](docs/PHILOSOPHY.md)

## Usage

### tryResult

Use `tryResult` for Promises and async functions.

```typescript
import { tryResult, NotFoundError } from "result-try"

const result = await tryResult(fetch("https://api.example.com/data"))

if (result.ok) {
  // Standard fetch Response
  console.log(result.value.status)
} else {
  // Type-safe Error
  console.error(result.error.message)
}

// With custom error map
const userResult = await tryResult(
  db.findUser(id),
  (error) => NotFoundError.from(error)
)

// Destructuring
const [data, error] = await tryResult(fetch("..."))
if (error) {
  return handle(error)
}
console.log(data)
```

### tryResultSync

Use `tryResultSync` for synchronous operations like JSON parsing.

```typescript
import { tryResultSync, BadRequestError } from "result-try"

const parseResult = tryResultSync(() => JSON.parse(userInput))

// With custom error map
const valResult = tryResultSync(
  () => validate(userInput),
  (error) => BadRequestError.from(error)
)

// Destructuring
const [data, error] = tryResultSync(() => JSON.parse(userInput))
```

### Decorators

Decorate your class methods to automatically catch errors and return `Result` types.

**Note:** Requires `"experimentalDecorators": true` in your `tsconfig.json`.

```typescript
import { TryResult, Result, NotFoundError } from "result-try"

class UserService {
  // Use default mapping (error -> ResultError.from(error))
  @TryResult()
  async getUser(id: string) {
    const user = await db.find(id)
    if (!user) {
      return NotFoundError.from("User not found") 
    }
    return Result.ok(user)
  }

  // Use custom mapping
  @TryResult((error) => mapPostgresError(error))
  async updateUser(id: string, data: Partial<User>): PromiseResult<User> {
     const user = await db.update(id, data)
     return Result.ok(user)
  }
}

```

## API Reference

### Result Type

A discriminated union that makes it impossible to access `value` without checking `ok`.
It also supports array destructuring for a Go-like experience.

```typescript
// Object access
if (result.ok) {
  console.log(result.value)
}

// Array destructuring
const [value, error] = result
if (error) {
  console.error(error)
}
```

```typescript
type Result<T, E extends ResultError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

- **`Result.ok(value)`**
- **`Result.error(error)`**
- **`Result.void()`**: Useful for functions that verify something but return no data.

  ```typescript
  import { Result, ResultError, ForbiddenError } from "result-try"

  function validateUser(user: User): Result<void, ResultError> {
    if (!user.isActive) {
      return Result.error(ForbiddenError.from("User is inactive"))
    }
    
    return Result.void()
  }
  ```

**`Result.unwrap()`**

Returns the value if `ok`, otherwise throws the error.

  ```typescript
  const value = result.unwrap() // Throws if result is error
  ```

### ResultError & Built-in Errors

`result-try` treats errors as structured data.
The `ResultError` class ensures every error has a `code`, `status`, and `message`.

We provide standard HTTP-friendly error classes out of the box:

| Error Class | Status | Code |
| :--- | :--- | :--- |
| `BadRequestError` | 400 | `BAD_REQUEST` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `PaymentRequiredError` | 402 | `PAYMENT_REQUIRED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `MethodNotAllowedError` | 405 | `METHOD_NOT_ALLOWED` |
| `NotAcceptableError` | 406 | `NOT_ACCEPTABLE` |
| `TimeoutError` | 408 | `TIMEOUT` |
| `ConflictError` | 409 | `CONFLICT` |
| `PreconditionFailedError` | 412 | `PRECONDITION_FAILED` |
| `PayloadTooLargeError` | 413 | `PAYLOAD_TOO_LARGE` |
| `UnsupportedMediaTypeError` | 415 | `UNSUPPORTED_MEDIA_TYPE` |
| `UnprocessableEntityError` | 422 | `UNPROCESSABLE_ENTITY` |
| `UnprocessableContentError` | 422 | `UNPROCESSABLE_CONTENT` |
| `TooManyRequestsError` | 429 | `TOO_MANY_REQUESTS` |
| `ClientClosedRequestError` | 499 | `CLIENT_CLOSED_REQUEST` |
| `InternalServerError` | 500 | `INTERNAL_SERVER_ERROR` |
| `NotImplementedError` | 501 | `NOT_IMPLEMENTED` |
| `BadGatewayError` | 502 | `BAD_GATEWAY` |
| `ServiceUnavailableError` | 503 | `SERVICE_UNAVAILABLE` |
| `GatewayTimeoutError` | 504 | `GATEWAY_TIMEOUT` |


You can access these definitions at runtime via `HTTP_ERRORS`.

### Static Factory Methods

All built-in error classes provide two static factory methods for convenient error creation:

**`from()`**

Creates an error instance from a message or existing error:

```typescript
import { ResultError, NotFoundError } from "result-try"

// From a string message
const error1 = ResultError.from("User not found")

// From an existing error
try {
  await db.findUser(id)
} catch (error) {
  const error2 = NotFoundError.from(error)
}
```

**`result()`** 

Creates an error `Result` directly (shorthand for `Result.error(ErrorClass.from(...))`):

```typescript
import { NotFoundError } from "result-try"

// Concise
return NotFoundError.result("User not found")

// Equivalent to
return Result.error(NotFoundError.from("User not found"))
```

### `inspect` Utility

A robust stringification utility designed for logging and debugging.

All built-in error classes use `inspect` internally to ensure that any error caught is preserved safely.

**Why use `inspect`?**

- **Never crashes:** Safe for circular references and deep nesting.
- **Rich Types:** Serializes `Map`, `Set`, `BigInt`, `Error`, `URL`, `RegExp` and `ArrayBuffer`.
- **Classes:** Preserves constructor names for custom classes.
- **Errors:** Fully serializes Error chains and causes.



```typescript
import { inspect } from "result-try"

// 1. Circular References (No crash)
const circular: any = { self: null }
circular.self = circular
console.log(inspect(circular))
// Output: [Referential Structure]:{"self":null}

// 2. Built-in Types (JSON.stringify usually swallows these)
console.log(inspect(new Map([['key', 'value']]))) // [Map]:[["key","value"]]
console.log(inspect(new Set([1, 2, 3])))          // [Set]:[1,2,3]
console.log(inspect(BigInt(123)))                 // 123

// 3. Errors
const err = new Error("Boom")
console.log(inspect(err))
// Output: [Error]:{"name":"Error","message":"Boom",...}

// 4. Custom Classes
class User {
  constructor(public id: number) {}
}
console.log(inspect(new User(1)))
// Output: [User]:{"id":1}
```

### Error Helpers

Safe utilities for checking and finding errors.

```typescript
import { 
  isResultError, 
  isResultErrorCode, 
  isResultErrorStatus,
  findHTTPErrorFromCode,
  getHTTPErrorMessageFromCode 
} from "result-try"

// Type Guard
if (isResultError(someValue)) {
  console.log(someValue.code) // Safe access
}

// Check Specific Errors (Safe even if value is unknown)
const error: unknown = result.error
if (isResultErrorCode(result.error, "NOT_FOUND")) {
    // Handle specific code
}

if (isResultErrorStatus(result.error, 404)) {
    // Handle specific status
}

// Find Error Definition by Code
const httpError = findHTTPErrorFromCode("NOT_FOUND")
if (httpError) {
    console.log(httpError.message) // "The requested resource could not be found."
}

// Get Error Message from Code
const msg = getHTTPErrorMessageFromCode("BAD_REQUEST", "Fallback message")
```

## Publishing Guide

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for instructions on how to publish this package to npm.

## License

MIT
