// Mappers convert Domain Models to View Models / Presentation Models.
// These are pure functions — no side effects, no async.
// Each mapper is unit-tested.
//
// Example:
//   function userToProfileVM(user: User): UserProfileVM { ... }
//
// View model mappers are typically co-located with the feature
// that owns the view model, but shared presentation model
// mappers live here.
export {};