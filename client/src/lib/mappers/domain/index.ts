// Mappers convert API DTOs to Domain Models.
// These are pure functions — no side effects, no async.
// Each mapper is unit-tested.
//
// Example structure:
//   export function userDtoToUser(dto: UserDto): User { ... }
//
// Mappers are created per domain when the first consumer
// requires the transformation.
export {};