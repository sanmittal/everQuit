# Meeting Room Booking Service Design

## Data model

- `Room`
  - `id`: UUID
  - `name`: String, unique case-insensitive enforced at application layer
  - `capacity`: Int
  - `floor`: Int
  - `amenities`: String[]

- `Booking`
  - `id`: UUID
  - `roomId`: String
  - `title`: String
  - `organizerEmail`: String
  - `startTime`: DateTime
  - `endTime`: DateTime
  - `status`: String (`confirmed` or `cancelled`)

- `IdempotencyKey`
  - compound primary key: `(key, organizerEmail)`
  - `status`: `in_progress` or `completed`
  - `response`: Json stored booking response
  - `createdAt`: timestamp

## Overlap enforcement

- Bookings only conflict when a confirmed booking exists for the same room and intervals overlap.
- Overlap detection uses `startTime < incomingEnd && endTime > incomingStart`.
- Cancelled bookings are excluded from conflict checks.

## Error handling strategy

- Errors thrown as objects containing `status` and `message`.
- Error middleware returns consistent JSON:
  - `error`: error name or generic `Error`
  - `message`: error message
- Validation failures use `400`, unknown rooms use `404`, booking conflicts use `409`.

## Idempotency implementation

- Requests must include `Idempotency-Key`.
- The idempotency record is persisted in the database.
- The service:
  1. checks for an existing completed record and returns it if present
  2. creates an `in_progress` idempotency row before booking creation
  3. updates the row with the final booking response after successful creation
- Concurrent requests with the same key wait for the first request to complete rather than creating duplicates.

## Concurrency handling

- Database transaction wraps idempotency record creation and booking creation.
- Unique constraint on `(key, organizerEmail)` prevents duplicate idempotency records.
- If a concurrent request collides on the same key, it retries by checking the persisted idempotency row.

## Utilization calculation

- Business hours are tracked as Monday–Friday, 08:00–20:00.
- The report calculates the actual overlap of confirmed bookings with the requested range.
- Utilization percent = total booked hours in range / total business hours in range.
- If the range contains no business hours, utilization is `0`.
