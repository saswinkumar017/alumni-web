export interface IdleState {
  readonly status: "idle";
}

export interface LoadingState {
  readonly status: "loading";
}

export interface SuccessState<T> {
  readonly status: "success";
  readonly data: T;
}

export interface ErrorState {
  readonly status: "error";
  readonly error: string;
}

export type AsyncState<T> =
  | IdleState
  | LoadingState
  | SuccessState<T>
  | ErrorState;
